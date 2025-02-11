"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchWithAuth } from '@/lib/utils/api';

interface Deal {
  id: string;
  name: string;
  stage: string;
  amount?: number;
  closeDate?: string;
  pipeline?: string;
  lastActivity?: string;
}

const ITEMS_PER_PAGE = 10;

const DEAL_STAGES = {
  appointmentscheduled: { 
    label: 'Appointment Scheduled', 
    color: 'bg-blue-100 text-blue-800 border border-blue-200'
  },
  qualifiedtobuy: { 
    label: 'Qualified to Buy', 
    color: 'bg-emerald-100 text-emerald-800 border border-emerald-200'
  },
  presentationscheduled: { 
    label: 'Presentation Scheduled', 
    color: 'bg-purple-100 text-purple-800 border border-purple-200'
  },
  decisionmakerboughtin: { 
    label: 'Decision Maker Bought-In', 
    color: 'bg-indigo-100 text-indigo-800 border border-indigo-200'
  },
  contractsent: { 
    label: 'Contract Sent', 
    color: 'bg-amber-100 text-amber-800 border border-amber-200'
  },
  closedwon: { 
    label: 'Closed Won', 
    color: 'bg-green-100 text-green-800 border border-green-200'
  },
  closedlost: { 
    label: 'Closed Lost', 
    color: 'bg-red-100 text-red-800 border border-red-200'
  }
};

export default function HubspotDeals() {
  const [isLoading, setIsLoading] = useState(false);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchDeals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchWithAuth('/hubspot/deals');
      
      if (response.error) {
        throw new Error(response.error);
      }

      setDeals(response.data || []);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch deals');
    } finally {
      setIsLoading(false);
    }
  };

  const syncDeals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetchWithAuth('/hubspot/sync', {
        method: 'POST'
      });
      
      if (response.error) {
        throw new Error(response.error);
      }

      await fetchDeals();
    } catch (err) {
      console.error('Error syncing deals:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync deals');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // Filter deals based on search term
  const filteredDeals = deals.filter(deal => {
    const searchString = searchTerm.toLowerCase();
    return (
      deal.name?.toLowerCase().includes(searchString) ||
      deal.stage?.toLowerCase().includes(searchString) ||
      deal.pipeline?.toLowerCase().includes(searchString)
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredDeals.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentDeals = filteredDeals.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  // Get stage info
  const getStageInfo = (stage: string) => {
    const stageKey = stage.toLowerCase().replace(/\s+/g, '');
    return DEAL_STAGES[stageKey as keyof typeof DEAL_STAGES] || {
      label: stage,
      color: 'bg-gray-100 text-gray-800 border border-gray-200'
    };
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">HubSpot Deals</h1>
        <button
          onClick={syncDeals}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Syncing...' : 'Sync Deals'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => {}}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Deal Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Close Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Pipeline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                  </td>
                </tr>
              ) : currentDeals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No deals found matching your search.' : 'No deals found. Sync with HubSpot to import deals.'}
                  </td>
                </tr>
              ) : (
                currentDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {deal.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-sm font-medium rounded-full ${getStageInfo(deal.stage).color}`}>
                        {getStageInfo(deal.stage).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(deal.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(deal.closeDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {deal.pipeline || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {deal.lastActivity || 'No activity'}
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
        {!isLoading && filteredDeals.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredDeals.length)} of {filteredDeals.length} results
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
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
                  onClick={() => handlePageChange(currentPage + 1)}
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