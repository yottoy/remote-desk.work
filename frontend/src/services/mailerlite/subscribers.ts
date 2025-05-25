import { MailerLiteClient } from './client';
import { Subscriber, BatchOperation } from './types';

export class MailerLiteSubscribers {
  private client: MailerLiteClient;
  private groupId: string;

  constructor(client: MailerLiteClient, groupId: string) {
    this.client = client;
    this.groupId = groupId;
  }

  async addSubscriber(subscriber: Subscriber): Promise<Subscriber> {
    const response = await this.client.post<Subscriber>('/subscribers', {
      email: subscriber.email,
      name: subscriber.name,
      fields: subscriber.fields,
      groups: [this.groupId],
    });
    return response;
  }

  async updateSubscriber(email: string, data: Partial<Subscriber>): Promise<Subscriber> {
    const response = await this.client.put<Subscriber>(`/subscribers/${email}`, {
      ...data,
      groups: [this.groupId],
    });
    return response;
  }

  async removeSubscriber(email: string): Promise<void> {
    await this.client.delete(`/subscribers/${email}`);
  }

  async getSubscriber(email: string): Promise<Subscriber> {
    const response = await this.client.get<Subscriber>(`/subscribers/${email}`);
    return response;
  }

  async batchProcess(operations: BatchOperation[]): Promise<void> {
    const batchSize = 100; // MailerLite's recommended batch size
    const batches = this.chunkArray(operations, batchSize);

    for (const batch of batches) {
      const batchPromises = batch.map(async (operation) => {
        switch (operation.operation) {
          case 'create':
            return Promise.all(
              operation.subscribers.map((subscriber) => this.addSubscriber(subscriber))
            );
          case 'update':
            return Promise.all(
              operation.subscribers.map((subscriber) =>
                this.updateSubscriber(subscriber.email, subscriber)
              )
            );
          case 'delete':
            return Promise.all(
              operation.subscribers.map((subscriber) => this.removeSubscriber(subscriber.email))
            );
        }
      });

      await Promise.all(batchPromises);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
} 