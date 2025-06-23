import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface ISubscriber extends Document {
  email: string;
  subscriptionDate: Date;
  status: 'active' | 'inactive';
  unsubscribeToken: string;
  preferences: {
    jobTypes: string[];
    frequency: 'daily' | 'weekly';
    maxDistance?: number;
  };
  source: {
    type: 'landing_page' | 'popup' | 'api';
    url?: string;
    campaign?: string;
  };
  lastEmailSent?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriberSchema = new Schema<ISubscriber>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: props => `${props.value} is not a valid email address!`
      }
    },
    subscriptionDate: {
      type: Date,
      default: Date.now,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      required: true
    },
    unsubscribeToken: {
      type: String,
      required: true,
      unique: true
    },
    preferences: {
      jobTypes: [{
        type: String,
        enum: ['data_entry', 'virtual_assistant', 'customer_service', 'executive_assistant']
      }],
      frequency: {
        type: String,
        enum: ['daily', 'weekly'],
        default: 'weekly'
      },
      maxDistance: {
        type: Number,
        min: 0,
        max: 100
      }
    },
    source: {
      type: {
        type: String,
        enum: ['landing_page', 'popup', 'api'],
        required: true
      },
      url: String,
      campaign: String
    },
    lastEmailSent: Date
  },
  {
    timestamps: true
  }
);

// Generate unsubscribe token before saving
SubscriberSchema.pre('save', function(next) {
  if (!this.unsubscribeToken) {
    this.unsubscribeToken = crypto.randomBytes(32).toString('hex');
  }
  next();
});

// Create indexes
SubscriberSchema.index({ email: 1 }, { unique: true });
SubscriberSchema.index({ unsubscribeToken: 1 }, { unique: true });
SubscriberSchema.index({ status: 1, lastEmailSent: 1 });
SubscriberSchema.index({ 'preferences.frequency': 1, status: 1 });

export const Subscriber = mongoose.models.Subscriber || mongoose.model<ISubscriber>('Subscriber', SubscriberSchema); 