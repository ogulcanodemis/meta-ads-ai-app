import { prisma } from '@/lib/prisma';
import type {
  HubspotApiError,
  HubspotContact,
  HubspotDeal,
  HubspotContactsResponse,
  HubspotDealsResponse,
} from '@/types/hubspot';

const HUBSPOT_API_URL = 'https://api.hubapi.com';

async function fetchHubspotApi<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`${HUBSPOT_API_URL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = 'HubSpot API Error';
      try {
        const error = await response.json() as HubspotApiError;
        errorMessage = error.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data) {
      throw new Error('Invalid response from HubSpot API');
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while fetching from HubSpot API');
  }
}

async function getOAuthAccessToken(clientSecret: string): Promise<string> {
  try {
    const response = await fetch(`${HUBSPOT_API_URL}/oauth/v1/access-tokens/${clientSecret}`);
    if (!response.ok) {
      throw new Error('Failed to get OAuth access token');
    }
    const data = await response.json();
    if (!data?.access_token) {
      throw new Error('Invalid OAuth response: No access token found');
    }
    return data.access_token;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to authenticate with HubSpot: ${error.message}`);
    }
    throw new Error('Failed to authenticate with HubSpot');
  }
}

export async function fetchContacts(userId: string): Promise<HubspotContactsResponse> {
  try {
    const account = await prisma.hubspotAccount.findFirst({
      where: { 
        userId,
        status: 'active'
      }
    });

    if (!account) {
      throw new Error('HubSpot account not found');
    }

    let token;
    if (account.authType === 'private') {
      token = account.privateKey;
    } else {
      if (!account.clientSecret) {
        throw new Error('No client secret found for OAuth authentication');
      }
      token = await getOAuthAccessToken(account.clientSecret);
    }

    if (!token) {
      throw new Error('No valid authentication token found');
    }
    
    const response = await fetchHubspotApi<HubspotContactsResponse>(
      '/crm/v3/objects/contacts?properties=email,firstname,lastname,phone,company,jobtitle,lifecyclestage&limit=100',
      token
    );

    if (!response?.results) {
      throw new Error('Invalid response format from HubSpot API');
    }

    // Store contacts in database
    const contacts = response.results;
    for (const contact of contacts) {
      await prisma.hubspotContact.upsert({
        where: {
          hubspotAccountId_hubspotId: {
            hubspotAccountId: account.id,
            hubspotId: contact.id,
          },
        },
        create: {
          hubspotId: contact.id,
          email: contact.properties.email || '',
          firstName: contact.properties.firstname,
          lastName: contact.properties.lastname,
          phone: contact.properties.phone,
          company: contact.properties.company,
          jobTitle: contact.properties.jobtitle,
          lifecycle_stage: contact.properties.lifecyclestage,
          properties: contact.properties,
          lastSyncedAt: new Date(),
          hubspotAccount: {
            connect: {
              id: account.id
            }
          }
        },
        update: {
          email: contact.properties.email || '',
          firstName: contact.properties.firstname,
          lastName: contact.properties.lastname,
          phone: contact.properties.phone,
          company: contact.properties.company,
          jobTitle: contact.properties.jobtitle,
          lifecycle_stage: contact.properties.lifecyclestage,
          properties: contact.properties,
          lastSyncedAt: new Date(),
        },
      });
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch contacts: ${error.message}`);
    }
    throw new Error('Failed to fetch contacts');
  }
}

export async function fetchDeals(userId: string): Promise<HubspotDealsResponse> {
  try {
    const account = await prisma.hubspotAccount.findFirst({
      where: { 
        userId,
        status: 'active'
      }
    });

    if (!account) {
      throw new Error('HubSpot account not found');
    }

    let token;
    if (account.authType === 'private') {
      token = account.privateKey;
    } else {
      if (!account.clientSecret) {
        throw new Error('No client secret found for OAuth authentication');
      }
      token = await getOAuthAccessToken(account.clientSecret);
    }

    if (!token) {
      throw new Error('No valid authentication token found');
    }
    
    const response = await fetchHubspotApi<HubspotDealsResponse>(
      '/crm/v3/objects/deals?properties=dealname,dealstage,amount,closedate,pipeline&associations=contacts&limit=100',
      token
    );

    if (!response?.results) {
      throw new Error('Invalid response format from HubSpot API');
    }

    // Store deals in database
    const deals = response.results;
    for (const deal of deals) {
      await prisma.hubspotDeal.upsert({
        where: {
          hubspotAccountId_hubspotId: {
            hubspotAccountId: account.id,
            hubspotId: deal.id,
          },
        },
        create: {
          hubspotId: deal.id,
          name: deal.properties.dealname,
          stage: deal.properties.dealstage,
          amount: deal.properties.amount ? parseFloat(deal.properties.amount) : null,
          closeDate: deal.properties.closedate ? new Date(deal.properties.closedate) : null,
          pipeline: deal.properties.pipeline,
          properties: deal.properties,
          hubspotAccountId: account.id,
          lastSyncedAt: new Date(),
        },
        update: {
          name: deal.properties.dealname,
          stage: deal.properties.dealstage,
          amount: deal.properties.amount ? parseFloat(deal.properties.amount) : null,
          closeDate: deal.properties.closedate ? new Date(deal.properties.closedate) : null,
          pipeline: deal.properties.pipeline,
          properties: deal.properties,
          lastSyncedAt: new Date(),
        },
      });
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch deals: ${error.message}`);
    }
    throw new Error('Failed to fetch deals');
  }
}

export async function validateHubspotToken(
  token: string,
  authType: 'oauth' | 'private'
): Promise<boolean> {
  try {
    const endpoint = authType === 'private'
      ? '/crm/v3/objects/contacts?limit=1'
      : '/oauth/v1/access-tokens/';

    const response = await fetch(`${HUBSPOT_API_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function syncHubspotData(userId: string) {
  try {
    const account = await prisma.hubspotAccount.findFirst({
      where: { 
        userId,
        status: 'active'
      }
    });

    if (!account) {
      throw new Error('HubSpot account not found');
    }

    const [contacts, deals] = await Promise.all([
      fetchContacts(userId),
      fetchDeals(userId)
    ]);

    // Update last sync time
    await prisma.hubspotAccount.update({
      where: { id: account.id },
      data: { lastSyncedAt: new Date() },
    });

    return {
      contacts: contacts?.results || [],
      deals: deals?.results || [],
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to sync HubSpot data: ${error.message}`);
    }
    throw new Error('Failed to sync HubSpot data');
  }
} 