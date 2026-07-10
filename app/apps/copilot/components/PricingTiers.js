// app/apps/copilot/components/PricingTiers.js
'use client';
import Link from 'next/link';

export default function PricingTiers({
  user,
  onSignupClick,
}) {
  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h3 className="pricing-title">Using Purple Giraffe Copilot</h3>
        {!user && (
          <div className="limited-alert">
            <span>10 free questions to try, no signup needed.</span>
          </div>
        )}
      </div>

      <div className="free-card">
        <div className="free-card-header">
          <span className="free-icon">&#128640;</span>
          <div>
            <h4>Free to use</h4>
            <p className="free-price">&#8377;0</p>
          </div>
        </div>
        <ul className="free-features">
          <li>10 questions to try, no signup needed</li>
          <li>Unlimited questions once you sign up (still free)</li>
          <li>Chat history saved to your account</li>
        </ul>
        {user ? (
          <div className="signed-up-note">You&apos;re signed in &mdash; unlimited questions.</div>
        ) : (
          <button className="tier-button" onClick={onSignupClick}>Sign up free</button>
        )}
      </div>

      <div className="build-callout">
        <h4>Want a private tool for your workflow?</h4>
        <p>
          Tell us your process and we&apos;ll suggest whether it needs a simple app, a
          dashboard, an automation, or an AI-assisted tool.
        </p>
        <Link href="/#request" className="build-callout-cta">Request a build &rarr;</Link>
      </div>

      <p className="pricing-footnote">
        Copilot is one example of what Purple Giraffe builds. Most projects are
        practical business apps, priced separately from this tool.
      </p>

      <style jsx>{`
        .pricing-container {
          padding: 1rem;
          height: 100%;
          display: flex;
          flex-direction: column;
          background: var(--bg-primary);
          overflow-y: auto;
        }

        .pricing-header {
          margin-bottom: 1rem;
        }

        .pricing-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
        }

        .limited-alert {
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid rgba(139, 92, 246, 0.25);
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          color: var(--primary-dark);
          margin-bottom: 0.5rem;
        }

        .free-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .free-card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .free-icon {
          font-size: 1.5rem;
          line-height: 1;
        }

        .free-card-header h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.15rem 0;
        }

        .free-price {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .free-features {
          list-style: none;
          padding: 0;
          margin: 0 0 1rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .free-features li {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
          padding-left: 0.9rem;
          position: relative;
        }

        .free-features li::before {
          content: '\u2013';
          position: absolute;
          left: 0;
          color: var(--primary-purple);
        }

        .tier-button {
          width: 100%;
          padding: 0.625rem;
          border-radius: 6px;
          font-size: 0.813rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          background: var(--primary-purple);
          color: white;
          transition: background 0.2s;
        }

        .tier-button:hover {
          background: var(--primary-dark);
        }

        .signed-up-note {
          font-size: 0.8rem;
          color: #10b981;
          font-weight: 500;
        }

        .build-callout {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .build-callout h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.4rem 0;
        }

        .build-callout p {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 0.6rem 0;
        }

        .build-callout :global(.build-callout-cta) {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--primary-purple);
          text-decoration: none;
        }

        .build-callout :global(.build-callout-cta:hover) {
          color: var(--primary-dark);
        }

        .pricing-footnote {
          font-size: 0.7rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-top: auto;
        }

        .pricing-container::-webkit-scrollbar {
          width: 6px;
        }
        .pricing-container::-webkit-scrollbar-track {
          background: var(--bg-primary);
        }
        .pricing-container::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 3px;
        }
        .pricing-container::-webkit-scrollbar-thumb:hover {
          background: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
