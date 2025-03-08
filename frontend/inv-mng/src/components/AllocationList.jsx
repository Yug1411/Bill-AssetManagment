"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Search, RefreshCw, Edit, Trash2, AlertCircle, Filter, Eye, Calendar } from "lucide-react"
import { Alert, AlertDescription } from "./ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Label } from "./ui/label"
import { ScrollArea } from "./ui/scroll-area"
import { Card, CardContent } from "./ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip"

export default function AllocationList() {
  const [allocations, setAllocations] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedAllocation, setSelectedAllocation] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editFormData, setEditFormData] = useState(null)
  const [filterOption, setFilterOption] = useState("all")
  const [dateRange, setDateRange] = useState({ 
    startDate: "", 
    endDate: "" 
  })

  useEffect(() => {
    fetchAllocations()
  }, [])

  const fetchAllocations = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await axios.get("http://localhost:5000/devices/allocations")
      setAllocations(response.data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching allocations:", error)
      setError("Failed to load allocations. Please try again.")
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAllocations()
    setTimeout(() => setIsRefreshing(false), 500) // Visual feedback for refresh action
  }

  const handleDeleteClick = (allocation) => {
    setSelectedAllocation(allocation)
    setIsDeleteDialogOpen(true)
  }

  const handleEditClick = (allocation) => {
    setSelectedAllocation(allocation)
    setEditFormData({
      recipient: allocation.recipient,
      allocator: allocation.allocator,
      lab: allocation.lab,
      dateOfAllocation: new Date(allocation.dateOfAllocation).toISOString().split("T")[0],
      // Items are not editable in this simplified version
    })
    setIsEditDialogOpen(true)
  }

  const handleViewDetails = (allocation) => {
    setSelectedAllocation(allocation)
    setIsDetailsDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedAllocation) return
    
    setIsDeleting(true)
    try {
      await axios.delete(`http://localhost:5000/devices/allocations/${selectedAllocation._id}`)
      setAllocations(allocations.filter(a => a._id !== selectedAllocation._id))
      setIsDeleteDialogOpen(false)
      setSelectedAllocation(null)
    } catch (error) {
      setError(`Failed to delete allocation: ${error.response?.data?.error || error.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditInputChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    })
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    if (!selectedAllocation || !editFormData) return
    
    try {
      const response = await axios.put(
        `http://localhost:5000/devices/allocations/${selectedAllocation._id}`, 
        editFormData
      )
      
      // Update the allocation in the local state
      setAllocations(allocations.map(a => 
        a._id === selectedAllocation._id ? { ...a, ...editFormData } : a
      ))
      
      setIsEditDialogOpen(false)
      setSelectedAllocation(null)
    } catch (error) {
      setError(`Failed to update allocation: ${error.response?.data?.error || error.message}`)
    }
  }

  const handleDateRangeChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    })
  }

  const clearDateFilter = () => {
    setDateRange({ startDate: "", endDate: "" })
  }

  const formatAllocationBreakdown = (items) => {
    return items
      .map((item) => {
        const billNo = item.billId.billNo
        const total = item.billId.items.find((i) => i.name === item.itemName).quantity
        return `${billNo}/${item.startNumber}/${total} to ${billNo}/${item.endNumber}/${total}`
      })
      .join(" & ")
  }

  // Apply filters and search
  const filteredAllocations = allocations.filter((allocation) => {
    // Search term filtering
    const matchesSearch = 
      allocation.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.allocator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.lab.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.items.some(item => item.itemName.toLowerCase().includes(searchTerm.toLowerCase()))

    // Date range filtering
    const allocationDate = new Date(allocation.dateOfAllocation)
    const startDateMatch = dateRange.startDate ? allocationDate >= new Date(dateRange.startDate) : true
    const endDateMatch = dateRange.endDate ? allocationDate <= new Date(dateRange.endDate) : true
    const matchesDateRange = startDateMatch && endDateMatch

    // Type filtering
    if (filterOption === "all") {
      return matchesSearch && matchesDateRange
    } else if (filterOption === "recent") {
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      return matchesSearch && matchesDateRange && new Date(allocation.dateOfAllocation) >= oneWeekAgo
    }
    
    return matchesSearch && matchesDateRange
  })

  const sortedAllocations = [...filteredAllocations].sort((a, b) => 
    new Date(b.dateOfAllocation) - new Date(a.dateOfAllocation)
  )

  // Helper function to format date range display
  const getDateRangeDisplayText = () => {
    if (dateRange.startDate && dateRange.endDate) {
      return `${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}`
    } else if (dateRange.startDate) {
      return `From ${new Date(dateRange.startDate).toLocaleDateString()}`
    } else if (dateRange.endDate) {
      return `Until ${new Date(dateRange.endDate).toLocaleDateString()}`
    }
    return "Filter by date range"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Allocation List</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="w-5 h-5 text-gray-500" />
          <Input
            type="text"
            placeholder="Search by recipient, allocator, lab or item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {dateRange.startDate || dateRange.endDate ? getDateRangeDisplayText() : "Filter by date range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={dateRange.startDate}
                    onChange={handleDateRangeChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={dateRange.endDate}
                    onChange={handleDateRangeChange}
                    min={dateRange.startDate}
                  />
                </div>
                {(dateRange.startDate || dateRange.endDate) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearDateFilter}
                    className="w-full mt-2"
                  >
                    Clear Date Filter
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <Select value={filterOption} onValueChange={setFilterOption}>
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Allocations</SelectItem>
              <SelectItem value="recent">Recent (7 days)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="text-sm text-gray-500">
        Showing {filteredAllocations.length} of {allocations.length} allocations
      </div>
      
      <ScrollArea className="h-[500px] border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recipient</TableHead>
              <TableHead>Allocator</TableHead>
              <TableHead>Lab</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading allocations...
                </TableCell>
              </TableRow>
            ) : sortedAllocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchTerm || dateRange.startDate || dateRange.endDate || filterOption !== "all" 
                    ? "No allocations match your filters." 
                    : "No allocations found."}
                </TableCell>
              </TableRow>
            ) : (
              sortedAllocations.map((allocation) => (
                <TableRow key={allocation._id}>
                  <TableCell className="font-medium">{allocation.recipient}</TableCell>
                  <TableCell>{allocation.allocator}</TableCell>
                  <TableCell>{allocation.lab}</TableCell>
                  <TableCell>{new Date(allocation.dateOfAllocation).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <ul className="list-disc list-inside">
                      {allocation.items.slice(0, 2).map((item, index) => (
                        <li key={index} className="text-sm">
                          {item.itemName} - Qty: {item.allocatedQuantity}
                        </li>
                      ))}
                      {allocation.items.length > 2 && (
                        <li className="text-xs text-blue-500 italic">
                          +{allocation.items.length - 2} more items...
                        </li>
                      )}
                    </ul>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleViewDetails(allocation)}
                              className="bg-white hover:bg-gray-100 border"
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>View Details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditClick(allocation)}
                              className="bg-white hover:bg-gray-100 border"
                            >
                              <Edit className="h-4 w-4 text-amber-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Edit Allocation</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteClick(allocation)}
                              className="bg-white hover:bg-gray-100 border"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>Delete Allocation</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-white text-black shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-black">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p className="text-gray-800">
            Are you sure you want to delete the allocation for{" "}
            <span className="font-semibold">{selectedAllocation?.recipient}</span>?
          </p>
          <p className="text-sm text-gray-600">This action cannot be undone.</p>
          <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsDeleteDialogOpen(false)}
            disabled={isDeleting}
            className="border-gray-400 text-gray-800 hover:bg-gray-100"
          >
           Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirmDelete}
            disabled={isDeleting}
            className="bg-red-600 text-white hover:bg-red-700"
          >
          {isDeleting ? "Deleting..." : "Delete"}
          </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Edit Dialog */}
      {/* Edit Dialog */}
<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
  <DialogContent className="bg-white text-black shadow-lg sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="text-black">Edit Allocation</DialogTitle>
    </DialogHeader>
    {editFormData && (
      <form onSubmit={submitEdit} className="space-y-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="recipient" className="text-gray-800">Recipient</Label>
            <Input
              id="recipient"
              name="recipient"
              value={editFormData.recipient}
              onChange={handleEditInputChange}
              required
              className="border-gray-400 text-gray-900"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="allocator" className="text-gray-800">Allocator</Label>
            <Input
              id="allocator"
              name="allocator"
              value={editFormData.allocator}
              onChange={handleEditInputChange}
              required
              className="border-gray-400 text-gray-900"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lab" className="text-gray-800">Lab</Label>
            <Input
              id="lab"
              name="lab"
              value={editFormData.lab}
              onChange={handleEditInputChange}
              required
              className="border-gray-400 text-gray-900"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dateOfAllocation" className="text-gray-800">Date of Allocation</Label>
            <Input
              id="dateOfAllocation"
              name="dateOfAllocation"
              type="date"
              value={editFormData.dateOfAllocation}
              onChange={handleEditInputChange}
              required
              className="border-gray-400 text-gray-900"
            />
          </div>
          <p className="text-sm text-amber-600">
            Note: Item details cannot be edited. To modify items, delete this allocation and create a new one.
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsEditDialogOpen(false)}
            className="border-gray-400 text-gray-800 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
            Save Changes
          </Button>
        </DialogFooter>
      </form>
    )}
  </DialogContent>
</Dialog>

{/* Details Dialog */}
<Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
  <DialogContent className="bg-white text-black shadow-lg sm:max-w-lg">
    <DialogHeader>
      <DialogTitle className="text-black">Allocation Details</DialogTitle>
    </DialogHeader>
    {selectedAllocation && (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">Recipient</p>
              <p className="font-medium text-black">{selectedAllocation.recipient}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">Allocator</p>
              <p className="font-medium text-black">{selectedAllocation.allocator}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">Lab</p>
              <p className="font-medium text-black">{selectedAllocation.lab}</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-medium text-black">
                {new Date(selectedAllocation.dateOfAllocation).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-gray-50">
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-2 text-black">Allocated Items</h3>
            <ScrollArea className="max-h-[200px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-800">Item</TableHead>
                    <TableHead className="text-gray-800">Quantity</TableHead>
                    <TableHead className="text-gray-800">Breakdown</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAllocation.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-gray-900">{item.itemName}</TableCell>
                      <TableCell className="text-gray-900">{item.allocatedQuantity}</TableCell>
                      <TableCell className="text-xs text-gray-700">
                        {formatAllocationBreakdown([item])}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
        
        <DialogFooter>
          <Button onClick={() => setIsDetailsDialogOpen(false)} className="bg-gray-200 text-black hover:bg-gray-300">
            Close
          </Button>
        </DialogFooter>
      </div>
    )}
  </DialogContent>
</Dialog>

    </div>
  )
}