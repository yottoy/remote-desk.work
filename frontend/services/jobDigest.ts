import { MailerLite } from './mailerlite';
import { mailerLiteConfig } from '../config/mailerlite';
import { format } from 'date-fns';

interface Job {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
}

export class JobDigestService {
  private mailerLite: MailerLite;

  constructor() {
    this.mailerLite = new MailerLite(mailerLiteConfig);
  }

  private generateEmailContent(jobs: Job[]): string {
    const date = format(new Date(), 'MMMM d, yyyy');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Weekly Job Digest</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .job { margin-bottom: 25px; padding: 15px; border: 1px solid #eee; border-radius: 5px; }
            .job-title { color: #2563eb; font-size: 18px; margin-bottom: 5px; }
            .job-company { color: #4b5563; font-size: 16px; margin-bottom: 10px; }
            .job-location { color: #6b7280; font-size: 14px; margin-bottom: 10px; }
            .job-description { margin-bottom: 15px; }
            .job-link { display: inline-block; padding: 8px 16px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Weekly Job Digest</h1>
              <p>${date}</p>
            </div>
            
            ${jobs.map(job => `
              <div class="job">
                <h2 class="job-title">${job.title}</h2>
                <p class="job-company">${job.company}</p>
                <p class="job-location">${job.location}</p>
                <div class="job-description">${job.description}</div>
                <a href="${job.url}" class="job-link">View Job</a>
              </div>
            `).join('')}
            
            <div class="footer">
              <p>You're receiving this email because you subscribed to our weekly job digest.</p>
              <p><a href="{{unsubscribe}}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async sendWeeklyDigest(jobs: Job[], scheduledAt?: string): Promise<void> {
    const subject = `New Jobs This Week - ${format(new Date(), 'MMMM d, yyyy')}`;
    const content = this.generateEmailContent(jobs);

    await this.mailerLite.campaigns.createWeeklyDigest(
      'Weekly Job Digest',
      subject,
      content,
      scheduledAt
    );
  }

  async addSubscriber(email: string, name?: string): Promise<void> {
    await this.mailerLite.subscribers.addSubscriber({
      email,
      name,
      fields: {
        subscribed_at: new Date().toISOString(),
      },
    });
  }

  async removeSubscriber(email: string): Promise<void> {
    await this.mailerLite.subscribers.removeSubscriber(email);
  }
} 