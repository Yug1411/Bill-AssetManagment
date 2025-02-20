import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pencil, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';

function AllocationList() {
  const [allocations, setAllocations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/devices/allocations');
      setAllocations(response.data);
    } catch (error) {
      console.error('Error fetching allocations:', error);
      alert('Failed to fetch allocations');
    }
  };

  const handleEdit = (allocation) => {
    setEditingId(allocation._id);
    setEditForm(allocation);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/devices/allocations/${editingId}`, editForm);
      setEditingId(null);
      fetchAllocations();
    } catch (error) {
      console.error('Error updating allocation:', error);
      alert('Failed to update allocation');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this allocation?')) {
      try {
        await axios.delete(`http://localhost:5000/devices/allocations/${id}`);
        fetchAllocations();
      } catch (error) {
        console.error('Error deleting allocation:', error);
        alert('Failed to delete allocation');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.patch(`http://localhost:5000/devices/allocations/${id}/toggle-status`);
      fetchAllocations();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Failed to toggle status');
    }
  };

  const filteredAllocations = allocations.filter(allocation =>
    allocation.assignedTo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeAllocations = filteredAllocations.filter(allocation => allocation.status === 'active');
  const inactiveAllocations = filteredAllocations.filter(allocation => allocation.status === 'inactive');

  const renderAllocationTable = (allocations) => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device Type</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lab</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned By</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {allocations.map((allocation) => (
          <tr key={allocation._id}>
            {editingId === allocation._id ? (
              <td colSpan="7" className="px-6 py-4">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <input
                    type="text"
                    name="deviceType"
                    value={editForm.deviceType}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <input
                    type="text"
                    name="assignedTo"
                    value={editForm.assignedTo}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <input
                    type="text"
                    name="lab"
                    value={editForm.lab}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <input
                    type="text"
                    name="assignedBy"
                    value={editForm.assignedBy}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <input
                    type="date"
                    name="date"
                    value={editForm.date.split('T')[0]}
                    onChange={handleEditChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <div>
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md mr-2">Save</button>
                    <button type="button" onClick={() => setEditingId(null)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md">Cancel</button>
                  </div>
                </form>
              </td>
            ) : (
              <>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{allocation.deviceType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{allocation.assignedTo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{allocation.lab}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{allocation.assignedBy}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(allocation.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    allocation.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {allocation.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleEdit(allocation)} className="text-indigo-600 hover:text-indigo-900 mr-2">
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(allocation._id)} className="text-red-600 hover:text-red-900 mr-2">
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleToggleStatus(allocation._id)} className="text-gray-600 hover:text-gray-900">
                    {allocation.status === 'active' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Device Allocations</h2>
        <div className="mt-4 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
            placeholder="Search by assigned person"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="border-t border-gray-200">
        <h3 className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Active Allocations</h3>
        {renderAllocationTable(activeAllocations)}
        <h3 className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 mt-6">Inactive Allocations</h3>
        {renderAllocationTable(inactiveAllocations)}
        {filteredAllocations.length === 0 && (
          <p className="text-center py-4 text-gray-500">No allocations available.</p>
        )}
      </div>
    </div>
  );
}

export default AllocationList;

