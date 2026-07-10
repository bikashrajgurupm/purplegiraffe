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

      <div className="info-panel">
        <p>
          Copilot is free to use. Try 10 questions without signing up, or sign
          up (still free) for unlimited questions and chat history saved to
          your account.
        </p>
        {user ? (
          <div className="signed-up-note">You&apos;re signed in &mdash; unlimited questions.</div>
        ) : (
          <button className="tier-button" onClick={onSignupClick}>Sign up free</button>
        )}
      </div>

      <div className="build-callout">
        <h4>Need a private tool for your workflow?</h4>
        <p>
          Tell us what you are trying to manage, track or simplify.
        </p>
        <Link href="/#request" className="build-callout-cta">Request a private build &rarr;</Link>
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

        .info-panel {
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .info-panel p {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0 0 0.85rem 0;
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
