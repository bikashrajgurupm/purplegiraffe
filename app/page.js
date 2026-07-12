// app/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const HERO_WORDS = ['clinic desk', 'delivery tracker', 'booking board', 'customer portal', 'order dashboard', 'personal tool', 'lead tracker', 'inventory tracker', 'staff schedule', 'restaurant board', 'member roster', 'document assistant', 'travel planner', 'meal planner', 'workflow app'];

const NAV_LINKS = [
  { label: 'Live Prototype', href: '#live-prototype' },
  { label: 'App Ideas', href: '#app-ideas' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Start from \u20b9999', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const APP_IDEAS = [
  {
    id: 'docs',
    group: 'business',
    title: 'AI Doc Whisperer',
    eyebrow: 'For B2B teams \u2014 HR, legal, compliance and training',
    copy: 'Built on the same technology as Purple Giraffe Copilot: ask questions about your own documents and get grounded answers, not guesses. Upload PDFs, Word files or website content, summarise, compare versions, extract action items, or turn them into checklists.',
    tiny: 'Could become an Employee Handbook Assistant, a Policy Copilot, or a Course Material Assistant.',
    cta: 'Build something like this',
    tryHref: '/apps/copilot',
    tryLabel: 'Try Copilot',
    featured: true,
  },
  {
    id: 'leads',
    group: 'business',
    title: 'Lead Nest',
    eyebrow: 'For sales and enquiries',
    copy: 'Capture enquiries, track status, add notes, set reminders and see who needs a follow-up today.',
    tiny: "Because 'I'll remember' isn't a CRM.",
    cta: 'Build something like this',
  },
  {
    id: 'inventory',
    group: 'business',
    title: 'Stock Goblin',
    eyebrow: 'For inventory and reorders',
    copy: 'Track stock, suppliers, daily usage, low-stock alerts and reorder history without living inside Excel.',
    tiny: 'A tiny app that nags before things run out.',
    cta: 'Build something like this',
  },
  {
    id: 'shifts',
    group: 'business',
    title: 'Shift Shepherd',
    eyebrow: 'For teams with rotating shifts',
    copy: 'Build staff schedules, handle swap requests, confirm shifts and spot coverage gaps before they become a problem.',
    tiny: "No more 'wait, who's working Saturday?'",
    cta: 'Build something like this',
  },
  {
    id: 'booking',
    group: 'customers',
    title: 'Booking Board',
    eyebrow: 'For services and appointments',
    copy: 'Manage booking requests, slots, customer details, reminders, cancellations and follow-ups.',
    tiny: 'For salons, tutors, trainers, consultants, clinics and classes.',
    cta: 'Build something like this',
  },
  {
    id: 'restaurant',
    group: 'customers',
    title: 'Table Turner',
    eyebrow: 'For cafes, restaurants and small eateries',
    copy: 'Manage table status, walk-in waitlists, takeaway orders and daily specials without a clipboard.',
    tiny: 'Because the clipboard always goes missing at 1pm.',
    cta: 'Build something like this',
  },
  {
    id: 'dental',
    group: 'customers',
    title: 'Dental Clinic Desk',
    eyebrow: 'For clinics and appointment-heavy businesses',
    copy: 'Manage appointments, patient follow-ups, payments, treatment status, reminders and front-desk tasks in one place.',
    tiny: 'No medical advice. Just cleaner clinic operations.',
    cta: 'Build something like this',
  },
  {
    id: 'delivery',
    group: 'customers',
    title: 'Delivery Command Board',
    eyebrow: 'For delivery and local operations',
    copy: 'Track orders, pickups, drops, riders, payment collection, failed deliveries, COD status and daily dispatches.',
    tiny: "For when 'Where is this order?' becomes your full-time job.",
    cta: 'Build something like this',
  },
  {
    id: 'membership',
    group: 'customers',
    title: 'Membership Minder',
    eyebrow: 'For gyms, studios and clubs',
    copy: 'Track memberships, renewals, attendance, class bookings and payment status in one place.',
    tiny: 'So renewals stop happening by accident.',
    cta: 'Build something like this',
  },
  {
    id: 'custom-orders',
    group: 'customers',
    title: 'Custom Order Studio',
    eyebrow: 'For made-to-order businesses',
    copy: 'Track custom orders, due dates, advances, delivery notes, customer preferences, add-ons and staff tasks.',
    tiny: 'Useful for bakeries, boutiques, catering, gifts and custom work.',
    cta: 'Build something like this',
  },
  {
    id: 'personal',
    group: 'yourself',
    title: 'Personal Command Center',
    eyebrow: 'For personal workflows',
    copy: 'A private tool for habits, study plans, family tasks, budgeting, collections, routines or anything you keep rebuilding in spreadsheets.',
    tiny: 'Your weird system, but cleaner.',
    cta: 'Build my personal tool',
  },
  {
    id: 'travel',
    group: 'yourself',
    title: 'Trip Sketchpad',
    eyebrow: 'For personal travel planning',
    copy: 'Plan itineraries, track bookings, split costs with travel companions and keep every confirmation in one place.',
    tiny: 'Fewer tabs. Fewer screenshots. One trip plan.',
    cta: 'Build something like this',
  },
  {
    id: 'recipes',
    group: 'yourself',
    title: 'Recipe Rescue',
    eyebrow: 'For home cooking and meal planning',
    copy: "Save recipes, plan the week's meals, and auto-build a grocery list from what you're actually cooking.",
    tiny: "Because 'what's for dinner' shouldn't be a crisis.",
    cta: 'Build something like this',
  },
];


const IDEA_GROUPS = [
  { key: 'business', label: 'For your business' },
  { key: 'customers', label: 'For your customers' },
  { key: 'yourself', label: 'For yourself' },
];

const HOW_IT_WORKS = [
  { title: 'Show us the mess', text: 'Send the spreadsheet, WhatsApp flow, screenshots, notes, or just explain how you do it today.' },
  { title: 'We shape the app', text: 'We turn the workflow into screens, fields, statuses, users and actions.' },
  { title: 'You use it', text: 'We ship a working version. You can own the source code or ask Purple Giraffe to manage it.' },
];

const PRICING_BLOCKS = [
  { title: 'Mini Build', copy: 'One small workflow. One clear outcome. A working first version.', price: 'Starts at \u20b9999' },
  { title: 'Business Build', copy: 'For apps with dashboards, users, data, roles, portals or integrations.', price: 'Scoped after workflow review' },
  { title: 'Managed App', copy: 'We can host, monitor, fix and improve the app after launch.', price: 'Monthly plan after launch' },
];

const AI_EXAMPLES = [
  'Auto-summarise customer messages',
  'Draft replies',
  'Ask questions from documents',
  'Analyse uploaded files',
  'Create a private copilot',
  'Extract action items',
];

const FAQS = [
  { q: 'Is Purple Giraffe an AI company?', a: 'No. Purple Giraffe builds custom apps and workflow tools. Some apps include AI features when useful, but most projects start with a simple workflow problem.' },
  { q: 'What can you build?', a: 'Order trackers, clinic desks, booking boards, delivery trackers, inventory tools, lead trackers, customer portals, dashboards, personal tools and other custom apps.' },
  { q: 'Do I need a technical requirement document?', a: "No. Explain how you work today. We'll help shape the first version." },
  { q: 'Can I own the source code?', a: 'Yes. We can hand over the source code and basic documentation.' },
  { q: 'Can you manage the app for me?', a: 'Yes. We can host, maintain, fix and improve the app for a monthly fee.' },
  { q: 'Can you add AI?', a: 'Yes, if it helps the workflow. We do not add AI just for the sake of it.' },
];

const BUDGET_OPTIONS = ['Under \u20b910k', '\u20b910k\u2013\u20b925k', '\u20b925k\u2013\u20b975k', '\u20b975k+', 'Not sure'];
const TIMELINE_OPTIONS = ['Urgent', '2\u20134 weeks', '1\u20132 months', 'Just exploring'];
const USE_TYPE_OPTIONS = ['Business', 'Personal'];

export default function Home() {
  const [returningUser, setReturningUser] = useState(null);
  const [heroWordIndex, setHeroWordIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [copilotBtnHover, setCopilotBtnHover] = useState(false);
  const [ideaTryHover, setIdeaTryHover] = useState(null);
  const [form, setForm] = useState({
    name: '', contact: '', buildDescription: '', currentProcess: '', useType: '', budget: '', timeline: '',
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
      setHeroWordIndex((i) => (i + 1) % HERO_WORDS.length);
    }, 1900);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const scrollToId = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const buildFromIdea = (ideaTitle) => (e) => {
    e.preventDefault();
    setForm((f) => ({ ...f, buildDescription: `Something like "${ideaTitle}" \u2014 ` }));
    document.getElementById('request')?.scrollIntoView({ behavior: 'smooth' });
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
        setForm({ name: '', contact: '', buildDescription: '', currentProcess: '', useType: '', budget: '', timeline: '' });
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
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} onClick={scrollToId(link.href.slice(1))}>
                {link.label}
              </a>
            ))}
            <a href="#request" className="nav-cta" onClick={scrollToId('request')}>Tell us your workflow</a>
          </nav>
        </div>
      </header>

      {returningUser && (
        <div className="returning-banner">
          <span>Signed in as {returningUser} on Purple Giraffe Copilot</span>
          <Link href="/apps/copilot">Continue &rarr;</Link>
        </div>
      )}

      <section className="hero">
        <span className="hero-badge">CUSTOM APPS FOR WORK AND LIFE</span>
        <h1>
          Build your{' '}
          <span className="cycle-word" key={HERO_WORDS[heroWordIndex]}>{HERO_WORDS[heroWordIndex]}</span>.
        </h1>
        <p className="hero-static-line">Built around the way you actually work.</p>
        <p className="hero-sub">
          Purple Giraffe turns messy workflows into simple custom apps &mdash; for
          businesses, founders, creators, clinics, shops, service teams and personal
          use cases. Add AI where it helps. Skip it where it doesn&apos;t.
        </p>
        <div className="hero-actions">
          <a href="#request" className="btn btn-primary" onClick={scrollToId('request')}>
            Tell us your workflow
          </a>
          <a href="#live-prototype" className="btn btn-ghost" onClick={scrollToId('live-prototype')}>
            Explore live prototypes
          </a>
        </div>
        <p className="hero-micro">
          Own the source code, or let Purple Giraffe host and manage your app.
        </p>

        <div className="hero-visual" aria-hidden="true">
          <div className="chaos-cluster">
            <span className="chaos-chip chaos-1">&#128172; WhatsApp chaos</span>
            <span className="chaos-chip chaos-2">&#128202; Excel mess</span>
            <span className="chaos-chip chaos-3">&#128221; Sticky notes</span>
          </div>
          <span className="flow-arrow">&rarr;</span>
          <div className="flow-box flow-box-accent">&#129412; Purple Giraffe</div>
          <span className="flow-arrow">&rarr;</span>
          <div className="flow-box">&#10024; Your custom app</div>
        </div>
      </section>

      <section className="live-proto" id="live-prototype">
        <p className="section-label">Live Prototype</p>
        <h2>Try something real.</h2>
        <p className="section-sub">
          Purple Giraffe Copilot is a working example. It shows how a specialised
          workflow can become an interactive tool.
        </p>

        <div className="proto-card">
          <div className="proto-card-top">
            <span className="proto-live-badge">Live</span>
            <span className="proto-category">AI-assisted workflow example</span>
          </div>
          <h3>Purple Giraffe Copilot</h3>
          <p>
            A working prototype for specialised troubleshooting and question-answering,
            built for adtech teams today. The same approach works for company
            documents too &mdash; SOPs, policies, manuals &mdash; with grounded answers
            instead of guesses. This is one example of what Purple Giraffe can build
            when a workflow benefits from AI-style guidance.
          </p>
          <ul className="proto-bullets">
            <li>Try a real working prototype</li>
            <li>See how a workflow can become a tool</li>
            <li>Request a private version for your own process</li>
            <li>Built AI-first, to show what&apos;s possible</li>
          </ul>
          <div className="proto-actions">
            <Link
              href="/apps/copilot"
              onMouseEnter={() => setCopilotBtnHover(true)}
              onMouseLeave={() => setCopilotBtnHover(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.8rem 1.5rem',
                borderRadius: '10px',
                fontSize: '0.95rem',
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid transparent',
                cursor: 'pointer',
                background: copilotBtnHover ? '#4c2e9e' : '#8b5cf6',
                color: '#ffffff',
                transition: 'transform 0.15s ease, background 0.15s ease',
                transform: copilotBtnHover ? 'translateY(-1px)' : 'none',
              }}
            >
              Try Copilot &rarr;
            </Link>
            <a href="#request" className="btn btn-ghost" onClick={buildFromIdea('Purple Giraffe Copilot')}>Build something like this</a>
          </div>
          <p className="proto-footnote">
            This is one example. Purple Giraffe also builds simple non-AI business apps.
          </p>
        </div>
      </section>

      <section className="ideas" id="app-ideas">
        <h2>What could we build for you?</h2>
        <p className="section-sub">
          A few starting points. Yours can be smaller, stranger, simpler, or completely different.
        </p>
        {IDEA_GROUPS.map((group) => {
          const groupIdeas = APP_IDEAS.filter((idea) => idea.group === group.key);
          if (groupIdeas.length === 0) return null;
          return (
            <div className="ideas-group" key={group.key}>
              <h3 className="ideas-group-title">{group.label}</h3>
              <div className="ideas-grid">
                {groupIdeas.map((idea) => (
                  <article className={`idea-card${idea.featured ? ' idea-card-featured' : ''}`} key={idea.id}>
                    <p className="idea-eyebrow">{idea.eyebrow}</p>
                    <h3>{idea.title}</h3>
                    <p className="idea-copy">{idea.copy}</p>
                    <p className="idea-tiny">{idea.tiny}</p>
                    <div className="idea-ctas">
                      {idea.tryHref && (
                        <Link
                          href={idea.tryHref}
                          onMouseEnter={() => setIdeaTryHover(idea.id)}
                          onMouseLeave={() => setIdeaTryHover(null)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.5rem 0.9rem',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                            background: ideaTryHover === idea.id ? '#4c2e9e' : '#8b5cf6',
                            color: '#ffffff',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          {idea.tryLabel} &rarr;
                        </Link>
                      )}
                      <a href="#request" className="card-cta" onClick={buildFromIdea(idea.title)}>{idea.cta} &rarr;</a>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <section className="how" id="how-it-works">
        <h2>From messy process to working app.</h2>
        <div className="how-list">
          {HOW_IT_WORKS.map((step, i) => (
            <div className="how-step" key={step.title}>
              <span className="how-num">{i + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="how-footnote">Then we improve it once real users touch it.</p>
      </section>

      <section className="pricing" id="pricing">
        <h2>Start small. Don&apos;t overbuild.</h2>
        <p className="section-sub">
          Mini builds start at &#8377;999. Good for tiny tools, focused workflows and
          first versions. Bigger business apps are quoted after we understand the scope.
        </p>
        <div className="pricing-blocks">
          {PRICING_BLOCKS.map((b) => (
            <div className="pricing-block" key={b.title}>
              <h3>{b.title}</h3>
              <p>{b.copy}</p>
              <p className="pricing-block-price">{b.price}</p>
            </div>
          ))}
        </div>
        <a href="#request" className="btn btn-primary" onClick={scrollToId('request')}>Start with a mini build</a>
        <p className="pricing-note">
          The &#8377;999 starting price is for very small builds. Final pricing depends
          on complexity, integrations, hosting, support and timeline.
        </p>
      </section>

      <section className="ai-sprinkle">
        <div className="ai-sprinkle-card">
          <h2>AI, only where it helps.</h2>
          <p>
            Some workflows benefit from smart features &mdash; summarising long notes,
            drafting replies, answering questions from documents, analysing uploads, or
            creating a copilot for repeated troubleshooting. We add AI when it improves
            the app, not because it sounds trendy.
          </p>
          <ul className="ai-examples-list">
            {AI_EXAMPLES.map((a) => <li key={a}>{a}</li>)}
          </ul>
        </div>
      </section>

      <section className="ownership">
        <h2>Keep it yours.</h2>
        <div className="ownership-grid">
          <div className="ownership-col">
            <h3>Source code handover</h3>
            <p>We build it, document the basics and hand over the code so you or your team can run it.</p>
          </div>
          <div className="ownership-col">
            <h3>Managed by Purple Giraffe</h3>
            <p>Don&apos;t want to deal with hosting, fixes, backups or changes? We can run it for you.</p>
          </div>
        </div>
      </section>

      <section className="request" id="request">
        <div className="request-inner">
          <h2>Tell us the workflow.</h2>
          <p>No perfect requirement document needed. Messy explanations are welcome.</p>

          {status === 'success' ? (
            <div className="form-success">Thanks &mdash; we&apos;ve got your workflow and will follow up shortly.</div>
          ) : (
            <form onSubmit={handleSubmit} className="request-form">
              <div className="form-row">
                <label>
                  Name
                  <input type="text" value={form.name} onChange={handleChange('name')} required />
                </label>
                <label>
                  Email or phone
                  <input type="text" value={form.contact} onChange={handleChange('contact')} required />
                </label>
              </div>
              <label>
                What do you want to build?
                <textarea rows="3" value={form.buildDescription} onChange={handleChange('buildDescription')} required />
              </label>
              <label>
                How do you handle it today?
                <textarea rows="3" value={form.currentProcess} onChange={handleChange('currentProcess')} placeholder="WhatsApp, Excel, paper, memory..." />
              </label>
              <div className="form-row">
                <label>
                  Business or personal use case?
                  <select value={form.useType} onChange={handleChange('useType')}>
                    <option value="">Select one</option>
                    {USE_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
                <label>
                  Budget range
                  <select value={form.budget} onChange={handleChange('budget')}>
                    <option value="">Select one</option>
                    {BUDGET_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
              </div>
              <label>
                Timeline
                <select value={form.timeline} onChange={handleChange('timeline')}>
                  <option value="">Select one</option>
                  {TIMELINE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
              {status === 'error' && <div className="form-error">{errorMsg}</div>}
              <button type="submit" className="btn btn-primary" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Sending\u2026' : 'Send my workflow'}
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="faq" id="faq">
        <h2>FAQ</h2>
        <div className="faq-list">
          {FAQS.map((item, i) => (
            <div className="faq-item" key={item.q}>
              <button
                className="faq-question"
                onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                aria-expanded={openFaqIndex === i}
              >
                <span>{item.q}</span>
                <span className="faq-icon">{openFaqIndex === i ? '\u2212' : '+'}</span>
              </button>
              {openFaqIndex === i && <p className="faq-answer">{item.a}</p>}
            </div>
          ))}
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
          max-width: 780px;
          margin: 0 auto;
          padding: 4rem 1.5rem 3rem;
          text-align: center;
        }
        .hero-badge {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          color: var(--pg-purple-deep);
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.25);
          border-radius: 999px;
          padding: 0.35rem 0.9rem;
          margin-bottom: 1.25rem;
        }
        .hero h1 {
          font-family: var(--font-display);
          font-size: clamp(2rem, 4.6vw, 3rem);
          font-weight: 600;
          line-height: 1.2;
          margin-bottom: 0.6rem;
        }
        .cycle-word {
          display: inline-block;
          color: var(--pg-purple-deep);
          animation: cycleIn 0.4s ease;
        }
        @keyframes cycleIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-static-line {
          font-family: var(--font-display);
          font-size: clamp(1.1rem, 2.4vw, 1.4rem);
          color: var(--pg-muted);
          margin-bottom: 1.5rem;
        }
        .hero-sub {
          font-size: 1.05rem;
          line-height: 1.7;
          color: var(--pg-muted);
          margin-bottom: 1.75rem;
        }
        .hero-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .hero-micro {
          font-size: 0.85rem;
          color: var(--pg-muted);
          margin-bottom: 2.5rem;
        }

        .hero-visual {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .chaos-cluster {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
          max-width: 220px;
        }
        .chaos-chip {
          font-size: 0.78rem;
          font-family: var(--font-mono);
          background: rgba(242, 169, 59, 0.14);
          border: 1px dashed rgba(138, 90, 16, 0.35);
          color: var(--pg-amber-deep);
          border-radius: 8px;
          padding: 0.35rem 0.6rem;
          white-space: nowrap;
        }
        .chaos-1 { transform: rotate(-4deg); }
        .chaos-2 { transform: rotate(3deg); }
        .chaos-3 { transform: rotate(-2deg); }
        .flow-arrow {
          color: var(--pg-muted);
          font-size: 1.1rem;
        }
        .flow-box {
          background: var(--pg-card);
          border: 1px solid var(--pg-line);
          border-radius: 10px;
          padding: 0.85rem 1.1rem;
          font-size: 0.9rem;
          font-weight: 500;
          white-space: nowrap;
        }
        .flow-box-accent {
          border-color: var(--pg-purple);
          background: rgba(139, 92, 246, 0.1);
          color: var(--pg-purple-deep);
          font-weight: 600;
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

        section > h2 {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 600;
          margin-bottom: 0.6rem;
        }
        .section-label {
          font-family: var(--font-mono);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          font-size: 0.75rem;
          color: var(--pg-purple-deep);
          margin-bottom: 0.5rem;
        }
        .section-sub {
          color: var(--pg-muted);
          font-size: 0.98rem;
          line-height: 1.6;
          max-width: 640px;
          margin-bottom: 1.75rem;
        }

        .live-proto {
          max-width: 900px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
          border-top: 1px solid var(--pg-line);
        }
        .proto-card {
          background: var(--pg-card);
          border: 1px solid var(--pg-purple);
          border-radius: 18px;
          padding: 2rem;
          box-shadow: 0 14px 32px -20px rgba(139, 92, 246, 0.5);
        }
        .proto-card-top {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.75rem;
        }
        .proto-live-badge {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: var(--pg-purple);
          color: white;
          border-radius: 999px;
          padding: 0.25rem 0.65rem;
        }
        .proto-category {
          font-family: var(--font-mono);
          font-size: 0.75rem;
          color: var(--pg-muted);
        }
        .proto-card h3 {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.6rem;
        }
        .proto-card p {
          color: var(--pg-muted);
          line-height: 1.6;
          margin-bottom: 1rem;
        }
        .proto-bullets {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-bottom: 1.4rem;
          font-size: 0.92rem;
          color: var(--pg-ink);
        }
        .proto-bullets li {
          padding-left: 1.1rem;
          position: relative;
        }
        .proto-bullets li::before {
          content: '–';
          position: absolute;
          left: 0;
          color: var(--pg-purple);
        }
        .proto-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .proto-footnote {
          font-size: 0.82rem;
          color: var(--pg-muted);
          margin: 0;
        }

        .ideas {
          max-width: 1120px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
        }
        .ideas-group {
          margin-bottom: 2.5rem;
        }
        .ideas-group:last-child {
          margin-bottom: 0;
        }
        .ideas-group-title {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--pg-ink);
          margin-bottom: 1rem;
          padding-bottom: 0.6rem;
          border-bottom: 1px solid var(--pg-line);
        }
        .ideas-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        .idea-card {
          background: var(--pg-card);
          border: 1px solid var(--pg-line);
          border-radius: 14px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
        }
        .idea-card:hover {
          transform: translateY(-3px);
          border-color: var(--pg-purple);
          box-shadow: 0 10px 24px -16px rgba(139, 92, 246, 0.4);
        }
        .idea-card-featured {
          grid-column: span 2;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.06), var(--pg-card));
        }
        .idea-eyebrow {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--pg-purple-deep);
        }
        .idea-card h3 {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 600;
        }
        .idea-copy {
          color: var(--pg-muted);
          font-size: 0.9rem;
          line-height: 1.55;
        }
        .idea-tiny {
          font-size: 0.82rem;
          color: var(--pg-amber-deep);
          font-style: italic;
        }
        .idea-ctas {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 0.4rem;
        }
        .idea-card :global(.card-cta) {
          align-self: flex-start;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--pg-ink);
          border-bottom: 2px solid var(--pg-purple);
          padding-bottom: 0.1rem;
        }
        .idea-card :global(.card-cta:hover) {
          color: var(--pg-purple-deep);
        }

        .how {
          max-width: 720px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
          border-top: 1px solid var(--pg-line);
        }
        .how-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin-bottom: 1rem;
        }
        .how-step {
          display: flex;
          gap: 1.1rem;
          position: relative;
        }
        .how-step:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 17px;
          top: 34px;
          width: 1px;
          height: calc(100% + 1.5rem - 34px);
          background: var(--pg-line);
        }
        .how-num {
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--pg-ink);
          color: var(--pg-paper);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-weight: 600;
          font-size: 0.95rem;
          position: relative;
          z-index: 1;
        }
        .how-step h3 {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .how-step p {
          color: var(--pg-muted);
          line-height: 1.6;
          font-size: 0.92rem;
        }
        .how-footnote {
          font-size: 0.85rem;
          color: var(--pg-muted);
          font-style: italic;
        }

        .pricing {
          max-width: 1000px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
          border-top: 1px solid var(--pg-line);
          text-align: center;
        }
        .pricing .section-sub {
          margin-left: auto;
          margin-right: auto;
        }
        .pricing-blocks {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
          margin-bottom: 1.75rem;
          text-align: left;
        }
        .pricing-block {
          background: var(--pg-card);
          border: 1px solid var(--pg-line);
          border-radius: 14px;
          padding: 1.4rem;
        }
        .pricing-block h3 {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 600;
          margin-bottom: 0.4rem;
        }
        .pricing-block p {
          color: var(--pg-muted);
          font-size: 0.88rem;
          line-height: 1.5;
          margin-bottom: 0.6rem;
        }
        .pricing-block-price {
          font-family: var(--font-mono);
          font-size: 0.82rem;
          color: var(--pg-purple-deep);
          font-weight: 600;
        }
        .pricing-note {
          font-size: 0.82rem;
          color: var(--pg-muted);
          max-width: 520px;
          margin: 1rem auto 0;
        }

        .ai-sprinkle {
          max-width: 900px;
          margin: 0 auto;
          padding: 1rem 1.5rem 3rem;
        }
        .ai-sprinkle-card {
          background: var(--pg-card);
          border: 1px solid var(--pg-line);
          border-radius: 14px;
          padding: 1.75rem;
        }
        .ai-sprinkle-card h2 {
          font-size: 1.3rem;
        }
        .ai-sprinkle-card p {
          color: var(--pg-muted);
          font-size: 0.92rem;
          line-height: 1.6;
          max-width: 640px;
          margin-bottom: 1rem;
        }
        .ai-examples-list {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .ai-examples-list li {
          font-family: var(--font-mono);
          font-size: 0.78rem;
          color: var(--pg-purple-deep);
          background: rgba(139, 92, 246, 0.07);
          border-radius: 6px;
          padding: 0.3rem 0.6rem;
        }

        .ownership {
          max-width: 1120px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
          border-top: 1px solid var(--pg-line);
        }
        .ownership-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        .ownership-col {
          background: var(--pg-card);
          border: 1px solid var(--pg-line);
          border-radius: 14px;
          padding: 1.5rem;
        }
        .ownership-col h3 {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .ownership-col p {
          color: var(--pg-muted);
          line-height: 1.6;
          font-size: 0.92rem;
        }

        .request {
          background: var(--pg-ink);
          color: var(--pg-paper);
          padding: 3.5rem 1.5rem;
        }
        .request-inner {
          max-width: 600px;
          margin: 0 auto;
        }
        .request-inner h2 {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .request-inner > p {
          color: rgba(250, 249, 252, 0.7);
          margin-bottom: 1.75rem;
        }
        .request-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
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
          padding: 0.65rem 0.85rem;
          color: var(--pg-paper);
          font-size: 0.95rem;
          font-family: inherit;
        }
        .request-form textarea {
          resize: vertical;
          min-height: 70px;
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

        .faq {
          max-width: 720px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
        }
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .faq-item {
          border: 1px solid var(--pg-line);
          border-radius: 12px;
          overflow: hidden;
          background: var(--pg-card);
        }
        .faq-question {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          background: none;
          border: none;
          text-align: left;
          padding: 0.9rem 1.15rem;
          font-size: 0.92rem;
          font-weight: 500;
          color: var(--pg-ink);
          cursor: pointer;
        }
        .faq-icon {
          font-family: var(--font-mono);
          color: var(--pg-purple);
          flex-shrink: 0;
        }
        .faq-answer {
          padding: 0 1.15rem 1rem;
          color: var(--pg-muted);
          font-size: 0.88rem;
          line-height: 1.6;
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
          .ideas-grid,
          .pricing-blocks,
          .ownership-grid {
            grid-template-columns: 1fr;
          }
          .idea-card-featured {
            grid-column: span 1;
          }
          .nav-links {
            gap: 0.8rem;
          }
        }
        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          .chaos-cluster {
            max-width: 100%;
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
