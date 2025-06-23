import React, { useState } from 'react';
import './EditorPickJobCard.css';

// Editor's Pick Job Card Component
// Uses real editorial content from docs/content/editors_pick_templates.md
// Designed for integration in homepage, job listings, and dedicated editor's picks page

const EditorPickJobCard = () => {
  const [selectedJob, setSelectedJob] = useState(0);

  // Real editorial content from docs/content/editors_pick_templates.md
  const editorsPicks = [
    {
      id: 1,
      title: "Executive Assistant",
      company: "Series B Fintech Startup",
      salary: "$65,000 + Equity",
      location: "Remote (Global)",
      equity: "0.05-0.1%",
      rating: 4.8,
      badge: "EQUITY UPSIDE",
      highlights: ["Recent $50M funding round", "European expansion", "$2,000 learning budget"],
      editorAnalysis: "This executive assistant position at a Series B fintech startup stands out for several compelling reasons. The $65,000 salary significantly exceeds market averages for similar roles, reflecting the company's rapid growth trajectory and competitive talent market. What makes this particularly attractive is the equity component (0.05-0.1%), which could prove valuable given the company's recent $50M funding round and expansion into European markets. The role requires supporting two C-level executives across different time zones, demanding exceptional organizational skills and cultural sensitivity. Unlike many startup EA roles that can be chaotic, this position offers structured responsibilities with clear success metrics. The company's commitment to professional development, including a $2,000 annual learning budget and mentorship program, demonstrates genuine investment in employee growth. However, candidates should prepare for the fast-paced environment and potential for role expansion as the company scales.",
      pros: [
        "Salary exceeds market average by 15-20%",
        "Equity upside potential with Series B funding",
        "Structured responsibilities with clear success metrics",
        "Professional development investment ($2,000 budget)",
        "Mentorship program included"
      ],
      considerations: [
        "Fast-paced startup environment",
        "Multi-timezone executive support required",
        "Potential for role expansion as company scales",
        "Cultural sensitivity needed for global operations"
      ],
      skillsRequired: ["Executive calendar management", "Cross-timezone coordination", "Cultural sensitivity", "C-level communication"]
    },
    {
      id: 2,
      title: "Operations Coordinator",
      company: "Healthcare SaaS Company",
      salary: "$52,000 + Benefits",
      location: "Remote + Quarterly Denver Meetings",
      rating: 4.6,
      badge: "HEALTHCARE TECH",
      highlights: ["18-month promotion pathway", "HIPAA certified", "SOC 2 Type II"],
      editorAnalysis: "This operations coordinator role represents an excellent entry point into the rapidly growing healthcare technology sector. At $52,000 with comprehensive benefits, the compensation reflects the specialized nature of healthcare compliance and the company's strong market position. The role's focus on automating manual processes positions it perfectly for professionals seeking to develop valuable technical skills while working in a stable, recession-resistant industry. What sets this opportunity apart is the company's clear 18-month promotion pathway to Senior Operations Coordinator, backed by specific skill development milestones and mentorship from the VP of Operations. The hybrid flexibility (remote with quarterly team meetings in Denver) offers the best of both worlds for collaboration and independence. Candidates with healthcare experience will find additional value, but the comprehensive training program makes this accessible to operations professionals from other industries. The company's recent HIPAA compliance certification and SOC 2 Type II attestation demonstrate operational maturity that translates to job security and professional credibility.",
      pros: [
        "Clear 18-month promotion pathway to Senior role",
        "Healthcare industry stability (recession-resistant)",
        "Automation skills development opportunity",
        "Hybrid flexibility with quarterly team meetings",
        "Comprehensive training program included",
        "VP of Operations mentorship"
      ],
      considerations: [
        "Healthcare compliance requirements to learn",
        "Quarterly travel to Denver required",
        "Industry-specific learning curve initially",
        "HIPAA and SOC 2 compliance standards"
      ],
      skillsRequired: ["Healthcare operations", "Process automation", "HIPAA compliance", "Team collaboration"]
    },
    {
      id: 3,
      title: "Project Administrative Coordinator",
      company: "Boutique Management Consulting",
      salary: "$48,000 + Quarterly Bonuses",
      location: "Remote (US)",
      rating: 4.7,
      badge: "FORTUNE 500 EXPOSURE",
      highlights: ["Quarterly bonuses $3K-5K", "C-suite client exposure", "40-hour work weeks"],
      editorAnalysis: "This project administrative coordinator position at a boutique management consulting firm offers unique exposure to Fortune 500 client work typically reserved for senior professionals. The $48,000 base salary, while competitive, becomes exceptional when combined with project completion bonuses averaging $3,000-5,000 quarterly. The role provides unparalleled learning opportunities through direct interaction with C-suite executives across multiple industries. The position's strength lies in its variety—supporting projects ranging from digital transformation to organizational restructuring. This exposure accelerates professional development and builds a diverse skill set valuable across industries. The firm's commitment to work-life balance, demonstrated through strict 40-hour work weeks and mandatory PTO, sets it apart from larger consulting organizations known for burnout. Candidates should be prepared for intellectual rigor and attention to detail, as work directly impacts client outcomes. The clear advancement path to Project Manager within 2-3 years, supported by firm-sponsored PMP certification, makes this an strategic career move for ambitious administrative professionals.",
      pros: [
        "Fortune 500 client exposure typically reserved for seniors",
        "Quarterly performance bonuses ($3K-$5K)",
        "Diverse industry experience (digital transformation, restructuring)",
        "Excellent work-life balance (strict 40-hour weeks)",
        "Clear advancement path to Project Manager (2-3 years)",
        "Firm-sponsored PMP certification"
      ],
      considerations: [
        "High attention to detail required",
        "Intellectual rigor expectations",
        "Client outcome responsibility",
        "Mandatory PTO policy (structured time off)"
      ],
      skillsRequired: ["Project coordination", "Executive communication", "Multi-industry adaptability", "Analytical thinking"]
    },
    {
      id: 4,
      title: "Customer Success Administrative Specialist",
      company: "B2B Software Company",
      salary: "$44,000 + Retention Bonuses",
      location: "Remote (Global)",
      rating: 4.5,
      badge: "SAAS GROWTH",
      highlights: ["Quarterly retention bonuses", "Shopify partnerships", "Tableau training"],
      editorAnalysis: "This customer success administrative role at a rapidly scaling B2B software company presents an exceptional opportunity to build expertise in the high-growth SaaS sector. The $44,000 salary, enhanced by quarterly customer retention bonuses (averaging $1,500-2,500), reflects the direct impact this role has on company revenue. The position offers front-row exposure to customer success methodologies and metrics that are increasingly valuable across industries. The role's emphasis on data analysis and reporting (using Salesforce, ChurnZero, and Tableau) provides hands-on experience with enterprise-level tools that significantly enhance professional marketability. The company's customer base includes recognizable brands like Shopify partners and major e-commerce platforms, offering networking opportunities and resume credibility. Particularly appealing is the structured career development program, with 73% of customer success administrative hires promoted within 18 months. The remote-first culture, supported by comprehensive onboarding and quarterly team retreats, ensures strong integration despite distributed work. Candidates with customer service background will excel, but the role's analytical components make it suitable for detail-oriented professionals seeking to transition into tech.",
      pros: [
        "SaaS industry expertise development opportunity",
        "Direct revenue impact visibility and measurement",
        "Enterprise tool proficiency (Salesforce, ChurnZero, Tableau)",
        "73% promotion rate within 18 months",
        "Recognizable client base (Shopify partners, major e-commerce)",
        "Remote-first culture with comprehensive onboarding",
        "Quarterly team retreats for collaboration"
      ],
      considerations: [
        "Customer retention pressure and metrics focus",
        "Data analysis requirements significant",
        "Remote-first culture adaptation needed",
        "Analytical skills development required"
      ],
      skillsRequired: ["Salesforce", "ChurnZero", "Tableau", "Customer relationship management"]
    },
    {
      id: 5,
      title: "Data Entry Specialist",
      company: "Investment Advisory Firm",
      salary: "$40,000 + Performance Bonuses",
      location: "Remote (US)",
      rating: 4.3,
      badge: "FINANCE ENTRY",
      highlights: ["Performance bonuses up to $4K", "Bloomberg Terminal training", "Series 7 licensing"],
      editorAnalysis: "While data entry roles often get overlooked, this position at a mid-sized investment advisory firm offers exceptional value for detail-oriented professionals. The $40,000 salary includes performance bonuses based on accuracy metrics, potentially adding $3,000-4,000 annually for top performers. What elevates this beyond typical data entry is the exposure to financial analysis and client portfolio management, providing valuable industry knowledge and potential career pivot opportunities. The firm's commitment to accuracy and compliance creates a structured environment where attention to detail is genuinely valued and rewarded. The role includes training on financial software platforms (including Bloomberg Terminal basics) that are highly transferable and valuable in the finance industry. With only 12 employees, this position offers direct interaction with senior advisors and exposure to high-net-worth client management. The clear progression path to Client Services Associate within 12-18 months, supported by firm-sponsored Series 7 licensing, demonstrates genuine investment in employee advancement. Candidates seeking stability, skill development, and potential entry into financial services will find this role particularly rewarding, though it requires discretion given the confidential nature of client financial information.",
      pros: [
        "Financial industry knowledge gain and career pivot opportunity",
        "Bloomberg Terminal access and training",
        "Clear advancement to Client Services Associate (12-18 months)",
        "Small team direct advisor interaction (12 employees)",
        "Performance bonuses up to $4K for accuracy",
        "Firm-sponsored Series 7 licensing support",
        "High-net-worth client management exposure"
      ],
      considerations: [
        "High accuracy requirements with performance tracking",
        "Confidential client information requires discretion",
        "Series 7 licensing commitment required",
        "Structured compliance environment"
      ],
      skillsRequired: ["Financial data accuracy", "Bloomberg Terminal", "Discretion with client info", "Attention to detail"]
    }
  ];

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }
    
    return stars;
  };

  return (
    <section className="editors-picks-section" aria-labelledby="editors-picks-heading">
      <div className="section-header">
        <h2 id="editors-picks-heading" className="section-title">
          <span className="editors-badge">Editor's Choice</span>
          Curated Remote Administrative Opportunities
        </h2>
        <p className="section-description">
          Hand-selected positions analyzed by our editorial team for exceptional value, growth potential, and compensation.
        </p>
      </div>

      <div className="job-cards-container">
        <div className="job-cards-navigation">
          {editorsPicks.map((job, index) => (
            <button
              key={job.id}
              className={`nav-card ${index === selectedJob ? 'active' : ''}`}
              onClick={() => setSelectedJob(index)}
              aria-label={`Select ${job.title} at ${job.company}`}
            >
              <div className="nav-card-content">
                <div className="nav-card-header">
                  <span className="nav-card-badge">{job.badge}</span>
                  <div className="nav-card-rating">
                    {renderStars(job.rating)}
                    <span className="rating-number">{job.rating}</span>
                  </div>
                </div>
                <h3 className="nav-card-title">{job.title}</h3>
                <p className="nav-card-company">{job.company}</p>
                <p className="nav-card-salary">{job.salary}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="featured-job-card">
          {editorsPicks.map((job, index) => (
            <div
              key={job.id}
              className={`job-detail ${index === selectedJob ? 'active' : ''}`}
              role="tabpanel"
              aria-labelledby={`tab-${job.id}`}
            >
              <div className="job-header">
                <div className="job-title-section">
                  <div className="job-badge-rating">
                    <span className="job-badge">{job.badge}</span>
                    <div className="job-rating">
                      <div className="stars">{renderStars(job.rating)}</div>
                      <span className="rating-text">Editor Rating: {job.rating}/5.0</span>
                    </div>
                  </div>
                  <h3 className="job-title">{job.title}</h3>
                  <p className="job-company">{job.company}</p>
                  <div className="job-meta">
                    <span className="job-salary">{job.salary}</span>
                    {job.equity && <span className="job-equity">+ {job.equity} equity</span>}
                    <span className="job-location">{job.location}</span>
                  </div>
                </div>
              </div>

              <div className="job-highlights">
                <h4>Key Highlights</h4>
                <ul>
                  {job.highlights.map((highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  ))}
                </ul>
              </div>

              <div className="editor-analysis">
                <h4>
                  <span className="editor-icon">✍️</span>
                  Editor's Analysis
                </h4>
                <p className="analysis-text">{job.editorAnalysis}</p>
              </div>

              <div className="pros-cons-section">
                <div className="pros-section">
                  <h4>
                    <span className="pros-icon">✅</span>
                    Why We Recommend This Role
                  </h4>
                  <ul>
                    {job.pros.map((pro, idx) => (
                      <li key={idx}>{pro}</li>
                    ))}
                  </ul>
                </div>

                <div className="considerations-section">
                  <h4>
                    <span className="considerations-icon">⚠️</span>
                    Important Considerations
                  </h4>
                  <ul>
                    {job.considerations.map((con, idx) => (
                      <li key={idx}>{con}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="skills-section">
                <h4>Required Skills & Experience</h4>
                <div className="skills-tags">
                  {job.skillsRequired.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="action-section">
                <button className="apply-button primary" aria-label={`Apply for ${job.title} position`}>
                  View Full Job Details
                </button>
                <button className="save-button secondary" aria-label={`Save ${job.title} for later`}>
                  Save for Later
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EditorPickJobCard; 