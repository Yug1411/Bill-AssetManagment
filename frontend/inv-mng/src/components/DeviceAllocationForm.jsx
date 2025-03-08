"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Plus, Minus } from "lucide-react"
import { Alert, AlertDescription } from "./ui/alert"
import { ScrollArea } from "./ui/scroll-area"

export default function DeviceAllocationForm() {
  const [availability, setAvailability] = useState({})
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState("")
  const [selectedBill, setSelectedBill] = useState("")
  const [formData, setFormData] = useState({
    recipient: "",
    allocator: "",
    lab: "",
    dateOfAllocation: new Date().toISOString().split("T")[0],
    items: [],
  })

  // Define the fixed department value
  const DEPARTMENT = "Electronics" // Replace with your actual department name

  useEffect(() => {
    fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/availability")
      const processedAvailability = {}
      for (const [itemName, bills] of Object.entries(response.data)) {
        const totalAvailable = bills.reduce((sum, bill) => sum + bill.availableQuantity, 0)
        processedAvailability[itemName] = { totalAvailable, bills }
      }
      setAvailability(processedAvailability)
    } catch (error) {
      setError("Error fetching availability: " + (error.response?.data?.error || error.message))
    }
  }

  const handleInputChange = (e) => {
    setError("")
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleItemSelection = (itemName) => {
    setSelectedItem(itemName)
    setSelectedBill("") // Reset bill selection when item changes
    setError("")
  }

  const handleBillSelection = (billId) => {
    setSelectedBill(billId)
    setError("")
  }

  const handleAddItem = () => {
    if (!selectedItem || !selectedBill) {
      setError("Please select both an item and a bill")
      return
    }

    // Find the bill with available quantity for this item
    const billsWithItem = availability[selectedItem]?.bills || []
    const selectedBillData = billsWithItem.find((bill) => bill.billId === selectedBill)

    if (!selectedBillData) {
      setError(`Bill not found for ${selectedItem}`)
      return
    }

    if (selectedBillData.availableQuantity <= 0) {
      setError(`No available ${selectedItem} in the selected bill`)
      return
    }

    // Create new item with billId
    const newItem = {
      itemName: selectedItem,
      billId: selectedBill,
      quantity: 1,
    }

    setFormData({ ...formData, items: [...formData.items, newItem] })
    setSelectedItem("")
    setSelectedBill("")
    setError("")
  }

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData({ ...formData, items: newItems })
    setError("")
  }

  const handleQuantityChange = (index, newQuantity) => {
    const newItems = [...formData.items]
    const item = newItems[index]

    // Find the bill for this item
    const billsWithItem = availability[item.itemName]?.bills || []
    const matchingBill = billsWithItem.find((bill) => bill.billId === item.billId)
    const maxAvailable = matchingBill?.availableQuantity || 0

    if (isNaN(newQuantity) || newQuantity < 1) {
      setError(`Quantity must be a positive number`)
      return
    }

    if (newQuantity > maxAvailable) {
      setError(`Only ${maxAvailable} ${item.itemName}(s) available in the selected bill`)
      return
    }

    newItems[index].quantity = newQuantity
    setFormData({ ...formData, items: newItems })
    setError("")
  }

  const validateForm = () => {
    if (!formData.recipient.trim()) return "Recipient is required"
    if (!formData.allocator.trim()) return "Allocator is required"
    if (!formData.lab.trim()) return "Lab is required"
    if (!formData.dateOfAllocation) return "Date of allocation is required"
    if (formData.items.length === 0) return "At least one item must be added"

    for (const item of formData.items) {
      // Find the bill for this item
      const billsWithItem = availability[item.itemName]?.bills || []
      const matchingBill = billsWithItem.find((bill) => bill.billId === item.billId)
      const maxAvailable = matchingBill?.availableQuantity || 0

      if (item.quantity > maxAvailable) {
        return `Insufficient quantity available for ${item.itemName} in the selected bill`
      }
    }

    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError("")

    try {
      // Add the department to the form data before sending
      const dataToSubmit = {
        ...formData,
        department: DEPARTMENT,
      }

      const response = await axios.post("http://localhost:5000/devices/allocations", dataToSubmit)

      if (response.status === 201) {
        alert("Allocation successful")
        setFormData({
          recipient: "",
          allocator: "",
          lab: "",
          dateOfAllocation: new Date().toISOString().split("T")[0],
          items: [],
        })
        fetchAvailability()
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message
      setError(`Error creating allocation: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Utility function to get bill number from bill ID
  const getBillNoFromId = (itemName, billId) => {
    const bills = availability[itemName]?.bills || []
    const bill = bills.find((b) => b.billId === billId)
    return bill ? bill.billNo : "Unknown"
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Device Allocation Form</h2>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="recipient">Recipient</Label>
          <Input id="recipient" name="recipient" value={formData.recipient} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="allocator">Allocator</Label>
          <Input id="allocator" name="allocator" value={formData.allocator} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="lab">Lab</Label>
          <Input id="lab" name="lab" value={formData.lab} onChange={handleInputChange} required />
        </div>
        <div>
          <Label htmlFor="dateOfAllocation">Date of Allocation</Label>
          <Input
            id="dateOfAllocation"
            name="dateOfAllocation"
            type="date"
            value={formData.dateOfAllocation}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Select Item</Label>
          <Select value={selectedItem} onValueChange={handleItemSelection}>
            <SelectTrigger>
              <SelectValue placeholder="Select an item" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <ScrollArea className="h-[200px]">
                {Object.entries(availability).map(([itemName, { totalAvailable }]) => (
                  <SelectItem key={itemName} value={itemName} disabled={totalAvailable === 0}>
                    {itemName} (Available: {totalAvailable})
                  </SelectItem>
                ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Select Bill</Label>
          <Select value={selectedBill} onValueChange={handleBillSelection} disabled={!selectedItem}>
            <SelectTrigger>
              <SelectValue placeholder={selectedItem ? "Select a bill" : "Select an item first"} />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <ScrollArea className="h-[200px]">
                {selectedItem &&
                  availability[selectedItem]?.bills.map((bill) => (
                    <SelectItem key={bill.billId} value={bill.billId} disabled={bill.availableQuantity <= 0}>
                      Bill #{bill.billNo} (Available: {bill.availableQuantity})
                    </SelectItem>
                  ))}
              </ScrollArea>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <Button 
            type="button" 
            onClick={handleAddItem} 
            disabled={!selectedItem || !selectedBill || loading}
            className="w-full"
          >
            Add Item
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[300px] border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead>Bill No</TableHead>
              <TableHead>Available Quantity</TableHead>
              <TableHead>Allocation Quantity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {formData.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500">
                  No items added yet
                </TableCell>
              </TableRow>
            ) : (
              formData.items.map((item, index) => {
                // Find the bill for this item
                const billsWithItem = availability[item.itemName]?.bills || []
                const matchingBill = billsWithItem.find((bill) => bill.billId === item.billId)
                const maxAvailable = matchingBill?.availableQuantity || 0

                return (
                  <TableRow key={index}>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{getBillNoFromId(item.itemName, item.billId)}</TableCell>
                    <TableCell>{maxAvailable}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => handleQuantityChange(index, item.quantity - 1)}
                          disabled={item.quantity <= 1 || loading}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, Number.parseInt(e.target.value))}
                          className="w-20"
                          min="1"
                          max={maxAvailable}
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => handleQuantityChange(index, item.quantity + 1)}
                          disabled={item.quantity >= maxAvailable || loading}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => handleRemoveItem(index)}
                        disabled={loading}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="px-6">
          {loading ? "Creating Allocation..." : "Create Allocation"}
        </Button>
      </div>
    </form>
  )
}