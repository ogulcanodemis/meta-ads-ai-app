import { useState, useEffect } from 'react';
import { DollarSign, Filter, Download, Calendar, TrendingUp, Target, BarChart3, Users, MousePointerClick, Eye } from 'lucide-react';
import { fetchWithAuth } from '@/lib/utils/api';

interface DealMetrics {
  totalDeals: number;
  totalRevenue: number;
  wonDeals: number;
  wonRevenue: number;
  averageDealSize: number;
  dealsByStage: Record<string, { count: number; value: number }>;
}

interface ContactMetrics {
  totalContacts: number;
  activeContacts: number;
  contactsBySource: Record<string, number>;
}

interface CampaignMetric {
  id: string;
  name: string;
  status: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  ctr: number;
  cpc: number;
  conversionRate: number;
  cpa: number;
}

interface OverallCampaignMetrics {
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
}

interface PerformanceReports {
  dealMetrics: DealMetrics;
  contactMetrics: ContactMetrics;
  campaignMetrics: CampaignMetric[];
  overallCampaignMetrics: OverallCampaignMetrics;
  roi: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export default function PerformanceReports() {
  const [dateRange, setDateRange] = useState('last30');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PerformanceReports | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetchWithAuth(`/api/hubspot/analytics/reports?dateRange=${dateRange}`);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setData(response.data);
    } catch (err) {
      console.error('Error fetching performance reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch performance reports');
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
      ['Performance Report Summary'],
      ['Date Range', `${new Date(data.dateRange.start).toLocaleDateString()} - ${new Date(data.dateRange.end).toLocaleDateString()}`],
      [],
      ['Deal Metrics'],
      ['Metric', 'Value'],
      ['Total Deals', data.dealMetrics.totalDeals],
      ['Total Revenue', formatCurrency(data.dealMetrics.totalRevenue)],
      ['Won Deals', data.dealMetrics.wonDeals],
      ['Won Revenue', formatCurrency(data.dealMetrics.wonRevenue)],
      ['Average Deal Size', formatCurrency(data.dealMetrics.averageDealSize)],
      [],
      ['Deals by Stage'],
      ['Stage', 'Count', 'Value'],
      ...Object.entries(data.dealMetrics.dealsByStage).map(([stage, metrics]) => [
        stage,
        metrics.count,
        formatCurrency(metrics.value)
      ]),
      [],
      ['Contact Metrics'],
      ['Total Contacts', data.contactMetrics.totalContacts],
      ['Active Contacts', data.contactMetrics.activeContacts],
      [],
      ['Contacts by Source'],
      ['Source', 'Count'],
      ...Object.entries(data.contactMetrics.contactsBySource).map(([source, count]) => [
        source,
        count
      ]),
      [],
      ['Campaign Metrics'],
      ['Campaign', 'Status', 'Spend', 'Clicks', 'Impressions', 'Conversions', 'CTR', 'CPC', 'Conv. Rate', 'CPA'],
      ...data.campaignMetrics.map(campaign => [
        campaign.name,
        campaign.status,
        formatCurrency(campaign.spend),
        formatNumber(campaign.clicks),
        formatNumber(campaign.impressions),
        formatNumber(campaign.conversions),
        formatPercentage(campaign.ctr),
        formatCurrency(campaign.cpc),
        formatPercentage(campaign.conversionRate),
        formatCurrency(campaign.cpa)
      ]),
      [],
      ['Overall Campaign Metrics'],
      ['Total Campaigns', data.overallCampaignMetrics.totalCampaigns],
      ['Active Campaigns', data.overallCampaignMetrics.activeCampaigns],
      ['Total Spend', formatCurrency(data.overallCampaignMetrics.totalSpend)],
      ['Total Clicks', formatNumber(data.overallCampaignMetrics.totalClicks)],
      ['Total Impressions', formatNumber(data.overallCampaignMetrics.totalImpressions)],
      ['Total Conversions', formatNumber(data.overallCampaignMetrics.totalConversions)],
      ['Overall CTR', formatPercentage(data.overallCampaignMetrics.overallCTR)],
      ['Overall CPC', formatCurrency(data.overallCampaignMetrics.overallCPC)],
      ['Overall Conversion Rate', formatPercentage(data.overallCampaignMetrics.overallConversionRate)],
      ['Overall CPA', formatCurrency(data.overallCampaignMetrics.overallCPA)],
      [],
      ['ROI', formatPercentage(data.roi)]
    ];

    const csvContent = headers.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `performance-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
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
          <span>Loading reports...</span>
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
          No performance reports available.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Performance Reports</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive performance reports and analytics
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

      {/* Deal Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Deal Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Deals</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {formatNumber(data.dealMetrics.totalDeals)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {formatCurrency(data.dealMetrics.totalRevenue)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Won Deals</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {formatNumber(data.dealMetrics.wonDeals)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Won Revenue</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {formatCurrency(data.dealMetrics.wonRevenue)}
            </p>
          </div>
        </div>
      </div>

      {/* Deals by Stage */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Deals by Stage</h2>
        <div className="space-y-4">
          {Object.entries(data.dealMetrics.dealsByStage).map(([stage, metrics]) => (
            <div key={stage} className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{stage}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({metrics.count} deals)
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(metrics.value)}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${(metrics.value / data.dealMetrics.totalRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Contact Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Contacts</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {formatNumber(data.contactMetrics.totalContacts)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Contacts</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {formatNumber(data.contactMetrics.activeContacts)}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Contacts by Source</h3>
          <div className="space-y-4">
            {Object.entries(data.contactMetrics.contactsBySource).map(([source, count]) => (
              <div key={source} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{source}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatNumber(count)} contacts
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${(count / data.contactMetrics.totalContacts) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Campaign Metrics</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Spend</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clicks</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Impressions</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CTR</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CPC</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Conv.</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Conv. Rate</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">CPA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {data.campaignMetrics.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      campaign.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(campaign.spend)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatNumber(campaign.clicks)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatNumber(campaign.impressions)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatPercentage(campaign.ctr)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(campaign.cpc)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatNumber(campaign.conversions)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatPercentage(campaign.conversionRate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(campaign.cpa)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overall Campaign Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Overall Campaign Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Spend</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {formatCurrency(data.overallCampaignMetrics.totalSpend)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Clicks</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {formatNumber(data.overallCampaignMetrics.totalClicks)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Impressions</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {formatNumber(data.overallCampaignMetrics.totalImpressions)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Conversions</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {formatNumber(data.overallCampaignMetrics.totalConversions)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Overall CTR</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {formatPercentage(data.overallCampaignMetrics.overallCTR)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Overall CPC</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {formatCurrency(data.overallCampaignMetrics.overallCPC)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Overall Conversion Rate</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {formatPercentage(data.overallCampaignMetrics.overallConversionRate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Overall CPA</p>
            <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-gray-100">
              {formatCurrency(data.overallCampaignMetrics.overallCPA)}
            </p>
          </div>
        </div>
      </div>

      {/* ROI */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Return on Investment</h2>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {formatPercentage(data.roi)}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">ROI</span>
        </div>
      </div>
    </div>
  );
} 