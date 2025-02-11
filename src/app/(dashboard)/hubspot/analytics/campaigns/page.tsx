"use client";

import React, { useState, useEffect } from 'react';
import { TrendingUp, Filter, Download, Calendar, DollarSign, MousePointerClick, Eye, Target, ChevronLeft, ChevronRight, Search, ArrowUp, ArrowDown, BarChart3 } from 'lucide-react';
import { fetchWithAuth } from '@/lib/utils/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
  Filler
);

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
  createdAt: string;
}

interface PerformanceData {
  date: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
}

interface PaginationData {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface CampaignAnalytics {
  campaigns: CampaignMetric[];
  performance: PerformanceData[];
  summary: {
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
  };
  pagination: PaginationData;
  trends: {
    spend: TrendData;
    clicks: TrendData;
    ctr: TrendData;
    cpc: TrendData;
  };
}

interface TrendData {
  percentage: number;
  isPositive: boolean;
}

interface QuickStat {
  title: string;
  value: number | string;
  trend: TrendData;
  icon: React.ReactNode;
  color: string;
  sparklineData?: number[];
}

export default function CampaignPerformance() {
  const [dateRange, setDateRange] = useState('last30');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CampaignAnalytics | null>(null);
  const [sortField, setSortField] = useState<keyof CampaignMetric>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [comparisonPeriod, setComparisonPeriod] = useState(3);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        dateRange,
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy: sortField,
        sortOrder,
        comparisonPeriod: comparisonPeriod.toString(),
        ...(search && { search })
      });

      const response = await fetchWithAuth(`/api/hubspot/analytics/campaigns?${queryParams}`);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setData(response.data);
    } catch (err) {
      console.error('Error fetching campaign analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch campaign analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, page, pageSize, sortField, sortOrder, search]);

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

  const handleSort = (field: keyof CampaignMetric) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleExport = () => {
    if (!data) return;

    // Convert data to CSV
    const headers = [
      ['Campaign Performance Summary'],
      ['Date Range', dateRange],
      [],
      ['Overall Metrics'],
      ['Metric', 'Value'],
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
      [],
      ['Campaign Details'],
      ['Name', 'Status', 'Spend', 'Clicks', 'Impressions', 'CTR', 'CPC', 'Conversions', 'Conv. Rate', 'CPA'],
      ...data.campaigns.map(campaign => [
        campaign.name,
        campaign.status,
        formatCurrency(campaign.spend),
        formatNumber(campaign.clicks),
        formatNumber(campaign.impressions),
        formatPercentage(campaign.ctr),
        formatCurrency(campaign.cpc),
        formatNumber(campaign.conversions),
        formatPercentage(campaign.conversionRate),
        formatCurrency(campaign.cpa)
      ]),
      [],
      ['Daily Performance'],
      ['Date', 'Spend', 'Clicks', 'Impressions', 'Conversions'],
      ...data.performance.map(day => [
        new Date(day.date).toLocaleDateString(),
        formatCurrency(day.spend),
        formatNumber(day.clicks),
        formatNumber(day.impressions),
        formatNumber(day.conversions)
      ])
    ];

    const csvContent = headers.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `campaign-performance-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const prepareSparklineData = (performanceData: PerformanceData[]) => {
    return {
      labels: performanceData.map(d => new Date(d.date).toLocaleDateString()),
      datasets: [
        {
          data: performanceData.map(d => d.spend),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0,
        }
      ]
    };
  };

  const sparklineOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      }
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      }
    },
    maintainAspectRatio: false,
  };

  const getQuickStats = (data: CampaignAnalytics): QuickStat[] => {
    return [
      {
        title: 'Total Spend',
        value: formatCurrency(data.summary.totalSpend),
        trend: data.trends.spend,
        icon: <DollarSign className="w-5 h-5" />,
        color: 'bg-blue-500',
        sparklineData: data.performance.map(d => d.spend)
      },
      {
        title: 'Total Clicks',
        value: formatNumber(data.summary.totalClicks),
        trend: data.trends.clicks,
        icon: <BarChart3 className="w-5 h-5" />,
        color: 'bg-green-500',
        sparklineData: data.performance.map(d => d.clicks)
      },
      {
        title: 'CTR',
        value: formatPercentage(data.summary.overallCTR),
        trend: data.trends.ctr,
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'bg-purple-500',
        sparklineData: data.performance.map(d => d.clicks / d.impressions * 100)
      },
      {
        title: 'CPC',
        value: formatCurrency(data.summary.overallCPC),
        trend: data.trends.cpc,
        icon: <DollarSign className="w-5 h-5" />,
        color: 'bg-orange-500',
        sparklineData: data.performance.map(d => d.spend / d.clicks)
      }
    ];
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="animate-spin">
            <TrendingUp className="w-6 h-6 text-blue-600" />
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
          No campaign data available.
        </div>
      </div>
    );
  }

  const quickStats = getQuickStats(data);

  const sortedCampaigns = [...data.campaigns].sort((a, b) => {
    const valueA = a[sortField];
    const valueB = b[sortField];

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortOrder === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    return sortOrder === 'asc'
      ? (valueA as number) - (valueB as number)
      : (valueB as number) - (valueA as number);
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Campaign Performance</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track and analyze your campaign metrics
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Trends are calculated by comparing the last {comparisonPeriod} days with the previous {comparisonPeriod} days
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={search}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="last90">Last 90 days</option>
            <option value="thisYear">This Year</option>
          </select>
          <select
            value={comparisonPeriod}
            onChange={(e) => setComparisonPeriod(Number(e.target.value))}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
          >
            <option value="3">Compare 3 days</option>
            <option value="7">Compare 7 days</option>
            <option value="14">Compare 14 days</option>
            <option value="30">Compare 30 days</option>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
              <div className={`flex items-center ${
                stat.trend.isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
                {stat.trend.isPositive ? '↑' : '↓'} {stat.trend.percentage}%
              </div>
            </div>
            {stat.sparklineData && (
              <div className="h-16">
                <Line
                  data={prepareSparklineData([...data.performance])}
                  options={sparklineOptions}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Campaign List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Campaign Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th 
                  onClick={() => handleSort('name')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Campaign
                </th>
                <th 
                  onClick={() => handleSort('status')}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Status
                </th>
                <th 
                  onClick={() => handleSort('spend')}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Spend
                </th>
                <th 
                  onClick={() => handleSort('clicks')}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Clicks
                </th>
                <th 
                  onClick={() => handleSort('impressions')}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Impressions
                </th>
                <th 
                  onClick={() => handleSort('ctr')}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  CTR
                </th>
                <th 
                  onClick={() => handleSort('cpc')}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  CPC
                </th>
                <th 
                  onClick={() => handleSort('conversions')}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Conv.
                </th>
                <th 
                  onClick={() => handleSort('conversionRate')}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  Conv. Rate
                </th>
                <th 
                  onClick={() => handleSort('cpa')}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  CPA
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {sortedCampaigns.map((campaign) => (
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
        {/* Pagination */}
        {data && data.pagination && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, data.pagination.totalItems)} of {data.pagination.totalItems} results
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={!data.pagination.hasPreviousPage}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === data.pagination.totalPages || Math.abs(p - page) <= 2)
                  .map((p, i, arr) => (
                    <React.Fragment key={p}>
                      {i > 0 && arr[i - 1] !== p - 1 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(p)}
                        className={`px-3 py-1 rounded-lg ${
                          page === p
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!data.pagination.hasNextPage}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 