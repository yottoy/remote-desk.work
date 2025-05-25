import { MailerLiteClient } from './client';
import { Campaign } from './types';

export class MailerLiteCampaigns {
  private client: MailerLiteClient;
  private groupId: string;

  constructor(client: MailerLiteClient, groupId: string) {
    this.client = client;
    this.groupId = groupId;
  }

  async createCampaign(campaign: Omit<Campaign, 'id'>): Promise<Campaign> {
    const response = await this.client.post<Campaign>('/campaigns', {
      name: campaign.name,
      type: 'regular',
      emails: [{
        subject: campaign.subject,
        from_name: 'ClickClickJob',
        from: 'hi@clickclickjob.com',
        content: campaign.content
      }],
      groups: [this.groupId],
    });
    return response;
  }

  async updateCampaign(id: string, data: Partial<Campaign>): Promise<Campaign> {
    const response = await this.client.put<Campaign>(`/campaigns/${id}`, data);
    return response;
  }

  async getCampaign(id: string): Promise<Campaign> {
    const response = await this.client.get<Campaign>(`/campaigns/${id}`);
    return response;
  }

  async deleteCampaign(id: string): Promise<void> {
    await this.client.delete(`/campaigns/${id}`);
  }

  async sendCampaign(id: string, scheduledAt?: string): Promise<Campaign> {
    const response = await this.client.post<Campaign>(`/campaigns/${id}/send`, {
      scheduled_at: scheduledAt,
    });
    return response;
  }

  async getCampaignStats(id: string): Promise<{
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  }> {
    const response = await this.client.get<{
      sent: number;
      opened: number;
      clicked: number;
      bounced: number;
      unsubscribed: number;
    }>(`/campaigns/${id}/stats`);
    return response;
  }

  async createWeeklyDigest(
    name: string,
    subject: string,
    content: string,
    scheduledAt?: string
  ): Promise<Campaign> {
    const campaign = await this.createCampaign({
      name,
      subject,
      content,
      status: 'draft',
    });

    if (scheduledAt) {
      return this.sendCampaign(campaign.id, scheduledAt);
    }

    return campaign;
  }
} 