"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { FileText, ChevronRight, Download, Calendar, Building2, Upload, Trash } from "lucide-react"

export default function BillList() {
  const [bills, setBills] = useState([])
  const [selectedBill, setSelectedBill] = useState(null)

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    try {
      const response = await axios.get("http://localhost:5000/bills")
      setBills(response.data)
    } catch (error) {
      console.error("Error fetching bills:", error)
    }
  }

  const [uploadingPdf, setUploadingPdf] = useState(null)
  
  const handleViewPdf = (billPdfPath) => {
    window.open(`http://localhost:5000/uploads/${billPdfPath}`, "_blank")
  }

  const handleDeleteBill = async (billId) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await axios.delete(`http://localhost:5000/bills/${billId}`)
        setBills(bills.filter(bill => bill._id !== billId))
      } catch (error) {
        console.error("Error deleting bill:", error)
        alert('Failed to delete bill')
      }
    }
  }

  const handleUploadPdf = async (billId, file) => {

    try {
      console.log('Starting PDF upload for bill:', billId)
      console.log('Selected file:', file)
      setUploadingPdf(billId)
      const formData = new FormData()
      formData.append('pdf', file)
      
      console.log('Sending request to server...')
      const response = await axios.patch(
        `http://localhost:5000/bills/${billId}/pdf`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      console.log('Upload response:', response)

      if (response.status === 200) {
        fetchBills() // Refresh the list
      }
    } catch (error) {
      console.error("Error uploading PDF:", error)
      console.error("Error details:", error.response?.data || error.message)
      alert(`Failed to upload PDF: ${error.response?.data?.error || error.message}`)
    } finally {
      setUploadingPdf(null)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Bills</h2>
        </div>
        <div className="divide-y">
          {bills.map((bill) => (
            <div
              key={bill._id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={(e) => {
                // Don't collapse if clicking on file input or its label
                if (!e.target.closest('input[type="file"], label')) {
                  setSelectedBill(selectedBill?._id === bill._id ? null : bill)
                }
              }}

            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      bill.billType === "Purchase" ? "bg-blue-100" : "bg-green-100"
                    }`}
                  >
                    <FileText
                      className={`w-5 h-5 ${bill.billType === "Purchase" ? "text-blue-600" : "text-green-600"}`}
                    />
                  </div>
                  <div>
                    <h3 className="font-medium">{bill.supplier}</h3>
                    <p className="text-sm text-gray-500">
                      {bill.billType} - {bill.academicYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-medium">Bill No: {bill.billNo}</p>
                    <p className="text-sm text-gray-500">{formatDate(bill.invoiceDate)}</p>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${
                      selectedBill?._id === bill._id ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </div>

              {selectedBill?._id === bill._id && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Supplier Details</p>
                          <p className="text-sm">{bill.supplier}</p>
                          <p className="text-sm">{bill.contactNo}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Invoice Date</p>
                          <p className="text-sm">{formatDate(bill.invoiceDate)}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <table className="min-w-full">
                        <thead>
                          <tr className="text-left text-sm font-medium text-gray-500">
                            <th className="pb-2">Item</th>
                            <th className="pb-2">Unit Price</th>
                            <th className="pb-2">Quantity</th>
                            <th className="pb-2">Total</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {bill.items.map((item, index) => (
                            <tr key={index}>
                              <td className="py-1">{item.name}</td>
                              <td className="py-1">₹{item.unitPrice}</td>
                              <td className="py-1">{item.quantity}</td>
                              <td className="py-1">₹{item.totalPrice}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-medium">
                            <td colSpan="3" className="pt-2">
                              Total Amount
                            </td>
                            <td className="pt-2">₹{bill.items.reduce((sum, item) => sum + item.totalPrice, 0)}</td>

                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    {bill.billPdfPath ? (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBill(bill._id)
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                        <button

                          onClick={() => handleViewPdf(bill.billPdfPath)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          View PDF
                        </button>
                      </div>

                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBill(bill._id)
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                        <div>
                        <input
                          type="file"
                          id={`pdf-upload-${bill._id}`}
                          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                          accept=".pdf"
                          onChange={(e) => {
                            console.log('File input changed')
                            const file = e.target.files[0]
                            console.log('Selected file:', file)
                            if (file) {
                              console.log('File selected, starting upload...')
                              handleUploadPdf(bill._id, file)
                            } else {
                              console.log('No file selected')
                            }
                          }}
                        />
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor={`pdf-upload-${bill._id}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer"
                          >
                            {uploadingPdf === bill._id ? (
                              "Uploading..."
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload PDF
                              </>
                            )}
                          </label>
                        </div>
                      </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {bills.length === 0 && <div className="p-8 text-center text-gray-500">No bills found</div>}
        </div>
      </div>
    </div>
  )
}
