import { NextResponse } from 'next/server';
import { authenticateTokenWithPrisma } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fetchHubspotApi } from '@/lib/hubspot-api';

export async function POST(request: Request) {
  try {
    const user = await authenticateTokenWithPrisma(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get HubSpot account
    const hubspotAccount = await prisma.hubspotAccount.findFirst({
      where: {
        userId: user.id,
        status: 'active'
      }
    });

    if (!hubspotAccount) {
      throw new Error('No active HubSpot account found');
    }

    // Get request body
    const body = await request.json();
    const { contactIds, subject, content } = body;

    if (!contactIds?.length || !subject || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get contacts from database
    const contacts = await prisma.hubspotContact.findMany({
      where: {
        id: { in: contactIds },
        hubspotAccountId: hubspotAccount.id
      }
    });

    if (!contacts.length) {
      throw new Error('No valid contacts found');
    }

    let token;
    if (hubspotAccount.authType === 'private') {
      token = hubspotAccount.privateKey;
    } else {
      if (!hubspotAccount.clientSecret) {
        throw new Error('No client secret found for OAuth authentication');
      }
      token = hubspotAccount.clientSecret;
    }

    // Create email campaign in HubSpot
    const campaignResponse = await fetchHubspotApi(
      '/marketing/v3/transactional/single-email/send',
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          emailId: null, // For custom email content
          message: {
            to: contacts.map(contact => contact.email),
            subject: subject,
            html: content,
            from: {
              email: user.email // Use authenticated user's email
            }
          },
          contactProperties: {
            // Optional: Update contact properties after sending email
            last_email_sent: new Date().toISOString()
          },
          customProperties: {
            // Optional: Add custom tracking properties
            campaign_source: 'meta-ads-ai-app',
            campaign_medium: 'bulk-email'
          }
        })
      }
    );

    // Log the email activity
    await prisma.activity.create({
      data: {
        type: 'EMAIL_SENT',
        description: `Bulk email sent to ${contacts.length} contacts`,
        metadata: {
          subject,
          recipientCount: contacts.length,
          campaignId: campaignResponse.id
        },
        userId: user.id
      }
    });

    return NextResponse.json({
      message: `Email sent successfully to ${contacts.length} contacts`,
      success: true
    });
  } catch (error) {
    console.error('Error sending bulk email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 