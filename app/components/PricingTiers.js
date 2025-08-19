// components/PricingTiers.js
'use client';
import { useState } from 'react';

export default function PricingTiers({ user, currentTier = 'free' }) {
  const [selectedTier, setSelectedTier] = useState(null);

  const tiers = [
    {
      id: 'free',
      name: 'Community Member',
      price: 'FREE',
      period: 'forever',
      icon: '🎯',
      features: [
        'Unlimited debugging questions',
        'Community access & knowledge sharing',
        'Weekly newsletter with trends',
        'Basic AI assistance 24/7',
        'Member badge'
      ],
      buttonText: 'Current Plan',
      buttonClass: 'secondary',
      disabled: currentTier === 'free'
    },
    {
      id: 'pro',
      name: 'Pro Optimizer',
      price: '$29',
      period: '/month',
      icon: '💜',
      badge: 'MOST POPULAR',
      features: [
        'Everything in Community',
        'Screenshot & file upload analysis',
        'Full chat history preservation',
        'Expert knowledge base access',
        'Custom optimization reports',
        '3x faster priority responses'
      ],
      buttonText: currentTier === 'pro' ? 'Current Plan' : 'Upgrade to Pro',
      buttonClass: 'primary',
      disabled: currentTier === 'pro'
    },
    {
      id: 'elite',
      name: 'Elite Partner',
      price: '$149',
      period: '/month',
      icon: '💎',
      features: [
        'Everything in Pro',
        '10 hours monthly expert consultation',
        'Priority human support (2hr response)',
        'Custom implementation assistance',
        'Monthly 1-on-1 strategy sessions',
        'VIP community access'
      ],
      buttonText: currentTier === 'elite' ? 'Current Plan' : 'Become Elite',
      buttonClass: 'primary gradient',
      disabled: currentTier === 'elite'
    }
  ];

  const handleUpgrade = (tierId) => {
    if (tierId === currentTier) return;
    
    // For now, just show alert - we'll implement actual upgrade logic later
    if (!user) {
      alert('Please sign up or login to upgrade your plan');
      return;
    }
    
    setSelectedTier(tierId);
    alert(`Upgrade to ${tierId} tier - Payment integration coming soon!`);
  };

  return (
    <div className="pricing-tiers-container">
      <div className="sidebar-content">
        <h3 className="sidebar-title">
          <span style={{ marginRight: '8px' }}>🚀</span>
          Upgrade Your Experience
        </h3>
        
        {/* Current Plan Status */}
        {user && (
          <div className="current-plan-status">
            <div className="plan-status-header">
              <span className="status-label">Your Current Plan</span>
              <span className="status-value">{tiers.find(t => t.id === currentTier)?.name}</span>
            </div>
            {currentTier === 'free' && (
              <div className="upgrade-prompt">
                <span>🎯 Unlock premium features for better monetization insights</span>
              </div>
            )}
          </div>
        )}

        {/* Tier Cards */}
        <div className="tier-cards">
          {tiers.map((tier) => (
            <div 
              key={tier.id} 
              className={`pricing-card ${tier.id === 'pro' ? 'premium' : ''} ${currentTier === tier.id ? 'current' : ''}`}
            >
              {tier.badge && <span className="card-badge">{tier.badge}</span>}
              
              <div className="card-header">
                <div className="card-icon">{tier.icon}</div>
                <h4>{tier.name}</h4>
                <div className="price">
                  <span className="amount">{tier.price}</span>
                  <span className="period">{tier.period}</span>
                </div>
              </div>

              <ul className="features-list">
                {tier.features.map((feature, index) => (
                  <li key={index}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`upgrade-btn ${tier.buttonClass}`}
                onClick={() => handleUpgrade(tier.id)}
                disabled={tier.disabled}
              >
                {tier.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* Contact for Enterprise */}
        <div className="enterprise-contact">
          <div className="contact-card">
            <h5>🏢 Need Enterprise?</h5>
            <p>Custom solutions for large teams</p>
            <a href="mailto:enterprise@purplegiraffe.ai" className="contact-link">
              Contact Sales →
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pricing-tiers-container {
          height: 100%;
          overflow-y: auto;
        }

        .current-plan-status {
          background: var(--bg-secondary);
          border-radius: 0.75rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
          border: 1px solid var(--border-color);
        }

        .plan-status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .status-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--primary-purple);
        }

        .upgrade-prompt {
          font-size: 0.813rem;
          color: var(--text-secondary);
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border-color);
        }

        .tier-cards {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .pricing-card.current {
          border-color: var(--success-green);
          background: linear-gradient(to bottom, rgba(16, 185, 129, 0.05), var(--bg-primary));
        }

        .enterprise-contact {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border-color);
        }

        .contact-card {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(107, 70, 193, 0.05));
          border: 1px solid var(--primary-purple);
          border-radius: 0.75rem;
          padding: 1.25rem;
          text-align: center;
        }

        .contact-card h5 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .contact-card p {
          font-size: 0.813rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
        }

        .contact-link {
          display: inline-block;
          color: var(--primary-purple);
          font-weight: 600;
          font-size: 0.875rem;
          text-decoration: none;
          transition: transform 0.2s;
        }

        .contact-link:hover {
          transform: translateX(4px);
        }

        /* Responsive adjustments */
        @media (max-width: 1400px) {
          .pricing-card .features-list {
            font-size: 0.813rem;
          }
        }
      `}</style>
    </div>
  );
}
