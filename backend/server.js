const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const dotenv = require('dotenv')

dotenv.config()
// Middleware setup
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
const uri = process.env.MONGO_URI;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).catch(err => console.error('MongoDB connection error:', err));

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Updated Bill Schema
const billSchema = new mongoose.Schema({
  billType: {
    type: String,
    enum: ['Purchase', 'Recurring'],
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  billNo: {
    type: String,
    required: true,
    unique: true
  },
  invoiceDate: {
    type: Date,
    required: true
  },
  supplier: {
    type: String,
    required: true
  },
  contactNo: {
    type: String,
    required: true
  },
  items: [{
    name: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true }
  }],
  billPdfPath: {
    type: String,
    required: false
  }

});

const Bill = mongoose.model('Bill', billSchema);

// Other schemas remain unchanged
const allocationSchema = new mongoose.Schema({
  deviceType: String,
  assignedTo: String,
  lab: String,
  assignedBy: String,
  date: Date,
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
});

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

const recurringItemSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

const Allocation = mongoose.model('Allocation', allocationSchema);
const Device = mongoose.model('Device', deviceSchema);
const RecurringItem = mongoose.model('RecurringItem', recurringItemSchema);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Updated Bill Routes
app.post('/bills', upload.single('billPdf'), async (req, res) => {
  try {


    const {
      billType,
      academicYear,
      billNo,
      invoiceDate,
      supplier,
      contactNo,
      items
    } = req.body;

    // Parse items if it's a string
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

    // Validate items array
    if (!Array.isArray(parsedItems)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    const bill = new Bill({
      billType,
      academicYear,
      billNo,
      invoiceDate,
      supplier,
      contactNo,
      items: parsedItems,
      billPdfPath: req.file ? req.file.filename : null

    });

    await bill.save();
    res.status(201).json(bill);
  } catch (error) {
    console.error('Error saving bill:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/bills', async (req, res) => {
  try {
    const bills = await Bill.find().sort({ invoiceDate: -1 });
    res.status(200).json(bills);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ error: error.message });
  }
});

// File serving route
app.get('/uploads/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, 'uploads', filename);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).send('Error serving PDF file');
  }
});

// Device and Recurring Item routes
app.get('/devices-and-items', async (req, res) => {
  try {
    const devices = await Device.find();
    const recurringItems = await RecurringItem.find();
    res.json({ devices, recurringItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/devices', async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/devices', async (req, res) => {
  try {
    const device = new Device(req.body);
    await device.save();
    res.status(201).json(device);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/recurring-items', async (req, res) => {
  try {
    const item = new RecurringItem(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/devices/:id', async (req, res) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/recurring-items/:id', async (req, res) => {
  try {
    const item = await RecurringItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Recurring item not found' });
    res.json({ message: 'Recurring item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/devices/:id', async (req, res) => {
  try {
    const device = await Device.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    res.json(device);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/recurring-items/:id', async (req, res) => {
  try {
    const item = await RecurringItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Recurring item not found' });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Allocation routes
app.post('/devices/allocations', async (req, res) => {
  try {
    const { deviceType, assignedTo, lab, assignedBy, date } = req.body;
    const newAllocation = new Allocation({
      deviceType,
      assignedTo,
      lab,
      assignedBy,
      date: new Date(date),
      status: 'active',
    });
    await newAllocation.save();
    res.status(201).json(newAllocation);
  } catch (error) {
    console.error('Error creating allocation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/devices/allocations', async (req, res) => {
  try {
    const allocations = await Allocation.find();
    res.status(200).json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/devices/allocations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedAllocation = await Allocation.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedAllocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }
    res.status(200).json(updatedAllocation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/devices/allocations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAllocation = await Allocation.findByIdAndDelete(id);
    if (!deletedAllocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }
    res.status(200).json({ message: 'Allocation deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/devices/allocations/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    const allocation = await Allocation.findById(id);
    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }
    allocation.status = allocation.status === 'active' ? 'inactive' : 'active';
    await allocation.save();
    res.status(200).json(allocation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add PDF to existing bill
app.delete('/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findById(id);
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Delete associated PDF file if it exists
    if (bill.billPdfPath) {
      const filePath = path.join(__dirname, 'uploads', bill.billPdfPath);
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

app.patch('/bills/:id/pdf', upload.single('pdf'), async (req, res) => {

  try {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    const bill = await Bill.findByIdAndUpdate(
      id,
      { billPdfPath: req.file.filename },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    res.status(200).json(bill);
  } catch (error) {
    console.error('Error updating bill PDF:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
