"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Input } from "./ui/input"
import { Search, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "./ui/button"
import { Alert, AlertDescription } from "./ui/alert"
import { ScrollArea } from "./ui/scroll-area"

export default function Availability() {
  const [availability, setAvailability] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  useEffect(() => {
    fetchAvailability()
  }, [])
  
  const fetchAvailability = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await axios.get("http://localhost:5000/api/availability")
      setAvailability(response.data)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching availability:", error)
      setError("Failed to load availability data. Please try again.")
      setLoading(false)
    }
  }
  
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAvailability()
    setTimeout(() => setIsRefreshing(false), 500) // Visual feedback for refresh action
  }
  
  const filteredItems = Object.entries(availability).filter(([itemName]) =>
    itemName.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  
  // Calculate totals for summary
  const calculateSummary = () => {
    let totalItems = 0
    let totalAvailable = 0
    
    Object.values(availability).forEach(bills => {
      bills.forEach(bill => {
        totalItems += bill.totalQuantity
        totalAvailable += bill.availableQuantity
      })
    })
    
    return { totalItems, totalAvailable }
  }
  
  const { totalItems, totalAvailable } = calculateSummary()
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inventory Availability</h2>
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
      
      <div className="flex items-center space-x-2 max-w-md">
        <Search className="w-5 h-5 text-gray-500" />
        <Input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
        <div>
          Showing {filteredItems.length} of {Object.keys(availability).length} items
        </div>
        <div className="flex gap-4">
          <span>Total Items: {totalItems}</span>
          <span>Available Items: {totalAvailable}</span>
        </div>
      </div>
      
      <ScrollArea className="h-[500px] border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Item Name</TableHead>
              <TableHead>Bill No</TableHead>
              <TableHead>Total Quantity</TableHead>
              <TableHead>Available Quantity</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading inventory data...
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {searchTerm ? "No items match your search" : "No items available"}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map(([itemName, bills]) =>
                bills.map((bill, index) => (
                  <TableRow key={`${itemName}-${bill.billId}`}>
                    {index === 0 && <TableCell rowSpan={bills.length}>{itemName}</TableCell>}
                    <TableCell>{bill.billNo}</TableCell>
                    <TableCell>{bill.totalQuantity}</TableCell>
                    <TableCell>{bill.availableQuantity}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div 
                          className={`h-2 w-2 rounded-full mr-2 ${
                            bill.availableQuantity === 0 
                              ? "bg-red-500" 
                              : bill.availableQuantity < bill.totalQuantity * 0.25 
                                ? "bg-amber-500" 
                                : "bg-green-500"
                          }`} 
                        />
                        {bill.availableQuantity === 0 
                          ? "Out of stock" 
                          : bill.availableQuantity < bill.totalQuantity * 0.25 
                            ? "Low stock" 
                            : "In stock"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}