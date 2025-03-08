"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import { Monitor, Package, CheckCircle, FileText, AlertTriangle, BarChart3, PieChart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card"
import { Progress } from "./ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"

export default function DeviceSummary() {
  const [summary, setSummary] = useState({
    total: { count: 0 },
    allocated: { count: 0 },
    available: { count: 0 },
    recentAllocations: [],
  })

  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState("summary")
  const [yearlyExpenses, setYearlyExpenses] = useState([])
  const [labSummary, setLabSummary] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [summaryRes, billsRes, yearlyExpensesRes, labSummaryRes] = await Promise.all([
          axios.get("http://localhost:5000/devices/summary"),
          axios.get("http://localhost:5000/bills"),
          axios.get("http://localhost:5000/expenses/yearly"),
          axios.get("http://localhost:5000/labs/summary"),
        ])
        setSummary(summaryRes.data)
        setBills(billsRes.data)
        setYearlyExpenses(yearlyExpensesRes.data || generateMockYearlyExpenses())
        setLabSummary(labSummaryRes.data || generateMockLabSummary())
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to load data. Please try again later.")

        // Generate mock data if API endpoints don't exist yet
        setYearlyExpenses(generateMockYearlyExpenses())
        setLabSummary(generateMockLabSummary())
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const calculatePercentage = (count, total) => {
    return total > 0 ? (count / total) * 100 : 0
  }

  // Calculate items with low availability (less than 20% remaining)
  const getLowStockItems = () => {
    if (!bills || bills.length === 0) return []

    const items = []
    bills.forEach((bill) => {
      bill.items.forEach((item) => {
        const availablePercentage = ((item.quantity - item.allocatedQuantity) / item.quantity) * 100
        if (availablePercentage < 20 && item.quantity > 0) {
          items.push({
            name: item.name,
            available: item.quantity - item.allocatedQuantity,
            total: item.quantity,
            percentage: availablePercentage,
            billNo: bill.billNo,
          })
        }
      })
    })
    return items.slice(0, 5) // Return top 5 items with low stock
  }

  // Get recent bills
  const getRecentBills = () => {
    if (!bills || bills.length === 0) return []

    return [...bills].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
  }

  // Get allocation distribution by lab
  const getAllocationsByLab = () => {
    if (!summary.recentAllocations || summary.recentAllocations.length === 0) return []

    const labCount = {}
    summary.recentAllocations.forEach((allocation) => {
      if (!labCount[allocation.lab]) {
        labCount[allocation.lab] = 0
      }
      allocation.items.forEach((item) => {
        labCount[allocation.lab] += item.allocatedQuantity
      })
    })

    return Object.entries(labCount).map(([lab, count]) => ({
      lab,
      count,
      percentage: (count / summary.allocated.count) * 100,
    }))
  }

  // Generate mock yearly expenses data
  const generateMockYearlyExpenses = () => {
    const currentYear = new Date().getFullYear()
    return [
      { year: currentYear - 4, amount: 125000, itemCount: 45 },
      { year: currentYear - 3, amount: 187500, itemCount: 62 },
      { year: currentYear - 2, amount: 215000, itemCount: 78 },
      { year: currentYear - 1, amount: 268000, itemCount: 93 },
      { year: currentYear, amount: 192000, itemCount: 67 },
    ]
  }

  // Generate mock lab summary data
  const generateMockLabSummary = () => {
    return [
      { lab: "Computer Science", deviceCount: 124, totalValue: 345000, maintenanceCost: 12500 },
      { lab: "Electronics", deviceCount: 98, totalValue: 287000, maintenanceCost: 9800 },
      { lab: "Mechanical", deviceCount: 76, totalValue: 198000, maintenanceCost: 7600 },
      { lab: "Civil", deviceCount: 52, totalValue: 145000, maintenanceCost: 5200 },
      { lab: "Electrical", deviceCount: 87, totalValue: 230000, maintenanceCost: 8700 },
    ]
  }

  // Handle button actions
  const handleButtonClick = (action) => {
    console.log(`Action triggered: ${action}`)
    // For demo purposes, we'll just show an alert
    alert(`The "${action}" action has been triggered. This would navigate to the ${action} page in a complete implementation.`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading inventory data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-destructive/10 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Error Loading Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div className="w-full md:w-1/2">
          <h2 className="text-3xl font-bold tracking-tight">Inventory Dashboard</h2>
          <p className="text-muted-foreground mt-1">Track, manage and analyze your inventory in real-time</p>
        </div>
        
        {/* Fix: We're moving the value state into the Tabs component itself */}
        <div className="w-full md:w-auto">
          <Tabs defaultValue="summary" value={view} onValueChange={setView} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Overview</TabsTrigger>
              <TabsTrigger value="bills">Bills</TabsTrigger>
              <TabsTrigger value="allocations">Allocations</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Fix: We're wrapping all TabsContent components in a main Tabs component */}
      <Tabs value={view} onValueChange={setView}>
        <TabsContent value="summary" className="space-y-6 mt-0">
          {/* Key metrics cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
                <Monitor className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{summary.total.count}</div>
                <p className="text-xs text-muted-foreground mt-1">From {bills.length} bills</p>
                <Progress value={100} className="mt-2 h-2" />
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Allocated Devices</CardTitle>
                <CheckCircle className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{summary.allocated.count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {calculatePercentage(summary.allocated.count, summary.total.count).toFixed(1)}% of total inventory
                </p>
                <Progress
                  value={calculatePercentage(summary.allocated.count, summary.total.count)}
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Devices</CardTitle>
                <Package className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{summary.available.count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {calculatePercentage(summary.available.count, summary.total.count).toFixed(1)}% remaining
                </p>
                <Progress
                  value={calculatePercentage(summary.available.count, summary.total.count)}
                  className="mt-2 h-2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Yearly expenses */}
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                  Yearly Expenses
                </CardTitle>
                <CardDescription>Financial overview of inventory purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {yearlyExpenses.map((expense, index) => (
                    <Card key={index} className="bg-muted/40">
                      <CardContent className="p-4">
                        <div className="text-center">
                          <p className="text-sm font-medium">{expense.year}</p>
                          <p className="text-2xl font-bold mt-1">₹{expense.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground mt-1">{expense.itemCount} items</p>
                          <Progress value={expense.amount / 3000} className="h-1 mt-2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => handleButtonClick("Detailed Report")}>
                  View Detailed Report
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Lab summary */}
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  Lab-wise Summary
                </CardTitle>
                <CardDescription>Distribution and maintenance costs by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Laboratory</TableHead>
                        <TableHead>Device Count</TableHead>
                        <TableHead className="hidden md:table-cell">Total Value</TableHead>
                        <TableHead className="hidden md:table-cell">Maintenance Cost</TableHead>
                        <TableHead className="text-right">Utilization</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {labSummary.map((lab, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{lab.lab}</TableCell>
                          <TableCell>{lab.deviceCount}</TableCell>
                          <TableCell className="hidden md:table-cell">₹{lab.totalValue.toLocaleString()}</TableCell>
                          <TableCell className="hidden md:table-cell">₹{lab.maintenanceCost.toLocaleString()}/yr</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span>{Math.floor(75 + Math.random() * 20)}%</span>
                              <Progress value={75 + Math.random() * 20} className="w-16 h-2" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-between">
                <div className="text-sm text-muted-foreground">Showing {labSummary.length} laboratories</div>
                <Button size="sm" onClick={() => handleButtonClick("Lab Details")}>
                  View Lab Details
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Low stock alert and lab distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                  Low Stock Alert
                </CardTitle>
                <CardDescription>Items with less than 20% availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="min-h-48">
                  {getLowStockItems().length > 0 ? (
                    <div className="space-y-4">
                      {getLowStockItems().map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Bill #{item.billNo}</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <Badge variant={item.available === 0 ? "destructive" : "outline"}>
                              {item.available} / {item.total} available
                            </Badge>
                            <Progress value={item.percentage} className="w-24 mt-2 h-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48">
                      <p className="text-sm text-center text-muted-foreground">All items have sufficient stock</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setView("bills")}>
                  View All Inventory
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2 text-indigo-500" />
                  Lab Distribution
                </CardTitle>
                <CardDescription>Allocation of devices by lab</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="min-h-48">
                  {getAllocationsByLab().length > 0 ? (
                    <div className="space-y-4">
                      {getAllocationsByLab().map((lab, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">Lab {lab.lab}</p>
                            <p className="text-xs text-muted-foreground">{lab.count} devices</p>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="text-sm font-medium">{lab.percentage.toFixed(1)}%</p>
                            <Progress value={lab.percentage} className="w-24 mt-2 h-1" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-48">
                      <p className="text-sm text-center text-muted-foreground">No allocations by lab data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setView("allocations")}>
                  View All Allocations
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bills" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Recent Bills
              </CardTitle>
              <CardDescription>Latest inventory additions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Available</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getRecentBills().map((bill, index) => {
                      const totalItems = bill.items.reduce((sum, item) => sum + item.quantity, 0)
                      const availableItems = bill.items.reduce(
                        (sum, item) => sum + (item.quantity - item.allocatedQuantity),
                        0,
                      )

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{bill.billNo}</TableCell>
                          <TableCell>{bill.supplier}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{bill.billType}</Badge>
                          </TableCell>
                          <TableCell>{new Date(bill.invoiceDate).toLocaleDateString()}</TableCell>
                          <TableCell>{bill.items.length}</TableCell>
                          <TableCell className="text-right">
                            <span className={availableItems === 0 ? "text-destructive" : ""}>
                              {availableItems} / {totalItems}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {getRecentBills().length} of {bills.length} bills
              </div>
              <Button size="sm" onClick={() => handleButtonClick("All Bills")}>
                View All Bills
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="allocations" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Recent Allocations
              </CardTitle>
              <CardDescription>Latest device distributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Lab</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Allocator</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.recentAllocations && summary.recentAllocations.length > 0 ? (
                      summary.recentAllocations.map((allocation, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{allocation.recipient}</TableCell>
                          <TableCell>Lab {allocation.lab}</TableCell>
                          <TableCell>{new Date(allocation.dateOfAllocation).toLocaleDateString()}</TableCell>
                          <TableCell>{allocation.allocator}</TableCell>
                          <TableCell className="text-right">
                            {allocation.items.reduce((sum, item) => sum + item.allocatedQuantity, 0)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6">
                          No allocation data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {summary.recentAllocations ? summary.recentAllocations.length : 0} recent allocations
              </div>
              <Button size="sm" onClick={() => handleButtonClick("All Allocations")}>
                View All Allocations
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}