const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);
app.use(express.urlencoded({ extended: true }));
// Set up static file serving for the uploads directory
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
const uri = "mongodb+srv://yug14114:Yug%402004@cluster0.aqjlk.mongodb.net/";

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .catch((err) => console.error("MongoDB connection error:", err));

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Updated Bill Schema with lastAllocatedNumber and description
const billSchema = new mongoose.Schema({
  billType: {
    type: String,
    enum: ["Purchase", "Recurring"],
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
  },
  billNo: {
    type: String,
    required: true,
    unique: true,
  },
  invoiceDate: {
    type: Date,
    required: true,
  },
  supplier: {
    type: String,
    required: true,
  },
  contactNo: {
    type: String,
    required: true,
  },
  items: [
    {
      name: { type: String, required: true },
      description: { type: String, default: "" }, // Added description field
      unitPrice: { type: Number, required: true },
      quantity: { type: Number, required: true },
      totalPrice: { type: Number, required: true },
      allocatedQuantity: { type: Number, default: 0 },
      lastAllocatedNumber: { type: Number, default: 0 },
    },
  ],
  billPdfPath: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Bill = mongoose.model("Bill", billSchema);

// Updated Allocation Schema with start and end numbers
const allocationItemSchema = new mongoose.Schema({
  billId: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", required: true },
  itemName: { type: String, required: true },
  allocatedQuantity: { type: Number, required: true, min: 1 },
  startNumber: { type: Number, required: true },
  endNumber: { type: Number, required: true },
});

const allocationSchema = new mongoose.Schema({
  recipient: { type: String, required: true },
  allocator: { type: String, required: true },
  lab: { type: String, required: true },
  dateOfAllocation: { type: Date, required: true },
  items: [allocationItemSchema],
});

const Allocation = mongoose.model("Allocation", allocationSchema);

// Other schemas remain unchanged
const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

const recurringItemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
});

const Device = mongoose.model("Device", deviceSchema);
const RecurringItem = mongoose.model("RecurringItem", recurringItemSchema);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/'); // Save files to the uploads directory
  },
  filename: function(req, file, cb) {
    // Create a simple timestamp-based filename
    const timestamp = Date.now();
    const originalName = file.originalname;
    cb(null, `${timestamp}-${originalName}`);
  }
});

// File filter to only accept PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Create bills route - handles new bill creation
app.post('/bills', upload.single('billPdf'), async (req, res) => {
  try {
    // Parse items from the form data
    let items = typeof req.body.items === 'string' 
      ? JSON.parse(req.body.items) 
      : req.body.items;
    
    // Validate required fields
    if (!req.body.billType || !req.body.academicYear || !req.body.billNo || 
        !req.body.invoiceDate || !req.body.supplier || !req.body.contactNo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate academic year format (YYYY-YY)
    const academicYearPattern = /^\d{4}-\d{2}$/;
    if (!academicYearPattern.test(req.body.academicYear)) {
      return res.status(400).json({ error: 'Invalid academic year format' });
    }
    
    // Validate contact number
    const contactNoPattern = /^\d{10}$/;
    if (!contactNoPattern.test(req.body.contactNo)) {
      return res.status(400).json({ error: 'Invalid contact number' });
    }
    
    // Validate items
    if (!items || items.length === 0 || 
        items.some(item => !item.name || !item.unitPrice || !item.quantity)) {
      return res.status(400).json({ error: 'Invalid items data' });
    }

    // Ensure each item has the lastAllocatedNumber field initialized to 0
    const itemsWithNumbering = items.map(item => ({
      ...item,
      description: item.description || "", // Handle description field
      lastAllocatedNumber: 0,
      allocatedQuantity: 0
    }));
    
    // Store just the filename
    const billPdfName = req.file ? req.file.filename : null;
    
    // Create a bill object
    const bill = new Bill({
      billType: req.body.billType,
      academicYear: req.body.academicYear,
      billNo: req.body.billNo,
      invoiceDate: req.body.invoiceDate,
      supplier: req.body.supplier,
      contactNo: req.body.contactNo,
      items: itemsWithNumbering,
      billPdfPath: billPdfName  // Store just the filename
    });
    
    // Save to database
    await bill.save();
    
    // Return success
    res.status(201).json({ 
      message: 'Bill added successfully',
      billId: bill._id
    });
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ error: 'Server error while creating bill' });
  }
});

app.patch("/bills/:id/pdf", upload.single("pdf"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: "PDF file is required" });
    }

    // Store just the filename
    const pdfFilename = req.file.filename;

    const bill = await Bill.findByIdAndUpdate(id, { billPdfPath: pdfFilename }, { new: true });

    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }

    res.status(200).json(bill);
  } catch (error) {
    console.error("Error updating bill PDF:", error);
    res.status(500).json({ error: error.message });
  }
});


// Helper function to get PDF URL
function getPdfUrl(filename) {
  if (!filename) return null;
  return `/uploads/${filename}`;
}

// Utility function to enhance bill objects with PDF URLs
function addPdfUrlToBill(bill) {
  if (!bill) return null;
  
  // Create a copy of the bill (if it's a Mongoose document, use toObject or _doc)
  const billData = bill._doc || bill;
  
  return {
    ...billData,
    pdfUrl: getPdfUrl(billData.billPdfPath)
  };
}
// Get bills route - retrieves all bills
app.get("/bills", async (req, res) => {
  try {
    const bills = await Bill.find({});
    
    const billsWithUrls = bills.map(bill => addPdfUrlToBill(bill));
    
    res.status(200).json(billsWithUrls);
  } catch (error) {
    console.error("Error retrieving bills:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get bill by ID route
app.get("/bills/:id", async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }
    
    res.status(200).json(addPdfUrlToBill(bill));
  } catch (error) {
    console.error("Error retrieving bill:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update bill route - Add this to your server.js file
app.put("/bills/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { billType, academicYear, billNo, invoiceDate, supplier, contactNo, items } = req.body;

    // Validate required fields
    if (!billType || !academicYear || !billNo || !invoiceDate || !supplier || !contactNo || !items) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate academic year format (YYYY-YY)
    const academicYearPattern = /^\d{4}-\d{2}$/;
    if (!academicYearPattern.test(academicYear)) {
      return res.status(400).json({ error: 'Invalid academic year format' });
    }
    
    // Validate contact number
    const contactNoPattern = /^\d{10}$/;
    if (!contactNoPattern.test(contactNo)) {
      return res.status(400).json({ error: 'Invalid contact number' });
    }

    // Validate items
    if (!items || items.length === 0 || items.some(item => !item.name || !item.unitPrice || !item.quantity)) {
      return res.status(400).json({ error: 'Invalid items data' });
    }

    // Calculate total price for each item to ensure consistency
    const updatedItems = items.map(item => ({
      ...item,
      totalPrice: parseFloat((item.unitPrice * item.quantity).toFixed(2))
    }));

    // Verify the bill exists
    const existingBill = await Bill.findById(id);
    if (!existingBill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Check if the bill number is changed and if it already exists
    if (billNo !== existingBill.billNo) {
      const billWithSameNumber = await Bill.findOne({ billNo, _id: { $ne: id } });
      if (billWithSameNumber) {
        return res.status(400).json({ error: 'Bill number already exists' });
      }
    }

    // Update the bill
    const updatedBill = await Bill.findByIdAndUpdate(
      id,
      {
        billType,
        academicYear,
        billNo,
        invoiceDate,
        supplier,
        contactNo,
        items: updatedItems
      },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedBill);
  } catch (error) {
    console.error('Error updating bill:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete bill route
app.delete('/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    if (bill.billPdfPath) {
      const filePath = path.join(__dirname, bill.billPdfPath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Bill.findByIdAndDelete(id);
    res.status(200).json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Error deleting bill:', error);
    res.status(500).json({ error: error.message });
  }
});


// Create allocation route
app.post("/devices/allocations", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { recipient, allocator, lab, dateOfAllocation, items } = req.body;

    const allocation = new Allocation({
      recipient,
      allocator,
      lab,
      dateOfAllocation,
      items: [],
    });

    for (const item of items) {
      const bill = await Bill.findById(item.billId).session(session);
      if (!bill) {
        throw new Error(`Bill ${item.billId} not found`);
      }

      const billItem = bill.items.find((i) => i.name === item.itemName);
      if (!billItem) {
        throw new Error(`Item ${item.itemName} not found in bill ${bill.billNo}`);
      }

      // Calculate available quantity correctly
      const availableQuantity = billItem.quantity - billItem.allocatedQuantity;
      if (availableQuantity < item.quantity) {
        throw new Error(`Insufficient quantity for ${item.itemName} in bill ${bill.billNo}`);
      }

      // Calculate start and end numbers for sequential numbering
      const startNumber = billItem.lastAllocatedNumber + 1;
      const endNumber = startNumber + item.quantity - 1;

      // Update allocated quantity and last allocated number
      billItem.allocatedQuantity += parseInt(item.quantity); // Reduce available quantity
      billItem.lastAllocatedNumber = endNumber;

      await bill.save({ session });

      // Add item to allocation
      allocation.items.push({
        itemName: item.itemName,
        billId: bill._id,
        allocatedQuantity: item.quantity,
        startNumber,
        endNumber,
      });
    }

    await allocation.save({ session });
    await session.commitTransaction();
    res.status(201).json(allocation);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// Get allocations route
app.get("/devices/allocations", async (req, res) => {
  try {
    const allocations = await Allocation.find().populate("items.billId");
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Devices and Recurring Items routes
app.get("/devices-and-items", async (req, res) => {
  try {
    const devices = await Device.find();
    const recurringItems = await RecurringItem.find();
    res.json({ devices, recurringItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/devices", async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/devices", async (req, res) => {
  try {
    const device = new Device(req.body);
    await device.save();
    res.status(201).json(device);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/recurring-items", async (req, res) => {
  try {
    const item = new RecurringItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get availability route
app.get("/api/availability", async (req, res) => {
  try {
    const bills = await Bill.find();
    const availability = {};

    bills.forEach((bill) => {
      bill.items.forEach((item) => {
        if (!availability[item.name]) {
          availability[item.name] = [];
        }
        availability[item.name].push({
          billId: bill._id,
          billNo: bill.billNo,
          totalQuantity: item.quantity,
          availableQuantity: item.quantity - item.allocatedQuantity,
          lastAllocatedNumber: item.lastAllocatedNumber,
        });
      });
    });

    res.json(availability);
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get devices summary
app.get("/devices/summary", async (req, res) => {
  try {
    const bills = await Bill.find();
    const allocations = await Allocation.find();

    let totalDevices = 0;
    let allocatedDevices = 0;
    let availableDevices = 0;

    bills.forEach((bill) => {
      bill.items.forEach((item) => {
        totalDevices += item.quantity;
        allocatedDevices += item.allocatedQuantity;
      });
    });

    availableDevices = totalDevices - allocatedDevices;

    const summary = {
      total: { count: totalDevices },
      allocated: { count: allocatedDevices },
      available: { count: availableDevices },
      recentAllocations: allocations.slice(-5), // Get the 5 most recent allocations
    };

    res.json(summary);
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get yearly expenses
app.get("/expenses/yearly", async (req, res) => {
  try {
    const bills = await Bill.find({})

    // Group bills by year and calculate totals
    const yearlyExpenses = {}

    bills.forEach((bill) => {
      const year = new Date(bill.invoiceDate).getFullYear()

      if (!yearlyExpenses[year]) {
        yearlyExpenses[year] = {
          year,
          amount: 0,
          itemCount: 0,
        }
      }

      // Calculate total amount for this bill
      const billTotal = bill.items.reduce((total, item) => {
        return total + item.totalPrice
      }, 0)

      // Add to yearly totals
      yearlyExpenses[year].amount += billTotal
      yearlyExpenses[year].itemCount += bill.items.length
    })

    // Convert to array and sort by year
    const result = Object.values(yearlyExpenses).sort((a, b) => a.year - b.year)

    res.json(result)
  } catch (error) {
    console.error("Error fetching yearly expenses:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get lab-wise summary
app.get("/labs/summary", async (req, res) => {
  try {
    const allocations = await Allocation.find().populate({
      path: "items.billId",
      model: "Bill",
    })

    // Initialize lab summary object
    const labSummary = {}

    // Process each allocation
    for (const allocation of allocations) {
      const lab = allocation.lab

      if (!labSummary[lab]) {
        labSummary[lab] = {
          lab,
          deviceCount: 0,
          totalValue: 0,
          maintenanceCost: 0,
        }
      }

      // Process each allocated item
      for (const item of allocation.items) {
        // Find the bill and item details
        const bill = item.billId
        if (!bill) continue

        const billItem = bill.items.find((i) => i.name === item.itemName)
        if (!billItem) continue

        // Calculate values
        const itemValue = billItem.unitPrice * item.allocatedQuantity

        // Update lab summary
        labSummary[lab].deviceCount += item.allocatedQuantity
        labSummary[lab].totalValue += itemValue

        // Estimate maintenance cost (typically 10% of asset value annually)
        labSummary[lab].maintenanceCost += itemValue * 0.1
      }
    }

    // Convert to array and sort by device count (descending)
    const result = Object.values(labSummary).sort((a, b) => b.deviceCount - a.deviceCount)

    // Round monetary values to integers for cleaner display
    result.forEach((lab) => {
      lab.totalValue = Math.round(lab.totalValue)
      lab.maintenanceCost = Math.round(lab.maintenanceCost)
    })

    res.json(result)
  } catch (error) {
    console.error("Error fetching lab summary:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get upcoming maintenance schedule
app.get("/maintenance/upcoming", async (req, res) => {
  try {
    // This would typically come from a maintenance schedule collection
    // For now, we'll generate mock data based on device allocations

    const allocations = await Allocation.find().sort({ dateOfAllocation: -1 }).limit(10)

    const maintenanceSchedule = []

    // Generate maintenance schedules based on allocation dates
    // In a real system, you would have a separate collection for this
    allocations.forEach((allocation, index) => {
      // Create a maintenance date 90 days after allocation
      const allocationDate = new Date(allocation.dateOfAllocation)
      const maintenanceDate = new Date(allocationDate)
      maintenanceDate.setDate(maintenanceDate.getDate() + 90 + index * 15) // Stagger dates

      // Determine priority based on device type or random for demo
      const priorities = ["Critical", "Important", "Routine"]
      const priority = priorities[Math.floor(Math.random() * priorities.length)]

      // Create maintenance entry
      maintenanceSchedule.push({
        id: `maint-${index + 1}`,
        deviceGroup: `${allocation.lab} Equipment`,
        scheduledDate: maintenanceDate,
        priority,
        technician: allocation.allocator,
        notes: `Regular maintenance for devices allocated on ${allocationDate.toLocaleDateString()}`,
      })
    })

    res.json(maintenanceSchedule)
  } catch (error) {
    console.error("Error fetching maintenance schedule:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get warranty expiry alerts
app.get("/warranty/expiring", async (req, res) => {
  try {
    // In a real system, you would store warranty information with each device
    // For now, we'll generate mock data based on bills

    const bills = await Bill.find().sort({ invoiceDate: -1 }).limit(10)

    const warrantyAlerts = []

    // Generate warranty alerts based on bill dates
    bills.forEach((bill, index) => {
      // Assume warranty is 1 year from invoice date
      const invoiceDate = new Date(bill.invoiceDate)
      const warrantyEnd = new Date(invoiceDate)
      warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 1)

      // Group items by type
      const itemGroups = {}
      bill.items.forEach((item) => {
        const type = item.name.split(" ")[0] // Simple grouping by first word
        if (!itemGroups[type]) {
          itemGroups[type] = 0
        }
        itemGroups[type] += item.quantity
      })

      // Create warranty entry for each group
      Object.entries(itemGroups).forEach(([type, count], groupIndex) => {
        // Stagger expiry dates for demo
        const expiryDate = new Date(warrantyEnd)
        expiryDate.setDate(expiryDate.getDate() + groupIndex * 15)

        // Calculate days left
        const today = new Date()
        const daysLeft = Math.max(0, Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24)))

        warrantyAlerts.push({
          id: `warranty-${index}-${groupIndex}`,
          itemGroup: `${type} (${count})`,
          billNo: bill.billNo,
          expiryDate,
          daysLeft,
          supplier: bill.supplier,
          contactNo: bill.contactNo,
        })
      })
    })

    // Sort by days left (ascending)
    warrantyAlerts.sort((a, b) => a.daysLeft - b.daysLeft)

    res.json(warrantyAlerts)
  } catch (error) {
    console.error("Error fetching warranty alerts:", error)
    res.status(500).json({ error: error.message })
  }
})

// Update allocation route
app.put("/devices/allocations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { recipient, allocator, lab, dateOfAllocation, items } = req.body;

    const allocation = await Allocation.findByIdAndUpdate(id, {
      recipient,
      allocator,
      lab,
      dateOfAllocation,
      items,
    }, { new: true });

    if (!allocation) {
      return res.status(404).json({ error: "Allocation not found" });
    }

    res.status(200).json(allocation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete allocation route
app.delete("/devices/allocations/:id", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const allocation = await Allocation.findById(id).session(session);

    if (!allocation) {
      return res.status(404).json({ error: "Allocation not found" });
    }

    // Update the corresponding bill items
    for (const item of allocation.items) {
      const bill = await Bill.findById(item.billId).session(session);
      if (bill) {
        bill.items.forEach(billItem => {
          if (billItem.name === item.itemName) {
            billItem.allocatedQuantity -= item.allocatedQuantity;
            // Don't reset lastAllocatedNumber as it would break the sequence
          }
        });
        await bill.save({ session });
      }
    }

    await Allocation.findByIdAndDelete(id).session(session);
    await session.commitTransaction();
    res.status(200).json({ message: "Allocation deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 10MB limit' });
    }
    return res.status(400).json({ error: err.message });
  }
  
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});