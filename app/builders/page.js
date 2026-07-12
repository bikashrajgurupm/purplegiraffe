// app/builders/page.js
'use client';

const NAV_LINKS = [
  { label: 'Live Prototype', href: '/#live-prototype' },
  { label: 'App Ideas', href: '/#app-ideas' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Start from \u20b9999', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Meet the Builder', href: '/builders' },
];

export default function BuildersPage() {
  return (
    <div className="pg-home">
      <header className="nav">
        <div className="nav-inner">
          <a href="/" className="nav-brand">
            <img src="/logo.png" alt="" width="28" height="28" />
            <span>Purple Giraffe</span>
          </a>
          <nav className="nav-links">
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
            <a href="/#request" className="nav-cta">Tell us your workflow</a>
          </nav>
        </div>
      </header>

      <section className="builders-hero">
        <p className="section-label">Meet the builders</p>
        <h1>The people behind the apps.</h1>
      </section>

      <footer className="footer">
        <span>Purple Giraffe</span>
        <span>hello@purplegiraffe.ai</span>
      </footer>

      <style jsx>{`
        .pg-home {
          --pg-ink: #1a1523;
          --pg-paper: #faf9fc;
          --pg-card: #ffffff;
          --pg-purple: #8b5cf6;
          --pg-purple-deep: #4c2e9e;
          --pg-amber: #f2a93b;
          --pg-amber-deep: #8a5a10;
          --pg-line: #e4dff0;
          --pg-muted: #6b6478;
          --font-display: 'Space Grotesk', -apple-system, sans-serif;
          --font-mono: 'IBM Plex Mono', 'SFMono-Regular', monospace;
          color: var(--pg-ink);
          background: var(--pg-paper);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .pg-home a:focus-visible,
        .pg-home button:focus-visible {
          outline: 2px solid var(--pg-purple);
          outline-offset: 2px;
        }

        .nav {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(250, 249, 252, 0.92);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--pg-line);
        }
        .nav-inner {
          max-width: 1120px;
          margin: 0 auto;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 1.1rem;
          flex-shrink: 0;
          text-decoration: none;
          color: var(--pg-ink);
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 1.3rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .nav-links a {
          text-decoration: none;
          color: var(--pg-ink);
          font-size: 0.88rem;
        }
        .nav-links a.nav-cta {
          background: var(--pg-ink);
          color: var(--pg-paper);
          padding: 0.5rem 1rem;
          border-radius: 999px;
        }

        .section-label {
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.75rem;
          color: var(--pg-purple-deep);
          margin-bottom: 0.5rem;
        }

        .builders-hero {
          flex: 1;
          max-width: 780px;
          margin: 0 auto;
          padding: 5rem 1.5rem;
          text-align: center;
        }
        .builders-hero h1 {
          font-family: var(--font-display);
          font-size: clamp(2rem, 4.6vw, 3rem);
          font-weight: 600;
          line-height: 1.2;
        }

        .footer {
          max-width: 1120px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: var(--pg-muted);
          font-family: var(--font-mono);
        }

        @media (max-width: 768px) {
          .nav-links {
            gap: 0.8rem;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .pg-home * {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
