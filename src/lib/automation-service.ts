import { prisma } from '@/lib/prisma';

interface AutomationCondition {
  field: string;
  operator: string;
  value: any;
}

interface AutomationAction {
  type: string;
  params: Record<string, any>;
}

export async function executeMatchingRules(userId: string) {
  try {
    const rules = await prisma.automationRule.findMany({
      where: {
        userId,
        type: 'matching',
        status: 'active'
      }
    });

    for (const rule of rules) {
      try {
        // Get Meta campaigns
        const campaigns = await prisma.campaign.findMany({
          where: { userId },
          include: {
            analytics: {
              orderBy: { date: 'desc' },
              take: 1
            }
          }
        });

        // Get HubSpot deals
        const hubspotAccount = await prisma.hubspotAccount.findFirst({
          where: { userId, status: 'active' }
        });

        if (!hubspotAccount) continue;

        const deals = await prisma.hubspotDeal.findMany({
          where: { hubspotAccountId: hubspotAccount.id }
        });

        // Execute matching logic
        for (const campaign of campaigns) {
          const conditions = rule.conditions as AutomationCondition[];
          const actions = rule.actions as AutomationAction[];

          // Check conditions
          const matchesConditions = conditions.every(condition => {
            switch (condition.field) {
              case 'utm_source':
                return condition.value === 'facebook';
              case 'campaign_id':
                return campaign.campaignId === condition.value;
              default:
                return false;
            }
          });

          if (matchesConditions) {
            // Execute actions
            for (const action of actions) {
              switch (action.type) {
                case 'create_deal':
                  await prisma.hubspotDeal.create({
                    data: {
                      hubspotId: `meta_${campaign.campaignId}`,
                      name: `Deal from ${campaign.name}`,
                      stage: 'new',
                      amount: campaign.analytics[0]?.metrics.spend || 0,
                      properties: {
                        utm_source: 'facebook',
                        utm_campaign: campaign.campaignId
                      },
                      hubspotAccountId: hubspotAccount.id
                    }
                  });
                  break;
                case 'update_deal':
                  // Find matching deal
                  const deal = deals.find(d => {
                    const props = d.properties as any;
                    return props?.utm_campaign === campaign.campaignId;
                  });

                  if (deal) {
                    await prisma.hubspotDeal.update({
                      where: { id: deal.id },
                      data: {
                        amount: campaign.analytics[0]?.metrics.spend || 0,
                        properties: {
                          ...(deal.properties as object),
                          campaign_status: campaign.status,
                          last_sync: new Date().toISOString()
                        }
                      }
                    });
                  }
                  break;
              }
            }
          }
        }

        // Update rule execution time
        await prisma.automationRule.update({
          where: { id: rule.id },
          data: {
            lastRun: new Date(),
            nextRun: new Date(Date.now() + 3600000), // Run again in 1 hour
            logs: {
              create: {
                status: 'success',
                message: 'Rule executed successfully'
              }
            }
          }
        });
      } catch (error) {
        // Log rule execution error
        await prisma.automationLog.create({
          data: {
            ruleId: rule.id,
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: error instanceof Error ? { stack: error.stack } : {}
          }
        });
      }
    }
  } catch (error) {
    console.error('Error executing matching rules:', error);
    throw error;
  }
}

export async function executeTriggerRules(userId: string) {
  try {
    const rules = await prisma.automationRule.findMany({
      where: {
        userId,
        type: 'trigger',
        status: 'active'
      }
    });

    for (const rule of rules) {
      try {
        // Get campaigns with analytics
        const campaigns = await prisma.campaign.findMany({
          where: { userId },
          include: {
            analytics: {
              orderBy: { date: 'desc' },
              take: 1
            }
          }
        });

        // Execute trigger logic
        for (const campaign of campaigns) {
          const conditions = rule.conditions as AutomationCondition[];
          const actions = rule.actions as AutomationAction[];

          // Check conditions
          const matchesConditions = conditions.every(condition => {
            const metrics = campaign.analytics[0]?.metrics || {};
            const spend = metrics.spend || 0;
            const revenue = metrics.revenue || 0;
            const roi = spend > 0 ? ((revenue - spend) / spend) * 100 : 0;

            switch (condition.field) {
              case 'roi':
                return evaluateNumericCondition(roi, condition.operator, condition.value);
              case 'spend':
                return evaluateNumericCondition(spend, condition.operator, condition.value);
              default:
                return false;
            }
          });

          if (matchesConditions) {
            // Execute actions
            for (const action of actions) {
              switch (action.type) {
                case 'create_notification':
                  await prisma.notification.create({
                    data: {
                      userId,
                      title: action.params.title,
                      message: action.params.message.replace('{campaign_name}', campaign.name),
                      type: 'alert',
                      category: 'automation',
                      actionUrl: `/campaigns/${campaign.id}`
                    }
                  });
                  break;
                case 'update_campaign':
                  await prisma.campaign.update({
                    where: { id: campaign.id },
                    data: {
                      status: action.params.status,
                      lastUpdated: new Date()
                    }
                  });
                  break;
              }
            }
          }
        }

        // Update rule execution time
        await prisma.automationRule.update({
          where: { id: rule.id },
          data: {
            lastRun: new Date(),
            nextRun: new Date(Date.now() + 3600000), // Run again in 1 hour
            logs: {
              create: {
                status: 'success',
                message: 'Rule executed successfully'
              }
            }
          }
        });
      } catch (error) {
        // Log rule execution error
        await prisma.automationLog.create({
          data: {
            ruleId: rule.id,
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: error instanceof Error ? { stack: error.stack } : {}
          }
        });
      }
    }
  } catch (error) {
    console.error('Error executing trigger rules:', error);
    throw error;
  }
}

function evaluateNumericCondition(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case '<':
      return value < threshold;
    case '<=':
      return value <= threshold;
    case '>':
      return value > threshold;
    case '>=':
      return value >= threshold;
    case '==':
      return value === threshold;
    default:
      return false;
  }
} 