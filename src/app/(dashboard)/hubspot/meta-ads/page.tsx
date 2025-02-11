"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, MoreHorizontal, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { fetchWithAuth } from '@/lib/utils/api';

interface Campaign {
  id: string;
  name: string;
  status: string;
  metrics: {
    spend: number;
    leads: number;
    deals: number;
    revenue: number;
  };
}

interface LeadAttribution {
  campaignId: string;
  dealStage: string;
  count: number;
  value: number;
}

const ITEMS_PER_PAGE = 10;

export default function MetaAdsIntegration() {
  const [isLoading, setIsLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [leadAttribution, setLeadAttribution] = useState<LeadAttribution[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<'status' | 'spend' | 'leads' | 'deals' | 'revenue' | 'roi' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchCampaignData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchWithAuth('/hubspot/meta-ads/campaigns');
      
      if (response.error) {
        throw new Error(response.error);
      }

      setCampaigns(response.data || []);
    } catch (err) {
      console.error('Error fetching campaign data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch campaign data');
    } finally {
      setIsLoading(false);
    }
  };

  const syncMetaAds = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchWithAuth('/hubspot/meta-ads/sync', {
        method: 'POST'
      });
      
      if (response.error) {
        throw new Error(response.error);
      }

      await fetchCampaignData();
    } catch (err) {
      console.error('Error syncing Meta Ads:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync Meta Ads');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, []);

  // Sıralama fonksiyonu
  const sortCampaigns = (campaignsToSort: Campaign[]) => {
    if (!sortField) return campaignsToSort;

    return [...campaignsToSort].sort((a, b) => {
      if (sortField === 'status') {
        return sortDirection === 'asc' 
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }

      if (sortField === 'roi') {
        const roiA = a.metrics.spend > 0 
          ? ((a.metrics.revenue - a.metrics.spend) / a.metrics.spend) * 100 
          : 0;
        const roiB = b.metrics.spend > 0 
          ? ((b.metrics.revenue - b.metrics.spend) / b.metrics.spend) * 100 
          : 0;
        return sortDirection === 'asc' ? roiA - roiB : roiB - roiA;
      }

      const valueA = a.metrics[sortField] || 0;
      const valueB = b.metrics[sortField] || 0;
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });
  };

  // Sıralama işleyicisi
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sıralamayı kaldırma işleyicisi
  const handleClearSort = () => {
    setSortField(null);
    setSortDirection('desc');
  };

  // Sıralama ikonu bileşeni
  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) {
      return <ChevronsUpDown className="w-4 h-4 ml-1" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 ml-1" />
      : <ChevronDown className="w-4 h-4 ml-1" />;
  };

  // Filter campaigns based on search term and sort
  const filteredCampaigns = sortCampaigns(campaigns.filter((campaign: Campaign) => {
    const searchString = searchTerm.toLowerCase();
    return campaign.name.toLowerCase().includes(searchString);
  }));

  // Calculate pagination
  const totalPages = Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentCampaigns = filteredCampaigns.slice(startIndex, endIndex);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Meta Ads Integration</h1>
        <button
          onClick={syncMetaAds}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Syncing...' : 'Sync Meta Ads'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Integration Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Campaigns</h3>
          <p className="text-2xl font-semibold mt-1">{campaigns.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Leads</h3>
          <p className="text-2xl font-semibold mt-1 truncate">
            {new Intl.NumberFormat().format(campaigns.reduce((sum, campaign) => sum + (campaign.metrics.leads || 0), 0))}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Deals</h3>
          <p className="text-2xl font-semibold mt-1 truncate">
            {new Intl.NumberFormat().format(campaigns.reduce((sum, campaign) => sum + (campaign.metrics.deals || 0), 0))}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
          <p className="text-2xl font-semibold mt-1 truncate">
            {formatCurrency(campaigns.reduce((sum, campaign) => sum + (campaign.metrics.revenue || 0), 0))}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Campaign Name
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('status')}
                  onDoubleClick={handleClearSort}
                  title="Double click to clear sorting"
                >
                  <div className="flex items-center">
                    Status
                    <SortIcon field="status" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('spend')}
                  onDoubleClick={handleClearSort}
                  title="Double click to clear sorting"
                >
                  <div className="flex items-center">
                    Spend
                    <SortIcon field="spend" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('leads')}
                  onDoubleClick={handleClearSort}
                  title="Double click to clear sorting"
                >
                  <div className="flex items-center">
                    Leads
                    <SortIcon field="leads" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('deals')}
                  onDoubleClick={handleClearSort}
                  title="Double click to clear sorting"
                >
                  <div className="flex items-center">
                    Deals
                    <SortIcon field="deals" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('revenue')}
                  onDoubleClick={handleClearSort}
                  title="Double click to clear sorting"
                >
                  <div className="flex items-center">
                    Revenue
                    <SortIcon field="revenue" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('roi')}
                  onDoubleClick={handleClearSort}
                  title="Double click to clear sorting"
                >
                  <div className="flex items-center">
                    ROI
                    <SortIcon field="roi" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                  </td>
                </tr>
              ) : currentCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No campaigns found matching your search.' : 'No campaigns found.'}
                  </td>
                </tr>
              ) : (
                currentCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {campaign.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        campaign.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(campaign.metrics.spend)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {campaign.metrics.leads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {campaign.metrics.deals}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(campaign.metrics.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {campaign.metrics.spend > 0 
                        ? `${(((campaign.metrics.revenue - campaign.metrics.spend) / campaign.metrics.spend) * 100).toFixed(2)}%`
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {}}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && filteredCampaigns.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredCampaigns.length)} of {filteredCampaigns.length} results
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 