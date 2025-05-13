const qualityFilter = require('./src/utils/qualityFilter');

// Create sample job data
const sampleJobs = [
  {
    title: "Data Entry Specialist",
    company: "ABC Corp",
    location: "Remote",
    description: "We are looking for a Data Entry Specialist to join our team. This role requires excellent attention to detail and typing skills.",
    descriptionText: "We are looking for a Data Entry Specialist to join our team. This role requires excellent attention to detail and typing skills. Responsibilities include: • Inputting data into various systems • Verifying data accuracy • Managing spreadsheets • Organizing files Requirements: • Proficient in Excel • Typing speed of 50+ WPM • Strong communication skills • High school diploma or equivalent Salary: $18-$22 per hour depending on experience.",
    url: "https://example.com/jobs/123",
    source: "weworkremotely",
    postedDate: new Date("2025-05-01")
  },
  {
    title: "Administrative Assistant",
    company: "XYZ Company",
    location: "Remote",
    description: "Virtual administrative assistant needed for busy executive.",
    descriptionText: "Virtual administrative assistant needed for busy executive. Tasks include scheduling, email management, and light bookkeeping. Part-time position, flexible hours. Must be detail-oriented and have excellent communication skills.",
    url: "https://example.com/jobs/456",
    source: "remoteco",
    postedDate: new Date("2025-05-05")
  },
  {
    title: "Make $$$$ Fast - Work From Home",
    company: "Get Rich Quick",
    location: "Anywhere",
    description: "Earn up to $1000/day working from anywhere. Be your own boss!",
    descriptionText: "Earn up to $1000/day working from anywhere. Be your own boss! This amazing opportunity lets you work from home and make money while you sleep. Join our multi-level marketing team and start your journey to financial freedom today! Small investment required to start.",
    url: "https://example.com/jobs/789",
    source: "unknown",
    postedDate: new Date("2025-05-10")
  },
  {
    title: "Customer Service Representative",
    company: "Customer First Inc",
    location: "Remote",
    description: "Remote customer service position available immediately.",
    descriptionText: "Remote customer service position available immediately. Looking for friendly, patient individuals to handle customer inquiries via phone, email and chat. Must have reliable internet connection and quiet workspace. Experience with CRM systems preferred but not required. Training provided. Full-time and part-time positions available.",
    url: "https://example.com/jobs/101",
    source: "indeed",
    postedDate: new Date("2025-04-15")
  },
  {
    title: "High-Quality Data Entry Position",
    company: "Enterprise Solutions",
    location: "Remote - US Based",
    description: "Join our team as a data entry specialist handling important client information.",
    descriptionText: "Join our team as a data entry specialist handling important client information. This is a full-time remote position with a growing technology firm. Responsibilities: • Processing customer data • Maintaining database accuracy • Generating reports • Supporting data analysis team Requirements: • 2+ years of data entry experience • Excellent attention to detail • Proficient with Microsoft Excel and Google Sheets • Bachelor's degree preferred but not required Benefits: • Competitive salary ($45,000-$55,000) • Health insurance • 401(k) matching • Paid time off • Professional development opportunities",
    url: "https://example.com/jobs/555",
    source: "linkedin",
    postedDate: new Date("2025-05-11")
  },
  {
    title: "Virtual Executive Assistant",
    company: "C-Suite Support",
    location: "Remote",
    description: "",
    descriptionText: "Looking for a skilled virtual assistant. Must be available during business hours.",
    url: "https://example.com/jobs/666",
    source: "upwork",
    postedDate: new Date("2025-05-09")
  },
  {
    title: "Remote Data Analyst",
    company: "Analytics Inc",
    location: "Remote",
    description: "Data analyst position with focus on spreadsheet management.",
    descriptionText: "Our company needs a data analyst who will primarily work with spreadsheets and database systems. This role is adjacent to our data entry team and requires similar skills with additional analytical capabilities. The ideal candidate will have experience with Excel and basic SQL.",
    url: "https://example.com/jobs/777",
    source: "careerjet",
    postedDate: new Date("2025-05-03")
  },
  {
    title: "Network Marketing Opportunity!!!",
    company: "PyramidWorks",
    location: "Global",
    description: "Join our network and earn passive income! No experience needed!",
    descriptionText: "Join our network and earn passive income! No experience needed! This is a revolutionary business opportunity where you can build your own team and earn commissions on everything they sell. Start with a small investment and watch your money grow! Unlimited earning potential!",
    url: "https://example.com/jobs/888",
    source: "unknown",
    postedDate: new Date("2025-05-08")
  }
];

// Filter the jobs
const filteredJobs = qualityFilter.filterJobs(sampleJobs);

// Print results
console.log(`Original jobs: ${sampleJobs.length}`);
console.log(`Filtered jobs: ${filteredJobs.length}`);
console.log("\nRejection stats:");
console.log(qualityFilter.getRejectionStats());

console.log("\nFiltered Jobs Details:");
filteredJobs.forEach(job => {
  console.log(`\n${job.title} - ${job.company}`);
  console.log(`Quality Score: ${job.qualityMetrics.totalScore.toFixed(2)}`);
  console.log(`Relevance: ${job.qualityMetrics.relevanceScore.toFixed(2)}`);
  console.log(`Quality: ${job.qualityMetrics.qualityScore.toFixed(2)}`);
  console.log(`Credibility: ${job.qualityMetrics.credibilityScore.toFixed(2)}`);
  console.log(`Recency: ${job.qualityMetrics.recencyScore.toFixed(2)}`);
  console.log(`Featured: ${job.qualityMetrics.isFeatured}`);
}); 