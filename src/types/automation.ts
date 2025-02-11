export type AutomationType = 'matching' | 'trigger' | 'workflow' | 'sync';
export type AutomationStatus = 'active' | 'inactive';

export interface AutomationCondition {
  field: string;
  operator: '<' | '<=' | '>' | '>=' | '==' | 'contains' | 'startsWith' | 'endsWith';
  value: string | number | boolean;
}

export interface AutomationAction {
  type: string;
  params: Record<string, any>;
}

export interface AutomationRule {
  id: string;
  name: string;
  type: AutomationType;
  status: AutomationStatus;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  lastRun?: string;
  nextRun?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationLog {
  id: string;
  ruleId: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: Record<string, any>;
  createdAt: string;
}

// Predefined automation templates
export const AUTOMATION_TEMPLATES = {
  matching: [
    {
      name: 'Campaign to Deal Matching',
      conditions: [
        { field: 'utm_source', operator: '==', value: 'facebook' },
        { field: 'campaign_id', operator: 'contains', value: '' }
      ],
      actions: [
        {
          type: 'create_deal',
          params: {
            stage: 'new',
            source: 'Meta Ads'
          }
        }
      ]
    }
  ],
  trigger: [
    {
      name: 'Low ROI Alert',
      conditions: [
        { field: 'roi', operator: '<', value: 2 },
        { field: 'spend', operator: '>', value: 100 }
      ],
      actions: [
        {
          type: 'create_notification',
          params: {
            title: 'Low ROI Alert',
            message: 'Campaign {campaign_name} has ROI below target'
          }
        }
      ]
    },
    {
      name: 'High Spend Alert',
      conditions: [
        { field: 'spend', operator: '>', value: 1000 }
      ],
      actions: [
        {
          type: 'create_notification',
          params: {
            title: 'High Spend Alert',
            message: 'Campaign {campaign_name} has exceeded spend threshold'
          }
        },
        {
          type: 'update_campaign',
          params: {
            status: 'PAUSED'
          }
        }
      ]
    }
  ],
  workflow: [
    {
      name: 'Deal Stage Update',
      conditions: [
        { field: 'deal_amount', operator: '>', value: 5000 }
      ],
      actions: [
        {
          type: 'update_deal',
          params: {
            stage: 'qualified'
          }
        }
      ]
    }
  ],
  sync: [
    {
      name: 'Hourly Campaign Sync',
      conditions: [
        { field: 'last_sync', operator: '>', value: 3600 }
      ],
      actions: [
        {
          type: 'sync_campaigns',
          params: {
            includeInsights: true
          }
        }
      ]
    }
  ]
}; 