export interface CampaignMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  ctr: number;
  cpc: number;
  roas: number;
  conversion_rate: number;
}

export interface Campaign {
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
  analytics: {
    metrics: CampaignMetrics;
    date: Date;
  }[];
  metrics: {
    // Temel metrikler
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

    // Kalite metrikleri
    qualityScore: number | null;
    adRelevanceScore: number | null;
    landingPageScore: number | null;

    // Hedefleme metrikleri
    audienceSize: number | null;
    audienceOverlap: number | null;
    reachEstimate: number | null;
    impressionShare: number | null;
    searchImpressionShare: number | null;
    searchRankLostImpressionShare: number | null;

    // Zaman bazlı metrikler
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