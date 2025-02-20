import React, { useState, useEffect } from "react"
import axios from "axios"
import { Trash2, Edit2, Search } from "lucide-react"

const ManageDevicesAndItems = () => {
  const [devices, setDevices] = useState([])
  const [recurringItems, setRecurringItems] = useState([])
  const [newItem, setNewItem] = useState("")
  const [itemType, setItemType] = useState("device")
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchDevicesAndItems()
  }, [])

  const fetchDevicesAndItems = async () => {
    try {
      const response = await axios.get("http://localhost:5000/devices-and-items")
      setDevices(response.data.devices)
      setRecurringItems(response.data.recurringItems)
    } catch (error) {
      console.error("Error fetching devices and items:", error)
      alert("Failed to fetch devices and items. Please try again later.")
    }
  }

  const addItem = async () => {
    if (newItem === "") {
      alert("Enter item name...")
      return
    }
    try {
      const endpoint = itemType === "device" ? "/devices" : "/recurring-items"
      const response = await axios.post(`http://localhost:5000${endpoint}`, { name: newItem })
      if (itemType === "device") {
        setDevices([...devices, response.data])
      } else {
        setRecurringItems([...recurringItems, response.data])
      }
      setNewItem("")
    } catch (error) {
      console.error("Error adding item:", error)
      alert("Failed to add item. Please try again.")
    }
  }

  const deleteItem = async (id, type) => {
    try {
      const endpoint = type === "device" ? "/devices" : "/recurring-items"
      await axios.delete(`http://localhost:5000${endpoint}/${id}`)
      if (type === "device") {
        setDevices(devices.filter((device) => device._id !== id))
      } else {
        setRecurringItems(recurringItems.filter((item) => item._id !== id))
      }
    } catch (error) {
      console.error("Error deleting item:", error)
      alert("Failed to delete item. Please try again.")
    }
  }

  const startEditing = (item, type) => {
    setEditingItem({ ...item, type })
    setNewItem(item.name)
    setItemType(type)
  }

  const updateItem = async () => {
    if (newItem === "") {
      alert("Enter item name...")
      return
    }
    try {
      const endpoint = editingItem.type === "device" ? "/devices" : "/recurring-items"
      const response = await axios.put(`http://localhost:5000${endpoint}/${editingItem._id}`, { name: newItem })
      if (editingItem.type === "device") {
        setDevices(devices.map((device) => (device._id === editingItem._id ? response.data : device)))
      } else {
        setRecurringItems(recurringItems.map((item) => (item._id === editingItem._id ? response.data : item)))
      }
      setNewItem("")
      setEditingItem(null)
    } catch (error) {
      console.error("Error updating item:", error)
      alert("Failed to update item. Please try again.")
    }
  }

  const filteredDevices = devices.filter((device) => device.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const filteredRecurringItems = recurringItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-8 p-6 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold mb-6">Manage Devices and Recurring Items</h1>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 pl-10 border rounded-md"
          placeholder="Search items..."
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter item name"
        />
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="device"
              checked={itemType === "device"}
              onChange={() => setItemType("device")}
              className="mr-2"
            />
            Device
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="recurringItem"
              checked={itemType === "recurringItem"}
              onChange={() => setItemType("recurringItem")}
              className="mr-2"
            />
            Recurring Item
          </label>
        </div>
        <button
          onClick={editingItem ? updateItem : addItem}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {editingItem ? "Update Item" : "Add Item"}
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Devices</h2>
          <ul className="space-y-2">
            {filteredDevices.map((device) => (
              <li key={device._id} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <span>{device.name}</span>
                <div className="space-x-2">
                  <button onClick={() => startEditing(device, "device")} className="text-blue-600 hover:text-blue-800">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => deleteItem(device._id, "device")} className="text-red-600 hover:text-red-800">
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Recurring Items</h2>
          <ul className="space-y-2">
            {filteredRecurringItems.map((item) => (
              <li key={item._id} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                <span>{item.name}</span>
                <div className="space-x-2">
                  <button
                    onClick={() => startEditing(item, "recurringItem")}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => deleteItem(item._id, "recurringItem")}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ManageDevicesAndItems

