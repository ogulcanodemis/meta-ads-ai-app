"use client";

import { useState, useEffect } from 'react';
import { BarChart3, PieChart, LineChart, Users, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { fetchWithAuth } from '@/lib/utils/api';

interface AnalyticsCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

interface QuickStats {
  totalDeals: number;
  activeCampaigns: number;
  totalRevenue: number;
  conversionRate: number;
}

export default function HubspotAnalytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<QuickStats | null>(null);

  const analyticsCards: AnalyticsCard[] = [
    {
      title: "Deal Pipeline Analytics",
      description: "Track deal progress, conversion rates, and pipeline health metrics",
      icon: <BarChart3 className="w-6 h-6" />,
      href: "/hubspot/analytics/pipeline",
      color: "bg-blue-500"
    },
    {
      title: "Contact Source Analysis",
      description: "Analyze lead sources, engagement metrics, and contact growth",
      icon: <Users className="w-6 h-6" />,
      href: "/hubspot/analytics/contacts",
      color: "bg-green-500"
    },
    {
      title: "Campaign Performance",
      description: "Measure ROI, conversion rates, and campaign effectiveness",
      icon: <TrendingUp className="w-6 h-6" />,
      href: "/hubspot/analytics/campaigns",
      color: "bg-purple-500"
    },
    {
      title: "Revenue Analytics",
      description: "Track revenue trends, forecasts, and deal values",
      icon: <DollarSign className="w-6 h-6" />,
      href: "/hubspot/analytics/revenue",
      color: "bg-orange-500"
    },
    {
      title: "Custom Dashboards",
      description: "Create and customize your own analytics dashboards",
      icon: <PieChart className="w-6 h-6" />,
      href: "/hubspot/analytics/dashboards",
      color: "bg-red-500"
    },
    {
      title: "Performance Reports",
      description: "Generate detailed reports and schedule automated exports",
      icon: <LineChart className="w-6 h-6" />,
      href: "/hubspot/analytics/reports",
      color: "bg-indigo-500"
    }
  ];

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetchWithAuth('/api/hubspot/analytics/quick-stats');
        
        if (response.error) {
          throw new Error(response.error);
        }

        setStats(response.data);
      } catch (err) {
        console.error('Error fetching quick stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch quick stats');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">HubSpot Analytics & Reports</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Comprehensive analytics and reporting tools for your HubSpot data
        </p>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {analyticsCards.map((card) => (
          <Link 
            key={card.title} 
            href={card.href}
            className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow duration-200"
          >
            <div className="p-6">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4`}>
                <div className="text-white">
                  {card.icon}
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{card.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {card.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Deals</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {isLoading ? 'Loading...' : stats?.totalDeals || 0}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Campaigns</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {isLoading ? 'Loading...' : stats?.activeCampaigns || 0}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {isLoading ? 'Loading...' : formatCurrency(stats?.totalRevenue || 0)}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {isLoading ? 'Loading...' : `${stats?.conversionRate || 0}%`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 