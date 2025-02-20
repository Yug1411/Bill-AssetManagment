import { useState, useEffect } from 'react';
import axios from 'axios';
import { Monitor, Mouse, Keyboard, Cpu, Printer, Clock, PenToolIcon as Tool } from 'lucide-react';

export default function DeviceSummary() {
  const [summary, setSummary] = useState({
    total: { count: 0 },
    allocated: { count: 0},
    inactive: { count: 0},
    currently_active: { count: 0},
    maintenance: { count: 0}
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get('http://localhost:5000/devices/summary');
        setSummary(prevSummary => ({
          ...prevSummary,
          ...response.data,
          dailyUsage: response.data.dailyUsage || prevSummary.dailyUsage,
          maintenance: response.data.maintenance || prevSummary.maintenance
        }));
      } catch (error) {
        console.error('Error fetching summary:', error);
      }
    };
    fetchSummary();
  }, []);

  const calculatePercentage = (count, goal) => {
    return goal > 0 ? (count / goal) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-medium opacity-80">TOTAL DEVICES</h3>
              <p className="text-4xl font-bold mt-1">{summary.total?.count || 0}</p>
            </div>
            {/* <span className="text-sm">Goal ${summary.total?.goal || 0}</span> */}
          </div>
          {/* <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${calculatePercentage(summary.total?.count || 0, summary.total?.goal || 1)}%` }}
            />
          </div> */}
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-medium opacity-80">ALLOCATED</h3>
              <p className="text-4xl font-bold mt-1">{summary.allocated?.count || 0}</p>
            </div>
            {/* <span className="text-sm">Goal ${summary.allocated?.goal || 0}</span> */}
          </div>
          {/* <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${calculatePercentage(summary.allocated?.count || 0, summary.allocated?.goal || 1)}%` }}
            />
          </div> */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">INACTIVE</h3>
          </div>
          <p className="text-3xl font-bold mt-2">{summary.inactive?.count || 0}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Currently Active</h3>
          </div>
          <p className="text-3xl font-bold mt-2">{summary.inactive?.count || 0}</p>
        </div>

        
      </div>
    </div>
  );
}

