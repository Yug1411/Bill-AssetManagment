"use client"

import { useState } from "react"
import { Plus, Minus, Upload } from "lucide-react"

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
      unitPrice: "",
      quantity: "",
      totalPrice: 0,
    },
  ])

  const [billPdf, setBillPdf] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileSelected, setFileSelected] = useState(false)

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

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)

      const data = new FormData()
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key])
      })
      data.append("items", JSON.stringify(items))
      if (billPdf) {
        data.append("billPdf", billPdf)
      }

      const response = await fetch("http://localhost:5000/bills", {
        method: "POST",
        body: data,
      })

      if (response.status === 201) {
        alert("Bill added successfully")
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
            unitPrice: "",
            quantity: "",
            totalPrice: 0,
          },
        ])
        setBillPdf(null)
        setFileSelected(false)
        const fileInput = document.querySelector('input[type="file"]')
        if (fileInput) fileInput.value = ""
      } else {
        throw new Error("Failed to add bill")
      }
    } catch (error) {
      console.error("Error adding bill:", error)
      alert("Failed to add bill. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm max-w-4xl mx-auto">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold">Add New Bill</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bill Type</label>
            <select
              value={formData.billType}
              onChange={(e) => setFormData({ ...formData, billType: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="Purchase">Purchase</option>
              <option value="Recurring">Recurring</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <input
              type="text"
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              placeholder="e.g., 2022-23"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bill No.</label>
            <input
              type="text"
              value={formData.billNo}
              onChange={(e) => setFormData({ ...formData, billNo: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact No.</label>
            <input
              type="text"
              value={formData.contactNo}
              onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Items</label>
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 items-center">
              <input
                type="text"
                value={item.name}
                onChange={(e) => {
                  const newItems = [...items]
                  newItems[index] = { ...item, name: e.target.value }
                  setItems(newItems)
                }}
                placeholder="Item name"
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                value={item.unitPrice}
                onChange={(e) => handleUnitPriceChange(index, e.target.value)}
                placeholder="Unit price"
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <input
                type="number"
                step="1"
                min="0"
                value={item.quantity}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
                placeholder="Quantity"
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={Number(item.totalPrice).toFixed(2)}
                  className="px-3 py-2 border rounded-lg bg-gray-50"
                  readOnly
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_, i) => i !== index))}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems([...items, { name: "", unitPrice: "", quantity: "", totalPrice: 0 }])}
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Another Item</span>
          </button>
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
                      setBillPdf(file)
                      setFileSelected(!!file)
                    }}
                    accept=".pdf"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF up to 10MB</p>
              {fileSelected && <p className="text-sm text-blue-600">File selected successfully!</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
          >
            {isSubmitting ? "Submitting..." : "Submit Bill"}
          </button>
        </div>
      </form>
    </div>
  )
}
