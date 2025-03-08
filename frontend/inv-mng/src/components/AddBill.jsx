"use client"

import { useState } from "react"
import { Plus, Minus, Upload, X, AlertCircle } from "lucide-react"

export default function AddBill() {
  const [formData, setFormData] = useState({
    billType: "Purchase",
    academicYear: "",
    billNo: "",
    invoiceDate: "",
    supplier: "",
    contactNo: "",
  })

  const [items, setItems] = useState([
    {
      name: "",
      description: "",
      unitPrice: "",
      quantity: "",
      totalPrice: 0,
    },
  ])

  const [billPdf, setBillPdf] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileSelected, setFileSelected] = useState(false)
  const [notification, setNotification] = useState({ show: false, type: "", message: "" })
  const [errors, setErrors] = useState({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

  // Calculate grand total
  const grandTotal = items.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0)

  const calculateTotalPrice = (index, newUnitPrice, newQuantity) => {
    const unitPrice = parseFloat(newUnitPrice) || 0
    const quantity = parseFloat(newQuantity) || 0
    const totalPrice = unitPrice * quantity

    const newItems = [...items]
    newItems[index] = {
      ...newItems[index],
      unitPrice: newUnitPrice,
      quantity: newQuantity,
      totalPrice: totalPrice.toFixed(2)
    }
    setItems(newItems)
  }

  const handleUnitPriceChange = (index, value) => {
    const item = items[index]
    calculateTotalPrice(index, value, item.quantity)
  }

  const handleQuantityChange = (index, value) => {
    const item = items[index]
    calculateTotalPrice(index, item.unitPrice, value)
  }

  const validateForm = () => {
    const newErrors = {}
    
    // Validate academic year format (YYYY-YY)
    const academicYearPattern = /^\d{4}-\d{2}$/
    if (!academicYearPattern.test(formData.academicYear)) {
      newErrors.academicYear = "Please use YYYY-YY format (e.g., 2023-24)"
    }
    
    // Validate contact number
    const contactNoPattern = /^\d{10}$/
    if (!contactNoPattern.test(formData.contactNo)) {
      newErrors.contactNo = "Please enter a valid 10-digit contact number"
    }
    
    // Validate at least one item is properly filled
    if (items.some(item => !item.name || !item.unitPrice || !item.quantity)) {
      newErrors.items = "Please fill in all item details"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setNotification({
        show: true,
        type: "error",
        message: "Please fix the errors in the form"
      })
      setTimeout(() => setNotification({ show: false }), 5000)
      return
    }

    try {
      setIsSubmitting(true)

      const data = new FormData()
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key])
      })
      data.append("items", JSON.stringify(items))
      data.append("grandTotal", grandTotal.toFixed(2))
      
      if (billPdf) {
        data.append("billPdf", billPdf)
      }

      const response = await fetch("http://localhost:5000/bills", {
        method: "POST",
        body: data,
      })

      if (response.status === 201) {
        setNotification({
          show: true,
          type: "success",
          message: "Bill added successfully"
        })
        
        resetFormData()
      } else {
        throw new Error("Failed to add bill")
      }
    } catch (error) {
      console.error("Error adding bill:", error)
      setNotification({
        show: true,
        type: "error",
        message: "Failed to add bill. Please try again."
      })
    } finally {
      setIsSubmitting(false)
      setTimeout(() => setNotification({ show: false }), 5000)
    }
  }

  const resetFormData = () => {
    setFormData({
      billType: "Purchase",
      academicYear: "",
      billNo: "",
      invoiceDate: "",
      supplier: "",
      contactNo: "",
    })
    
    setItems([
      {
        name: "",
        description: "",
        unitPrice: "",
        quantity: "",
        totalPrice: 0,
      },
    ])
    
    setBillPdf(null)
    setFileSelected(false)
    setErrors({})
    
    const fileInput = document.querySelector('input[type="file"]')
    if (fileInput) fileInput.value = ""
  }

  const resetForm = () => {
    if (confirm("Are you sure you want to reset the form? All data will be lost.")) {
      resetFormData()
    }
  }

  const validateFileSize = (file) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setNotification({
        show: true,
        type: "error",
        message: "File size exceeds 10MB limit"
      })
      setTimeout(() => setNotification({ show: false }), 5000)
      return false
    }
    return true
  }

  return (
    <div className="bg-white rounded-xl shadow-sm max-w-4xl mx-auto">
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-md flex items-center space-x-2 z-50 ${
          notification.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {notification.type === "success" ? (
            <div className="flex items-center">
              <div className="bg-green-500 rounded-full p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="ml-2">{notification.message}</span>
            </div>
          ) : (
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="ml-2">{notification.message}</span>
            </div>
          )}
          <button 
            onClick={() => setNotification({ show: false })}
            className="p-1 hover:bg-gray-200 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Add New Bill</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bill Type</label>
            <select
              value={formData.billType}
              onChange={(e) => setFormData({ ...formData, billType: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              aria-label="Bill Type"
            >
              <option value="Purchase">Purchase</option>
              <option value="Recurring">Recurring</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Service">Service</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <input
              type="text"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              placeholder="e.g., 2023-24"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.academicYear ? "border-red-500" : ""
              }`}
              required
              aria-label="Academic Year"
              aria-invalid={errors.academicYear ? "true" : "false"}
            />
            {errors.academicYear && (
              <p className="mt-1 text-xs text-red-600">{errors.academicYear}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bill No.</label>
            <input
              type="text"
              value={formData.billNo}
              onChange={(e) => setFormData({ ...formData, billNo: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              aria-label="Bill Number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Date</label>
            <input
              type="date"
              value={formData.invoiceDate}
              onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              aria-label="Invoice Date"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              aria-label="Supplier Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact No.</label>
            <input
              type="text"
              value={formData.contactNo}
              onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.contactNo ? "border-red-500" : ""
              }`}
              required
              aria-label="Contact Number"
              aria-invalid={errors.contactNo ? "true" : "false"}
            />
            {errors.contactNo && (
              <p className="mt-1 text-xs text-red-600">{errors.contactNo}</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Items</label>
            {errors.items && (
              <p className="text-xs text-red-600">{errors.items}</p>
            )}
          </div>
          
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Item Name</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => {
                        const newItems = [...items]
                        newItems[index] = { ...item, name: e.target.value }
                        setItems(newItems)
                      }}
                      placeholder="Item name"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...items]
                        newItems[index] = { ...item, description: e.target.value }
                        setItems(newItems)
                      }}
                      placeholder="Brief description"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Unit Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div className="relative">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Total Price (₹)</label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={Number(item.totalPrice).toFixed(2)}
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50 font-medium"
                        readOnly
                      />
                      
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(index)}
                          className="absolute right-2 p-1 text-red-500 hover:bg-red-50 rounded-full"
                          aria-label={`Remove item ${index + 1}`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {showDeleteConfirm === index && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                    <p className="text-sm text-red-700">Remove this item?</p>
                    <div className="mt-2 flex space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          setItems(items.filter((_, i) => i !== index))
                          setShowDeleteConfirm(null)
                        }}
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        Yes, Remove
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setItems([...items, { name: "", description: "", unitPrice: "", quantity: "", totalPrice: 0 }])}
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Item</span>
            </button>
            
            <div className="text-lg font-semibold bg-blue-50 px-4 py-2 rounded-lg">
              Grand Total: ₹{grandTotal.toFixed(2)}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bill PDF</label>
          <div
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg ${
              fileSelected ? "border-blue-600" : "border-gray-300"
            }`}
          >
            <div className="space-y-1 text-center">
              <Upload className={`mx-auto h-12 w-12 ${fileSelected ? "text-blue-600" : "text-gray-400"}`} />
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                  <span>Upload a file</span>
                  <input
                    type="file"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files[0]
                      if (file) {
                        if (validateFileSize(file)) {
                          setBillPdf(file)
                          setFileSelected(true)
                        } else {
                          e.target.value = ""
                          setBillPdf(null)
                          setFileSelected(false)
                        }
                      }
                    }}
                    accept=".pdf"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF up to 10MB</p>
              {fileSelected && (
                <div className="flex items-center justify-center space-x-2">
                  <p className="text-sm text-blue-600">{billPdf?.name}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setBillPdf(null)
                      setFileSelected(false)
                      const fileInput = document.querySelector('input[type="file"]')
                      if (fileInput) fileInput.value = ""
                    }}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                  >
                    <X className="w-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Reset Form
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 flex items-center justify-center min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Submitting...</span>
              </div>
            ) : "Submit Bill"}
          </button>
        </div>
      </form>
    </div>
  )
}