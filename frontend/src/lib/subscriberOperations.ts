import { Subscriber, ISubscriber } from '../models/Subscriber';
import { JobDigest, IJobDigest } from '../models/JobDigest';
import connectDB from './db';

export async function addSubscriber(email: string, source: { type: string; url?: string; campaign?: string }) {
  await connectDB();
  
  const existingSubscriber = await Subscriber.findOne({ email });
  if (existingSubscriber) {
    if (existingSubscriber.status === 'inactive') {
      existingSubscriber.status = 'active';
      existingSubscriber.source = source;
      await existingSubscriber.save();
      return existingSubscriber;
    }
    throw new Error('Subscriber already exists');
  }

  const subscriber = new Subscriber({
    email,
    source,
    preferences: {
      jobTypes: [],
      frequency: 'weekly'
    }
  });

  await subscriber.save();
  return subscriber;
}

export async function unsubscribe(token: string) {
  await connectDB();
  
  const subscriber = await Subscriber.findOne({ unsubscribeToken: token });
  if (!subscriber) {
    throw new Error('Invalid unsubscribe token');
  }

  subscriber.status = 'inactive';
  await subscriber.save();
  return subscriber;
}

export async function getActiveSubscribers(frequency: 'daily' | 'weekly') {
  await connectDB();
  
  return Subscriber.find({
    status: 'active',
    'preferences.frequency': frequency
  }).lean();
}

export async function createJobDigest(jobs: Array<{ jobId: string; title: string; company: string; url: string }>) {
  await connectDB();
  
  const digest = new JobDigest({
    digestDate: new Date(),
    jobs,
    status: 'pending'
  });

  await digest.save();
  return digest;
}

export async function updateDigestStatus(digestId: string, status: 'sent' | 'failed', recipientCount?: number, error?: string) {
  await connectDB();
  
  const digest = await JobDigest.findById(digestId);
  if (!digest) {
    throw new Error('Digest not found');
  }

  digest.status = status;
  if (status === 'sent') {
    digest.sentAt = new Date();
    digest.recipientCount = recipientCount || 0;
  } else if (status === 'failed') {
    digest.error = error;
  }

  await digest.save();
  return digest;
}

export async function getPendingDigests() {
  await connectDB();
  
  return JobDigest.find({
    status: 'pending'
  }).sort({ digestDate: 1 }).lean();
}

export async function updateSubscriberPreferences(email: string, preferences: Partial<ISubscriber['preferences']>) {
  await connectDB();
  
  const subscriber = await Subscriber.findOne({ email });
  if (!subscriber) {
    throw new Error('Subscriber not found');
  }

  subscriber.preferences = {
    ...subscriber.preferences,
    ...preferences
  };

  await subscriber.save();
  return subscriber;
} 