import { prisma } from '@/lib/prisma';

interface HubspotApiError {
  status: string;
  message: string;
  correlationId: string;
  category: string;
}

export async function fetchContacts(userId: string) {
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

    const token = account.authType === 'private' ? account.privateKey : account.accessToken;
    
    const response = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = (await response.json()) as HubspotApiError;
      throw new Error(`HubSpot API Error: ${error.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
}

export async function fetchDeals(userId: string) {
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

    const token = account.authType === 'private' ? account.privateKey : account.accessToken;
    
    const response = await fetch(
      'https://api.hubapi.com/crm/v3/objects/deals',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = (await response.json()) as HubspotApiError;
      throw new Error(`HubSpot API Error: ${error.message}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching deals:', error);
    throw error;
  }
}

export async function validateHubspotToken(token: string, authType: 'oauth' | 'private'): Promise<boolean> {
  try {
    const endpoint = authType === 'private'
      ? 'https://api.hubapi.com/crm/v3/objects/contacts'
      : 'https://api.hubapi.com/oauth/v1/access-tokens/';

    const response = await fetch(endpoint, {
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
    contacts,
    deals
  };
} 