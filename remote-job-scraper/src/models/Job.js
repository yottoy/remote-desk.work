const mongoose = require('mongoose');
const config = require('../../config/config');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    index: true
  },
  company: {
    type: String,
    required: true,
    index: true
  },
  location: {
    type: String,
    default: 'Remote'
  },
  description: {
    type: String,
    required: true
  },
  descriptionText: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
  salary: {
    type: String
  },
  postedDate: {
    type: Date,
    index: true
  },
  scrapedDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    default: () => {
      const date = new Date();
      date.setDate(date.getDate() + config.database.ttlDays);
      return date;
    },
    index: true
  },
  source: {
    type: String,
    required: true,
    index: true
  },
  sourceId: {
    type: String,
    sparse: true
  },
  qualityScore: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
    index: true
  },
  relevanceScore: {
    type: Number,
    min: 0,
    max: 10
  },
  qualityIndicatorScore: {
    type: Number,
    min: 0,
    max: 10
  },
  credibilityScore: {
    type: Number,
    min: 0,
    max: 10
  },
  recencyScore: {
    type: Number,
    min: 0,
    max: 10
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  tags: {
    type: [String],
    index: true
  },
  // Composite unique index for deduplication
  uniqueIdentifier: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

// Create compound index for efficient deduplication
jobSchema.index({ company: 1, title: 1, source: 1 });

// Create TTL index for automatic expiration
jobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create text index for search functionality
jobSchema.index({ title: 'text', company: 'text', descriptionText: 'text' });

// Pre-save hook to generate uniqueIdentifier for deduplication
jobSchema.pre('save', function(next) {
  if (!this.uniqueIdentifier) {
    // Create a unique identifier based on normalized title and company
    const normalizedTitle = this.title.toLowerCase().trim();
    const normalizedCompany = this.company.toLowerCase().trim();
    this.uniqueIdentifier = `${normalizedCompany}-${normalizedTitle}`;
  }
  next();
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job; 