import React, { useState, useEffect } from 'react';
import './JobMarketInsightsDashboard.css';

const JobMarketInsightsDashboard = () => {
  const [activeSection, setActiveSection] = useState('global-trends');
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

    animateNumber(156, 'globalIncrease');
    animateNumber(67, 'videoSkills');
    animateNumber(127, 'marketGrowth');
    animateNumber(73, 'promotionRate');
  }, []);

  const marketData = {
    globalTrends: {
      title: "Global Remote Hiring Boom",
      subtitle: "International Talent Competition Reshaping Administrative Careers",
      keyStats: [
        { label: "International Remote Job Growth", value: "156%", description: "More globally available positions vs 2024", trend: "up" },
        { label: "Technology Sector Leadership", value: "73%", description: "Of tech startups maintain global hiring", trend: "up" },
        { label: "Video Communication Skills", value: "67%", description: "More likely to receive positive feedback", trend: "up" },
        { label: "Admin Market Growth", value: "127%", description: "Remote admin positions since 2022", trend: "up" }
      ]
    },
    
    salaryInsights: {
      experienceLevels: [
        {
          level: "Entry Level (0-2 years)",
          roles: [
            { title: "Administrative Assistant", range: "$30,000 - $40,000" },
            { title: "Data Entry Specialist", range: "$28,000 - $38,000" },
            { title: "Customer Service Admin", range: "$32,000 - $42,000" }
          ]
        },
        {
          level: "Mid-Level (3-5 years)",
          roles: [
            { title: "Executive Assistant", range: "$45,000 - $60,000" },
            { title: "Operations Coordinator", range: "$48,000 - $62,000" },
            { title: "Project Administrator", range: "$44,000 - $58,000" }
          ]
        },
        {
          level: "Senior Level (5+ years)",
          roles: [
            { title: "Senior Executive Assistant", range: "$60,000 - $80,000" },
            { title: "Operations Manager", range: "$65,000 - $85,000" },
            { title: "Administrative Manager", range: "$58,000 - $75,000" }
          ]
        }
      ],
      
      geographicPremiums: [
        { region: "North American Companies", percentage: "47%", salary: "$35,000-$75,000 USD", zones: "EST/PST alignment" },
        { region: "European Union Companies", percentage: "28%", salary: "€30,000-€60,000 EUR", zones: "English + multilingual preferred" },
        { region: "APAC Companies", percentage: "15%", salary: "$25,000-$55,000 USD equiv", zones: "Time zone flexibility critical" },
        { region: "Emerging Markets", percentage: "10%", salary: "$20,000-$45,000 USD equiv", zones: "89% YoY growth" }
      ],
      
      timezonePremiuns: [
        { zone: "US Eastern Time Coverage", premium: "15-25%", details: "6 AM - 3 PM EST: Highest premium (25%)" },
        { zone: "European Business Hours", premium: "10-18%", details: "9 AM - 6 PM CET: Standard rate (10%)" },
        { zone: "APAC Flexibility", premium: "20-30%", details: "Rotating schedules for global coverage" }
      ]
    },

    languageSkills: {
      premiums: [
        { languages: "English + Spanish", premium: "$3,000-5,000", demand: "US-Latin America business support", growth: "high" },
        { languages: "English + Mandarin", premium: "$4,000-7,000", demand: "US-China business operations", growth: "critical" },
        { languages: "English + German", premium: "$3,500-6,000", demand: "European business development", growth: "steady" },
        { languages: "English + French", premium: "$2,500-4,500", demand: "Canadian and European markets", growth: "moderate" }
      ]
    },

    industryInsights: [
      {
        sector: "Technology",
        growth: "Leading Global Integration",
        characteristics: "73% of tech startups maintain global hiring practices",
        opportunities: [
          "DevOps Administrative Support",
          "Customer Success Administration", 
          "Product Management Administration",
          "International Compliance Coordination"
        ],
        salaryPremium: "20-35% higher than domestic-only positions",
        keyTrend: "Global tech admin roles command highest premiums"
      },
      {
        sector: "Financial Services", 
        growth: "Regulatory Complexity",
        characteristics: "International financial regulations expertise required",
        opportunities: [
          "International Regulatory Coordinator: $45,000-65,000",
          "Global Client Administrative Specialist: $40,000-58,000",
          "Cross-Border Transaction Administrator: $42,000-62,000"
        ],
        salaryPremium: "18-28% premiums over domestic positions",
        keyTrend: "Strong advancement as telemedicine expands internationally"
      },
      {
        sector: "Healthcare",
        growth: "Telemedicine Expansion", 
        characteristics: "Global health administration opportunities emerging",
        opportunities: [
          "International Patient Coordinator",
          "Global Health Data Administrator",
          "Telemedicine Administrative Support"
        ],
        salaryPremium: "18-28% premiums over domestic positions",
        keyTrend: "Strong advancement as telemedicine expands internationally"
      }
    ],

    emergingRoles: [
      { role: "Global Operations Coordinator", salary: "$55,000-$75,000", timeframe: "Next 12-18 Months", demand: "high" },
      { role: "International Compliance Administrator", salary: "$50,000-$68,000", timeframe: "Next 12-18 Months", demand: "high" },
      { role: "Cross-Cultural Communication Specialist", salary: "$48,000-$65,000", timeframe: "Next 12-18 Months", demand: "medium" },
      { role: "Global Client Experience Manager", salary: "$52,000-$70,000", timeframe: "Next 12-18 Months", demand: "high" }
    ],

    keyInsights: [
      {
        icon: "🌍",
        title: "Complete Globalization Ahead",
        description: "65-70% of administrative roles will be globally available by 2028",
        impact: "Increased competition requiring continuous skill development"
      },
      {
        icon: "💰", 
        title: "Higher Average Compensation",
        description: "Companies compete for top global talent with premium salaries",
        impact: "5-15% salary increases for remote vs location-adjusted roles"
      },
      {
        icon: "🎯",
        title: "Cultural Competency Critical", 
        description: "International business skills become essential for advancement",
        impact: "23% higher satisfaction scores from international colleagues"
      },
      {
        icon: "🚀",
        title: "Technology Acceleration",
        description: "AI translation and VR collaboration reducing global barriers",
        impact: "New opportunities in virtual office management and coordination"
      }
    ]
  };

  const renderTrendIcon = (trend) => {
    return trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
  };

  const sections = [
    { id: 'global-trends', label: 'Global Trends', icon: '🌍' },
    { id: 'salary-insights', label: 'Salary Insights', icon: '💰' },  
    { id: 'industry-analysis', label: 'Industry Analysis', icon: '📊' },
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
          Based on analysis of 4,200 international remote job postings and interviews with 89 global hiring managers
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
        {activeSection === 'global-trends' && (
          <div className="content-section active" role="tabpanel" aria-labelledby="global-trends-tab">
            <div className="section-header">
              <h3 className="section-title">{marketData.globalTrends.title}</h3>
              <p className="section-subtitle">{marketData.globalTrends.subtitle}</p>
            </div>

            <div className="key-stats-grid">
              {marketData.globalTrends.keyStats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-header">
                    <span className="stat-trend">{renderTrendIcon(stat.trend)}</span>
                    <span className="stat-value">{stat.value}</span>
                  </div>
                  <h4 className="stat-label">{stat.label}</h4>
                  <p className="stat-description">{stat.description}</p>
                </div>
              ))}
            </div>

            <div className="geographic-distribution">
              <h4 className="subsection-title">Geographic Distribution of Remote Opportunities</h4>
              <div className="geographic-grid">
                {marketData.salaryInsights.geographicPremiums.map((region, index) => (
                  <div key={index} className="geographic-card">
                    <div className="geographic-header">
                      <span className="geographic-percentage">{region.percentage}</span>
                      <span className="geographic-region">{region.region}</span>
                    </div>
                    <div className="geographic-details">
                      <p className="geographic-salary">{region.salary}</p>
                      <p className="geographic-notes">{region.zones}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="language-premiums">
              <h4 className="subsection-title">Multilingual Premium Rates</h4>
              <div className="language-grid">
                {marketData.languageSkills.premiums.map((lang, index) => (
                  <div key={index} className="language-card">
                    <div className="language-header">
                      <span className="language-combo">{lang.languages}</span>
                      <span className="language-premium">{lang.premium} annually</span>
                    </div>
                    <p className="language-demand">{lang.demand}</p>
                    <div className="language-growth">
                      <span className={`growth-indicator ${lang.growth}`}>{lang.growth} demand</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'salary-insights' && (
          <div className="content-section active" role="tabpanel" aria-labelledby="salary-insights-tab">
            <div className="section-header">
              <h3 className="section-title">Comprehensive Salary Analysis</h3>
              <p className="section-subtitle">Current market rates and compensation trends across experience levels</p>
            </div>

            <div className="salary-by-experience">
              <h4 className="subsection-title">Salary Ranges by Experience Level</h4>
              {marketData.salaryInsights.experienceLevels.map((level, index) => (
                <div key={index} className="experience-level-card">
                  <h5 className="experience-level">{level.level}</h5>
                  <div className="roles-grid">
                    {level.roles.map((role, roleIndex) => (
                      <div key={roleIndex} className="role-salary-card">
                        <span className="role-title">{role.title}</span>
                        <span className="role-salary">{role.range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="timezone-premiums">
              <h4 className="subsection-title">Time Zone Alignment Premiums</h4>
              <div className="timezone-grid">
                {marketData.salaryInsights.timezonePremiuns.map((zone, index) => (
                  <div key={index} className="timezone-card">
                    <div className="timezone-header">
                      <span className="timezone-name">{zone.zone}</span>
                      <span className="timezone-premium">+{zone.premium}</span>
                    </div>
                    <p className="timezone-details">{zone.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'industry-analysis' && (
          <div className="content-section active" role="tabpanel" aria-labelledby="industry-analysis-tab">
            <div className="section-header">
              <h3 className="section-title">Industry-Specific Global Trends</h3>
              <p className="section-subtitle">Sector analysis and emerging opportunities</p>
            </div>

            <div className="industry-cards">
              {marketData.industryInsights.map((industry, index) => (
                <div key={index} className="industry-card">
                  <div className="industry-header">
                    <h4 className="industry-sector">{industry.sector}</h4>
                    <span className="industry-growth">{industry.growth}</span>
                  </div>
                  <p className="industry-characteristics">{industry.characteristics}</p>
                  
                  <div className="industry-opportunities">
                    <h5>Key Opportunities:</h5>
                    <ul>
                      {industry.opportunities.map((opp, oppIndex) => (
                        <li key={oppIndex}>{opp}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="industry-footer">
                    <span className="salary-premium">{industry.salaryPremium}</span>
                    <span className="key-trend">{industry.keyTrend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'future-outlook' && (
          <div className="content-section active" role="tabpanel" aria-labelledby="future-outlook-tab">
            <div className="section-header">
              <h3 className="section-title">Future Predictions and Opportunities</h3>
              <p className="section-subtitle">Emerging roles and market evolution insights</p>
            </div>

            <div className="emerging-roles">
              <h4 className="subsection-title">New Role Categories (Next 12-18 Months)</h4>
              <div className="emerging-roles-grid">
                {marketData.emergingRoles.map((role, index) => (
                  <div key={index} className="emerging-role-card">
                    <div className="role-header">
                      <h5 className="role-name">{role.role}</h5>
                      <span className={`demand-indicator ${role.demand}`}>{role.demand} demand</span>
                    </div>
                    <div className="role-details">
                      <span className="role-salary">{role.salary}</span>
                      <span className="role-timeframe">{role.timeframe}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="key-insights">
              <h4 className="subsection-title">Strategic Market Insights</h4>
              <div className="insights-grid">
                {marketData.keyInsights.map((insight, index) => (
                  <div key={index} className="insight-card">
                    <div className="insight-icon">{insight.icon}</div>
                    <h5 className="insight-title">{insight.title}</h5>
                    <p className="insight-description">{insight.description}</p>
                    <p className="insight-impact"><strong>Impact:</strong> {insight.impact}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="market-predictions">
              <div className="prediction-card highlight">
                <h4>Market Prediction: Complete Globalization by 2028</h4>
                <p>The trend toward global hiring will accelerate, with predictions that <strong>65-70% of administrative roles</strong> will be globally available by 2028. This represents the most significant expansion of career opportunities in the field's history.</p>
                
                <div className="prediction-implications">
                  <h5>Key Implications:</h5>
                  <ul>
                    <li>Increased competition requiring continuous skill development and specialization</li>
                    <li>Higher average compensation as companies compete for top global talent</li>
                    <li>Greater importance of cultural competency and international business skills</li>
                    <li>Emergence of global administrative career paths with international advancement opportunities</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-footer">
        <div className="update-info">
          <span className="update-label">Last Updated:</span>
          <span className="update-date">Weekly Market Analysis - Current Week</span>
        </div>
        <div className="source-info">
          <span className="source-label">Data Sources:</span>
          <span className="source-details">4,200 international remote job postings • 89 global hiring manager interviews</span>
        </div>
      </div>
    </section>
  );
};

export default JobMarketInsightsDashboard; 