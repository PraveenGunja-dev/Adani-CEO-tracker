"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import UserTable from '@/app/components/UserTable';
import { useRouter } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Import the fiscal year data files
import exDataFY24 from './ex.json';
import exDataFY25 from './ex_fy25.json';
import exDataFY26 from './ex_fy26.json';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AnalyticsPage() {
  const [fiscalYear, setFiscalYear] = useState('FY_24');
  const [showTracker, setShowTracker] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  // Handle form submission
  const handleFormSubmit = () => {
    setShowTracker(prev => !prev);
  };

  // Handle add new capacity button click
  const handleAddNewCapacity = () => {
    if (user) {
      setShowTracker(true);
    } else {
      // Redirect to login page with proper redirect URL
      router.push('/login?redirect=/application#analytics');
    }
  };

  // Check if we should show the tracker after login
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const shouldShowTracker = localStorage.getItem('showTrackerAfterLogin');
      if (shouldShowTracker === 'true') {
        setShowTracker(true);
        localStorage.removeItem('showTrackerAfterLogin');
      }
    }
  }, [user]);

  // Also check on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shouldShowTracker = localStorage.getItem('showTrackerAfterLogin');
      if (shouldShowTracker === 'true' && user) {
        setShowTracker(true);
        localStorage.removeItem('showTrackerAfterLogin');
      }
    }
  }, []);

  // Sample data for charts - in a real app, this would come from your data source
  const getChartData = () => {
    // Get the data for the selected fiscal year
    let data = [];
    switch (fiscalYear) {
      case 'FY_24':
        data = exDataFY24;
        break;
      case 'FY_25':
        data = exDataFY25;
        break;
      case 'FY_26':
        data = exDataFY26;
        break;
      default:
        data = exDataFY24;
    }

    // Calculate statistics from the data
    let totalCapacity = 0;
    let totalSolar = 0;
    let totalWind = 0;
    let projectCount = data.length;
    
    // Group data by type and group for charts
    const typeData: Record<string, number> = {
      'Solar': 0,
      'Wind': 0,
      'Hybrid': 0
    };
    
    const groupData: Record<string, number> = {
      'AGEL': 0,
      'ACL': 0
    };
    
    // Process each data entry
    data.forEach(item => {
      const capacity = typeof item["Capacity"] === 'number' ? item["Capacity"] : 0;
      const solar = typeof item["Solar"] === 'number' ? item["Solar"] : 0;
      const wind = typeof item["Wind"] === 'number' ? item["Wind"] : 0;
      const type = item["Type"] || 'Unknown';
      const group = item["Group"] || 'Unknown';
      
      totalCapacity += capacity;
      totalSolar += solar;
      totalWind += wind;
      
      // Update type data
      if (typeData.hasOwnProperty(type)) {
        typeData[type] += capacity;
      }
      
      // Update group data
      if (groupData.hasOwnProperty(group)) {
        groupData[group] += 1;
      }
    });
    
    // Prepare chart data for Bar chart (Capacity by Type)
    const typeChartData = {
      labels: Object.keys(typeData),
      datasets: [
        {
          label: 'Capacity (MW)',
          data: Object.values(typeData),
          backgroundColor: [
            'rgba(255, 206, 86, 0.8)', // Solar - Yellow
            'rgba(75, 192, 192, 0.8)',  // Wind - Teal
            'rgba(153, 102, 255, 0.8)', // Hybrid - Purple
          ],
          borderColor: [
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
    
    // Prepare chart data for Pie chart (Projects by Group)
    const groupChartData = {
      labels: Object.keys(groupData),
      datasets: [
        {
          label: 'Projects',
          data: Object.values(groupData),
          backgroundColor: [
            'rgba(54, 162, 235, 0.8)', // AGEL - Blue
            'rgba(255, 99, 132, 0.8)',  // ACL - Red
          ],
          borderColor: [
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)',
          ],
          borderWidth: 1,
        },
      ],
    };
    
    return {
      capacity: Math.round(totalCapacity),
      solar: Math.round(totalSolar),
      wind: Math.round(totalWind),
      projects: projectCount,
      typeData: typeChartData,
      groupData: groupChartData,
    };
  };

  const chartData = getChartData();

  return (
    <div className=" dark:bg-[#171717]">
      {/* Main Layout - Year Selection on Left, Charts on Right */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Year Selection and Summary Cards */}
        <div className="lg:w-1/4 flex items-center">
          {/* Fiscal Year Selection */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Analytics</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">View and analyze data with the charts below.</p>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Year
              </label>
              <select
                value={fiscalYear}
                onChange={(e) => setFiscalYear(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-md border border-input-border dark:border-gray-600 bg-input-background dark:bg-[#171717] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
              >
                <option value="FY_24">FY 2023-24</option>
                <option value="FY_25">FY 2024-25</option>
                <option value="FY_26">FY 2025-26</option>
              </select>
              <svg 
                className="absolute right-3 top-8 h-5 w-5 text-gray-400 dark:text-gray-300 pointer-events-none" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Right Column - Charts */}
        <div className="lg:w-3/4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-foreground dark:text-white mb-4">Capacity by Type</h3>
              <div className="h-64">
                <Bar 
                  data={chartData.typeData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          color: 'rgba(0, 0, 0, 0.7)'
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      },
                      x: {
                        ticks: {
                          color: 'rgba(0, 0, 0, 0.7)'
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.1)'
                        }
                      }
                    }
                  }} 
                />
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium text-foreground dark:text-white mb-4">Projects by Group</h3>
              <div className="h-64">
                <Pie 
                  data={chartData.groupData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const,
                      },
                      title: {
                        display: false,
                      },
                    },
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Data Table */}
      <div className="mt-8">
        <UserTable 
          fiscalYear={fiscalYear} 
          isAuthenticated={!!user} 
          showTracker={showTracker}
          onFormSubmit={handleFormSubmit}
        />
      </div>
    </div>
  );
}
