import React, { useState, useEffect } from "react"
import axios from "axios"

function DeviceAllocationForm() {
  const [formData, setFormData] = useState({
    deviceType: "",
    assignedTo: "",
    lab: "",
    assignedBy: "",
    date: "",
  })

  const [deviceOptions, setDeviceOptions] = useState([])
  const [filteredDeviceOptions, setFilteredDeviceOptions] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      const response = await axios.get("http://localhost:5000/devices")
      const devices = response.data.map((device) => device.name)
      setDeviceOptions(devices)
      setFilteredDeviceOptions(devices)
    } catch (error) {
      console.error("Error fetching devices:", error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleDeviceSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase()
    const filtered = deviceOptions.filter((device) => device.toLowerCase().includes(searchTerm))
    setFilteredDeviceOptions(filtered)
    setFormData({ ...formData, deviceType: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post("http://localhost:5000/devices/allocations", formData)
      if (response.status === 200 || response.status === 201) {
        alert("Device allocated successfully")
        setFormData({
          deviceType: "",
          assignedTo: "",
          lab: "",
          assignedBy: "",
          date: "",
        })
      } else {
        throw new Error("Unexpected response status")
      }
    } catch (error) {
      console.error("Error allocating device:", error)
      alert("Failed to allocate device: " + (error.response?.data?.error || error.message))
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Allocate Device</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="deviceType" className="block text-sm font-medium text-gray-700">
            Device Type
          </label>
          <div className="relative mt-1">
            <input
              type="text"
              id="deviceType"
              name="deviceType"
              value={formData.deviceType}
              onChange={handleDeviceSearch}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              required
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
              placeholder="Search for a device"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            {isDropdownOpen && filteredDeviceOptions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {filteredDeviceOptions.map((option) => (
                  <li
                    key={option}
                    className="text-gray-900 cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white"
                    onMouseDown={() => {
                      setFormData({ ...formData, deviceType: option })
                      setIsDropdownOpen(false)
                    }}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
            Assigned To
          </label>
          <input
            type="text"
            id="assignedTo"
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="lab" className="block text-sm font-medium text-gray-700">
            Lab
          </label>
          <input
            type="text"
            id="lab"
            name="lab"
            value={formData.lab}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="assignedBy" className="block text-sm font-medium text-gray-700">
            Assigned By
          </label>
          <input
            type="text"
            id="assignedBy"
            name="assignedBy"
            value={formData.assignedBy}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Allocate Device
          </button>
        </div>
      </form>
    </div>
  )
}

export default DeviceAllocationForm

