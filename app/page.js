// app/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const PROTOTYPES = [
  {
    id: 'copilot',
    index: 'P–01',
    status: 'live',
    statusLabel: 'Live',
    name: 'Purple Giraffe Copilot',
    description:
      'Answers FAQs and debugs live issues for adtech and ad-monetization teams: eCPM drops, waterfall setup, fill-rate troubleshooting.',
    specs: ['Chat + file analysis', 'Built-in knowledge base', 'Free to try'],
    peek: {
      q: 'My eCPM dropped 40% overnight',
      a: "Let's check your waterfall priority first…",
    },
    href: '/apps/copilot',
    cta: 'Try the prototype',
  },
  {
    id: 'healthcare',
    index: 'P–02',
    status: 'planned',
    statusLabel: 'Planned',
    name: 'Healthcare & clinics',
    description:
      'Patient FAQs, appointment triage, and intake support for clinics and small practices.',
    specs: ['Patient-facing chat', 'Appointment triage', 'Intake forms'],
    peek: {
      q: "I've had a headache for 3 days",
      a: 'Let\u2019s ask a few quick questions first…',
    },
    href: null,
    cta: null,
  },
  {
    id: 'finance',
    index: 'P–03',
    status: 'planned',
    statusLabel: 'Planned',
    name: 'Personal finance',
    description:
      "Portfolio tracking and plain-language financial Q&A, built around one person's real accounts and goals.",
    specs: ['Portfolio dashboard', 'Plain-language Q&A', 'Built for one user'],
    peek: {
      q: 'Am I on track to retire by 55?',
      a: 'Based on your savings rate so far…',
    },
    href: null,
    cta: null,
  },
  {
    id: 'yours',
    index: 'P–04',
    status: 'open',
    statusLabel: 'Your idea',
    name: 'Something else',
    description:
      'Not seeing your use case? That is normal this early. Tell us what you need below.',
    specs: [],
    peek: null,
    href: '#request',
    cta: 'Request a build',
  },
];

const CYCLE_WORDS = ['portfolio', 'business', 'app', 'next idea'];

const PELLETS = [
  "You're always in control",
  'Built around how you work',
  'Free to try',
  'Built fast, refined faster',
  'Open process, no lock-in',
];

const USE_CASE_OPTIONS = [
  'AdTech / Purple Giraffe Copilot',
  'Healthcare & clinics',
  'Personal finance',
  'Something else',
];

export default function Home() {
  const [returningUser, setReturningUser] = useState(null);
  const [wordIndex, setWordIndex] = useState(0);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    useCase: '',
    message: '',
  });
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    try {
      const cached = localStorage.getItem('pg_user');
      if (cached) {
        const user = JSON.parse(cached);
        if (user?.email) setReturningUser(user.email);
      }
    } catch (e) {
      // malformed or missing localStorage data — safe to ignore
    }
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % CYCLE_WORDS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const scrollToId = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', company: '', useCase: '', message: '' });
      } else {
        setStatus('error');
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMsg('Something went wrong sending your request. Please try again or email us directly.');
    }
  };

  return (
    <div className="pg-home">
      <header className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <img src="/logo.png" alt="" width="28" height="28" />
            <span>Purple Giraffe</span>
          </div>
          <nav className="nav-links">
            <a href="#prototypes" onClick={scrollToId('prototypes')}>Prototypes</a>
            <a href="#request" className="nav-cta" onClick={scrollToId('request')}>Request a build</a>
          </nav>
        </div>
      </header>

      {returningUser && (
        <div className="returning-banner">
          <span>Signed in as {returningUser} on Purple Giraffe Copilot</span>
          <Link href="/apps/copilot">Continue →</Link>
        </div>
      )}

      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <p className="eyebrow">AI that builds with you</p>
        <h1>
          Build your{' '}
          <span className="cycle-word" key={CYCLE_WORDS[wordIndex]}>
            {CYCLE_WORDS[wordIndex]}
          </span>
          , in minutes.
        </h1>
        <p className="hero-sub">
          From a personal portfolio to a full business application, whatever you&apos;re
          picturing, we&apos;ll build a working version of it, fast. You stay in control
          the whole way: customize it, try it for free, and only pay once it&apos;s
          actually yours.
        </p>
        <div className="hero-actions">
          <a href="#prototypes" className="btn btn-primary" onClick={scrollToId('prototypes')}>
            Explore prototypes
          </a>
          <a href="#request" className="btn btn-ghost" onClick={scrollToId('request')}>
            Request a build
          </a>
        </div>
      </section>

      <section className="pellets">
        <ul className="pellets-list">
          {PELLETS.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <section className="how">
        <div className="how-step">
          <span className="how-num">01</span>
          <h3>Browse a prototype</h3>
          <p>Find the closest match to what you need, or tell us there isn&apos;t one yet.</p>
        </div>
        <div className="how-step">
          <span className="how-num">02</span>
          <h3>Request a build</h3>
          <p>Send us your use case. We&apos;ll scope what a version for your business looks like.</p>
        </div>
        <div className="how-step">
          <span className="how-num">03</span>
          <h3>We build it with you</h3>
          <p>You get a working application shaped around your workflow, not a generic template.</p>
        </div>
      </section>

      <section className="gallery" id="prototypes">
        <h2>Prototypes</h2>
        <p className="gallery-legend">
          <strong>Live</strong> ones are ready to click into and try right now. Everything
          else just hasn&apos;t been pre-built yet — we can build any of it for you. Tell us
          your version below.
        </p>
        <div className="gallery-grid">
          {PROTOTYPES.map((p) => (
            <article className={`card card-${p.status}`} key={p.id}>
              <div className="card-top">
                <span className="card-index">{p.index}</span>
                <span className={`stamp stamp-${p.status}`}>{p.statusLabel}</span>
              </div>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              {p.peek && (
                <div className="card-peek" aria-hidden="true">
                  <div className="peek-bubble peek-q">{p.peek.q}</div>
                  <div className="peek-bubble peek-a">{p.peek.a}</div>
                </div>
              )}
              {p.specs.length > 0 && (
                <ul className="card-specs">
                  {p.specs.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              )}
              {p.href && p.href.startsWith('/') ? (
                <Link href={p.href} className="card-cta">
                  {p.cta} →
                </Link>
              ) : p.href ? (
                <a href={p.href} className="card-cta" onClick={scrollToId('request')}>
                  {p.cta} →
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="request" id="request">
        <div className="request-inner">
          <h2>Tell us what you need</h2>
          <p>A few details and we&apos;ll follow up with what a prototype for your business could look like.</p>

          {status === 'success' ? (
            <div className="form-success">
              Thanks — we&apos;ve got your request and will follow up by email.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="request-form">
              <div className="form-row">
                <label>
                  Name
                  <input type="text" value={form.name} onChange={handleChange('name')} required />
                </label>
                <label>
                  Email
                  <input type="email" value={form.email} onChange={handleChange('email')} required />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Company (optional)
                  <input type="text" value={form.company} onChange={handleChange('company')} />
                </label>
                <label>
                  Closest prototype
                  <select value={form.useCase} onChange={handleChange('useCase')}>
                    <option value="">Select one</option>
                    {USE_CASE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Tell us more
                <textarea
                  rows="4"
                  value={form.message}
                  onChange={handleChange('message')}
                  placeholder="What should this application do, and who is it for?"
                />
              </label>
              {status === 'error' && <div className="form-error">{errorMsg}</div>}
              <button type="submit" className="btn btn-primary" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Sending…' : 'Send request'}
              </button>
            </form>
          )}
        </div>
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
        }

        .pg-home a:focus-visible,
        .pg-home button:focus-visible,
        .pg-home input:focus-visible,
        .pg-home select:focus-visible,
        .pg-home textarea:focus-visible {
          outline: 2px solid var(--pg-purple);
          outline-offset: 2px;
        }

        .nav {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(250, 249, 252, 0.88);
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
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .nav-links a {
          text-decoration: none;
          color: var(--pg-ink);
          font-size: 0.9rem;
        }
        .nav-links a.nav-cta {
          background: var(--pg-ink);
          color: var(--pg-paper);
          padding: 0.5rem 1rem;
          border-radius: 999px;
        }

        .returning-banner {
          background: var(--pg-purple);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          padding: 0.6rem 1.5rem;
          font-size: 0.9rem;
          text-align: center;
          flex-wrap: wrap;
        }
        .returning-banner a {
          color: white;
          font-weight: 600;
          text-decoration: underline;
        }

        .hero {
          position: relative;
          overflow: hidden;
          max-width: 780px;
          margin: 0 auto;
          padding: 5rem 1.5rem 4rem;
          text-align: center;
        }
        .hero-glow {
          position: absolute;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          width: 680px;
          height: 420px;
          background: radial-gradient(closest-side, rgba(139, 92, 246, 0.16), transparent);
          filter: blur(6px);
          z-index: 0;
          pointer-events: none;
        }
        .eyebrow {
          position: relative;
          z-index: 1;
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.75rem;
          color: var(--pg-purple-deep);
          margin-bottom: 1rem;
        }
        .hero h1 {
          position: relative;
          z-index: 1;
          font-family: var(--font-display);
          font-size: clamp(2.25rem, 5vw, 3.5rem);
          font-weight: 600;
          line-height: 1.15;
          margin-bottom: 1.25rem;
        }
        .cycle-word {
          display: inline-block;
          color: var(--pg-purple-deep);
          animation: cycleIn 0.4s ease;
        }
        @keyframes cycleIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .hero-sub {
          position: relative;
          z-index: 1;
          font-size: 1.125rem;
          line-height: 1.7;
          color: var(--pg-muted);
          margin-bottom: 2.25rem;
        }
        .hero-actions {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.8rem 1.5rem;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 500;
          text-decoration: none;
          border: 1px solid transparent;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;
        }
        .btn-primary {
          background: var(--pg-ink);
          color: var(--pg-paper);
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          background: var(--pg-purple-deep);
        }
        .btn-ghost {
          background: transparent;
          border-color: var(--pg-line);
          color: var(--pg-ink);
        }
        .btn-ghost:hover {
          border-color: var(--pg-purple);
          color: var(--pg-purple-deep);
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .pellets {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 1.5rem 3rem;
        }
        .pellets-list {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.75rem;
        }
        .pellets-list li {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--pg-purple-deep);
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid var(--pg-line);
          border-radius: 999px;
          padding: 0.5rem 1rem;
        }

        .how {
          max-width: 1120px;
          margin: 0 auto;
          padding: 3.5rem 1.5rem 5rem;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          border-top: 1px solid var(--pg-line);
        }
        .how-step {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .how-num {
          font-family: var(--font-mono);
          color: var(--pg-purple);
          font-size: 0.85rem;
          letter-spacing: 0.05em;
        }
        .how-step h3 {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 600;
        }
        .how-step p {
          color: var(--pg-muted);
          line-height: 1.6;
          font-size: 0.95rem;
        }

        .gallery {
          max-width: 1120px;
          margin: 0 auto;
          padding: 1rem 1.5rem 5rem;
        }
        .gallery h2 {
          font-family: var(--font-display);
          font-size: 1.75rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }
        .gallery-legend {
          color: var(--pg-muted);
          font-size: 0.9rem;
          line-height: 1.6;
          max-width: 640px;
          margin-bottom: 2rem;
        }
        .gallery-legend strong {
          color: var(--pg-amber-deep);
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        .card {
          background: var(--pg-card);
          border: 1px solid var(--pg-line);
          border-radius: 14px;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.9rem;
        }
        .card.card-live {
          border-color: var(--pg-purple);
          box-shadow: 0 8px 24px -14px rgba(139, 92, 246, 0.45);
        }
        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .card-index {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--pg-muted);
        }
        .stamp {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          transform: rotate(-4deg);
          border: 1px dashed currentColor;
        }
        .stamp.stamp-live {
          color: var(--pg-amber-deep);
          background: rgba(242, 169, 59, 0.18);
          border-style: solid;
        }
        .stamp.stamp-planned {
          color: var(--pg-purple-deep);
          background: rgba(139, 92, 246, 0.08);
        }
        .stamp.stamp-open {
          color: var(--pg-muted);
          background: rgba(107, 100, 120, 0.08);
        }
        .card h3 {
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 600;
        }
        .card p {
          color: var(--pg-muted);
          line-height: 1.6;
          font-size: 0.95rem;
        }
        .card-specs {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--pg-purple-deep);
        }
        .card-specs li::before {
          content: '· ';
          color: var(--pg-purple);
        }
        .card-peek {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          background: var(--pg-paper);
          border: 1px solid var(--pg-line);
          border-radius: 10px;
          padding: 0.75rem;
        }
        .peek-bubble {
          font-size: 0.8rem;
          line-height: 1.4;
          padding: 0.45rem 0.7rem;
          border-radius: 8px;
          max-width: 90%;
        }
        .peek-q {
          align-self: flex-end;
          background: var(--pg-ink);
          color: var(--pg-paper);
        }
        .peek-a {
          align-self: flex-start;
          background: rgba(139, 92, 246, 0.1);
          color: var(--pg-purple-deep);
        }
        .card :global(.card-cta) {
          margin-top: auto;
          align-self: flex-start;
          text-decoration: none;
          font-weight: 600;
          color: var(--pg-ink);
          border-bottom: 2px solid var(--pg-purple);
          padding-bottom: 0.15rem;
        }
        .card :global(.card-cta:hover) {
          color: var(--pg-purple-deep);
        }

        .request {
          background: var(--pg-ink);
          color: var(--pg-paper);
          padding: 5rem 1.5rem;
        }
        .request-inner {
          max-width: 640px;
          margin: 0 auto;
        }
        .request-inner h2 {
          font-family: var(--font-display);
          font-size: 1.85rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .request-inner > p {
          color: rgba(250, 249, 252, 0.7);
          margin-bottom: 2rem;
        }
        .request-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.1rem;
        }
        .request-form label {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.85rem;
          color: rgba(250, 249, 252, 0.75);
        }
        .request-form input,
        .request-form select,
        .request-form textarea {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 8px;
          padding: 0.7rem 0.85rem;
          color: var(--pg-paper);
          font-size: 0.95rem;
          font-family: inherit;
        }
        .request-form textarea {
          resize: vertical;
          min-height: 100px;
        }
        .request-form select option {
          color: var(--pg-ink);
        }
        .request .btn-primary {
          background: var(--pg-purple);
          align-self: flex-start;
        }
        .request .btn-primary:hover {
          background: var(--pg-amber);
          color: var(--pg-ink);
        }
        .form-error {
          color: #ffb4b4;
          font-size: 0.85rem;
        }
        .form-success {
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid var(--pg-purple);
          border-radius: 10px;
          padding: 1.25rem;
          font-size: 1rem;
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
          .how {
            grid-template-columns: 1fr;
          }
          .gallery-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
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
