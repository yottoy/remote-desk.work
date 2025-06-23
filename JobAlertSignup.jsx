import React, { useState, useEffect } from 'react';
import './JobAlertSignup.css';

const JobAlertSignup = () => {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    experienceLevel: '',
    jobTypes: [],
    salaryMin: '',
    preferredSchedule: '',
    skills: [],
    remotePreference: 'fully-remote',
    newsletterOptIn: true
  });

  const [formState, setFormState] = useState({
    isSubmitting: false,
    isSuccess: false,
    errors: {},
    touched: {}
  });

  const [customSkill, setCustomSkill] = useState('');

  // Experience levels from the Ultimate Remote Admin Guide
  const experienceLevels = [
    { value: 'entry', label: 'Entry Level (0-2 years)', salary: '$30,000 - $42,000' },
    { value: 'mid', label: 'Mid-Level (3-5 years)', salary: '$44,000 - $62,000' },
    { value: 'senior', label: 'Senior Level (5+ years)', salary: '$58,000 - $85,000' }
  ];

  // Job types based on the guide content
  const jobTypes = [
    'Executive Assistant',
    'Virtual Operations Coordinator', 
    'Customer Success Administrative Support',
    'Data Analysis and Reporting Specialist',
    'Project Administrative Coordinator',
    'Healthcare Administrative Specialist',
    'Legal Administrative Support',
    'Real Estate Transaction Coordinator'
  ];

  // Skills from the guide
  const commonSkills = [
    'Microsoft Office Suite',
    'Google Workspace',
    'Salesforce',
    'Project Management (Asana, Trello)',
    'Data Analysis (Excel, SQL)',
    'Customer Relationship Management',
    'Calendar Management',
    'Travel Coordination',
    'Document Management',
    'Video Conferencing',
    'Social Media Management',
    'Basic Graphic Design',
    'Time Tracking',
    'Process Automation'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox' && name === 'jobTypes') {
      setFormData(prev => ({
        ...prev,
        jobTypes: checked 
          ? [...prev.jobTypes, value]
          : prev.jobTypes.filter(item => item !== value)
      }));
    } else if (type === 'checkbox' && name === 'skills') {
      setFormData(prev => ({
        ...prev,
        skills: checked 
          ? [...prev.skills, value]
          : prev.skills.filter(item => item !== value)
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (formState.errors[name]) {
      setFormState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [name]: ''
        }
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setFormState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [name]: true
      }
    }));
    validateField(name, formData[name]);
  };

  const validateField = (fieldName, value) => {
    let error = '';

    switch (fieldName) {
      case 'email':
        if (!value) {
          error = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'firstName':
        if (!value.trim()) {
          error = 'First name is required';
        }
        break;
      case 'experienceLevel':
        if (!value) {
          error = 'Please select your experience level';
        }
        break;
      default:
        break;
    }

    setFormState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: error
      }
    }));

    return error === '';
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.experienceLevel) {
      errors.experienceLevel = 'Please select your experience level';
    }

    if (formData.jobTypes.length === 0) {
      errors.jobTypes = 'Please select at least one job type';
    }

    setFormState(prev => ({
      ...prev,
      errors
    }));

    return Object.keys(errors).length === 0;
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !formData.skills.includes(customSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, customSkill.trim()]
      }));
      setCustomSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true }));

    try {
      // Simulate API call - replace with actual endpoint
      const response = await fetch('/api/job-alerts/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          subscribedAt: new Date().toISOString(),
          source: 'website_signup'
        }),
      });

      if (response.ok) {
        setFormState(prev => ({
          ...prev,
          isSubmitting: false,
          isSuccess: true,
          errors: {}
        }));
        
        // Track conversion for analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'job_alert_signup', {
            event_category: 'engagement',
            event_label: formData.experienceLevel
          });
        }
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        errors: {
          submit: 'Something went wrong. Please try again.'
        }
      }));
    }
  };

  if (formState.isSuccess) {
    return (
      <section className="job-alert-signup success" aria-labelledby="success-heading">
        <div className="success-content">
          <div className="success-icon">🎉</div>
          <h2 id="success-heading" className="success-title">You're All Set!</h2>
          <p className="success-message">
            Welcome to the ClickClickJob community! We've successfully set up your personalized job alerts.
          </p>
          
          <div className="success-benefits">
            <h3>What happens next?</h3>
            <ul>
              <li>
                <span className="benefit-icon">📧</span>
                <div>
                  <strong>Daily Job Matches:</strong> Receive curated remote administrative opportunities that match your criteria
                </div>
              </li>
              <li>
                <span className="benefit-icon">📊</span>
                <div>
                  <strong>Weekly Market Insights:</strong> Get exclusive salary data and industry trends from our editorial team
                </div>
              </li>
              <li>
                <span className="benefit-icon">🎯</span>
                <div>
                  <strong>Editor's Picks:</strong> Hand-selected opportunities with detailed analysis and compensation insights
                </div>
              </li>
              <li>
                <span className="benefit-icon">🚀</span>
                <div>
                  <strong>Career Resources:</strong> Access to our complete remote work guides and professional development tips
                </div>
              </li>
            </ul>
          </div>

          <div className="success-actions">
            <button 
              className="btn-primary"
              onClick={() => window.location.href = '/jobs'}
              aria-label="Browse current job openings"
            >
              Browse Current Opportunities
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setFormState({ ...formState, isSuccess: false })}
              aria-label="Set up another job alert"
            >
              Create Another Alert
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="job-alert-signup" aria-labelledby="signup-heading">
      <div className="signup-header">
        <h2 id="signup-heading" className="signup-title">
          <span className="title-accent">Never Miss</span>
          Your Perfect Remote Administrative Role
        </h2>
        <p className="signup-subtitle">
          Join thousands of administrative professionals who trust ClickClickJob to deliver curated, 
          high-quality remote opportunities directly to their inbox. Our editorial team analyzes over 
          4,200 positions weekly to bring you only the best matches.
        </p>
        
        <div className="value-propositions">
          <div className="value-prop">
            <span className="value-icon">🎯</span>
            <span>Hand-curated opportunities</span>
          </div>
          <div className="value-prop">
            <span className="value-icon">💰</span>
            <span>Salary insights & analysis</span>
          </div>
          <div className="value-prop">
            <span className="value-icon">🌍</span>
            <span>Global remote positions</span>
          </div>
          <div className="value-prop">
            <span className="value-icon">⚡</span>
            <span>First access to new jobs</span>
          </div>
        </div>
      </div>

      <form className="signup-form" onSubmit={handleSubmit} noValidate>
        <div className="form-section">
          <h3 className="section-title">Personal Information</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                First Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`form-input ${formState.errors.firstName ? 'error' : ''}`}
                placeholder="Enter your first name"
                required
              />
              {formState.errors.firstName && (
                <span className="error-message" role="alert">{formState.errors.firstName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">Last Name</label>
              <input
                type="text"
                id="lastName" 
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter your last name"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`form-input ${formState.errors.email ? 'error' : ''}`}
              placeholder="your.email@example.com"
              required
            />
            {formState.errors.email && (
              <span className="error-message" role="alert">{formState.errors.email}</span>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Experience & Preferences</h3>
          
          <div className="form-group">
            <label htmlFor="experienceLevel" className="form-label">
              Experience Level <span className="required">*</span>
            </label>
            <select
              id="experienceLevel"
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className={`form-select ${formState.errors.experienceLevel ? 'error' : ''}`}
              required
            >
              <option value="">Select your experience level</option>
              {experienceLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label} - {level.salary}
                </option>
              ))}
            </select>
            {formState.errors.experienceLevel && (
              <span className="error-message" role="alert">{formState.errors.experienceLevel}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Job Types of Interest <span className="required">*</span>
            </label>
            <div className="checkbox-grid">
              {jobTypes.map(jobType => (
                <label key={jobType} className="checkbox-label">
                  <input
                    type="checkbox"
                    name="jobTypes"
                    value={jobType}
                    checked={formData.jobTypes.includes(jobType)}
                    onChange={handleInputChange}
                    className="checkbox-input"
                  />
                  <span className="checkbox-text">{jobType}</span>
                </label>
              ))}
            </div>
            {formState.errors.jobTypes && (
              <span className="error-message" role="alert">{formState.errors.jobTypes}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="salaryMin" className="form-label">Minimum Salary</label>
              <select
                id="salaryMin"
                name="salaryMin"
                value={formData.salaryMin}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">No minimum</option>
                <option value="30000">$30,000+</option>
                <option value="35000">$35,000+</option>
                <option value="40000">$40,000+</option>
                <option value="45000">$45,000+</option>
                <option value="50000">$50,000+</option>
                <option value="55000">$55,000+</option>
                <option value="60000">$60,000+</option>
                <option value="70000">$70,000+</option>
                <option value="80000">$80,000+</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="preferredSchedule" className="form-label">Schedule Preference</label>
              <select
                id="preferredSchedule"
                name="preferredSchedule"
                value={formData.preferredSchedule}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">Any schedule</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="flexible">Flexible hours</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="remotePreference" className="form-label">Remote Work Preference</label>
            <select
              id="remotePreference"
              name="remotePreference"
              value={formData.remotePreference}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="fully-remote">Fully Remote Only</option>
              <option value="hybrid-ok">Hybrid Acceptable</option>
              <option value="occasional-travel">Occasional Travel OK</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Skills & Expertise</h3>
          
          <div className="form-group">
            <label className="form-label">Select Your Skills</label>
            <div className="skills-grid">
              {commonSkills.map(skill => (
                <label key={skill} className="skill-checkbox">
                  <input
                    type="checkbox"
                    name="skills"
                    value={skill}
                    checked={formData.skills.includes(skill)}
                    onChange={handleInputChange}
                    className="checkbox-input"
                  />
                  <span className="skill-text">{skill}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="customSkill" className="form-label">Add Custom Skill</label>
            <div className="custom-skill-input">
              <input
                type="text"
                id="customSkill"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                className="form-input"
                placeholder="Type a skill and press Enter"
              />
              <button
                type="button"
                onClick={addCustomSkill}
                className="add-skill-btn"
                disabled={!customSkill.trim()}
              >
                Add
              </button>
            </div>
          </div>

          {formData.skills.length > 0 && (
            <div className="selected-skills">
              <span className="skills-label">Selected Skills:</span>
              <div className="skills-tags">
                {formData.skills.map(skill => (
                  <span key={skill} className="skill-tag">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="remove-skill"
                      aria-label={`Remove ${skill} skill`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-section">
          <div className="form-group">
            <label className="checkbox-label newsletter-optin">
              <input
                type="checkbox"
                name="newsletterOptIn"
                checked={formData.newsletterOptIn}
                onChange={handleInputChange}
                className="checkbox-input"
              />
              <span className="checkbox-text">
                Send me weekly market insights and remote work tips (recommended)
              </span>
            </label>
          </div>
        </div>

        {formState.errors.submit && (
          <div className="error-message submit-error" role="alert">
            {formState.errors.submit}
          </div>
        )}

        <button
          type="submit"
          disabled={formState.isSubmitting}
          className={`submit-btn ${formState.isSubmitting ? 'submitting' : ''}`}
          aria-label={formState.isSubmitting ? 'Creating your job alert...' : 'Create job alert'}
        >
          {formState.isSubmitting ? (
            <>
              <span className="spinner"></span>
              Creating Your Alert...
            </>
          ) : (
            <>
              <span className="btn-icon">🚀</span>
              Create My Job Alert
            </>
          )}
        </button>

        <p className="privacy-note">
          By submitting this form, you agree to receive job alerts and career insights from ClickClickJob. 
          You can unsubscribe at any time. Read our <a href="/privacy">Privacy Policy</a>.
        </p>
      </form>
    </section>
  );
};

export default JobAlertSignup; 