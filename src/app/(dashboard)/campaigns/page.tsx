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
import { InfoIcon, TrendingUpIcon, TrendingDownIcon, AlertTriangleIcon, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
import { analyzeHourlyPerformance, analyzeDailyPerformance, formatMetricValue, calculateMetricTrends, getMetricBenchmark, getMetricStatus } from '@/lib/utils/metrics';
import {
  calculateGrowthRate,
  renderTrendIndicator,
  calculateEngagementScore,
  getPeakHours,
  calculateHourlyVolatility,
  getBestDays,
  calculateDailyStability,
  calculateDataReliability,
  calculateTrendReliability,
  calculatePerformanceScore,
  analyzeSegmentPerformance
} from '@/lib/utils/metrics';

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

interface ApiHourlyPerformance {
  hour: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
}

interface ApiDailyPerformance {
  day_of_week: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
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
    // Zaman bazlı metrikler
    hourly_performance?: ApiHourlyPerformance[];
    daily_performance?: ApiDailyPerformance[];
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
    revenue: number;
    roas: number;

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

const renderMetricCard = (
  title: string,
  value: number,
  subValue: string,
  trend?: { value: number; type: 'up' | 'down' | 'stable' },
  benchmark?: { value: number; rating: 'above' | 'average' | 'below' },
  type: 'percentage' | 'currency' | 'number' = 'number'
) => (
  <div className="p-4 bg-gray-800 rounded-lg">
    <div className="flex justify-between items-start">
      <h3 className="text-sm text-gray-400">{title}</h3>
      {trend && (
        <div className={cn(
          "flex items-center text-sm",
          trend.type === 'up' ? 'text-green-500' : 
          trend.type === 'down' ? 'text-red-500' : 
          'text-gray-500'
        )}>
          {trend.type === 'up' && <TrendingUp className="h-4 w-4 mr-1" />}
          {trend.type === 'down' && <TrendingDown className="h-4 w-4 mr-1" />}
          {trend.type === 'stable' && <Minus className="h-4 w-4 mr-1" />}
          {formatMetricValue(Math.abs(trend.value), 'percentage')}
        </div>
      )}
    </div>
    <p className="text-2xl font-semibold">
      {formatMetricValue(value, type)}
    </p>
    <div className="flex justify-between items-center">
      <p className="text-sm text-gray-400">{subValue}</p>
      {benchmark && (
        <Badge variant={
          benchmark.rating === 'above' ? 'success' :
          benchmark.rating === 'below' ? 'destructive' :
          'default'
        }>
          {benchmark.rating}
        </Badge>
      )}
    </div>
  </div>
);

interface CampaignFilters {
  status: string;
  objective: string;
  adAccount: string;
  dateRange: DateRange;
  search: string;
  performanceMetric: string;
  performanceValue: string;
}

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
  const [filters, setFilters] = useState<CampaignFilters>({
    status: '',
    objective: '',
    adAccount: '',
    dateRange: {
      from: undefined,
      to: undefined
    },
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
        // Ensure insights object exists and handle null/undefined values
        const data = insights || {};
        
        // Helper function for safe number parsing
        const safeParseFloat = (value: string | number | null | undefined): number => {
          if (value === null || value === undefined) return 0;
          const parsed = typeof value === 'string' ? parseFloat(value) : value;
          return isNaN(parsed) ? 0 : parsed;
        };

        // Helper function for safe percentage calculation
        const calculatePercentage = (numerator: number, denominator: number): number => {
          if (!denominator) return 0;
          return (numerator / denominator) * 100;
        };

        // Helper function for safe null number handling
        const safeNullableNumber = (value: number | null | undefined): number | null => {
          if (value === null || value === undefined) return null;
          const parsed = typeof value === 'string' ? parseFloat(value) : value;
          return isNaN(parsed) ? null : parsed;
        };

        // Calculate base metrics
        const impressions = safeParseFloat(data.impressions);
        const clicks = safeParseFloat(data.clicks);
        const spend = safeParseFloat(data.spend);
        const conversions = safeParseFloat(data.conversions);
        const revenue = safeParseFloat(data.revenue);

        return {
          // Temel metrikler - API'den gelenler
          impressions,
          clicks,
          spend,
          // Hesaplanan metrikler
          ctr: calculatePercentage(clicks, impressions),
          cpc: clicks ? spend / clicks : 0,
          reach: safeParseFloat(data.reach),
          frequency: safeParseFloat(data.frequency),
          uniqueClicks: safeParseFloat(data.unique_clicks),
          uniqueCtr: calculatePercentage(safeParseFloat(data.unique_clicks), safeParseFloat(data.reach)),
          costPerUniqueClick: safeParseFloat(data.unique_clicks) ? 
            spend / safeParseFloat(data.unique_clicks) : 0,
          outboundClicks: safeParseFloat(data.outbound_clicks),
          outboundClicksCtr: calculatePercentage(
            safeParseFloat(data.outbound_clicks),
            impressions
          ),
          engagementRate: calculatePercentage(
            safeParseFloat(data.page_engagement),
            impressions
          ),
          qualityRanking: data.quality_ranking || 'UNKNOWN',
          engagementRateRanking: data.engagement_rate_ranking || 'UNKNOWN',
          conversionRateRanking: data.conversion_rate_ranking || 'UNKNOWN',
          linkClicks: safeParseFloat(data.link_clicks),
          pageEngagement: safeParseFloat(data.page_engagement),
          leads: safeParseFloat(data.leads),
          purchases: safeParseFloat(data.purchases),
          costPerLead: safeParseFloat(data.leads) ? 
            spend / safeParseFloat(data.leads) : 0,
          costPerPurchase: safeParseFloat(data.purchases) ? 
            spend / safeParseFloat(data.purchases) : 0,
          conversions,
          revenue,
          roas: spend ? revenue / spend : 0,

          // Kalite metrikleri
          qualityScore: safeNullableNumber(data.quality_score),
          adRelevanceScore: safeNullableNumber(data.ad_relevance_score),
          landingPageScore: safeNullableNumber(data.landing_page_score),

          // Hedefleme metrikleri
          audienceSize: safeNullableNumber(data.audience_size),
          audienceOverlap: safeNullableNumber(data.audience_overlap),
          reachEstimate: safeNullableNumber(data.reach_estimate),
          impressionShare: safeNullableNumber(data.impression_share),
          searchImpressionShare: safeNullableNumber(data.search_impression_share),
          searchRankLostImpressionShare: safeNullableNumber(data.search_rank_lost_impression_share),

          // Demografik metrikler
          ageTargetingPerformance: data.age_targeting_performance?.map(age => ({
            ageRange: age.age_range,
            impressions: safeParseFloat(age.impressions),
            clicks: safeParseFloat(age.clicks),
            conversions: safeParseFloat(age.conversions),
            ctr: calculatePercentage(
              safeParseFloat(age.clicks),
              safeParseFloat(age.impressions)
            )
          })) || [],

          genderTargetingPerformance: data.gender_targeting_performance?.map(gender => ({
            gender: gender.gender,
            impressions: safeParseFloat(gender.impressions),
            clicks: safeParseFloat(gender.clicks),
            conversions: safeParseFloat(gender.conversions),
            ctr: calculatePercentage(
              safeParseFloat(gender.clicks),
              safeParseFloat(gender.impressions)
            )
          })) || [],

          placementPerformance: data.placement_performance?.map(placement => ({
            placement: placement.placement,
            impressions: safeParseFloat(placement.impressions),
            clicks: safeParseFloat(placement.clicks),
            conversions: safeParseFloat(placement.conversions),
            ctr: calculatePercentage(
              safeParseFloat(placement.clicks),
              safeParseFloat(placement.impressions)
            )
          })) || [],

          // Zaman bazlı metrikler
          hourlyPerformance: data.hourly_performance?.map(hour => ({
            hour: safeParseFloat(hour.hour),
            impressions: safeParseFloat(hour.impressions),
            clicks: safeParseFloat(hour.clicks),
            conversions: safeParseFloat(hour.conversions),
            ctr: calculatePercentage(
              safeParseFloat(hour.clicks),
              safeParseFloat(hour.impressions)
            )
          })) || [],

          dailyPerformance: data.daily_performance?.map(day => ({
            dayOfWeek: safeParseFloat(day.day_of_week),
            impressions: safeParseFloat(day.impressions),
            clicks: safeParseFloat(day.clicks),
            conversions: safeParseFloat(day.conversions),
            ctr: calculatePercentage(
              safeParseFloat(day.clicks),
              safeParseFloat(day.impressions)
            )
          })) || [],

          daily_stats: data.daily_stats?.map(stat => ({
            date_start: stat.date_start,
            spend: safeParseFloat(stat.spend),
            impressions: safeParseFloat(stat.impressions),
            clicks: safeParseFloat(stat.clicks),
            conversions: safeParseFloat(stat.conversions),
            revenue: safeParseFloat(stat.revenue)
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
    
    // Örnek benchmark değerleri (gerçek verilerle değiştirilmeli)
    const benchmarks = {
      ctr: 2.5,
      cpc: 1.2,
      conversionRate: 3.0,
      roas: 4.0
    };

    // Örnek önceki dönem verileri (gerçek verilerle değiştirilmeli)
    const previousMetrics = {
      ...metrics,
      impressions: metrics.impressions * 0.9,
      clicks: metrics.clicks * 0.85,
      spend: metrics.spend * 0.95,
      conversions: metrics.conversions * 0.8
    };

    const trends = calculateMetricTrends(metrics, previousMetrics);
    
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {renderMetricCard(
          "Spend",
          metrics.spend,
          `${formatMetricValue(metrics.impressions)} impressions`,
          {
            value: trends.spend.changePercentage,
            type: trends.spend.trend
          },
          {
            value: metrics.spend,
            rating: getMetricStatus(metrics.spend, benchmarks.cpc * metrics.clicks) === 'success' ? 'above' :
                   getMetricStatus(metrics.spend, benchmarks.cpc * metrics.clicks) === 'warning' ? 'average' : 'below'
          },
          'currency'
        )}
        
        {renderMetricCard(
          "CTR",
          metrics.ctr,
          `${formatMetricValue(metrics.clicks)} clicks`,
          {
            value: trends.ctr.changePercentage,
            type: trends.ctr.trend
          },
          {
            value: metrics.ctr,
            rating: getMetricStatus(metrics.ctr, benchmarks.ctr) === 'success' ? 'above' :
                   getMetricStatus(metrics.ctr, benchmarks.ctr) === 'warning' ? 'average' : 'below'
          },
          'percentage'
        )}
        
        {renderMetricCard(
          "CPC",
          metrics.cpc,
          "Cost per click",
          {
            value: trends.cpc.changePercentage,
            type: trends.cpc.trend
          },
          {
            value: metrics.cpc,
            rating: getMetricStatus(benchmarks.cpc, metrics.cpc, 0.1) === 'success' ? 'above' :
                   getMetricStatus(benchmarks.cpc, metrics.cpc, 0.1) === 'warning' ? 'average' : 'below'
          },
          'currency'
        )}
        
        {renderMetricCard(
          "ROAS",
          metrics.roas,
          `${formatMetricValue(metrics.revenue, 'currency')} revenue`,
          {
            value: trends.roas.changePercentage,
            type: trends.roas.trend
          },
          {
            value: metrics.roas,
            rating: getMetricStatus(metrics.roas, benchmarks.roas) === 'success' ? 'above' :
                   getMetricStatus(metrics.roas, benchmarks.roas) === 'warning' ? 'average' : 'below'
          },
          'number'
        )}
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

  const renderDetailedMetrics = (campaign: Campaign) => {
    const { metrics } = campaign;
    
    return (
      <>
        {/* Demografik Metrikler Kartı */}
        <Card>
          <CardHeader>
            <CardTitle>Demographic Performance</CardTitle>
            <CardDescription>Age and gender based performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="age">
              <TabsList>
                <TabsTrigger value="age">Age Distribution</TabsTrigger>
                <TabsTrigger value="gender">Gender Distribution</TabsTrigger>
                <TabsTrigger value="placement">Placement Performance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="age">
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-800">
                      <tr>
                        <th className="px-6 py-3">Age Range</th>
                        <th className="px-6 py-3">Impressions</th>
                        <th className="px-6 py-3">Clicks</th>
                        <th className="px-6 py-3">CTR</th>
                        <th className="px-6 py-3">Conversions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.ageTargetingPerformance?.map((age) => (
                        <tr key={age.ageRange} className="border-b border-gray-800">
                          <td className="px-6 py-4">{age.ageRange}</td>
                          <td className="px-6 py-4">{formatWithCommas(age.impressions)}</td>
                          <td className="px-6 py-4">{formatWithCommas(age.clicks)}</td>
                          <td className="px-6 py-4">{formatNumber(age.ctr)}%</td>
                          <td className="px-6 py-4">{formatWithCommas(age.conversions)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="gender">
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-800">
                      <tr>
                        <th className="px-6 py-3">Gender</th>
                        <th className="px-6 py-3">Impressions</th>
                        <th className="px-6 py-3">Clicks</th>
                        <th className="px-6 py-3">CTR</th>
                        <th className="px-6 py-3">Conversions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.genderTargetingPerformance?.map((gender) => (
                        <tr key={gender.gender} className="border-b border-gray-800">
                          <td className="px-6 py-4 capitalize">{gender.gender.toLowerCase()}</td>
                          <td className="px-6 py-4">{formatWithCommas(gender.impressions)}</td>
                          <td className="px-6 py-4">{formatWithCommas(gender.clicks)}</td>
                          <td className="px-6 py-4">{formatNumber(gender.ctr)}%</td>
                          <td className="px-6 py-4">{formatWithCommas(gender.conversions)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              <TabsContent value="placement">
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-800">
                      <tr>
                        <th className="px-6 py-3">Placement</th>
                        <th className="px-6 py-3">Impressions</th>
                        <th className="px-6 py-3">Clicks</th>
                        <th className="px-6 py-3">CTR</th>
                        <th className="px-6 py-3">Conversions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.placementPerformance?.map((placement) => (
                        <tr key={placement.placement} className="border-b border-gray-800">
                          <td className="px-6 py-4">{placement.placement}</td>
                          <td className="px-6 py-4">{formatWithCommas(placement.impressions)}</td>
                          <td className="px-6 py-4">{formatWithCommas(placement.clicks)}</td>
                          <td className="px-6 py-4">{formatNumber(placement.ctr)}%</td>
                          <td className="px-6 py-4">{formatWithCommas(placement.conversions)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Kalite ve Hedefleme Metrikleri Kartı */}
        <Card>
          <CardHeader>
            <CardTitle>Quality & Targeting Metrics</CardTitle>
            <CardDescription>Detailed quality scores and targeting performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kalite Metrikleri */}
              <div>
                <h4 className="text-sm font-medium mb-4">Quality Metrics</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h3 className="text-sm text-gray-400">Quality Score</h3>
                    <p className="text-2xl font-semibold">{metrics.qualityScore || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h3 className="text-sm text-gray-400">Ad Relevance Score</h3>
                    <p className="text-2xl font-semibold">{metrics.adRelevanceScore || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h3 className="text-sm text-gray-400">Landing Page Score</h3>
                    <p className="text-2xl font-semibold">{metrics.landingPageScore || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Hedefleme Metrikleri */}
              <div>
                <h4 className="text-sm font-medium mb-4">Targeting Metrics</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h3 className="text-sm text-gray-400">Audience Size</h3>
                    <p className="text-2xl font-semibold">{formatWithCommas(metrics.audienceSize) || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h3 className="text-sm text-gray-400">Audience Overlap</h3>
                    <p className="text-2xl font-semibold">{formatNumber(metrics.audienceOverlap)}% || 'N/A'</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg">
                    <h3 className="text-sm text-gray-400">Impression Share</h3>
                    <p className="text-2xl font-semibold">{formatNumber(metrics.impressionShare)}% || 'N/A'</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ROI ve Revenue Metrikleri Kartı */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue & ROI Analysis</CardTitle>
            <CardDescription>Return on investment and revenue metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm text-gray-400">Total Revenue</h3>
                <p className="text-2xl font-semibold">${formatNumber(metrics.revenue || 0)}</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm text-gray-400">ROAS</h3>
                <p className="text-2xl font-semibold">{formatNumber(metrics.roas || 0)}x</p>
                <p className="text-sm text-gray-400">Return on Ad Spend</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm text-gray-400">Unique Clicks</h3>
                <p className="text-2xl font-semibold">{formatWithCommas(metrics.uniqueClicks)}</p>
                <p className="text-sm text-gray-400">{formatNumber(metrics.uniqueCtr)}% CTR</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm text-gray-400">Cost Per Unique Click</h3>
                <p className="text-2xl font-semibold">${formatNumber(metrics.costPerUniqueClick)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Zaman Bazlı Performans Kartı */}
        <Card>
          <CardHeader>
            <CardTitle>Time-Based Performance</CardTitle>
            <CardDescription>Hourly and daily performance breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hourly">
              <TabsList>
                <TabsTrigger value="hourly">Hourly Performance</TabsTrigger>
                <TabsTrigger value="daily">Daily Performance</TabsTrigger>
              </TabsList>

              <TabsContent value="hourly">
                {campaign.metrics.hourlyPerformance ? (
                  <>
                    <div className="mb-6">
                      {(() => {
                        const analysis = analyzeHourlyPerformance(campaign.metrics.hourlyPerformance);
                        if (!analysis) return null;

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-800 rounded-lg">
                              <h3 className="text-sm text-gray-400">Best Hours</h3>
                              <p className="text-2xl font-semibold">
                                {analysis.bestHours.map(hour => 
                                  `${hour}:00`
                                ).join(', ')}
                              </p>
                              <p className="text-sm text-gray-400">Highest CTR performance</p>
                            </div>
                            <div className="p-4 bg-gray-800 rounded-lg">
                              <h3 className="text-sm text-gray-400">Average Performance</h3>
                              <p className="text-2xl font-semibold">
                                {formatMetricValue(analysis.averageMetrics.ctr, 'percentage')} CTR
                              </p>
                              <p className="text-sm text-gray-400">
                                {formatMetricValue(analysis.averageMetrics.clicks)} clicks/hour
                              </p>
                            </div>
                            <div className="p-4 bg-gray-800 rounded-lg">
                              <h3 className="text-sm text-gray-400">Improvement Hours</h3>
                              <p className="text-2xl font-semibold">
                                {analysis.worstHours.map(hour => 
                                  `${hour}:00`
                                ).join(', ')}
                              </p>
                              <p className="text-sm text-gray-400">Needs optimization</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={campaign.metrics.hourlyPerformance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="hour" 
                            tickFormatter={(hour) => `${hour}:00`}
                          />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'ctr' ? `${formatMetricValue(value as number, 'percentage')}` :
                              formatMetricValue(value as number),
                              typeof name === 'string' ? name.toUpperCase() : name
                            ]}
                          />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="impressions"
                            name="Impressions"
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
                            dataKey="ctr"
                            name="CTR"
                            stroke="#ffc658"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hourly performance data available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="daily">
                {campaign.metrics.dailyPerformance ? (
                  <>
                    <div className="mb-6">
                      {(() => {
                        const analysis = analyzeDailyPerformance(campaign.metrics.dailyPerformance);
                        if (!analysis) return null;

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-800 rounded-lg">
                              <h3 className="text-sm text-gray-400">Best Days</h3>
                              <p className="text-2xl font-semibold">
                                {analysis.bestDays.map(day => 
                                  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
                                ).join(', ')}
                              </p>
                              <p className="text-sm text-gray-400">Highest CTR performance</p>
                            </div>
                            <div className="p-4 bg-gray-800 rounded-lg">
                              <h3 className="text-sm text-gray-400">Average Performance</h3>
                              <p className="text-2xl font-semibold">
                                {formatMetricValue(analysis.averageMetrics.ctr, 'percentage')} CTR
                              </p>
                              <p className="text-sm text-gray-400">
                                {formatMetricValue(analysis.averageMetrics.clicks)} clicks/day
                              </p>
                            </div>
                            <div className="p-4 bg-gray-800 rounded-lg">
                              <h3 className="text-sm text-gray-400">Improvement Days</h3>
                              <p className="text-2xl font-semibold">
                                {analysis.worstDays.map(day => 
                                  ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
                                ).join(', ')}
                              </p>
                              <p className="text-sm text-gray-400">Needs optimization</p>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={campaign.metrics.dailyPerformance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="dayOfWeek" 
                            tickFormatter={(day) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => [
                              name === 'ctr' ? `${formatMetricValue(value as number, 'percentage')}` :
                              formatMetricValue(value as number),
                              typeof name === 'string' ? name.toUpperCase() : name
                            ]}
                          />
                          <Legend />
                          <Bar dataKey="impressions" name="Impressions" fill="#8884d8" />
                          <Bar dataKey="clicks" name="Clicks" fill="#82ca9d" />
                          <Bar dataKey="ctr" name="CTR" fill="#ffc658" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No daily performance data available
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quality & Ranking Metrics Card */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Quality & Ranking Metrics</CardTitle>
            <CardDescription>Campaign quality and performance rankings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm text-gray-400">Quality Ranking</h3>
                <p className="text-2xl font-semibold capitalize">
                  {metrics.qualityRanking?.toLowerCase() || 'N/A'}
                </p>
                <p className="text-sm text-gray-400">Overall quality score</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm text-gray-400">Engagement Ranking</h3>
                <p className="text-2xl font-semibold capitalize">
                  {metrics.engagementRateRanking?.toLowerCase() || 'N/A'}
                </p>
                <p className="text-sm text-gray-400">Engagement performance</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm text-gray-400">Conversion Ranking</h3>
                <p className="text-2xl font-semibold capitalize">
                  {metrics.conversionRateRanking?.toLowerCase() || 'N/A'}
                </p>
                <p className="text-sm text-gray-400">Conversion performance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search & Targeting Insights Card */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Search & Targeting Insights</CardTitle>
            <CardDescription>Search visibility and targeting metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm text-gray-400">Search Impression Share</h3>
                <p className="text-2xl font-semibold">
                  {formatNumber(metrics.searchImpressionShare || 0)}%
                </p>
                <p className="text-sm text-gray-400">Share of available impressions</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm text-gray-400">Lost Impression Share</h3>
                <p className="text-2xl font-semibold">
                  {formatNumber(metrics.searchRankLostImpressionShare || 0)}%
                </p>
                <p className="text-sm text-gray-400">Lost due to rank</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm text-gray-400">Reach Estimate</h3>
                <p className="text-2xl font-semibold">
                  {formatWithCommas(metrics.reachEstimate || 0)}
                </p>
                <p className="text-sm text-gray-400">Potential audience reach</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Performance Metrics Card */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Additional Performance Metrics</CardTitle>
            <CardDescription>Detailed engagement and conversion metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm text-gray-400">Conversion Rate</h3>
                <p className="text-2xl font-semibold">
                  {formatNumber((metrics.conversions / metrics.clicks) * 100)}%
                </p>
                <p className="text-sm text-gray-400">{formatWithCommas(metrics.conversions)} conversions</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm text-gray-400">Frequency</h3>
                <p className="text-2xl font-semibold">
                  {formatNumber(metrics.frequency)}
                </p>
                <p className="text-sm text-gray-400">Avg. views per user</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm text-gray-400">Unique Clicks</h3>
                <p className="text-2xl font-semibold">
                  {formatWithCommas(metrics.uniqueClicks)}
                </p>
                <p className="text-sm text-gray-400">{formatNumber(metrics.uniqueCtr)}% Unique CTR</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg">
                <h3 className="text-sm text-gray-400">Outbound Clicks</h3>
                <p className="text-2xl font-semibold">
                  {formatWithCommas(metrics.outboundClicks)}
                </p>
                <p className="text-sm text-gray-400">{formatNumber(metrics.outboundClicksCtr)}% CTR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
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

  // Önceki dönem metriklerini tutacak state
  const [previousMetrics, setPreviousMetrics] = useState<Campaign['metrics'] | null>(null);

  // Önceki dönem verilerini yükle
  useEffect(() => {
    if (selectedCampaign) {
      // Gerçek API'den alınacak, şimdilik mock data
      setPreviousMetrics({
        ...selectedCampaign.metrics,
        impressions: selectedCampaign.metrics.impressions * 0.9,
        clicks: selectedCampaign.metrics.clicks * 0.85,
        spend: selectedCampaign.metrics.spend * 0.95,
        conversions: selectedCampaign.metrics.conversions * 0.8,
        revenue: selectedCampaign.metrics.revenue * 0.75,
        uniqueClicks: selectedCampaign.metrics.uniqueClicks * 0.88,
        frequency: selectedCampaign.metrics.frequency * 0.95,
        pageEngagement: selectedCampaign.metrics.pageEngagement * 0.9
      });
    }
  }, [selectedCampaign]);

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
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                      <TabsTrigger value="insights">AI Insights</TabsTrigger>
                      <TabsTrigger value="daily">Daily Stats</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                      {renderMetrics(selectedCampaign)}
                      {renderCampaignInfo(selectedCampaign)}
                      {renderDetailedMetrics(selectedCampaign)}
                      
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
                                <tr className="border-b border-gray-800">
                                  <td className="px-6 py-4 font-medium">Unique Engagement</td>
                                  <td className="px-6 py-4">{formatWithCommas(selectedCampaign.metrics.uniqueClicks)} unique clicks</td>
                                  <td className="px-6 py-4">{formatNumber(selectedCampaign.metrics.uniqueCtr)}% unique CTR</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                  <td className="px-6 py-4 font-medium">View Frequency</td>
                                  <td className="px-6 py-4">{formatNumber(selectedCampaign.metrics.frequency)} avg. views</td>
                                  <td className="px-6 py-4">{formatWithCommas(selectedCampaign.metrics.reach)} unique users</td>
                                </tr>
                                <tr className="border-b border-gray-800">
                                  <td className="px-6 py-4 font-medium">Quality Metrics</td>
                                  <td className="px-6 py-4">
                                    Quality: {selectedCampaign.metrics.qualityRanking?.toLowerCase() || 'N/A'}
                                  </td>
                                  <td className="px-6 py-4">
                                    Engagement: {selectedCampaign.metrics.engagementRateRanking?.toLowerCase() || 'N/A'}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-4">
                      {selectedCampaign ? (
                        <>
                          {/* Conversion Funnel Card */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Conversion Funnel</CardTitle>
                              <CardDescription>Step by step conversion analysis</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-6">
                                {/* Funnel Metrics */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="p-4 bg-gray-800 rounded-lg">
                                    <h3 className="text-sm text-gray-400">Impressions</h3>
                                    <p className="text-2xl font-semibold">
                                      {formatWithCommas(selectedCampaign?.metrics?.impressions || 0)}
                                    </p>
                                  </div>
                                  <div className="p-4 bg-gray-800 rounded-lg">
                                    <h3 className="text-sm text-gray-400">Clicks</h3>
                                    <p className="text-2xl font-semibold">
                                      {formatWithCommas(selectedCampaign?.metrics?.clicks || 0)}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                      {formatNumber(selectedCampaign?.metrics?.ctr || 0)}% CTR
                                    </p>
                                  </div>
                                  <div className="p-4 bg-gray-800 rounded-lg">
                                    <h3 className="text-sm text-gray-400">Unique Clicks</h3>
                                    <p className="text-2xl font-semibold">
                                      {formatWithCommas(selectedCampaign?.metrics?.uniqueClicks || 0)}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                      {formatNumber(selectedCampaign?.metrics?.uniqueCtr || 0)}% Unique CTR
                                    </p>
                                  </div>
                                  <div className="p-4 bg-gray-800 rounded-lg">
                                    <h3 className="text-sm text-gray-400">Conversions</h3>
                                    <p className="text-2xl font-semibold">
                                      {formatWithCommas(selectedCampaign?.metrics?.conversions || 0)}
                                    </p>
                                    <p className="text-sm text-gray-400">
                                      {formatNumber((selectedCampaign?.metrics?.conversions || 0) / (selectedCampaign?.metrics?.clicks || 1) * 100)}% Conv. Rate
                                    </p>
                                  </div>
                                </div>

                                {/* Drop-off Analysis */}
                                <div className="space-y-4">
                                  <h4 className="text-sm font-medium">Drop-off Analysis</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-gray-800 rounded-lg">
                                      <h3 className="text-sm text-gray-400">Click Drop-off</h3>
                                      <p className="text-2xl font-semibold">
                                        {formatNumber(100 - (selectedCampaign?.metrics?.ctr || 0))}%
                                      </p>
                                      <p className="text-sm text-gray-400">
                                        {formatWithCommas((selectedCampaign?.metrics?.impressions || 0) - (selectedCampaign?.metrics?.clicks || 0))} lost impressions
                                      </p>
                                    </div>
                                    <div className="p-4 bg-gray-800 rounded-lg">
                                      <h3 className="text-sm text-gray-400">Unique Click Drop-off</h3>
                                      <p className="text-2xl font-semibold">
                                        {formatNumber(100 - ((selectedCampaign?.metrics?.uniqueClicks || 0) / (selectedCampaign?.metrics?.clicks || 1) * 100))}%
                                      </p>
                                      <p className="text-sm text-gray-400">
                                        {formatWithCommas((selectedCampaign?.metrics?.clicks || 0) - (selectedCampaign?.metrics?.uniqueClicks || 0))} repeat clicks
                                      </p>
                                    </div>
                                    <div className="p-4 bg-gray-800 rounded-lg">
                                      <h3 className="text-sm text-gray-400">Conversion Drop-off</h3>
                                      <p className="text-2xl font-semibold">
                                        {formatNumber(100 - ((selectedCampaign?.metrics?.conversions || 0) / (selectedCampaign?.metrics?.uniqueClicks || 1) * 100))}%
                                      </p>
                                      <p className="text-sm text-gray-400">
                                        {formatWithCommas((selectedCampaign?.metrics?.uniqueClicks || 0) - (selectedCampaign?.metrics?.conversions || 0))} lost opportunities
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Funnel Visualization */}
                                <div className="h-[300px]">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                      data={[
                                        {
                                          stage: 'Impressions',
                                          value: selectedCampaign?.metrics?.impressions || 0,
                                          dropoff: 0
                                        },
                                        {
                                          stage: 'Clicks',
                                          value: selectedCampaign?.metrics?.clicks || 0,
                                          dropoff: (selectedCampaign?.metrics?.impressions || 0) - (selectedCampaign?.metrics?.clicks || 0)
                                        },
                                        {
                                          stage: 'Unique Clicks',
                                          value: selectedCampaign?.metrics?.uniqueClicks || 0,
                                          dropoff: (selectedCampaign?.metrics?.clicks || 0) - (selectedCampaign?.metrics?.uniqueClicks || 0)
                                        },
                                        {
                                          stage: 'Conversions',
                                          value: selectedCampaign?.metrics?.conversions || 0,
                                          dropoff: (selectedCampaign?.metrics?.uniqueClicks || 0) - (selectedCampaign?.metrics?.conversions || 0)
                                        }
                                      ]}
                                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="stage" />
                                      <YAxis />
                                      <Tooltip formatter={(value) => formatWithCommas(value)} />
                                      <Legend />
                                      <Bar dataKey="value" name="Count" fill="#82ca9d" />
                                      <Bar dataKey="dropoff" name="Drop-off" fill="#ff8042" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Kalite ve Rekabet Analizi Kartı */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Rekabet ve Kalite Analizi</CardTitle>
                              <CardDescription>Pazar konumu ve kalite metrikleri</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-6">
                                {/* Pazar Konumu */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="p-4 bg-gray-800 rounded-lg">
                                    <h3 className="text-sm text-gray-400">Gösterim Payı</h3>
                                    <div className="flex justify-between items-center">
                                      <p className="text-2xl font-semibold">
                                        {formatNumber(selectedCampaign?.metrics?.impressionShare || 0)}%
                                      </p>
                                      <Badge variant={
                                        (selectedCampaign?.metrics?.impressionShare || 0) > 40 ? 'success' :
                                        (selectedCampaign?.metrics?.impressionShare || 0) > 20 ? 'default' :
                                        'destructive'
                                      }>
                                        {(selectedCampaign?.metrics?.impressionShare || 0) > 40 ? 'Dominant' :
                                         (selectedCampaign?.metrics?.impressionShare || 0) > 20 ? 'Rekabetçi' :
                                         'Geliştirilebilir'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400">Toplam gösterim payınız</p>
                                  </div>

                                  <div className="p-4 bg-gray-800 rounded-lg">
                                    <h3 className="text-sm text-gray-400">Kaybedilen Gösterimler</h3>
                                    <div className="flex justify-between items-center">
                                      <p className="text-2xl font-semibold">
                                        {formatNumber(selectedCampaign?.metrics?.searchRankLostImpressionShare || 0)}%
                                      </p>
                                      <Badge variant={
                                        (selectedCampaign?.metrics?.searchRankLostImpressionShare || 0) < 20 ? 'success' :
                                        (selectedCampaign?.metrics?.searchRankLostImpressionShare || 0) < 40 ? 'default' :
                                        'destructive'
                                      }>
                                        {(selectedCampaign?.metrics?.searchRankLostImpressionShare || 0) < 20 ? 'İyi' :
                                         (selectedCampaign?.metrics?.searchRankLostImpressionShare || 0) < 40 ? 'Orta' :
                                         'Kritik'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400">Sıralama nedeniyle kaybedilen</p>
                                  </div>

                                  <div className="p-4 bg-gray-800 rounded-lg">
                                    <h3 className="text-sm text-gray-400">Rekabet Gücü</h3>
                                    <div className="flex justify-between items-center">
                                      <p className="text-2xl font-semibold">
                                        {formatNumber(
                                          ((selectedCampaign?.metrics?.impressionShare || 0) /
                                          (100 - (selectedCampaign?.metrics?.searchRankLostImpressionShare || 0))) * 100
                                        )}%
                                      </p>
                                      <Badge variant={
                                        ((selectedCampaign?.metrics?.impressionShare || 0) /
                                        (100 - (selectedCampaign?.metrics?.searchRankLostImpressionShare || 0))) > 0.4 ? 'success' :
                                        ((selectedCampaign?.metrics?.impressionShare || 0) /
                                        (100 - (selectedCampaign?.metrics?.searchRankLostImpressionShare || 0))) > 0.2 ? 'default' :
                                        'destructive'
                                      }>
                                        {((selectedCampaign?.metrics?.impressionShare || 0) /
                                        (100 - (selectedCampaign?.metrics?.searchRankLostImpressionShare || 0))) > 0.4 ? 'Güçlü' :
                                         ((selectedCampaign?.metrics?.impressionShare || 0) /
                                         (100 - (selectedCampaign?.metrics?.searchRankLostImpressionShare || 0))) > 0.2 ? 'Orta' :
                                         'Zayıf'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400">Rekabet gücü skoru</p>
                                  </div>
                                </div>

                                {/* Kalite Metrikleri */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="p-4 bg-gray-800 rounded-lg">
                                    <h3 className="text-sm text-gray-400">Kalite Skoru</h3>
                                    <div className="flex justify-between items-center">
                                      <p className="text-2xl font-semibold">
                                        {selectedCampaign?.metrics?.qualityScore || 'N/A'}
                                      </p>
                                      <Badge variant={
                                        (selectedCampaign?.metrics?.qualityScore || 0) > 7 ? 'success' :
                                        (selectedCampaign?.metrics?.qualityScore || 0) > 5 ? 'default' :
                                        'destructive'
                                      }>
                                        {(selectedCampaign?.metrics?.qualityScore || 0) > 7 ? 'Yüksek' :
                                         (selectedCampaign?.metrics?.qualityScore || 0) > 5 ? 'Orta' :
                                         'Düşük'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400">Genel kalite puanı</p>
                                  </div>

                                  <div className="p-4 bg-gray-800 rounded-lg">
                                    <h3 className="text-sm text-gray-400">Reklam Alaka Düzeyi</h3>
                                    <div className="flex justify-between items-center">
                                      <p className="text-2xl font-semibold">
                                        {selectedCampaign?.metrics?.adRelevanceScore || 'N/A'}
                                      </p>
                                      <Badge variant={
                                        (selectedCampaign?.metrics?.adRelevanceScore || 0) > 7 ? 'success' :
                                        (selectedCampaign?.metrics?.adRelevanceScore || 0) > 5 ? 'default' :
                                        'destructive'
                                      }>
                                        {(selectedCampaign?.metrics?.adRelevanceScore || 0) > 7 ? 'Yüksek' :
                                         (selectedCampaign?.metrics?.adRelevanceScore || 0) > 5 ? 'Orta' :
                                         'Düşük'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400">Reklam ilgi skoru</p>
                                  </div>

                                  <div className="p-4 bg-gray-800 rounded-lg">
                                    <h3 className="text-sm text-gray-400">Landing Page Kalitesi</h3>
                                    <div className="flex justify-between items-center">
                                      <p className="text-2xl font-semibold">
                                        {selectedCampaign?.metrics?.landingPageScore || 'N/A'}
                                      </p>
                                      <Badge variant={
                                        (selectedCampaign?.metrics?.landingPageScore || 0) > 7 ? 'success' :
                                        (selectedCampaign?.metrics?.landingPageScore || 0) > 5 ? 'default' :
                                        'destructive'
                                      }>
                                        {(selectedCampaign?.metrics?.landingPageScore || 0) > 7 ? 'Yüksek' :
                                         (selectedCampaign?.metrics?.landingPageScore || 0) > 5 ? 'Orta' :
                                         'Düşük'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400">Hedef sayfa performansı</p>
                                  </div>
                                </div>

                                {/* Rekabet Önerileri */}
                                <div className="p-4 bg-gray-800 rounded-lg">
                                  <h3 className="text-sm font-medium mb-2">Rekabet İyileştirme Önerileri</h3>
                                  <div className="space-y-2">
                                    {(selectedCampaign?.metrics?.searchRankLostImpressionShare || 0) > 40 && (
                                      <div className="flex items-center gap-2 text-red-400">
                                        <AlertTriangleIcon className="h-4 w-4" />
                                        <p className="text-sm">Yüksek gösterim kaybı - Teklif stratejisi gözden geçirilmeli</p>
                                      </div>
                                    )}
                                    {(selectedCampaign?.metrics?.qualityScore || 0) < 5 && (
                                      <div className="flex items-center gap-2 text-red-400">
                                        <AlertTriangleIcon className="h-4 w-4" />
                                        <p className="text-sm">Düşük kalite skoru - Reklam içeriği ve hedefleme optimize edilmeli</p>
                                      </div>
                                    )}
                                    {(selectedCampaign?.metrics?.landingPageScore || 0) < 5 && (
                                      <div className="flex items-center gap-2 text-yellow-400">
                                        <AlertTriangleIcon className="h-4 w-4" />
                                        <p className="text-sm">Düşük landing page skoru - Sayfa optimizasyonu yapılmalı</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Anomali ve Risk Tespiti Kartı */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Anomali ve Risk Analizi</CardTitle>
                              <CardDescription>Performans sapmaları ve risk göstergeleri</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-6">
                                {/* Risk Göstergeleri */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="p-4 bg-gray-800 rounded-lg">
                                    <h3 className="text-sm text-gray-400">Bütçe Tüketim Riski</h3>
                                    <div className="flex justify-between items-center">
                                      <p className="text-2xl font-semibold">
                                        {formatNumber((selectedCampaign?.metrics?.spend || 0) / (selectedCampaign?.daily_budget || 1) * 100)}%
                                      </p>
                                      <Badge variant={
                                        ((selectedCampaign?.metrics?.spend || 0) / (selectedCampaign?.daily_budget || 1)) < 0.8 ? 'success' :
                                        ((selectedCampaign?.metrics?.spend || 0) / (selectedCampaign?.daily_budget || 1)) < 0.95 ? 'default' :
                                        'destructive'
                                      }>
                                        {((selectedCampaign?.metrics?.spend || 0) / (selectedCampaign?.daily_budget || 1)) < 0.8 ? 'Güvenli' :
                                         ((selectedCampaign?.metrics?.spend || 0) / (selectedCampaign?.daily_budget || 1)) < 0.95 ? 'Orta' :
                                         'Riskli'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400">Günlük bütçe kullanımı</p>
                                  </div>

                                  <div className="p-4 bg-gray-800 rounded-lg">
                                    <h3 className="text-sm text-gray-400">Bot Traffic Riski</h3>
                                    <div className="flex justify-between items-center">
                                      <p className="text-2xl font-semibold">
                                        {formatNumber(
                                          ((selectedCampaign?.metrics?.clicks || 0) - (selectedCampaign?.metrics?.uniqueClicks || 0)) /
                                          (selectedCampaign?.metrics?.clicks || 1) * 100
                                        )}%
                                      </p>
                                      <Badge variant={
                                        (((selectedCampaign?.metrics?.clicks || 0) - (selectedCampaign?.metrics?.uniqueClicks || 0)) /
                                        (selectedCampaign?.metrics?.clicks || 1) * 100) < 20 ? 'success' :
                                        (((selectedCampaign?.metrics?.clicks || 0) - (selectedCampaign?.metrics?.uniqueClicks || 0)) /
                                        (selectedCampaign?.metrics?.clicks || 1) * 100) < 40 ? 'default' :
                                        'destructive'
                                      }>
                                        {(((selectedCampaign?.metrics?.clicks || 0) - (selectedCampaign?.metrics?.uniqueClicks || 0)) /
                                        (selectedCampaign?.metrics?.clicks || 1) * 100) < 20 ? 'Düşük' :
                                         (((selectedCampaign?.metrics?.clicks || 0) - (selectedCampaign?.metrics?.uniqueClicks || 0)) /
                                         (selectedCampaign?.metrics?.clicks || 1) * 100) < 40 ? 'Orta' :
                                         'Yüksek'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400">Tekrarlayan tıklama oranı</p>
                                  </div>

                                  <div className="p-4 bg-gray-800 rounded-lg">
                                    <h3 className="text-sm text-gray-400">Performans Sapması</h3>
                                    <div className="flex justify-between items-center">
                                      <p className="text-2xl font-semibold">
                                        {formatNumber(Math.abs(
                                          ((selectedCampaign?.metrics?.ctr || 0) - 
                                          (previousMetrics?.ctr || 0)) / 
                                          (previousMetrics?.ctr || 1) * 100
                                        ))}%
                                      </p>
                                      <Badge variant={
                                        Math.abs(((selectedCampaign?.metrics?.ctr || 0) - (previousMetrics?.ctr || 0)) / (previousMetrics?.ctr || 1) * 100) < 10 ? 'success' :
                                        Math.abs(((selectedCampaign?.metrics?.ctr || 0) - (previousMetrics?.ctr || 0)) / (previousMetrics?.ctr || 1) * 100) < 20 ? 'default' :
                                        'destructive'
                                      }>
                                        {Math.abs(((selectedCampaign?.metrics?.ctr || 0) - (previousMetrics?.ctr || 0)) / (previousMetrics?.ctr || 1) * 100) < 10 ? 'Normal' :
                                         Math.abs(((selectedCampaign?.metrics?.ctr || 0) - (previousMetrics?.ctr || 0)) / (previousMetrics?.ctr || 1) * 100) < 20 ? 'Dikkat' :
                                         'Kritik'}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-400">CTR değişim oranı</p>
                                  </div>
                                </div>

                                {/* Risk Uyarıları */}
                                <div className="p-4 bg-gray-800 rounded-lg">
                                  <h3 className="text-sm font-medium mb-2">Risk Uyarıları</h3>
                                  <div className="space-y-2">
                                    {((selectedCampaign?.metrics?.spend || 0) / (selectedCampaign?.daily_budget || 1)) > 0.95 && (
                                      <div className="flex items-center gap-2 text-red-400">
                                        <AlertTriangleIcon className="h-4 w-4" />
                                        <p className="text-sm">Bütçe limiti yakın - Bütçe artırımı değerlendirilmeli</p>
                                      </div>
                                    )}
                                    {(((selectedCampaign?.metrics?.clicks || 0) - (selectedCampaign?.metrics?.uniqueClicks || 0)) /
                                      (selectedCampaign?.metrics?.clicks || 1) * 100) > 40 && (
                                      <div className="flex items-center gap-2 text-red-400">
                                        <AlertTriangleIcon className="h-4 w-4" />
                                        <p className="text-sm">Yüksek tekrarlayan tıklama - Potansiyel bot traffic incelenmeli</p>
                                      </div>
                                    )}
                                    {Math.abs(((selectedCampaign?.metrics?.ctr || 0) - (previousMetrics?.ctr || 0)) / (previousMetrics?.ctr || 1) * 100) > 20 && (
                                      <div className="flex items-center gap-2 text-yellow-400">
                                        <AlertTriangleIcon className="h-4 w-4" />
                                        <p className="text-sm">Anormal CTR değişimi - Hedefleme ve içerik gözden geçirilmeli</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Data Reliability Card */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Data Reliability</CardTitle>
                              <CardDescription>Analysis quality and confidence metrics</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="text-sm font-medium mb-4">Current Data Quality</h4>
                                  {(() => {
                                    const reliability = calculateDataReliability(selectedCampaign.metrics);
                                    return (
                                      <div className="p-4 bg-gray-800 rounded-lg">
                                        <div className="flex justify-between items-center">
                                          <h3 className="text-sm text-gray-400">Reliability Score</h3>
                                          <Badge variant={
                                            reliability > 80 ? 'success' :
                                            reliability > 60 ? 'default' :
                                            'destructive'
                                          }>
                                            {reliability > 80 ? 'High' :
                                             reliability > 60 ? 'Medium' :
                                             'Low'}
                                          </Badge>
                                        </div>
                                        <p className="text-2xl font-semibold">{formatNumber(reliability)}%</p>
                                        <p className="text-sm text-gray-400">Based on data quality checks</p>
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-4">Trend Reliability</h4>
                                  {previousMetrics && (() => {
                                    const trendReliability = calculateTrendReliability(selectedCampaign.metrics, previousMetrics);
                                    return (
                                      <div className="p-4 bg-gray-800 rounded-lg">
                                        <div className="flex justify-between items-center">
                                          <h3 className="text-sm text-gray-400">Trend Confidence</h3>
                                          <Badge variant={
                                            trendReliability > 80 ? 'success' :
                                            trendReliability > 60 ? 'default' :
                                            'destructive'
                                          }>
                                            {trendReliability > 80 ? 'High' :
                                             trendReliability > 60 ? 'Medium' :
                                             'Low'}
                                          </Badge>
                                        </div>
                                        <p className="text-2xl font-semibold">{formatNumber(trendReliability)}%</p>
                                        <p className="text-sm text-gray-400">Based on trend analysis checks</p>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Performance Score Card */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Overall Performance</CardTitle>
                              <CardDescription>Comprehensive performance analysis</CardDescription>
                            </CardHeader>
                            <CardContent>
                              {(() => {
                                const performanceScore = calculatePerformanceScore(selectedCampaign.metrics);
                                const segmentAnalysis = analyzeSegmentPerformance(selectedCampaign.metrics);
                                
                                return (
                                  <div className="space-y-6">
                                    <div className="p-4 bg-gray-800 rounded-lg">
                                      <div className="flex justify-between items-center">
                                        <h3 className="text-sm text-gray-400">Overall Score</h3>
                                        <Badge variant={
                                          performanceScore > 80 ? 'success' :
                                          performanceScore > 60 ? 'default' :
                                          'destructive'
                                        }>
                                          {performanceScore > 80 ? 'Excellent' :
                                           performanceScore > 60 ? 'Good' :
                                           'Needs Improvement'}
                                        </Badge>
                                      </div>
                                      <p className="text-2xl font-semibold">{formatNumber(performanceScore)}</p>
                                      <p className="text-sm text-gray-400">Weighted performance score</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      {Object.entries(segmentAnalysis.segments).map(([key, segment]) => (
                                        <div key={key} className="p-4 bg-gray-800 rounded-lg">
                                          <h3 className="text-sm text-gray-400 capitalize">{key} Performance</h3>
                                          <p className="text-2xl font-semibold">{formatNumber(segment.score)}</p>
                                          <div className="mt-2 space-y-1">
                                            {Object.entries(segment.metrics).map(([metricKey, value]) => (
                                              <div key={metricKey} className="flex justify-between text-sm">
                                                <span className="text-gray-400 capitalize">
                                                  {metricKey.replace(/([A-Z])/g, ' $1').trim()}
                                                </span>
                                                <span>{formatMetricValue(value ?? 0, 
                                                  metricKey.includes('rate') ? 'percentage' :
                                                  metricKey.includes('cost') ? 'currency' : 'number'
                                                )}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                            </CardContent>
                          </Card>

                          {/* Existing Performance Trends Card */}
                          {/* ... rest of the existing analytics content ... */}
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Please select a campaign to view analytics
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="insights">
                      {renderAIInsights()}
                    </TabsContent>

                    <TabsContent value="daily" className="space-y-4">
                      {selectedCampaign?.metrics.daily_stats ? (
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
                                    ${formatMetricValue(selectedCampaign.metrics.daily_stats[0]?.spend || 0, 'currency')}
                                  </p>
                                  <p className="text-sm text-gray-400">
                                    {formatMetricValue(selectedCampaign.metrics.daily_stats[0]?.impressions || 0)} impressions
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
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No daily statistics available
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
