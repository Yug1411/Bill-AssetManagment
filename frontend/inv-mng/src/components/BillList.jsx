"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { FileText, ChevronRight, Download, Calendar, Building2, Upload, Trash, Edit, AlertCircle, Loader2, X, Search, Filter } from "lucide-react"

export default function BillList() {
  const [bills, setBills] = useState([])
  const [filteredBills, setFilteredBills] = useState([])
  const [selectedBill, setSelectedBill] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [uploadingPdf, setUploadingPdf] = useState(null)
  const [editingBill, setEditingBill] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [billToDelete, setBillToDelete] = useState(null)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("All")

  useEffect(() => {
    fetchBills()
  }, [])

  // Apply filters and search whenever bills, searchTerm, or filterType changes
  useEffect(() => {
    applyFiltersAndSearch()
  }, [bills, searchTerm, filterType])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage("")
        setSuccessMessage("")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [errorMessage, successMessage])

  const fetchBills = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get("http://localhost:5000/bills")
      setBills(response.data)
    } catch (error) {
      console.error("Error fetching bills:", error)
      setErrorMessage("Failed to load bills. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  const applyFiltersAndSearch = () => {
    let result = [...bills]
    
    // Apply bill type filter
    if (filterType !== "All") {
      result = result.filter(bill => bill.billType === filterType)
    }
    
    // Apply search term
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase()
      result = result.filter(bill => 
        bill.supplier.toLowerCase().includes(term) ||
        bill.billNo.toLowerCase().includes(term) ||
        bill.academicYear.toLowerCase().includes(term) ||
        bill.items.some(item => 
          item.name.toLowerCase().includes(term) || 
          (item.description && item.description.toLowerCase().includes(term))
        )
      )
    }
    
    setFilteredBills(result)
  }

  const handleViewPdf = (billPdfPath) => {
    window.open(`http://localhost:5000/uploads/${billPdfPath}`, "_blank")
  }

  const handleDeleteBill = async (billId) => {
    setShowDeleteModal(false)
    setIsLoading(true)
    try {
      await axios.delete(`http://localhost:5000/bills/${billId}`)
      setBills(bills.filter(bill => bill._id !== billId))
      setSuccessMessage("Bill deleted successfully")
    } catch (error) {
      console.error("Error deleting bill:", error)
      setErrorMessage('Failed to delete bill: ' + (error.response?.data?.error || error.message))
    } finally {
      setIsLoading(false)
      setBillToDelete(null)
    }
  }

  const handleEditBill = (bill) => {
    setEditingBill({ ...bill })
  }

  const handleUpdateBill = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await axios.put(
        `http://localhost:5000/bills/${editingBill._id}`,
        editingBill
      )
      // Update the bills list with the edited bill
      setBills(bills.map(bill => bill._id === editingBill._id ? response.data : bill))
      setEditingBill(null)
      setSuccessMessage("Bill updated successfully")
    } catch (error) {
      console.error("Error updating bill:", error)
      setErrorMessage('Failed to update bill: ' + (error.response?.data?.error || error.message))
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadPdf = async (billId, file) => {
    try {
      setUploadingPdf(billId)
      const formData = new FormData()
      formData.append('pdf', file)
      
      const response = await axios.patch(
        `http://localhost:5000/bills/${billId}/pdf`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      if (response.status === 200) {
        fetchBills() // Refresh the list
        setSuccessMessage("PDF uploaded successfully")
      }
    } catch (error) {
      console.error("Error uploading PDF:", error)
      setErrorMessage(`Failed to upload PDF: ${error.response?.data?.error || error.message}`)
    } finally {
      setUploadingPdf(null)
    }
  }

  // Helper to update fields in editing form
  const updateEditingField = (field, value) => {
    setEditingBill(prev => ({ ...prev, [field]: value }))
  }

  // Helper to update item fields in editing form
  const updateItemField = (index, field, value) => {
    const updatedItems = [...editingBill.items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setEditingBill(prev => ({ ...prev, items: updatedItems }))
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const confirmDelete = (billId) => {
    setBillToDelete(billId)
    setShowDeleteModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Notification Messages */}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="inline-flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {errorMessage}
          </span>
          <button onClick={() => setErrorMessage("")} className="absolute top-0 right-0 p-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="absolute top-0 right-0 p-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Bills</h2>
            <button 
              onClick={() => fetchBills()} 
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Refresh
            </button>
          </div>
          
          {/* Search and Filter Section */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search bills by supplier, bill number, or items..."
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2 min-w-fit">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Bills</option>
                <option value="Purchase">Purchase</option>
                <option value="Recurring">Recurring</option>
              </select>
            </div>
          </div>
        </div>

        {isLoading && bills.length === 0 ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="divide-y">
            {filteredBills.map((bill) => (
              <div
                key={bill._id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={(e) => {
                  // Don't collapse if clicking on file input or its label
                  if (!e.target.closest('input[type="file"], label, button')) {
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
                              <th className="pb-2">Description</th>
                              <th className="pb-2">Unit Price</th>
                              <th className="pb-2">Quantity</th>
                              <th className="pb-2">Total</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {bill.items.map((item, index) => (
                              <tr key={index}>
                                <td className="py-1">{item.name}</td>
                                <td className="py-1">{item.description || '-'}</td>
                                <td className="py-1">₹{item.unitPrice}</td>
                                <td className="py-1">{item.quantity}</td>
                                <td className="py-1">₹{item.totalPrice}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="font-medium">
                              <td colSpan="4" className="pt-2">
                                Total Amount
                              </td>
                              <td className="pt-2">₹{bill.items.reduce((sum, item) => sum + item.totalPrice, 0)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          confirmDelete(bill._id)
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditBill(bill)
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      
                      {bill.billPdfPath ? (
                        <button
                          onClick={() => handleViewPdf(bill.billPdfPath)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          View PDF
                        </button>
                      ) : (
                        <div>
                          <input
                            type="file"
                            id={`pdf-upload-${bill._id}`}
                            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none hidden"
                            accept=".pdf"
                            onChange={(e) => {
                              const file = e.target.files[0]
                              if (file) {
                                handleUploadPdf(bill._id, file)
                              }
                            }}
                          />
                          <label
                            htmlFor={`pdf-upload-${bill._id}`}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer"
                          >
                            {uploadingPdf === bill._id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload PDF
                              </>
                            )}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {!isLoading && filteredBills.length === 0 && (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No bills found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {bills.length > 0 
                    ? "Try adjusting your search or filter criteria."
                    : "Start by adding your first bill to the system."}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this bill? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBill(billToDelete)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bill Modal */}
      {editingBill && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 shadow-lg my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Bill</h3>
              <button
                onClick={() => setEditingBill(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateBill} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bill Type
                  </label>
                  <select
                    value={editingBill.billType}
                    onChange={(e) => updateEditingField('billType', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="Purchase">Purchase</option>
                    <option value="Recurring">Recurring</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={editingBill.academicYear}
                    onChange={(e) => updateEditingField('academicYear', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="YYYY-YY"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bill No
                  </label>
                  <input
                    type="text"
                    value={editingBill.billNo}
                    onChange={(e) => updateEditingField('billNo', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={new Date(editingBill.invoiceDate).toISOString().split('T')[0]}
                    onChange={(e) => updateEditingField('invoiceDate', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supplier
                  </label>
                  <input
                    type="text"
                    value={editingBill.supplier}
                    onChange={(e) => updateEditingField('supplier', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact No
                  </label>
                  <input
                    type="text"
                    value={editingBill.contactNo}
                    onChange={(e) => updateEditingField('contactNo', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Items</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unit Price
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {editingBill.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItemField(index, 'name', e.target.value)}
                              className="w-full p-1 border border-gray-300 rounded-md"
                              required
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.description || ''}
                              onChange={(e) => updateItemField(index, 'description', e.target.value)}
                              className="w-full p-1 border border-gray-300 rounded-md"
                              placeholder="Optional"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const unitPrice = parseFloat(e.target.value) || 0;
                                updateItemField(index, 'unitPrice', unitPrice);
                                updateItemField(index, 'totalPrice', unitPrice * item.quantity);
                              }}
                              className="w-full p-1 border border-gray-300 rounded-md"
                              required
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const quantity = parseInt(e.target.value) || 0;
                                updateItemField(index, 'quantity', quantity);
                                updateItemField(index, 'totalPrice', item.unitPrice * quantity);
                              }}
                              className="w-full p-1 border border-gray-300 rounded-md"
                              required
                              min="1"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.totalPrice}
                              readOnly
                              className="w-full p-1 border border-gray-300 rounded-md bg-gray-50"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="4" className="px-4 py-2 text-right font-medium">
                          Total Bill Amount:
                        </td>
                        <td className="px-4 py-2 font-bold">
                          ₹{editingBill.items.reduce((sum, item) => sum + item.totalPrice, 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingBill(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}