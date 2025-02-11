import { useState, useEffect } from 'react';
import { DollarSign, Filter, Download, Calendar, TrendingUp, Target, BarChart3, Users, MousePointerClick, Eye } from 'lucide-react';
import { fetchWithAuth } from '@/lib/utils/api';

interface PerformanceData {
  date: string;
  revenue: number;
  wonRevenue: number;
  deals: number;
  wonDeals: number;
  contacts: number;
  spend: number;
}

interface DashboardAnalytics {
  summary: {
    totalRevenue: number;
    wonRevenue: number;
    averageDealSize: number;
    totalDeals: number;
    wonDeals: number;
    totalContacts: number;
    activeContacts: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalSpend: number;
    totalClicks: number;
    totalImpressions: number;
    totalConversions: number;
    overallCTR: number;
    overallCPC: number;
    overallConversionRate: number;
    overallCPA: number;
    roi: number;
  };
  performanceData: PerformanceData[];
}

export default function CustomDashboards() {
  const [dateRange, setDateRange] = useState('last30');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardAnalytics | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchWithAuth(`/api/hubspot/analytics/dashboards?dateRange=${dateRange}`);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setData(response.data);
    } catch (err) {
      console.error('Error fetching dashboard analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const handleExport = () => {
    if (!data) return;

    // Convert data to CSV
    const headers = [
      ['Dashboard Analytics Summary'],
      ['Metric', 'Value'],
      ['Total Revenue', formatCurrency(data.summary.totalRevenue)],
      ['Won Revenue', formatCurrency(data.summary.wonRevenue)],
      ['Average Deal Size', formatCurrency(data.summary.averageDealSize)],
      ['Total Deals', data.summary.totalDeals],
      ['Won Deals', data.summary.wonDeals],
      ['Total Contacts', data.summary.totalContacts],
      ['Active Contacts', data.summary.activeContacts],
      ['Total Campaigns', data.summary.totalCampaigns],
      ['Active Campaigns', data.summary.activeCampaigns],
      ['Total Spend', formatCurrency(data.summary.totalSpend)],
      ['Total Clicks', formatNumber(data.summary.totalClicks)],
      ['Total Impressions', formatNumber(data.summary.totalImpressions)],
      ['Total Conversions', formatNumber(data.summary.totalConversions)],
      ['Overall CTR', formatPercentage(data.summary.overallCTR)],
      ['Overall CPC', formatCurrency(data.summary.overallCPC)],
      ['Overall Conversion Rate', formatPercentage(data.summary.overallConversionRate)],
      ['Overall CPA', formatCurrency(data.summary.overallCPA)],
      ['ROI', formatPercentage(data.summary.roi)],
      [],
      ['Performance Over Time'],
      ['Date', 'Revenue', 'Won Revenue', 'Deals', 'Won Deals', 'Contacts', 'Spend'],
      ...data.performanceData.map(day => [
        new Date(day.date).toLocaleDateString(),
        formatCurrency(day.revenue),
        formatCurrency(day.wonRevenue),
        day.deals,
        day.wonDeals,
        day.contacts,
        formatCurrency(day.spend)
      ])
    ];

    const csvContent = headers.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard-analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="animate-spin">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 text-yellow-700 p-4 rounded-lg">
          No dashboard analytics available.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Custom Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive overview of your HubSpot performance metrics
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="last90">Last 90 days</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom Range</option>
          </select>
          <button className="px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatCurrency(data.summary.totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Won Revenue</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatCurrency(data.summary.wonRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">ROI</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatPercentage(data.summary.roi)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Deal Size</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatCurrency(data.summary.averageDealSize)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Deal & Contact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Deals</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatNumber(data.summary.totalDeals)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Won Deals</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatNumber(data.summary.wonDeals)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Contacts</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatNumber(data.summary.totalContacts)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Contacts</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatNumber(data.summary.activeContacts)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Spend</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatCurrency(data.summary.totalSpend)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Clicks</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatNumber(data.summary.totalClicks)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <MousePointerClick className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Impressions</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatNumber(data.summary.totalImpressions)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Conversions</p>
              <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
                {formatNumber(data.summary.totalConversions)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Over Time */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Performance Over Time</h2>
        <div className="space-y-4">
          {data.performanceData.map((day) => (
            <div key={day.date} className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(day.date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(day.revenue)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Won Revenue</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(day.wonRevenue)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Deals</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {formatNumber(day.deals)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Won Deals</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {formatNumber(day.wonDeals)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Contacts</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {formatNumber(day.contacts)}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Spend</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(day.spend)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 