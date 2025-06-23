import React, { useState, useEffect } from 'react';

// Job Market Insights Dashboard Component
// Uses real market data from docs/content/weekly_market_insights_*.md files
// Designed for homepage, dedicated market insights page, and individual job pages

const JobMarketInsightsDashboard = () => {
  const [activeSection, setActiveSection] = useState('salary-trends');
  const [animatedNumbers, setAnimatedNumbers] = useState({});

  // Animate numbers when component mounts
  useEffect(() => {
    const animateNumber = (target, key) => {
      let current = 0;
      const increment = target / 100;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setAnimatedNumbers(prev => ({
          ...prev,
          [key]: Math.floor(current)
        }));
      }, 20);
    };

    // Real data from weekly_market_insights_1.md
    animateNumber(18, 'salaryIncrease');
    animateNumber(22, 'executiveIncrease');
    animateNumber(78, 'techPremium');
    animateNumber(73, 'promotionRate');
  }, []);

  // Real market data from docs/content/weekly_market_insights_*.md
  const marketData = {
    salaryTrends: {
      title: "Remote Administrative Salaries Surge 18% as Skills Gap Widens",
      subtitle: "Analysis based on 3,247 remote administrative job postings",
      keyStats: [
        { 
          label: "Average Salary Increase", 
          value: `${animatedNumbers.salaryIncrease || 0}%`, 
          description: "Overall remote admin salary growth vs 2024", 
          trend: "up",
          detail: "Most significant increase in over two years"
        },
        { 
          label: "Executive Admin Growth", 
          value: `${animatedNumbers.executiveIncrease || 0}%`, 
          description: "Executive administrative support roles", 
          trend: "up",
          detail: "2024: $52,000 → 2025: $63,400"
        },
        { 
          label: "Tech Sector Premium", 
          value: `${animatedNumbers.techPremium || 0}%`, 
          description: "Higher compensation than other industries", 
          trend: "up",
          detail: "Tech companies leading compensation growth"
        },
        { 
          label: "Admin Promotion Rate", 
          value: `${animatedNumbers.promotionRate || 0}%`, 
          description: "Customer success admin hires promoted within 18 months", 
          trend: "up",
          detail: "Structured career development programs"
        }
      ],
      roleCategories: [
        {
          category: "Executive Administrative Support",
          growth: "22% increase",
          salary2024: "$52,000",
          salary2025: "$63,400",
          topQuartile: "$78,000+",
          description: "Supporting C-level executives across time zones"
        },
        {
          category: "Operations Coordination",
          growth: "19% increase",
          salary2024: "$48,500",
          salary2025: "$57,700",
          topQuartile: "$72,000+",
          description: "Process automation and workflow optimization"
        },
        {
          category: "Project Administrative Support",
          growth: "16% increase",
          salary2024: "$45,200",
          salary2025: "$52,400",
          topQuartile: "$65,000+",
          description: "Supporting complex project management"
        },
        {
          category: "Data Entry and Processing",
          growth: "14% increase",
          salary2024: "$35,800",
          salary2025: "$40,800",
          topQuartile: "$48,000+",
          description: "AI-enhanced data verification and quality assurance"
        }
      ]
    },

    skillsPremiums: {
      title: "High-Value Skills Commanding Premium Salaries",
      subtitle: "Technology integration requirements driving compensation",
      skillCategories: [
        {
          category: "Marketing Automation Platforms",
          tools: ["HubSpot", "Marketo", "Pardot"],
          salaryPremium: "$4,000-6,000",
          demandLevel: "High",
          description: "Campaign management and lead nurturing"
        },
        {
          category: "Advanced CRM Customization",
          tools: ["Salesforce", "Pipedrive", "Zoho"],
          salaryPremium: "$3,000-5,000",
          demandLevel: "High",
          description: "Custom workflows and reporting"
        },
        {
          category: "Basic SQL and Database Management",
          tools: ["MySQL", "PostgreSQL", "MongoDB"],
          salaryPremium: "$5,000-8,000",
          demandLevel: "Very High",
          description: "Data analysis and reporting capabilities"
        },
        {
          category: "Process Automation",
          tools: ["Zapier", "Microsoft Power Automate", "IFTTT"],
          salaryPremium: "$3,000-4,500",
          demandLevel: "High",
          description: "Workflow optimization and integration"
        }
      ]
    },

    aiIntegration: {
      title: "How AI is Reshaping Remote Administrative Roles",
      subtitle: "Based on interviews with 127 hiring managers",
      integrationAreas: [
        {
          area: "Document Management and Processing",
          adoptionRate: "78%",
          impact: "Transforming data entry into quality assurance roles",
          salaryEffect: "15-23% increase",
          description: "AI handles routine processing, humans focus on exceptions"
        },
        {
          area: "Customer Communication",
          adoptionRate: "65%",
          impact: "Elevating to relationship management specialists",
          salaryEffect: "$3,000-5,000 premium",
          description: "Training AI systems and handling complex interactions"
        },
        {
          area: "Calendar and Scheduling",
          adoptionRate: "71%",
          impact: "Strategic time management and optimization",
          salaryEffect: "40% time savings",
          description: "Focus on priority optimization and strategic planning"
        },
        {
          area: "Data Analysis and Reporting",
          adoptionRate: "52%",
          impact: "Transition to business intelligence roles",
          salaryEffect: "25-35% salary increase",
          description: "Creating insights and predictive analytics"
        }
      ]
    },

    industryInsights: [
      {
        sector: "Technology",
        growth: "Leading AI Integration",
        characteristics: "89% implementing AI in administrative functions",
        opportunities: [
          "Smart project management systems",
          "AI-powered meeting assistants",
          "Automated workflow optimization",
          "Intelligent resource allocation"
        ],
        salaryPremium: "$8,000-12,000 higher with AI integration",
        keyTrend: "Stock options included in 67% of roles (up from 23%)"
      },
      {
        sector: "Healthcare",
        growth: "Compliance-Focused AI",
        characteristics: "Maintaining HIPAA compliance with AI tools",
        opportunities: [
          "Automated patient scheduling with insurance verification",
          "AI-assisted medical coding and billing",
          "Intelligent documentation systems",
          "Predictive analytics for appointment optimization"
        ],
        salaryPremium: "21% salary growth in healthcare admin",
        keyTrend: "Specialized compliance knowledge + AI creates unique value"
      },
      {
        sector: "Financial Services",
        growth: "Risk-Aware AI Adoption",
        characteristics: "Security and regulatory compliance focus",
        opportunities: [
          "Automated document review and compliance",
          "AI-powered client communication with audit trails",
          "Intelligent regulatory reporting",
          "Risk assessment support"
        ],
        salaryPremium: "17% increase with location independence",
        keyTrend: "Traditional firms embracing remote work for first time"
      }
    ],

    futureOutlook: {
      title: "The Future of Remote Administrative Careers",
      subtitle: "Predictions and emerging opportunities",
      emergingRoles: [
        { 
          role: "AI Integration Specialist", 
          salary: "$55,000-$75,000", 
          timeframe: "Next 12-18 Months", 
          demand: "Very High",
          description: "Bridge between AI tools and business processes"
        },
        { 
          role: "Digital Workflow Coordinator", 
          salary: "$50,000-$68,000", 
          timeframe: "Next 12-18 Months", 
          demand: "High",
          description: "Design and manage human-AI collaborative workflows"
        },
        { 
          role: "Customer Experience Technology Manager", 
          salary: "$52,000-$70,000", 
          timeframe: "Next 12-18 Months", 
          demand: "High",
          description: "Optimize AI-human interactions for customer satisfaction"
        },
        { 
          role: "Operations Technology Specialist", 
          salary: "$48,000-$65,000", 
          timeframe: "Next 12-18 Months", 
          demand: "Medium",
          description: "AI tool implementation and optimization"
        }
      ],
      keyPredictions: [
        {
          icon: "🤖",
          title: "AI Collaboration Standard",
          description: "All administrative roles will require AI tool proficiency by 2026",
          impact: "Continuous skill development becomes essential"
        },
        {
          icon: "💰",
          title: "Continued Salary Growth",
          description: "8-12% additional salary increases projected over next year",
          impact: "Skills gap driving sustained compensation growth"
        },
        {
          icon: "🎯",
          title: "Strategic Role Evolution",
          description: "Administrative work becomes strategic business partnership",
          impact: "Career advancement opportunities expand significantly"
        },
        {
          icon: "🌍",
          title: "Global Talent Competition",
          description: "Remote work removes geographic barriers to talent",
          impact: "Higher compensation to attract top global talent"
        }
      ]
    }
  };

  const renderTrendIcon = (trend) => {
    return trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
  };

  const sections = [
    { id: 'salary-trends', label: 'Salary Trends', icon: '💰' },
    { id: 'skills-premiums', label: 'Skills Premiums', icon: '🎯' },
    { id: 'ai-integration', label: 'AI Integration', icon: '🤖' },
    { id: 'industry-insights', label: 'Industry Insights', icon: '📊' },
    { id: 'future-outlook', label: 'Future Outlook', icon: '🔮' }
  ];

  return (
    <section className="market-insights-dashboard" aria-labelledby="insights-heading">
      <div className="dashboard-header">
        <h2 id="insights-heading" className="dashboard-title">
          <span className="insights-badge">Market Intelligence</span>
          Weekly Remote Job Market Insights
        </h2>
        <p className="dashboard-subtitle">
          Based on analysis of 3,247 remote job postings and interviews with 127 hiring managers
        </p>
      </div>

      <div className="dashboard-navigation">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`nav-button ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
            aria-label={`View ${section.label} insights`}
          >
            <span className="nav-icon">{section.icon}</span>
            <span className="nav-label">{section.label}</span>
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {/* Salary Trends Section */}
        {activeSection === 'salary-trends' && (
          <div className="section-content salary-trends">
            <div className="content-header">
              <h3>{marketData.salaryTrends.title}</h3>
              <p className="content-subtitle">{marketData.salaryTrends.subtitle}</p>
            </div>

            <div className="key-stats-grid">
              {marketData.salaryTrends.keyStats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-header">
                    <span className="stat-trend">{renderTrendIcon(stat.trend)}</span>
                    <h4>{stat.label}</h4>
                  </div>
                  <div className="stat-value">{stat.value}</div>
                  <p className="stat-description">{stat.description}</p>
                  <p className="stat-detail">{stat.detail}</p>
                </div>
              ))}
            </div>

            <div className="role-categories">
              <h4>Salary Increases by Role Category</h4>
              <div className="categories-grid">
                {marketData.salaryTrends.roleCategories.map((role, index) => (
                  <div key={index} className="category-card">
                    <div className="category-header">
                      <h5>{role.category}</h5>
                      <span className="growth-badge">{role.growth}</span>
                    </div>
                    <div className="salary-comparison">
                      <div className="salary-row">
                        <span>2024 Average:</span>
                        <span className="salary-old">{role.salary2024}</span>
                      </div>
                      <div className="salary-row">
                        <span>2025 Average:</span>
                        <span className="salary-new">{role.salary2025}</span>
                      </div>
                      <div className="salary-row">
                        <span>Top Quartile:</span>
                        <span className="salary-top">{role.topQuartile}</span>
                      </div>
                    </div>
                    <p className="category-description">{role.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Skills Premiums Section */}
        {activeSection === 'skills-premiums' && (
          <div className="section-content skills-premiums">
            <div className="content-header">
              <h3>{marketData.skillsPremiums.title}</h3>
              <p className="content-subtitle">{marketData.skillsPremiums.subtitle}</p>
            </div>

            <div className="skills-grid">
              {marketData.skillsPremiums.skillCategories.map((skill, index) => (
                <div key={index} className="skill-card">
                  <div className="skill-header">
                    <h4>{skill.category}</h4>
                    <span className={`demand-badge ${skill.demandLevel.toLowerCase().replace(' ', '-')}`}>
                      {skill.demandLevel} Demand
                    </span>
                  </div>
                  <div className="skill-premium">
                    <span className="premium-amount">{skill.salaryPremium}</span>
                    <span className="premium-label">Annual Premium</span>
                  </div>
                  <div className="skill-tools">
                    {skill.tools.map((tool, toolIndex) => (
                      <span key={toolIndex} className="tool-tag">{tool}</span>
                    ))}
                  </div>
                  <p className="skill-description">{skill.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Integration Section */}
        {activeSection === 'ai-integration' && (
          <div className="section-content ai-integration">
            <div className="content-header">
              <h3>{marketData.aiIntegration.title}</h3>
              <p className="content-subtitle">{marketData.aiIntegration.subtitle}</p>
            </div>

            <div className="ai-areas-grid">
              {marketData.aiIntegration.integrationAreas.map((area, index) => (
                <div key={index} className="ai-area-card">
                  <div className="ai-area-header">
                    <h4>{area.area}</h4>
                    <div className="adoption-rate">
                      <span className="rate-value">{area.adoptionRate}</span>
                      <span className="rate-label">Adoption</span>
                    </div>
                  </div>
                  <div className="ai-impact">
                    <h5>Impact:</h5>
                    <p>{area.impact}</p>
                  </div>
                  <div className="ai-salary-effect">
                    <h5>Salary Effect:</h5>
                    <span className="effect-value">{area.salaryEffect}</span>
                  </div>
                  <p className="ai-description">{area.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Industry Insights Section */}
        {activeSection === 'industry-insights' && (
          <div className="section-content industry-insights">
            <div className="content-header">
              <h3>Industry-Specific AI Integration Patterns</h3>
              <p className="content-subtitle">How different sectors are adopting AI in administrative roles</p>
            </div>

            <div className="industry-cards">
              {marketData.industryInsights.map((industry, index) => (
                <div key={index} className="industry-card">
                  <div className="industry-header">
                    <h4>{industry.sector}</h4>
                    <span className="growth-indicator">{industry.growth}</span>
                  </div>
                  <p className="industry-characteristics">{industry.characteristics}</p>
                  
                  <div className="opportunities-section">
                    <h5>Key Opportunities:</h5>
                    <ul className="opportunities-list">
                      {industry.opportunities.map((opportunity, oppIndex) => (
                        <li key={oppIndex}>{opportunity}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="industry-metrics">
                    <div className="metric">
                      <span className="metric-label">Salary Premium:</span>
                      <span className="metric-value">{industry.salaryPremium}</span>
                    </div>
                    <div className="key-trend">
                      <span className="trend-label">Key Trend:</span>
                      <span className="trend-value">{industry.keyTrend}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Future Outlook Section */}
        {activeSection === 'future-outlook' && (
          <div className="section-content future-outlook">
            <div className="content-header">
              <h3>{marketData.futureOutlook.title}</h3>
              <p className="content-subtitle">{marketData.futureOutlook.subtitle}</p>
            </div>

            <div className="emerging-roles">
              <h4>Emerging Administrative Roles</h4>
              <div className="roles-grid">
                {marketData.futureOutlook.emergingRoles.map((role, index) => (
                  <div key={index} className="role-card">
                    <div className="role-header">
                      <h5>{role.role}</h5>
                      <span className={`demand-indicator ${role.demand.toLowerCase().replace(' ', '-')}`}>
                        {role.demand}
                      </span>
                    </div>
                    <div className="role-salary">{role.salary}</div>
                    <div className="role-timeframe">{role.timeframe}</div>
                    <p className="role-description">{role.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="key-predictions">
              <h4>Key Market Predictions</h4>
              <div className="predictions-grid">
                {marketData.futureOutlook.keyPredictions.map((prediction, index) => (
                  <div key={index} className="prediction-card">
                    <div className="prediction-icon">{prediction.icon}</div>
                    <h5>{prediction.title}</h5>
                    <p className="prediction-description">{prediction.description}</p>
                    <p className="prediction-impact">{prediction.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default JobMarketInsightsDashboard; 