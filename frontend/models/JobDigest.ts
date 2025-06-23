import mongoose, { Schema, Document } from 'mongoose';

export interface IJobDigest extends Document {
  digestDate: Date;
  jobs: Array<{
    jobId: string;
    title: string;
    company: string;
    url: string;
  }>;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: Date;
  recipientCount: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobDigestSchema = new Schema<IJobDigest>(
  {
    digestDate: {
      type: Date,
      required: true,
      index: true
    },
    jobs: [{
      jobId: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      company: {
        type: String,
        required: true
      },
      url: {
        type: String,
        required: true
      }
    }],
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
      required: true
    },
    sentAt: Date,
    recipientCount: {
      type: Number,
      default: 0,
      min: 0
    },
    error: String
  },
  {
    timestamps: true
  }
);

// Create indexes
JobDigestSchema.index({ digestDate: 1, status: 1 });
JobDigestSchema.index({ 'jobs.jobId': 1 });

export const JobDigest = mongoose.models.JobDigest || mongoose.model<IJobDigest>('JobDigest', JobDigestSchema); 