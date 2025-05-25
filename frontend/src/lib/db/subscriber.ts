import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';
import { Subscriber } from '@/types/subscriber';

export interface SubscriberDocument extends Subscriber, Document {}

const subscriberSchema = new Schema<SubscriberDocument>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address']
  },
  source: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed'],
    default: 'active'
  },
  unsubscribeToken: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate unsubscribe token before saving
subscriberSchema.pre('save', function(next) {
  if (this.isNew) {
    this.unsubscribeToken = crypto.randomBytes(32).toString('hex');
  }
  this.updatedAt = new Date();
  next();
});

// Static method to find by unsubscribe token
subscriberSchema.statics.findByUnsubscribeToken = function(token: string) {
  return this.findOne({ unsubscribeToken: token });
};

// Static method to check if email exists
subscriberSchema.statics.emailExists = function(email: string) {
  return this.exists({ email: email.toLowerCase() });
};

// Create indexes
subscriberSchema.index({ email: 1 }, { unique: true });
subscriberSchema.index({ unsubscribeToken: 1 }, { unique: true });
subscriberSchema.index({ status: 1 });

export const SubscriberModel = mongoose.models.Subscriber || mongoose.model<SubscriberDocument>('Subscriber', subscriberSchema); 