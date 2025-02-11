export interface HubspotContact {
  id: string;
  properties: {
    email: string;
    firstname?: string;
    lastname?: string;
    phone?: string;
    company?: string;
    jobtitle?: string;
    lifecyclestage?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HubspotDeal {
  id: string;
  properties: {
    dealname: string;
    dealstage: string;
    amount?: string;
    closedate?: string;
    pipeline?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HubspotApiError {
  status: string;
  message: string;
  correlationId: string;
  category: string;
}

export interface HubspotAccount {
  id: string;
  name?: string;
  accountId: string;
  accessToken?: string;
  privateKey?: string;
  authType: 'oauth' | 'private';
  status: 'active' | 'inactive';
  permissions: string[];
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HubspotContactsResponse {
  results: HubspotContact[];
  paging?: {
    next?: {
      after: string;
      link: string;
    };
  };
  total: number;
}

export interface HubspotDealsResponse {
  results: HubspotDeal[];
  paging?: {
    next?: {
      after: string;
      link: string;
    };
  };
  total: number;
} 