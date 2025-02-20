"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Search } from "lucide-react"


export default function Availability() {
  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState("")


  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const response = await axios.get("http://localhost:5000/bills")
      const bills = response.data
      
      // Aggregate items from all bills
      const itemMap = new Map()
      
      bills.forEach(bill => {
        bill.items.forEach(item => {
          if (itemMap.has(item.name)) {
            const existing = itemMap.get(item.name)
            itemMap.set(item.name, {
              ...existing,
              quantity: existing.quantity + item.quantity
            })
          } else {
            itemMap.set(item.name, {
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice
            })
          }
        })
      })

      setItems(Array.from(itemMap.values()))
    } catch (error) {
      console.error("Error fetching items:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Item Availability</h2>
        </div>
        <div className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 pl-10 focus:border-blue-500 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-sm font-medium text-gray-500">
                <th className="pb-2">Item</th>
                <th className="pb-2">Total Quantity</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {items
                .filter(item => 
                  item.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((item, index) => (
                  <tr key={index}>
                    <td className="py-1">{item.name}</td>
                    <td className="py-1">{item.quantity}</td>
                  </tr>
                ))}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  )
}
