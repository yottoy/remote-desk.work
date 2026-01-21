# Scraper Configuration Guide for New SEO Pages

**Created:** January 19, 2026  
**Purpose:** Configure scrapers to populate the 6 new SEO-optimized pages with relevant job listings

---

## Overview

This document outlines all search queries needed to populate the newly created SEO pages. These queries should be added to your job scraping configuration to ensure each page has fresh, relevant job listings.

**Target:** Minimum 10-15 jobs per specialized page, 30-50 for main hubs

---

## 1. MEDICAL DATA ENTRY JOBS

**Page:** `/medical-data-entry-jobs`  
**Target Volume:** 10-15 jobs minimum  
**Priority:** High (KD 17 - easy win)

### Search Queries:
```
medical data entry remote
healthcare data entry remote
medical data entry work from home
medical billing data entry
patient records data entry remote
medical records data entry
healthcare data entry jobs
medical office data entry remote
HIPAA data entry remote
clinical data entry remote
medical coding data entry
health information data entry
medical transcription data entry
EMR data entry remote
EHR data entry remote
```

### Filtering Keywords:
**Include:** medical, healthcare, health, patient, clinical, hospital, HIPAA, billing, records, EMR, EHR  
**Exclude:** on-site, in-office, local only

### Minimum Job Requirements:
- Must mention "remote" or "work from home"
- Must include medical/healthcare context
- Should specify data entry responsibilities

---

## 2. ENTRY LEVEL DATA ANALYST JOBS

**Page:** `/entry-level-data-analyst-jobs`  
**Target Volume:** 10-15 jobs minimum  
**Priority:** High (KD 16 - easy win)

### Search Queries:
```
entry level data analyst remote
junior data analyst remote
data analyst no experience remote
associate data analyst remote
data analyst remote entry level
beginner data analyst jobs remote
entry level data analyst work from home
junior data analyst work from home
data analyst trainee remote
data analyst intern remote
remote data analyst entry
entry level business analyst remote
junior business intelligence analyst
data analyst remote no experience
graduate data analyst remote
```

### Filtering Keywords:
**Include:** entry level, junior, no experience, associate, trainee, intern, graduate, beginner  
**Exclude:** senior, lead, principal, manager, 5+ years, experienced

### Minimum Job Requirements:
- Must mention "remote" or "work from home"
- Should specify entry-level or junior level
- Must include data analysis responsibilities

---

## 3. REMOTE DATA ENTRY JOBS (MAIN HUB)

**Page:** `/remote-data-entry-jobs`  
**Target Volume:** 30-50 jobs minimum  
**Priority:** Critical (KD 46, 49,500 volume - highest traffic potential)

### Search Queries:
```
remote data entry
data entry remote
work from home data entry
data entry work from home
online data entry
data entry clerk remote
virtual data entry
data entry operator remote
data entry specialist remote
remote data entry jobs
part time data entry remote
full time data entry remote
entry level data entry remote
data entry no experience remote
data entry jobs remote
data processing remote
data input remote
data entry typist remote
online data entry jobs
legitimate data entry remote
```

### Sub-Category Queries:
```
# Entry Level
entry level data entry remote
data entry no experience needed
beginner data entry remote

# Part Time
part time data entry remote
flexible data entry work from home
evening data entry remote

# Industry Specific
legal data entry remote
financial data entry remote
administrative data entry remote
```

### Filtering Keywords:
**Include:** remote, work from home, virtual, online, WFH, telecommute  
**Exclude:** scam, pay to work, MLM, investment required

### Quality Filters:
- Company name must be present
- Description minimum 100 characters
- No payment requests in job description
- Legitimate contact information

---

## 4. CUSTOMER SERVICE WORK FROM HOME JOBS

**Page:** `/customer-service-work-from-home-jobs`  
**Target Volume:** 20-30 jobs minimum  
**Priority:** High (KD 41, 8,100 volume)

### Search Queries:
```
customer service remote
customer service work from home
customer service representative remote
remote customer service
customer support remote
customer service agent remote
live chat support remote
chat support remote
phone customer service remote
call center remote
customer service rep work from home
customer support work from home
help desk remote
technical support remote
customer success remote
customer care remote
client services remote
customer service specialist remote
remote call center
work from home customer service
customer service advisor remote
customer support specialist remote
```

### Sub-Category Queries:
```
# Entry Level
entry level customer service remote
no experience customer service remote
customer service trainee remote

# Chat Support
live chat agent remote
chat support specialist
online chat support remote
text support remote

# Part Time
part time customer service remote
weekend customer service remote
evening customer service remote
flexible customer service work from home

# Technical
technical support remote
help desk support remote
IT support remote
```

### Filtering Keywords:
**Include:** remote, work from home, WFH, virtual, home-based  
**Exclude:** on-site required, in-office, commute

---

## 5. ONLINE TUTORING JOBS FOR COLLEGE STUDENTS

**Page:** `/online-tutoring-jobs-college-students`  
**Target Volume:** 10-15 jobs minimum  
**Priority:** Medium (KD 30, 3,600 volume)

### Search Queries:
```
online tutor remote
online tutoring jobs
ESL teaching online
teach English online
online teacher remote
remote tutor
virtual tutor
online ESL tutor
online teaching jobs
remote teaching jobs
homework help tutor remote
test prep tutor online
online math tutor
online science tutor
SAT tutor remote
ACT tutor remote
college tutor online
tutoring jobs remote
online instructor
VIPKid tutor
Cambly tutor
Chegg tutor
Wyzant tutor
subject tutor remote
English tutor online
```

### Sub-Category Queries:
```
# ESL Teaching
ESL teacher remote
English as second language tutor
TEFL jobs online
TESOL jobs remote
conversational English tutor

# Subject Tutoring
math tutor online
science tutor remote
writing tutor online
test prep remote
homework helper online
```

### Filtering Keywords:
**Include:** online, remote, virtual, work from home, flexible  
**Student-friendly indicators:** part-time, flexible hours, college student welcome

---

## 6. REMOTE ADMINISTRATIVE ASSISTANT JOBS

**Page:** `/remote-administrative-assistant-jobs`  
**Target Volume:** 15-20 jobs minimum  
**Priority:** High (KD 31, 5,400 volume)

### Search Queries:
```
remote administrative assistant
administrative assistant remote
virtual administrative assistant
remote executive assistant
executive assistant remote
admin assistant work from home
administrative assistant work from home
virtual assistant remote
remote admin
office assistant remote
administrative coordinator remote
executive admin remote
personal assistant remote
administrative support remote
remote office administrator
virtual executive assistant
admin support remote
executive support remote
administrative specialist remote
```

### Sub-Category Queries:
```
# Executive Assistant
remote executive assistant
C-suite assistant remote
senior executive assistant remote
chief of staff remote

# Part Time
part time administrative assistant remote
part time admin remote
part time executive assistant remote
flexible admin assistant remote

# Medical Admin
medical administrative assistant remote
healthcare administrative assistant remote
medical office assistant remote
healthcare admin remote

# Industry Specific
legal administrative assistant remote
real estate administrative assistant remote
finance administrative assistant remote
```

### Filtering Keywords:
**Include:** remote, work from home, virtual, WFH, home-based  
**Experience levels:** entry level, mid-level, senior, executive

---

## SCRAPER IMPLEMENTATION INSTRUCTIONS

### For Job Boards (Indeed, LinkedIn, ZipRecruiter, etc.):

1. **Add Search Queries to Rotation:**
   - Rotate through all queries for each category
   - Run each category daily
   - Prioritize main hub queries (data entry, customer service, admin assistant)

2. **Job Deduplication:**
   - Use job title + company name as unique identifier
   - Check for duplicate job IDs from same source
   - Remove jobs older than 30 days

3. **Quality Filtering:**
   ```javascript
   function isQualityJob(job) {
     // Must have company name
     if (!job.company || job.company.length < 2) return false;
     
     // Must have sufficient description
     if (!job.description || job.description.length < 100) return false;
     
     // Must specify remote
     const remoteKeywords = ['remote', 'work from home', 'wfh', 'virtual', 'telecommute'];
     const hasRemote = remoteKeywords.some(keyword => 
       job.title.toLowerCase().includes(keyword) || 
       job.description.toLowerCase().includes(keyword)
     );
     if (!hasRemote) return false;
     
     // Exclude scams
     const scamKeywords = ['pay to work', 'investment required', 'buy starter kit', 'pay for training'];
     const hasScamIndicator = scamKeywords.some(keyword =>
       job.description.toLowerCase().includes(keyword)
     );
     if (hasScamIndicator) return false;
     
     return true;
   }
   ```

4. **Categorization Tags:**
   ```javascript
   function categorizeJob(job) {
     const text = `${job.title} ${job.description}`.toLowerCase();
     
     // Primary category
     let category = 'general';
     if (text.includes('data entry')) category = 'data-entry';
     if (text.includes('customer service') || text.includes('customer support')) category = 'customer-service';
     if (text.includes('administrative assistant') || text.includes('admin assistant')) category = 'admin';
     if (text.includes('tutor') || text.includes('teaching')) category = 'tutoring';
     if (text.includes('data analyst')) category = 'data-analyst';
     
     // Experience level
     let experienceLevel = 'mid-level';
     if (text.includes('entry level') || text.includes('no experience')) experienceLevel = 'entry-level';
     if (text.includes('senior') || text.includes('lead')) experienceLevel = 'senior';
     
     // Time commitment
     let timeCommitment = 'full-time';
     if (text.includes('part time') || text.includes('part-time')) timeCommitment = 'part-time';
     if (text.includes('contract') || text.includes('freelance')) timeCommitment = 'contract';
     
     // Specialization
     let specialization = null;
     if (text.includes('medical') || text.includes('healthcare')) specialization = 'medical';
     if (text.includes('legal')) specialization = 'legal';
     if (text.includes('executive')) specialization = 'executive';
     
     return { category, experienceLevel, timeCommitment, specialization };
   }
   ```

5. **Database Storage:**
   ```javascript
   {
     job_id: "unique_id",
     title: "Remote Data Entry Specialist",
     company: "ABC Corp",
     description: "Full job description...",
     category: "data-entry",
     experience_level: "entry-level",
     time_commitment: "full-time",
     specialization: null,
     location: "Remote - US",
     salary_range: "$15-18/hour",
     posted_date: "2026-01-19",
     expires_date: "2026-02-19",
     apply_url: "https://...",
     source: "indeed",
     remote_type: "fully_remote",
     tags: ["no_experience", "training_provided"],
     verified: true,
     created_at: "2026-01-19T12:00:00Z"
   }
   ```

---

## SCRAPER SCHEDULE

### Daily Scraping Schedule:
- **6:00 AM:** Medical data entry jobs (15 queries)
- **7:00 AM:** Data analyst jobs (15 queries)
- **8:00 AM:** Remote data entry hub (20 queries)
- **9:00 AM:** Customer service jobs (20 queries)
- **10:00 AM:** Tutoring jobs (15 queries)
- **11:00 AM:** Admin assistant jobs (20 queries)

### Weekly Deep Scrape:
- **Sunday 2:00 AM:** Full refresh of all categories
- Remove jobs older than 30 days
- Re-verify company information
- Update salary ranges based on market data

---

## MONITORING & QUALITY ASSURANCE

### Key Metrics to Track:
1. **Jobs per category:** Ensure minimum thresholds met
2. **Job freshness:** 80%+ of jobs posted within last 7 days
3. **Application success rate:** Track which jobs get applications
4. **User reports:** Monitor scam reports and remove bad listings
5. **Source diversity:** Ensure jobs from multiple sources

### Quality Checks:
- [ ] All jobs have company names
- [ ] All jobs have descriptions (100+ chars)
- [ ] All jobs specify "remote" or "work from home"
- [ ] No obvious scam indicators
- [ ] Salary information when available
- [ ] Apply URLs are valid
- [ ] Categories are correctly assigned

---

## PRIORITY IMPLEMENTATION ORDER

1. **Week 1:** Data Entry Hub + Customer Service (highest volume keywords)
2. **Week 2:** Admin Assistant + Medical Data Entry
3. **Week 3:** Data Analyst + Tutoring

This ensures the highest-traffic pages get populated first while building out the entire ecosystem.

---

## TESTING CHECKLIST

Before going live:
- [ ] Test each search query manually on job boards
- [ ] Verify quality filter catches scams
- [ ] Confirm categorization logic works correctly
- [ ] Check database storage format
- [ ] Test job display on frontend pages
- [ ] Verify schema markup includes job data
- [ ] Confirm deduplication prevents duplicates
- [ ] Test expiration logic (30-day removal)

---

## NEXT STEPS

1. Add these queries to your scraper configuration file
2. Update category mapping in your job processing pipeline
3. Run test scrape for each category
4. Monitor job quality and adjust filters as needed
5. Set up daily scraping cron jobs
6. Create admin dashboard to monitor scraping metrics

---

**Last Updated:** January 19, 2026  
**Maintainer:** ClickClickJob Development Team
