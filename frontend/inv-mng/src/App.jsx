import { BrowserRouter as Router, Route, NavLink, Routes } from "react-router-dom";
import { useState } from "react";
import DeviceSummary from "./components/DeviceSummary";
import BillList from "./components/BillList";
import AddBill from "./components/AddBill";
import DeviceAllocationForm from "./components/DeviceAllocationForm";
import AllocationList from "./components/AllocationList";
import Availability from "./components/Availability";
import "./index.css";

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-indigo-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <span className="text-white font-bold text-xl">Inventory & Bill Management</span>
                </div>
              </div>
              
              {/* Desktop menu */}
              <div className="hidden md:flex md:items-center md:space-x-4">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive ? "bg-indigo-900 text-white" : "text-indigo-100 hover:bg-indigo-600"
                    }`
                  }
                >
                  Summary
                </NavLink>
                <NavLink
                  to="/bills"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive ? "bg-indigo-900 text-white" : "text-indigo-100 hover:bg-indigo-600"
                    }`
                  }
                >
                  Bills
                </NavLink>
                <NavLink
                  to="/add-bill"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive ? "bg-indigo-900 text-white" : "text-indigo-100 hover:bg-indigo-600"
                    }`
                  }
                >
                  Add Bill
                </NavLink>
                <NavLink
                  to="/allocations"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive ? "bg-indigo-900 text-white" : "text-indigo-100 hover:bg-indigo-600"
                    }`
                  }
                >
                  Allocations
                </NavLink>
                <NavLink
                  to="/allocate"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive ? "bg-indigo-900 text-white" : "text-indigo-100 hover:bg-indigo-600"
                    }`
                  }
                >
                  Allocate
                </NavLink>
                <NavLink
                  to="/availability"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      isActive ? "bg-indigo-900 text-white" : "text-indigo-100 hover:bg-indigo-600"
                    }`
                  }
                >
                  Availability
                </NavLink>
              </div>

              {/* Mobile menu button */}
              <div className="flex md:hidden items-center">
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-indigo-100 hover:bg-indigo-600 focus:outline-none"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? (
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu, show/hide based on menu state */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-indigo-700">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${
                      isActive ? "bg-indigo-900 text-white" : "text-indigo-100 hover:bg-indigo-600"
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Summary
                </NavLink>
                <NavLink
                  to="/bills"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${
                      isActive ? "bg-indigo-900 text-white" : "text-indigo-100 hover:bg-indigo-600"
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Bills
                </NavLink>
                <NavLink
                  to="/add-bill"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${
                      isActive ? "bg-indigo-900 text-white" : "text-indigo-100 hover:bg-indigo-600"
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Add Bill
                </NavLink>
                <NavLink
                  to="/allocations"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${
                      isActive ? "bg-indigo-900 text-white" : "text-indigo-100 hover:bg-indigo-600"
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Allocations
                </NavLink>
                <NavLink
                  to="/allocate"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${
                      isActive ? "bg-indigo-900 text-white" : "text-indigo-100 hover:bg-indigo-600"
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Allocate
                </NavLink>
                <NavLink
                  to="/availability"
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium ${
                      isActive ? "bg-indigo-900 text-white" : "text-indigo-100 hover:bg-indigo-600"
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Availability
                </NavLink>
              </div>
            </div>
          )}
        </nav>

        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <Routes>
              <Route path="/" element={<DeviceSummary />} />
              <Route path="/bills" element={<BillList />} />
              <Route path="/add-bill" element={<AddBill />} />
              <Route path="/allocations" element={<AllocationList />} />
              <Route path="/allocate" element={<DeviceAllocationForm />} />
              <Route path="/availability" element={<Availability />} />
            </Routes>
          </div>
        </main>

        <footer className="bg-white shadow-inner py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 text-sm">
              Inventory & Bill Management System © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;