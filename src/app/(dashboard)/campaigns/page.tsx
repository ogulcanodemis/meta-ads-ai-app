"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/lib/utils/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, TrendingUpIcon, TrendingDownIcon, AlertTriangleIcon, RefreshCw } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ApiCampaignInsightStat {
  date_start: string;
  spend: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  hour_of_day?: number;
  day_of_week?: number;
}

interface ApiCampaignInsight {
  data: Array<{
    spend: string;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cpc: number;
    roas: number;
    conversion_rate: number;
    daily_stats?: ApiCampaignInsightStat[];
    // Temel metrikler
    reach: number;
    frequency: number;
    unique_clicks: number;
    unique_ctr: number;
    cost_per_unique_click: number;
    outbound_clicks: number;
    outbound_clicks_ctr: number;
    engagement_rate: number;
    quality_ranking: string;
    engagement_rate_ranking: string;
    conversion_rate_ranking: string;
    link_clicks: number;
    page_engagement: number;
    leads: number;
    purchases: number;
    cost_per_lead: number;
    cost_per_purchase: number;
    // Kalite metrikleri
    quality_score: number | null;
    ad_relevance_score: number | null;
    landing_page_score: number | null;
    // Hedefleme metrikleri
    audience_size: number | null;
    audience_overlap: number | null;
    reach_estimate: number | null;
    impression_share: number | null;
    search_impression_share: number | null;
    search_rank_lost_impression_share: number | null;
    // Demografik metrikler
    age_targeting_performance?: Array<{
      age_range: string;
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
    }>;
    gender_targeting_performance?: Array<{
      gender: string;
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
    }>;
    placement_performance?: Array<{
      placement: string;
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
    }>;
  }>;
  paging: any;
}

interface ApiCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  daily_budget?: string;
  start_time: string;
  end_time?: string;
  insights?: ApiCampaignInsight;
  adAccountId: string;
  adAccountName: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  start_time: string;
  end_time?: string;
  daily_budget?: number;
  lifetime_budget?: number;
  adAccountId: string;
  adAccountName: string;
  metrics: {
    // Temel metrikler - Her zaman var
    impressions: number;
    clicks: number;
    spend: number;
    ctr: number;
    cpc: number;
    reach: number;
    frequency: number;
    uniqueClicks: number;
    uniqueCtr: number;
    costPerUniqueClick: number;
    outboundClicks: number;
    outboundClicksCtr: number;
    engagementRate: number;
    qualityRanking: string;
    engagementRateRanking: string;
    conversionRateRanking: string;
    linkClicks: number;
    pageEngagement: number;
    leads: number;
    purchases: number;
    costPerLead: number;
    costPerPurchase: number;
    conversions: number;

    // Kalite metrikleri - Opsiyonel
    qualityScore: number | null;
    adRelevanceScore: number | null;
    landingPageScore: number | null;

    // Hedefleme metrikleri - Opsiyonel
    audienceSize: number | null;
    audienceOverlap: number | null;
    reachEstimate: number | null;
    impressionShare: number | null;
    searchImpressionShare: number | null;
    searchRankLostImpressionShare: number | null;

    // Demografik metrikler - Opsiyonel
    ageTargetingPerformance: Array<{
      ageRange: string;
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
    }>;
    genderTargetingPerformance: Array<{
      gender: string;
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
    }>;
    placementPerformance: Array<{
      placement: string;
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
    }>;

    // Zaman bazlı metrikler - Opsiyonel
    hourlyPerformance?: Array<{
      hour: number;
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
    }>;
    dailyPerformance?: Array<{
      dayOfWeek: number;
      impressions: number;
      clicks: number;
      conversions: number;
      ctr: number;
    }>;
    daily_stats?: Array<{
      date_start: string;
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      revenue: number;
    }>;
  };
}

interface AIInsight {
  type: 'success' | 'warning' | 'info';
  message: string;
  recommendation?: string;
  impact?: 'high' | 'medium' | 'low';
}

interface ApiResponse {
  data: {
    campaigns: ApiCampaign[];
  };
  success: boolean;
  message: string;
}

// Cache helper functions
const CACHE_KEY = 'meta_ai_campaigns_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

const getCachedData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_DURATION;

    if (isExpired) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

const setCachedData = (data: Campaign[]) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error setting cache:', error);
  }
};

export default function CampaignsPage() {
  // Helper functions for number formatting
  const formatNumber = (value: any, decimals = 2) => {
    const num = Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(decimals);
  };

  const formatWithCommas = (value: any) => {
    const num = Number(value);
    return isNaN(num) ? '0' : num.toLocaleString();
  };

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Add new state variables for filters
  const [filters, setFilters] = useState({
    status: '',
    objective: '',
    adAccount: '',
    dateRange: {
      from: undefined,
      to: undefined
    } as DateRange,
    search: '',
    performanceMetric: '',
    performanceValue: ''
  });

  // Add filtered campaigns state
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);

  // Add unique values helper
  const getUniqueValues = (key: keyof Campaign) => {
    return Array.from(new Set(campaigns.map(campaign => campaign[key])));
  };

  // Add filter function
  const applyFilters = useCallback(() => {
    let result = [...campaigns];

    // Status filter
    if (filters.status && filters.status !== 'all_statuses') {
      result = result.filter(campaign => campaign.status === filters.status);
    }

    // Objective filter
    if (filters.objective && filters.objective !== 'all_objectives') {
      result = result.filter(campaign => campaign.objective === filters.objective);
    }

    // Ad Account filter
    if (filters.adAccount && filters.adAccount !== 'all_accounts') {
      result = result.filter(campaign => campaign.adAccountId === filters.adAccount);
    }

    // Date range filter
    if (filters.dateRange.from && filters.dateRange.to) {
      result = result.filter(campaign => {
        const campaignDate = new Date(campaign.start_time);
        return campaignDate >= filters.dateRange.from! && campaignDate <= filters.dateRange.to!;
      });
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(campaign => 
        campaign.name.toLowerCase().includes(searchLower) ||
        campaign.adAccountName.toLowerCase().includes(searchLower)
      );
    }

    // Performance metric filter
    if (filters.performanceMetric && filters.performanceMetric !== 'all_performance' && filters.performanceValue) {
      const value = parseFloat(filters.performanceValue);
      if (!isNaN(value)) {
        result = result.filter(campaign => {
          const metrics = campaign.metrics;
          switch (filters.performanceMetric) {
            case 'ctr_above':
              return metrics.ctr > value;
            case 'ctr_below':
              return metrics.ctr < value;
            case 'cpc_above':
              return metrics.cpc > value;
            case 'cpc_below':
              return metrics.cpc < value;
            case 'spend_above':
              return metrics.spend > value;
            case 'spend_below':
              return metrics.spend < value;
            default:
              return true;
          }
        });
      }
    }

    setFilteredCampaigns(result);
  }, [campaigns, filters]);

  // Update filtered campaigns when filters or campaigns change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Modify fetchCampaigns to handle caching
  const fetchCampaigns = async (forceRefresh = false) => {
    try {
      // If not forcing refresh, try to get cached data
      if (!forceRefresh) {
        const cachedData = getCachedData();
        if (cachedData) {
          console.log('Using cached data');
          setCampaigns(cachedData);
          if (cachedData.length > 0) {
            setSelectedCampaign(cachedData[0]);
            generateAIInsights(cachedData[0]);
          }
          return;
        }
      }

      setIsLoading(true);
      setError(null);
      console.log('Fetching campaigns...');
      
      const response = await fetchWithAuth('/meta/campaigns');
      console.log('Campaigns response:', response);

      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch campaigns');
      }

      const transformMetrics = (insights: ApiCampaignInsight['data'][0]) => {
        // Ensure insights object exists
        const data = insights || {};
        
        return {
          // Temel metrikler - API'den gelenler
          impressions: data.impressions || 0,
          clicks: data.clicks || 0,
          spend: data.spend ? parseFloat(data.spend) : 0,
          ctr: data.ctr || 0,
          cpc: data.cpc || 0,
          reach: data.reach || 0,
          frequency: data.frequency || 0,
          uniqueClicks: data.unique_clicks || 0,
          uniqueCtr: data.unique_ctr || 0,
          costPerUniqueClick: data.cost_per_unique_click || 0,
          outboundClicks: data.outbound_clicks || 0,
          outboundClicksCtr: data.outbound_clicks_ctr || 0,
          engagementRate: data.engagement_rate || 0,
          qualityRanking: data.quality_ranking || 'UNKNOWN',
          engagementRateRanking: data.engagement_rate_ranking || 'UNKNOWN',
          conversionRateRanking: data.conversion_rate_ranking || 'UNKNOWN',
          linkClicks: data.link_clicks || 0,
          pageEngagement: data.page_engagement || 0,
          leads: data.leads || 0,
          purchases: data.purchases || 0,
          costPerLead: data.cost_per_lead || 0,
          costPerPurchase: data.cost_per_purchase || 0,
          conversions: data.conversions || 0,

          // Kalite metrikleri - Her zaman var olmalı
          qualityScore: null,
          adRelevanceScore: null,
          landingPageScore: null,

          // Hedefleme metrikleri - Her zaman var olmalı
          audienceSize: null,
          audienceOverlap: null,
          reachEstimate: null,
          impressionShare: null,
          searchImpressionShare: null,
          searchRankLostImpressionShare: null,

          // Demografik metrikler - Her zaman var olmalı
          ageTargetingPerformance: [],
          genderTargetingPerformance: [],
          placementPerformance: [],

          // Zaman bazlı metrikler
          daily_stats: data.daily_stats?.map(stat => ({
            ...stat,
            spend: parseFloat(stat.spend)
          })) || []
        };
      };

      const transformedCampaigns = response.data.campaigns.map((campaign: ApiCampaign) => ({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        daily_budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : 0,
        lifetime_budget: campaign.daily_budget ? parseFloat(campaign.daily_budget) / 100 : 0,
        start_time: campaign.start_time,
        end_time: campaign.end_time,
        adAccountId: campaign.adAccountId,
        adAccountName: campaign.adAccountName,
        metrics: transformMetrics(campaign.insights?.data?.[0] || {} as ApiCampaignInsight['data'][0])
      }));

      // Update cache with new data
      setCachedData(transformedCampaigns);
      
      console.log('Transformed campaigns:', transformedCampaigns);
      setCampaigns(transformedCampaigns);
      
      if (transformedCampaigns.length > 0) {
        setSelectedCampaign(transformedCampaigns[0]);
        generateAIInsights(transformedCampaigns[0]);
      }

    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch campaigns');
      setCampaigns([]);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  // Handle sync button click
  const handleSync = useCallback(() => {
    setIsSyncing(true);
    fetchCampaigns(true);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCampaigns(false);
  }, []);

  const generateAIInsights = (campaign: Campaign) => {
    const insights: AIInsight[] = [];
    const { metrics } = campaign;

    // Performans Analizi
    if (metrics.ctr < 1) {
      insights.push({
        type: 'warning',
        message: 'Düşük Tıklama Oranı',
        recommendation: 'Reklam metninizi ve görselleri gözden geçirin. Hedef kitlenizi daraltmayı düşünün.',
        impact: 'high'
      });
    }

    if (metrics.cpc > 10) {
      insights.push({
        type: 'warning',
        message: 'Yüksek Tıklama Maliyeti',
        recommendation: 'Teklif stratejinizi ve hedefleme ayarlarınızı optimize edin.',
        impact: 'high'
      });
    }

    // Kalite Analizi
    if (metrics.qualityScore && metrics.qualityScore < 5) {
      insights.push({
        type: 'warning',
        message: 'Düşük Kalite Skoru',
        recommendation: 'Reklam alaka düzeyini ve landing page deneyimini iyileştirin.',
        impact: 'high'
      });
    }

    if (metrics.adRelevanceScore && metrics.adRelevanceScore < 5) {
      insights.push({
        type: 'warning',
        message: 'Düşük Reklam İlgi Skoru',
        recommendation: 'Reklam içeriğinizi hedef kitlenizle daha iyi eşleştirin.',
        impact: 'medium'
      });
    }

    // Hedefleme Analizi
    if (metrics.audienceOverlap && metrics.audienceOverlap > 30) {
      insights.push({
        type: 'info',
        message: 'Yüksek Kitle Örtüşmesi',
        recommendation: 'Kampanyalar arası rekabeti azaltmak için hedef kitleleri ayırın.',
        impact: 'medium'
      });
    }

    if (metrics.impressionShare && metrics.impressionShare < 20) {
      insights.push({
        type: 'warning',
        message: 'Düşük Gösterim Payı',
        recommendation: 'Bütçe ve teklif ayarlarınızı gözden geçirin.',
        impact: 'medium'
      });
    }

    // Demografik Analiz
    if (metrics.ageTargetingPerformance && metrics.ageTargetingPerformance.length > 0) {
      const bestAgeGroup = metrics.ageTargetingPerformance.reduce((prev, current) => 
        (current.ctr > prev.ctr) ? current : prev
      );

      insights.push({
        type: 'success',
        message: `En İyi Performans: ${bestAgeGroup.ageRange} Yaş Grubu`,
        recommendation: 'Bu yaş grubuna odaklanarak bütçenizi optimize edin.',
        impact: 'medium'
      });
    }

    if (metrics.genderTargetingPerformance && metrics.genderTargetingPerformance.length > 0) {
      const bestGender = metrics.genderTargetingPerformance.reduce((prev, current) => 
        (current.ctr > prev.ctr) ? current : prev
      );

      insights.push({
        type: 'success',
        message: `En İyi Performans: ${bestGender.gender} Cinsiyet Grubu`,
        recommendation: 'Bu cinsiyet grubuna yönelik içerik stratejinizi güçlendirin.',
        impact: 'medium'
      });
    }

    // Yerleşim Analizi
    if (metrics.placementPerformance && metrics.placementPerformance.length > 0) {
      const bestPlacement = metrics.placementPerformance.reduce((prev, current) => 
        (current.ctr > prev.ctr) ? current : prev
      );

      insights.push({
        type: 'success',
        message: `En İyi Performans: ${bestPlacement.placement} Yerleşimi`,
        recommendation: 'Bu yerleşime daha fazla bütçe ayırın.',
        impact: 'medium'
      });
    }

    setInsights(insights);
  };

  const renderMetrics = (campaign: Campaign) => {
    const { metrics } = campaign;
    
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm text-gray-400">Spend</h3>
          <p className="text-2xl font-semibold">${formatNumber(metrics.spend)}</p>
          <p className="text-sm text-gray-400">{formatWithCommas(metrics.impressions)} impressions</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm text-gray-400">CTR</h3>
          <p className="text-2xl font-semibold">{formatNumber(metrics.ctr)}%</p>
          <p className="text-sm text-gray-400">{formatWithCommas(metrics.clicks)} clicks</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm text-gray-400">CPC</h3>
          <p className="text-2xl font-semibold">${formatNumber(metrics.cpc)}</p>
          <p className="text-sm text-gray-400">Cost per click</p>
        </div>
        <div className="p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm text-gray-400">Status</h3>
          <p className="text-2xl font-semibold capitalize">{campaign.status.toLowerCase()}</p>
          <p className="text-sm text-gray-400">{campaign.objective?.replace('OUTCOME_', '')}</p>
        </div>
      </div>
    );
  };

  const renderCampaignInfo = (campaign: Campaign) => {
    const { metrics } = campaign;
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Campaign Details</CardTitle>
          <CardDescription>{campaign.adAccountName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Campaign Information</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Campaign ID:</span>
                  <p className="font-mono text-sm">{campaign.id}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Start Date:</span>
                  <p>{campaign.start_time ? new Date(campaign.start_time).toLocaleDateString() : 'Not set'}</p>
                </div>
                {campaign.end_time && (
                  <div>
                    <span className="text-sm text-gray-500">End Date:</span>
                    <p>{new Date(campaign.end_time).toLocaleDateString()}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500">Objective:</span>
                  <p className="capitalize">{campaign.objective?.replace('OUTCOME_', '').toLowerCase()}</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Performance Metrics</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">Total Impressions:</span>
                  <p>{formatWithCommas(metrics.impressions)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Total Clicks:</span>
                  <p>{formatWithCommas(metrics.clicks)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Total Spend:</span>
                  <p>${formatNumber(metrics.spend)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Click-through Rate:</span>
                  <p>{formatNumber(metrics.ctr)}%</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDetailedAnalytics = (campaign: Campaign) => {
    const { metrics } = campaign;
    
    return (
      <div className="space-y-4">
        {/* Kalite Metrikleri - Her zaman göster */}
        <Card>
          <CardHeader>
            <CardTitle>Kalite Metrikleri</CardTitle>
            <CardDescription>Reklam kalitesi ve performans göstergeleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <h5 className="text-sm text-gray-400">Kalite Skoru</h5>
                <p className="text-2xl font-semibold">
                  {metrics.qualityScore ? `${formatNumber(metrics.qualityScore)}/10` : 'API\'den alınamıyor'}
                </p>
                <p className="text-sm text-gray-400">Genel reklam kalitesi</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h5 className="text-sm text-gray-400">Reklam İlgi Skoru</h5>
                <p className="text-2xl font-semibold">
                  {metrics.adRelevanceScore ? `${formatNumber(metrics.adRelevanceScore)}/10` : 'API\'den alınamıyor'}
                </p>
                <p className="text-sm text-gray-400">Hedef kitle uyumu</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h5 className="text-sm text-gray-400">Landing Page Skoru</h5>
                <p className="text-2xl font-semibold">
                  {metrics.landingPageScore ? `${formatNumber(metrics.landingPageScore)}/10` : 'API\'den alınamıyor'}
                </p>
                <p className="text-sm text-gray-400">Varış sayfası deneyimi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hedefleme Metrikleri - Her zaman göster */}
        <Card>
          <CardHeader>
            <CardTitle>Hedefleme Analizi</CardTitle>
            <CardDescription>Kitle ve erişim metrikleri</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <h5 className="text-sm text-gray-400">Kitle Büyüklüğü</h5>
                <p className="text-2xl font-semibold">
                  {metrics.audienceSize ? formatWithCommas(metrics.audienceSize) : 'API\'den alınamıyor'}
                </p>
                <p className="text-sm text-gray-400">Potansiyel erişim</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h5 className="text-sm text-gray-400">Kitle Örtüşmesi</h5>
                <p className="text-2xl font-semibold">
                  {metrics.audienceOverlap ? `${formatNumber(metrics.audienceOverlap)}%` : 'API\'den alınamıyor'}
                </p>
                <p className="text-sm text-gray-400">Diğer kampanyalarla örtüşme</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h5 className="text-sm text-gray-400">Gösterim Payı</h5>
                <p className="text-2xl font-semibold">
                  {metrics.impressionShare ? `${formatNumber(metrics.impressionShare)}%` : 'API\'den alınamıyor'}
                </p>
                <p className="text-sm text-gray-400">Toplam gösterim payı</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demografik Performans - Her zaman göster */}
        <Card>
          <CardHeader>
            <CardTitle>Demografik Performans</CardTitle>
            <CardDescription>Yaş ve cinsiyet bazlı analiz</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="age">
              <TabsList>
                <TabsTrigger value="age">Yaş Dağılımı</TabsTrigger>
                <TabsTrigger value="gender">Cinsiyet Dağılımı</TabsTrigger>
                <TabsTrigger value="placement">Yerleşim</TabsTrigger>
              </TabsList>

              <TabsContent value="age">
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-800">
                      <tr>
                        <th className="px-6 py-3">Yaş Aralığı</th>
                        <th className="px-6 py-3">Gösterimler</th>
                        <th className="px-6 py-3">Tıklamalar</th>
                        <th className="px-6 py-3">CTR</th>
                        <th className="px-6 py-3">Dönüşümler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.ageTargetingPerformance?.length > 0 ? (
                        metrics.ageTargetingPerformance.map((age) => (
                          <tr key={age.ageRange} className="border-b border-gray-800">
                            <td className="px-6 py-4 font-medium">{age.ageRange}</td>
                            <td className="px-6 py-4">{formatWithCommas(age.impressions)}</td>
                            <td className="px-6 py-4">{formatWithCommas(age.clicks)}</td>
                            <td className="px-6 py-4">{formatNumber(age.ctr)}%</td>
                            <td className="px-6 py-4">{formatWithCommas(age.conversions)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center">API'den yaş bazlı veri alınamıyor</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="gender">
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-800">
                      <tr>
                        <th className="px-6 py-3">Cinsiyet</th>
                        <th className="px-6 py-3">Gösterimler</th>
                        <th className="px-6 py-3">Tıklamalar</th>
                        <th className="px-6 py-3">CTR</th>
                        <th className="px-6 py-3">Dönüşümler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.genderTargetingPerformance?.length > 0 ? (
                        metrics.genderTargetingPerformance.map((gender) => (
                          <tr key={gender.gender} className="border-b border-gray-800">
                            <td className="px-6 py-4 font-medium">{gender.gender}</td>
                            <td className="px-6 py-4">{formatWithCommas(gender.impressions)}</td>
                            <td className="px-6 py-4">{formatWithCommas(gender.clicks)}</td>
                            <td className="px-6 py-4">{formatNumber(gender.ctr)}%</td>
                            <td className="px-6 py-4">{formatWithCommas(gender.conversions)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center">API'den cinsiyet bazlı veri alınamıyor</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="placement">
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-800">
                      <tr>
                        <th className="px-6 py-3">Yerleşim</th>
                        <th className="px-6 py-3">Gösterimler</th>
                        <th className="px-6 py-3">Tıklamalar</th>
                        <th className="px-6 py-3">CTR</th>
                        <th className="px-6 py-3">Dönüşümler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.placementPerformance?.length > 0 ? (
                        metrics.placementPerformance.map((placement) => (
                          <tr key={placement.placement} className="border-b border-gray-800">
                            <td className="px-6 py-4 font-medium">{placement.placement}</td>
                            <td className="px-6 py-4">{formatWithCommas(placement.impressions)}</td>
                            <td className="px-6 py-4">{formatWithCommas(placement.clicks)}</td>
                            <td className="px-6 py-4">{formatNumber(placement.ctr)}%</td>
                            <td className="px-6 py-4">{formatWithCommas(placement.conversions)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center">API'den yerleşim bazlı veri alınamıyor</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderAIInsights = () => {
    if (!insights.length) return null;

    return (
      <div className="space-y-4 mt-4">
        {insights.map((insight, index) => (
          <Alert key={index} variant={insight.type === 'warning' ? 'destructive' : 'default'}>
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              {insight.type === 'success' && <TrendingUpIcon className="h-4 w-4 text-green-500" />}
              {insight.type === 'warning' && <TrendingDownIcon className="h-4 w-4 text-red-500" />}
              {insight.type === 'info' && <InfoIcon className="h-4 w-4 text-blue-500" />}
              {insight.message}
              {insight.impact && (
                <Badge variant={insight.impact === 'high' ? 'destructive' : 'default'}>
                  {insight.impact} impact
                </Badge>
              )}
            </AlertTitle>
            {insight.recommendation && (
              <AlertDescription>{insight.recommendation}</AlertDescription>
            )}
          </Alert>
        ))}
      </div>
    );
  };

  // Add filter components
  const renderFilters = () => {
    const uniqueStatuses = Array.from(new Set(campaigns.map(c => c.status)));
    const uniqueObjectives = Array.from(new Set(campaigns.map(c => c.objective)));
    // Update uniqueAccounts to ensure uniqueness based on both id and name
    const uniqueAccounts = Array.from(
      new Map(
        campaigns.map(c => [c.adAccountId, { id: c.adAccountId, name: c.adAccountName }])
      ).values()
    );

    const performanceMetrics = [
      { label: 'CTR Above', value: 'ctr_above' },
      { label: 'CTR Below', value: 'ctr_below' },
      { label: 'CPC Above', value: 'cpc_above' },
      { label: 'CPC Below', value: 'cpc_below' },
      { label: 'Spend Above', value: 'spend_above' },
      { label: 'Spend Below', value: 'spend_below' },
    ];

    return (
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <Select
            value={filters.status}
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent className="bg-black border border-gray-800 shadow-lg z-50">
              <SelectItem value="all_statuses">All Statuses</SelectItem>
              {uniqueStatuses.map((status) => (
                <SelectItem key={`status-${status}`} value={status}>
                  {status.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Objective Filter */}
          <Select
            value={filters.objective}
            onValueChange={(value) => setFilters(prev => ({ ...prev, objective: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Objective" />
            </SelectTrigger>
            <SelectContent className="bg-black border border-gray-800 shadow-lg z-50">
              <SelectItem value="all_objectives">All Objectives</SelectItem>
              {uniqueObjectives.map((objective) => (
                <SelectItem key={`objective-${objective}`} value={objective}>
                  {objective.replace('OUTCOME_', '').toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Ad Account Filter */}
          <Select
            value={filters.adAccount}
            onValueChange={(value) => setFilters(prev => ({ ...prev, adAccount: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Ad Account" />
            </SelectTrigger>
            <SelectContent className="bg-black border border-gray-800 shadow-lg z-50">
              <SelectItem value="all_accounts">All Ad Accounts</SelectItem>
              {uniqueAccounts.map((account) => (
                <SelectItem key={`account-${account.id}`} value={account.id}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range Filter */}
          <DatePickerWithRange
            value={filters.dateRange}
            onChange={(range) => setFilters(prev => ({ ...prev, dateRange: range || { from: undefined, to: undefined } }))}
          />

          {/* Search Filter */}
          <Input
            placeholder="Search campaigns..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full"
          />

          {/* Performance Metric Filter */}
          <div className="flex gap-2">
            <Select
              value={filters.performanceMetric}
              onValueChange={(value) => setFilters(prev => ({ ...prev, performanceMetric: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Performance Filter" />
              </SelectTrigger>
              <SelectContent className="bg-black border border-gray-800 shadow-lg z-50">
                <SelectItem value="all_performance">All Performance</SelectItem>
                {performanceMetrics.map((metric) => (
                  <SelectItem key={`metric-${metric.value}`} value={metric.value}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.performanceMetric && filters.performanceMetric !== 'all_performance' && (
              <Input
                type="number"
                placeholder="Value"
                value={filters.performanceValue}
                onChange={(e) => setFilters(prev => ({ ...prev, performanceValue: e.target.value }))}
                className="w-24"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleSync}
            variant="outline"
            disabled={isSyncing}
            className={cn(
              "gap-2",
              isSyncing && "opacity-70 cursor-not-allowed"
            )}
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              isSyncing && "animate-spin"
            )} />
            {isSyncing ? "Syncing..." : "Sync Campaigns"}
          </Button>
          <Button onClick={() => window.location.href = '/campaigns/new'}>
            Create Campaign
          </Button>
        </div>
      </div>

      {renderFilters()}

      <div className="grid md:grid-cols-12 gap-6">
        {/* Campaign List */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Your Campaigns</CardTitle>
              <CardDescription>{filteredCampaigns.length} campaigns found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredCampaigns.map((campaign) => (
                  <Button
                    key={campaign.id}
                    variant={selectedCampaign?.id === campaign.id ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      generateAIInsights(campaign);
                    }}
                  >
                    <span className="truncate">{campaign.name}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Details */}
        <div className="md:col-span-9">
          {selectedCampaign && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedCampaign.name}</CardTitle>
                      <CardDescription>
                        {selectedCampaign.start_time ? new Date(selectedCampaign.start_time).toLocaleDateString() : 'No start date'} - 
                        {selectedCampaign.end_time ? new Date(selectedCampaign.end_time).toLocaleDateString() : 'No end date'}
                      </CardDescription>
                    </div>
                    <Badge variant={selectedCampaign.status.toLowerCase() === 'active' ? 'default' : 'secondary'}>
                      {selectedCampaign.status.toLowerCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="insights">AI Insights</TabsTrigger>
                      <TabsTrigger value="daily">Daily Stats</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      {renderMetrics(selectedCampaign)}
                      {renderCampaignInfo(selectedCampaign)}
                      
                      {/* Performance Charts */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Performance Trend</CardTitle>
                          <CardDescription>Overall campaign performance metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Tabs defaultValue="line">
                            <TabsList className="mb-4">
                              <TabsTrigger value="line">Line Chart</TabsTrigger>
                              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                              <TabsTrigger value="area">Area Chart</TabsTrigger>
                            </TabsList>

                            <TabsContent value="line">
                              <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart
                                    data={[
                                      {
                                        name: 'Week 1',
                                        spend: selectedCampaign.metrics.spend * 0.2,
                                        impressions: selectedCampaign.metrics.impressions * 0.2,
                                        clicks: selectedCampaign.metrics.clicks * 0.2
                                      },
                                      {
                                        name: 'Week 2',
                                        spend: selectedCampaign.metrics.spend * 0.4,
                                        impressions: selectedCampaign.metrics.impressions * 0.4,
                                        clicks: selectedCampaign.metrics.clicks * 0.4
                                      },
                                      {
                                        name: 'Week 3',
                                        spend: selectedCampaign.metrics.spend * 0.7,
                                        impressions: selectedCampaign.metrics.impressions * 0.7,
                                        clicks: selectedCampaign.metrics.clicks * 0.7
                                      },
                                      {
                                        name: 'Week 4',
                                        spend: selectedCampaign.metrics.spend,
                                        impressions: selectedCampaign.metrics.impressions,
                                        clicks: selectedCampaign.metrics.clicks
                                      }
                                    ]}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip formatter={(value) => [formatNumber(value), '']} />
                                    <Legend />
                                    <Line
                                      yAxisId="left"
                                      type="monotone"
                                      dataKey="spend"
                                      name="Spend ($)"
                                      stroke="#8884d8"
                                    />
                                    <Line
                                      yAxisId="right"
                                      type="monotone"
                                      dataKey="clicks"
                                      name="Clicks"
                                      stroke="#82ca9d"
                                    />
                                    <Line
                                      yAxisId="right"
                                      type="monotone"
                                      dataKey="impressions"
                                      name="Impressions"
                                      stroke="#ffc658"
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </TabsContent>

                            <TabsContent value="bar">
                              <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={[
                                      {
                                        name: 'Metrics',
                                        spend: selectedCampaign.metrics.spend,
                                        clicks: selectedCampaign.metrics.clicks,
                                        impressions: selectedCampaign.metrics.impressions,
                                        ctr: selectedCampaign.metrics.ctr * 1000, // Scaling for visibility
                                        cpc: selectedCampaign.metrics.cpc * 100 // Scaling for visibility
                                      }
                                    ]}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value: any, name: string) => {
                                      const numValue = Number(value);
                                      if (name === 'ctr') return [formatNumber(numValue/1000) + '%', 'CTR'];
                                      if (name === 'cpc') return ['$' + formatNumber(numValue/100), 'CPC'];
                                      return [formatNumber(numValue), name];
                                    }} />
                                    <Legend />
                                    <Bar dataKey="spend" name="Spend ($)" fill="#8884d8" />
                                    <Bar dataKey="clicks" name="Clicks" fill="#82ca9d" />
                                    <Bar dataKey="impressions" name="Impressions" fill="#ffc658" />
                                    <Bar dataKey="ctr" name="CTR" fill="#ff8042" />
                                    <Bar dataKey="cpc" name="CPC" fill="#00C49F" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </TabsContent>

                            <TabsContent value="area">
                              <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={[
                                      {
                                        name: 'Week 1',
                                        spend: selectedCampaign.metrics.spend * 0.2,
                                        impressions: selectedCampaign.metrics.impressions * 0.2,
                                        clicks: selectedCampaign.metrics.clicks * 0.2
                                      },
                                      {
                                        name: 'Week 2',
                                        spend: selectedCampaign.metrics.spend * 0.4,
                                        impressions: selectedCampaign.metrics.impressions * 0.4,
                                        clicks: selectedCampaign.metrics.clicks * 0.4
                                      },
                                      {
                                        name: 'Week 3',
                                        spend: selectedCampaign.metrics.spend * 0.7,
                                        impressions: selectedCampaign.metrics.impressions * 0.7,
                                        clicks: selectedCampaign.metrics.clicks * 0.7
                                      },
                                      {
                                        name: 'Week 4',
                                        spend: selectedCampaign.metrics.spend,
                                        impressions: selectedCampaign.metrics.impressions,
                                        clicks: selectedCampaign.metrics.clicks
                                      }
                                    ]}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [formatNumber(value), '']} />
                                    <Legend />
                                    <Area
                                      type="monotone"
                                      dataKey="spend"
                                      name="Spend ($)"
                                      stackId="1"
                                      stroke="#8884d8"
                                      fill="#8884d8"
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="clicks"
                                      name="Clicks"
                                      stackId="2"
                                      stroke="#82ca9d"
                                      fill="#82ca9d"
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="impressions"
                                      name="Impressions"
                                      stackId="3"
                                      stroke="#ffc658"
                                      fill="#ffc658"
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>

                      {/* Performance Table */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Performance Summary</CardTitle>
                          <CardDescription>Detailed campaign metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left">
                              <thead className="text-xs uppercase bg-gray-800">
                                <tr>
                                  <th className="px-6 py-3">Metric</th>
                                  <th className="px-6 py-3">Value</th>
                                  <th className="px-6 py-3">Rate/Cost</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-gray-800">
                                  <td className="px-6 py-4 font-medium">Impressions</td>
                                  <td className="px-6 py-4">{formatWithCommas(selectedCampaign.metrics.impressions)}</td>
                                  <td className="px-6 py-4">-</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                  <td className="px-6 py-4 font-medium">Clicks</td>
                                  <td className="px-6 py-4">{formatWithCommas(selectedCampaign.metrics.clicks)}</td>
                                  <td className="px-6 py-4">{formatNumber(selectedCampaign.metrics.ctr)}% CTR</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                  <td className="px-6 py-4 font-medium">Spend</td>
                                  <td className="px-6 py-4">${formatNumber(selectedCampaign.metrics.spend)}</td>
                                  <td className="px-6 py-4">${formatNumber(selectedCampaign.metrics.cpc)} CPC</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                  <td className="px-6 py-4 font-medium">Link Clicks</td>
                                  <td className="px-6 py-4">{formatWithCommas(selectedCampaign.metrics.linkClicks)}</td>
                                  <td className="px-6 py-4">{formatNumber(selectedCampaign.metrics.outboundClicksCtr)}% CTR</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                  <td className="px-6 py-4 font-medium">Page Engagement</td>
                                  <td className="px-6 py-4">{formatWithCommas(selectedCampaign.metrics.pageEngagement)}</td>
                                  <td className="px-6 py-4">{formatNumber(selectedCampaign.metrics.engagementRate)}%</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                  <td className="px-6 py-4 font-medium">Conversions</td>
                                  <td className="px-6 py-4">
                                    Leads: {formatWithCommas(selectedCampaign.metrics.leads)}
                                    <br />
                                    Purchases: {formatWithCommas(selectedCampaign.metrics.purchases)}
                                  </td>
                                  <td className="px-6 py-4">
                                    CPL: ${formatNumber(selectedCampaign.metrics.costPerLead)}
                                    <br />
                                    CPP: ${formatNumber(selectedCampaign.metrics.costPerPurchase)}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>

                      {renderDetailedAnalytics(selectedCampaign)}
                    </TabsContent>

                    <TabsContent value="insights">
                      {renderAIInsights()}
                    </TabsContent>

                    <TabsContent value="daily" className="space-y-4">
                      {selectedCampaign.metrics.daily_stats && (
                        <div className="space-y-6">
                          <Card>
                            <CardHeader>
                              <CardTitle>Today's Performance</CardTitle>
                              <CardDescription>
                                {format(new Date(), 'dd MMMM yyyy')}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-gray-800 rounded-lg">
                                  <h3 className="text-sm text-gray-400">Today's Spend</h3>
                                  <p className="text-2xl font-semibold">
                                    ${formatNumber(selectedCampaign.metrics.daily_stats[0]?.spend || 0)}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {formatWithCommas(selectedCampaign.metrics.daily_stats[0]?.impressions || 0)} impressions
                                  </p>
                                </div>
                                <div className="p-4 bg-gray-800 rounded-lg">
                                  <h3 className="text-sm text-gray-400">Today's CTR</h3>
                                  <p className="text-2xl font-semibold">
                                    {formatNumber((selectedCampaign.metrics.daily_stats[0]?.clicks || 0) / 
                                      (selectedCampaign.metrics.daily_stats[0]?.impressions || 1) * 100)}%
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {formatWithCommas(selectedCampaign.metrics.daily_stats[0]?.clicks || 0)} clicks
                                  </p>
                                </div>
                                <div className="p-4 bg-gray-800 rounded-lg">
                                  <h3 className="text-sm text-gray-400">Today's CPC</h3>
                                  <p className="text-2xl font-semibold">
                                    ${formatNumber((selectedCampaign.metrics.daily_stats[0]?.spend || 0) / 
                                      (selectedCampaign.metrics.daily_stats[0]?.clicks || 1))}
                                  </p>
                                  <p className="text-sm text-gray-400">Cost per click</p>
                                </div>
                                <div className="p-4 bg-gray-800 rounded-lg">
                                  <h3 className="text-sm text-gray-400">Today's Conversion Rate</h3>
                                  <p className="text-2xl font-semibold">
                                    {formatNumber((selectedCampaign.metrics.daily_stats[0]?.conversions || 0) / 
                                      (selectedCampaign.metrics.daily_stats[0]?.clicks || 1) * 100)}%
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {formatWithCommas(selectedCampaign.metrics.daily_stats[0]?.conversions || 0)} conversions
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>Daily Trend</CardTitle>
                              <CardDescription>Performance over the last 7 days</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart
                                    data={selectedCampaign.metrics.daily_stats.slice(0, 7).reverse()}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                      dataKey="date_start" 
                                      tickFormatter={(date) => format(new Date(date), 'dd MMM')}
                                    />
                                    <YAxis yAxisId="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip 
                                      labelFormatter={(date) => format(new Date(date), 'dd MMMM yyyy')}
                                      formatter={(value) => [formatNumber(value), '']}
                                    />
                                    <Legend />
                                    <Line
                                      yAxisId="left"
                                      type="monotone"
                                      dataKey="spend"
                                      name="Spend ($)"
                                      stroke="#8884d8"
                                    />
                                    <Line
                                      yAxisId="right"
                                      type="monotone"
                                      dataKey="clicks"
                                      name="Clicks"
                                      stroke="#82ca9d"
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle>Daily Statistics</CardTitle>
                              <CardDescription>Detailed daily performance data</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="relative overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                  <thead className="text-xs uppercase bg-gray-800">
                                    <tr>
                                      <th className="px-6 py-3">Date</th>
                                      <th className="px-6 py-3">Impressions</th>
                                      <th className="px-6 py-3">Clicks</th>
                                      <th className="px-6 py-3">CTR</th>
                                      <th className="px-6 py-3">Spend</th>
                                      <th className="px-6 py-3">CPC</th>
                                      <th className="px-6 py-3">Conversions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {selectedCampaign.metrics.daily_stats.map((stat, index) => (
                                      <tr key={stat.date_start} className="border-b border-gray-800">
                                        <td className="px-6 py-4">
                                          {format(new Date(stat.date_start), 'dd MMM yyyy')}
                                        </td>
                                        <td className="px-6 py-4">
                                          {formatWithCommas(stat.impressions)}
                                        </td>
                                        <td className="px-6 py-4">
                                          {formatWithCommas(stat.clicks)}
                                        </td>
                                        <td className="px-6 py-4">
                                          {formatNumber((stat.clicks / stat.impressions) * 100)}%
                                        </td>
                                        <td className="px-6 py-4">
                                          ${formatNumber(stat.spend)}
                                        </td>
                                        <td className="px-6 py-4">
                                          ${formatNumber(stat.spend / stat.clicks)}
                                        </td>
                                        <td className="px-6 py-4">
                                          {formatWithCommas(stat.conversions)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 