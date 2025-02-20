import { BrowserRouter as Router, Route, NavLink, Routes } from "react-router-dom"
import DeviceSummary from "./components/DeviceSummary"
import BillList from "./components/BillList"
import AddBill from "./components/AddBill"
import DeviceAllocationForm from "./components/DeviceAllocationForm"
import AllocationList from "./components/AllocationList"
import ManageDevicesAndItems from "./components/ManageDevicesAndItems"
import Availability from "./components/Availability"
import "./index.css"

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex space-x-8 h-16 items-center">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                Summary
              </NavLink>
              <NavLink
                to="/bills"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                Bills
              </NavLink>
              <NavLink
                to="/add-bill"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                Add New Bill
              </NavLink>
              <NavLink
                to="/allocations"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                Device Allocations
              </NavLink>
              <NavLink
                to="/allocate"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                Allocate Device
              </NavLink>
              <NavLink
                to="/manage-devices-items"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                Manage Devices & Items
              </NavLink>
              <NavLink
                to="/availability"
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium ${
                    isActive ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                Availability
              </NavLink>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<DeviceSummary />} />
            <Route path="/bills" element={<BillList />} />
            <Route path="/add-bill" element={<AddBill />} />
            <Route path="/allocations" element={<AllocationList />} />
            <Route path="/allocate" element={<DeviceAllocationForm />} />
            <Route path="/manage-devices-items" element={<ManageDevicesAndItems />} />
            <Route path="/availability" element={<Availability />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
