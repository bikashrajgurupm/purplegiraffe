// components/PricingTiers.js
'use client';
import { useState } from 'react';

export default function PricingTiers({ user, currentTier = 'limited' }) {
  const [selectedTier, setSelectedTier] = useState(null);

  // Determine actual tier - if no user or not logged in, they're on limited plan
  const actualTier = user ? (currentTier || 'free') : 'limited';

  const tiers = [
    {
      id: 'free',
      name: 'Community Member',
      price: 'FREE',
      period: 'forever',
      icon: '💚',
      requiresSignup: true,
      features: [
        'Unlimited debugging questions',
        'Weekly newsletter with trends',
        "FAQ's and trending issues"
      ],
      buttonText: actualTier === 'free' ? 'Current Plan' : (user ? 'Switch to Free' : 'Sign Up Free'),
      buttonClass: actualTier === 'free' ? 'current' : 'free',
      disabled: actualTier === 'free'
    },
    {
      id: 'pro',
      name: 'Pro Optimizer',
      price: '₹2,499',
      period: '/month',
      icon: '💜',
      badge: 'COMING SOON',
      requiresSignup: true,
      features: [
        'Screenshot & file upload analysis',
        'Full chat history preservation',
        'Expert knowledge base access',
        '3x faster priority responses'
      ],
      buttonText: 'Coming Soon',
      buttonClass: 'disabled',
      disabled: true
    },
    {
      id: 'elite',
      name: 'Elite Partner',
      price: '₹14,999',
      period: '/month',
      icon: '💎',
      badge: 'COMING SOON',
      requiresSignup: true,
      features: [
        '40 hours monthly expert consultation',
        'Priority human support (12hr response)',
        'Custom implementation assistance'
      ],
      buttonText: 'Coming Soon',
      buttonClass: 'disabled',
      disabled: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      icon: '🏢',
      badge: 'COMING SOON',
      features: [
        'Unlimited consultations',
        'Dedicated account manager',
        'Custom AI training'
      ],
      buttonText: 'Contact Sales',
      buttonClass: 'disabled',
      disabled: true
    }
  ];

  const handleUpgrade = (tierId) => {
    if (tierId === actualTier) return;
    
    // If user is not logged in, prompt to sign up
    if (!user) {
      alert('Please sign up or login to unlock unlimited access');
      return;
    }
    
    setSelectedTier(tierId);
    if (tierId !== 'free') {
      alert(`${tierId === 'enterprise' ? 'Enterprise' : 'Premium'} tiers coming soon!`);
    }
  };

  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h3 className="pricing-title">Choose Your Plan</h3>
        {actualTier === 'limited' && (
          <div className="limited-alert">
            ⚠️ <span>10 questions limit - Sign up for unlimited!</span>
          </div>
        )}
      </div>

      <div className="tiers-grid">
        {tiers.map((tier) => (
          <div 
            key={tier.id} 
            className={`tier-card ${actualTier === tier.id ? 'current' : ''} ${tier.id === 'enterprise' ? 'enterprise' : ''}`}
          >
            {tier.badge && <span className="tier-badge">{tier.badge}</span>}
            
            <div className="tier-header">
              <span className="tier-icon">{tier.icon}</span>
              <div className="tier-info">
                <div className="tier-name">{tier.name}</div>
                <div className="tier-price">
                  {tier.price}
                  {tier.period && <span className="tier-period">{tier.period}</span>}
                </div>
              </div>
            </div>

            <ul className="tier-features">
              {tier.features.map((feature, index) => (
                <li key={index}>
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              className={`tier-button ${tier.buttonClass}`}
              onClick={() => handleUpgrade(tier.id)}
              disabled={tier.disabled}
            >
              {tier.buttonText}
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .pricing-container {
          padding: 1rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg-primary);
        }

        .pricing-header {
          margin-bottom: 1rem;
        }

        .pricing-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .limited-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tiers-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          flex: 1;
          overflow-y: auto;
        }

        .tier-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.875rem;
          position: relative;
          display: flex;
          flex-direction: column;
          transition: all 0.2s;
        }

        .tier-card:hover {
          border-color: var(--primary-purple);
          transform: translateY(-2px);
        }

        .tier-card.current {
          border-color: #10b981;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), var(--bg-secondary));
        }

        .tier-card.enterprise {
          background: linear-gradient(135deg, rgba(249, 115, 22, 0.05), var(--bg-secondary));
        }

        .tier-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: rgba(139, 92, 246, 0.2);
          color: var(--primary-purple);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-size: 0.5rem;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .tier-header {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          margin-bottom: 0.75rem;
        }

        .tier-icon {
          font-size: 1.25rem;
          line-height: 1;
        }

        .tier-info {
          flex: 1;
        }

        .tier-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.2;
          margin-bottom: 0.25rem;
        }

        .tier-price {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
        }

        .tier-period {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 400;
        }

        .tier-features {
          list-style: none;
          padding: 0;
          margin: 0 0 0.875rem 0;
          flex: 1;
        }

        .tier-features li {
          display: flex;
          align-items: flex-start;
          gap: 0.375rem;
          font-size: 0.6875rem;
          color: var(--text-secondary);
          line-height: 1.3;
          margin-bottom: 0.375rem;
        }

        .tier-features li:last-child {
          margin-bottom: 0;
        }

        .tier-features svg {
          color: #10b981;
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .tier-button {
          width: 100%;
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tier-button.free {
          background: #10b981;
          color: white;
        }

        .tier-button.free:hover:not(:disabled) {
          background: #059669;
        }

        .tier-button.current {
          background: var(--bg-primary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          cursor: default;
        }

        .tier-button.disabled {
          background: var(--bg-primary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Responsive for very small heights */
        @media (max-height: 700px) {
          .pricing-container {
            padding: 0.75rem;
          }
          
          .tiers-grid {
            gap: 0.5rem;
          }
          
          .tier-card {
            padding: 0.75rem;
          }
          
          .tier-features li {
            font-size: 0.625rem;
            margin-bottom: 0.25rem;
          }
        }

        /* Single column for narrow sidebars */
        @media (max-width: 400px) {
          .tiers-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Scrollbar styling */
        .tiers-grid::-webkit-scrollbar {
          width: 4px;
        }

        .tiers-grid::-webkit-scrollbar-track {
          background: var(--bg-primary);
        }

        .tiers-grid::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 2px;
        }

        .tiers-grid::-webkit-scrollbar-thumb:hover {
          background: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
