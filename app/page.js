// app/page.js
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
  { label: 'Examples', href: '#examples' },
  { label: 'What we build', href: '#what-we-build' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const PROBLEM_CARDS = [
  {
    title: 'Orders get missed',
    text: 'Customer requests come through WhatsApp, calls, Instagram and spreadsheets, but there is no single place to track them.',
  },
  {
    title: 'Follow-ups depend on memory',
    text: 'Payments, delivery dates, appointments and reminders are easy to forget when everything is manual.',
  },
  {
    title: 'Spreadsheets become messy',
    text: 'Excel is flexible, but it becomes hard to manage once multiple people, statuses and workflows are involved.',
  },
  {
    title: 'Generic software does not fit',
    text: 'Off-the-shelf tools often do too much or too little. Sometimes you need a simple app built around your exact process.',
  },
];

const WHAT_WE_BUILD = [
  {
    title: 'Order Management Apps',
    text: 'Track custom orders, due dates, payments, delivery status, customer details and staff tasks in one place.',
    examples: 'Bakery orders, boutique orders, custom gifts, catering orders.',
  },
  {
    title: 'Booking & Appointment Tools',
    text: 'Let customers request slots, track bookings, manage availability and reduce back-and-forth.',
    examples: 'Salons, tutors, clinics, consultants, trainers.',
  },
  {
    title: 'Inventory & Stock Trackers',
    text: 'Track stock levels, purchase needs, low-stock alerts, suppliers and usage.',
    examples: 'Cafes, bakeries, stores, small warehouses.',
  },
  {
    title: 'Lead & Customer Trackers',
    text: 'Capture enquiries, qualify leads, track conversations, and follow up at the right time.',
    examples: 'Real estate agents, agencies, consultants, service businesses.',
  },
  {
    title: 'Internal Dashboards',
    text: 'Simple dashboards for tasks, reports, approvals, operations and team visibility.',
    examples: 'Small teams, founders, operations teams.',
  },
  {
    title: 'Personal Use-Case Apps',
    text: 'Custom tools for personal workflows, planning, tracking, learning, budgeting or family organisation.',
    examples: 'Habit trackers, study planners, personal finance trackers, home inventory.',
  },
  {
    title: 'Customer Portals',
    text: 'Give your customers a simple page or portal to place orders, check status, upload details or view updates.',
    examples: null,
  },
  {
    title: 'AI Features When Useful',
    text: 'Some apps may benefit from AI features like summarising messages, drafting replies, analysing documents or answering FAQs. We add AI only when it helps the workflow.',
    examples: null,
  },
];

const EXAMPLES = [
  {
    id: 'bakery',
    title: 'Bakery Order Manager',
    category: 'Small Business',
    description: 'A custom app for bakeries to manage cake orders, delivery dates, payments, customer notes, flavours, sizes, add-ons and staff tasks.',
    features: ['Custom order form', 'Order status dashboard', 'Advance/payment tracker', 'Delivery calendar', 'Customer reminders'],
    cta: 'Build something like this',
    href: '#request',
  },
  {
    id: 'booking',
    title: 'Appointment & Booking Manager',
    category: 'Service Business',
    description: 'A simple app for managing bookings, customer details, appointment slots, reminders and status.',
    features: ['Booking requests', 'Calendar view', 'Customer history', 'Reminder workflow'],
    cta: 'Build something like this',
    href: '#request',
  },
  {
    id: 'inventory',
    title: 'Inventory & Reorder Tracker',
    category: 'Operations',
    description: 'Track stock levels, supplier details, daily usage, low-stock alerts and reorder history.',
    features: ['Product list', 'Stock in/out', 'Low stock alerts', 'Supplier notes'],
    cta: 'Build something like this',
    href: '#request',
  },
  {
    id: 'leads',
    title: 'Lead & Follow-up Tracker',
    category: 'Sales',
    description: 'Capture incoming leads, track conversation status, set follow-up reminders and generate simple summaries.',
    features: ['Lead capture form', 'Status pipeline', 'Follow-up reminders', 'Notes and tasks'],
    cta: 'Build something like this',
    href: '#request',
  },
  {
    id: 'copilot',
    title: 'Purple Giraffe Copilot',
    category: 'AI Feature Example',
    description: 'An example of an AI-assisted tool for specialised troubleshooting and question-answering. Useful when a workflow needs expert-style guidance or document/chat support.',
    features: [],
    cta: 'Try prototype',
    href: '/apps/copilot',
  },
  {
    id: 'yours',
    title: 'Your Own Workflow',
    category: 'Custom',
    description: 'Have a process that does not fit any existing tool? Tell us how you work today, and we will suggest the simplest app version.',
    features: [],
    cta: 'Tell us your idea',
    href: '#request',
  },
];

const HOW_IT_WORKS = [
  { title: 'Tell us your workflow', text: 'Explain what you currently do manually: orders, bookings, customers, inventory, follow-ups, reports or personal tracking.' },
  { title: 'We design the first version', text: 'We convert your workflow into a simple app structure: screens, users, data, statuses and actions.' },
  { title: 'We build and share', text: 'You get a working version to test. We improve it based on feedback.' },
  { title: 'You choose ownership or management', text: 'We can hand over the source code or continue hosting and managing the app for you.' },
  { title: 'Improve over time', text: 'Once the first version works, we can add features, dashboards, automations, integrations or AI features if useful.' },
];

const PRICING_CARDS = [
  {
    title: 'Mini App',
    price: 'From \u20b925,000',
    bestFor: 'One small workflow or personal tool.',
    includes: ['Simple app flow', 'Basic screens', 'Data storage', 'Demo deployment', 'Handover walkthrough'],
    timeline: '5\u201310 days',
    cta: 'Request mini app',
  },
  {
    title: 'Business Workflow App',
    price: 'From \u20b975,000',
    bestFor: 'Small businesses that need order tracking, bookings, dashboards, inventory or customer workflows.',
    includes: ['Custom screens', 'Database', 'Admin view', 'Basic reporting', 'Deployment', 'Source-code handover option'],
    timeline: '2\u20134 weeks',
    cta: 'Discuss business app',
  },
  {
    title: 'Full Custom Build',
    price: 'From \u20b91.5L',
    bestFor: 'Larger workflows with multiple users, roles, integrations, customer portals or advanced features.',
    includes: ['Full app build', 'User roles if needed', 'Custom dashboard', 'Integrations if needed', 'Documentation', 'Source-code handover'],
    timeline: '4\u20138 weeks',
    cta: 'Plan custom build',
  },
  {
    title: 'Managed App',
    price: 'From \u20b910,000/month',
    bestFor: 'Customers who want us to host, maintain and improve the app.',
    includes: ['Hosting support', 'Bug fixes', 'Monitoring', 'Backups', 'Small improvements', 'Support'],
    timeline: null,
    cta: 'Discuss managed app',
  },
];

const WHO_FOR = [
  'Bakeries and custom-order businesses',
  'Salons, tutors, trainers and appointment-based services',
  'Small stores and inventory-heavy businesses',
  'Consultants, agencies and freelancers',
  'Founders and small teams',
  'Individuals with personal tracking or planning needs',
  'Anyone outgrowing WhatsApp, Excel and manual follow-ups',
];

const FAQS = [
  { q: 'Is Purple Giraffe an AI company?', a: 'Purple Giraffe builds custom apps and workflow tools. Some apps may include AI features when useful, but AI is not required for every project.' },
  { q: 'What kind of apps do you build?', a: 'Order trackers, booking tools, dashboards, inventory systems, lead trackers, customer portals, personal tools, internal apps and custom workflow software.' },
  { q: 'Can I own the source code?', a: 'Yes. For custom builds, we can hand over the source code and basic deployment documentation.' },
  { q: 'Can you manage the app for me?', a: 'Yes. If you do not want to handle hosting, maintenance or changes, we can manage the app for a monthly fee.' },
  { q: 'How long does it take?', a: 'Small apps can take 5\u201310 days. Business workflow apps usually take 2\u20134 weeks. Larger custom builds may take 4\u20138 weeks or more.' },
  { q: 'Do I need to know technology?', a: 'No. You only need to explain your current workflow and what you want to improve.' },
  { q: 'Can you build mobile apps?', a: 'We usually recommend starting with a web app that works well on mobile browsers. Native mobile apps can be considered if the use case truly needs it.' },
  { q: 'Can you connect with WhatsApp, Google Sheets or other tools?', a: 'Yes, depending on the tool and available APIs. Integrations are scoped before the build.' },
  { q: 'Will the first version have every feature?', a: 'No. We recommend starting with the smallest useful version, testing it, and improving it over time.' },
];

const BUDGET_OPTIONS = ['Under \u20b925k', '\u20b925k\u2013\u20b975k', '\u20b975k\u2013\u20b91.5L', '\u20b91.5L+', 'Not sure'];
const TIMELINE_OPTIONS = ['As soon as possible', '2\u20134 weeks', '1\u20132 months', 'Just exploring'];
const USE_TYPE_OPTIONS = ['Business', 'Personal'];
const OWNERSHIP_OPTIONS = ['Source-code handover', 'Managed service', 'Not sure yet'];

export default function Home() {
  const [returningUser, setReturningUser] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [form, setForm] = useState({
    name: '',
    contact: '',
    useType: '',
    buildDescription: '',
    currentProcess: '',
    whoWillUse: '',
    whatToTrack: '',
    ownership: '',
    budget: '',
    timeline: '',
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
        setForm({
          name: '', contact: '', useType: '', buildDescription: '', currentProcess: '',
          whoWillUse: '', whatToTrack: '', ownership: '', budget: '', timeline: '',
        });
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
            <a href="#request" className="nav-cta" onClick={scrollToId('request')}>Request a build</a>
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
        <h1>Custom apps for your business, built around the way you work.</h1>
        <p className="hero-sub">
          Purple Giraffe helps businesses and individuals turn repeated manual work into
          simple working apps: order trackers, booking tools, dashboards, customer
          portals, inventory systems, personal tools and more.
        </p>
        <div className="hero-actions">
          <a href="#request" className="btn btn-primary" onClick={scrollToId('request')}>
            Request a build
          </a>
          <a href="#examples" className="btn btn-ghost" onClick={scrollToId('examples')}>
            Explore examples
          </a>
        </div>
        <p className="hero-trust">Own the source code or let us manage the app for you.</p>
        <p className="hero-support">
          No need to hire a tech team. Tell us your workflow, and we&apos;ll build the first
          working version.
        </p>

        <div className="hero-visual" aria-hidden="true">
          <div className="flow-box">Your workflow</div>
          <span className="flow-arrow">&rarr;</span>
          <div className="flow-box flow-box-accent">Custom app</div>
          <span className="flow-arrow">&rarr;</span>
          <div className="flow-box">Source code / Managed service</div>
        </div>
      </section>

      <section className="problem">
        <h2>Still running your business on WhatsApp, Excel and memory?</h2>
        <p className="section-sub">
          That works in the beginning. But as orders, customers, tasks and follow-ups
          grow, things start slipping.
        </p>
        <div className="problem-grid">
          {PROBLEM_CARDS.map((c) => (
            <div className="problem-card" key={c.title}>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="build" id="what-we-build">
        <h2>We build practical apps for everyday workflows.</h2>
        <p className="section-sub">If you can explain the process, we can usually turn it into a simple app.</p>
        <div className="build-grid">
          {WHAT_WE_BUILD.map((b) => (
            <div className="build-card" key={b.title}>
              <h3>{b.title}</h3>
              <p>{b.text}</p>
              {b.examples && <p className="build-examples">{b.examples}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="gallery" id="examples">
        <h2>Explore example apps.</h2>
        <p className="section-sub">
          These are sample ideas and prototypes. Your app can be simpler, larger or
          completely different depending on your workflow.
        </p>
        <div className="gallery-grid">
          {EXAMPLES.map((ex) => (
            <article className="card" key={ex.id}>
              <div className="card-top">
                <span className="card-category">{ex.category}</span>
              </div>
              <h3>{ex.title}</h3>
              <p>{ex.description}</p>
              {ex.features.length > 0 && (
                <ul className="card-specs">
                  {ex.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              )}
              {ex.href.startsWith('/') ? (
                <Link href={ex.href} className="card-cta">{ex.cta} &rarr;</Link>
              ) : (
                <a href={ex.href} className="card-cta" onClick={scrollToId('request')}>{ex.cta} &rarr;</a>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="how" id="how-it-works">
        <h2>How it works</h2>
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
      </section>

      <section className="pricing" id="pricing">
        <h2>Start small. Build what you need.</h2>
        <p className="section-sub">
          Most projects start with one clear workflow. Pricing depends on complexity,
          users, integrations, data and whether you want us to manage the app.
        </p>
        <div className="pricing-grid">
          {PRICING_CARDS.map((p) => (
            <div className="pricing-card" key={p.title}>
              <h3>{p.title}</h3>
              <p className="pricing-amount">{p.price}</p>
              <p className="pricing-bestfor">{p.bestFor}</p>
              <ul className="card-specs">
                {p.includes.map((i) => <li key={i}>{i}</li>)}
              </ul>
              {p.timeline && <p className="pricing-timeline">Timeline: {p.timeline}</p>}
              <a href="#request" className="card-cta" onClick={scrollToId('request')}>{p.cta} &rarr;</a>
            </div>
          ))}
        </div>
        <p className="pricing-note">Final pricing depends on scope. We keep the first version focused so you do not overbuild.</p>
      </section>

      <section className="ownership">
        <h2>Own the app, or let us manage it.</h2>
        <div className="ownership-grid">
          <div className="ownership-col">
            <h3>Source-code handover</h3>
            <p>We can build the app and hand over the source code, deployment notes and basic documentation so you or your team can run it independently.</p>
            <ul className="card-specs">
              <li>Source code</li>
              <li>Deployment notes</li>
              <li>Basic documentation</li>
              <li>Your repository/cloud if required</li>
            </ul>
          </div>
          <div className="ownership-col">
            <h3>Managed by Purple Giraffe</h3>
            <p>If you do not want to handle hosting, maintenance, backups or changes, we can manage the app for you.</p>
            <ul className="card-specs">
              <li>Hosting support</li>
              <li>Maintenance</li>
              <li>Bug fixes</li>
              <li>Small improvements</li>
              <li>Monitoring and backups</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="who-for">
        <h2>Built for people with specific workflows.</h2>
        <ul className="who-list">
          {WHO_FOR.map((w) => <li key={w}>{w}</li>)}
        </ul>
      </section>

      <section className="request" id="request">
        <div className="request-inner">
          <h2>Tell us what you want to build.</h2>
          <p>Share the process you want to simplify. We will suggest the best first version.</p>

          {status === 'success' ? (
            <div className="form-success">Thanks. We will review your workflow and suggest the simplest first version.</div>
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
              <div className="form-row">
                <label>
                  Business or personal use case?
                  <select value={form.useType} onChange={handleChange('useType')}>
                    <option value="">Select one</option>
                    {USE_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </label>
                <label>
                  Who will use the app?
                  <input type="text" value={form.whoWillUse} onChange={handleChange('whoWillUse')} placeholder="e.g. me, my team, my customers" />
                </label>
              </div>
              <label>
                What do you want to build?
                <textarea rows="3" value={form.buildDescription} onChange={handleChange('buildDescription')} required />
              </label>
              <label>
                How do you handle this today?
                <textarea rows="3" value={form.currentProcess} onChange={handleChange('currentProcess')} placeholder="WhatsApp, Excel, paper, memory..." />
              </label>
              <label>
                What should the app track or manage?
                <textarea rows="3" value={form.whatToTrack} onChange={handleChange('whatToTrack')} />
              </label>
              <div className="form-row">
                <label>
                  Source-code handover or managed service?
                  <select value={form.ownership} onChange={handleChange('ownership')}>
                    <option value="">Select one</option>
                    {OWNERSHIP_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
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
                {status === 'submitting' ? 'Sending\u2026' : 'Request build review'}
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
          gap: 1.35rem;
          flex-wrap: wrap;
          justify-content: flex-end;
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
          max-width: 820px;
          margin: 0 auto;
          padding: 4.5rem 1.5rem 3.5rem;
          text-align: center;
        }
        .hero h1 {
          font-family: var(--font-display);
          font-size: clamp(2.1rem, 4.6vw, 3.1rem);
          font-weight: 600;
          line-height: 1.2;
          margin-bottom: 1.25rem;
        }
        .hero-sub {
          font-size: 1.1rem;
          line-height: 1.7;
          color: var(--pg-muted);
          margin-bottom: 2rem;
        }
        .hero-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: 1.25rem;
        }
        .hero-trust {
          font-size: 0.9rem;
          color: var(--pg-purple-deep);
          font-weight: 600;
          margin-bottom: 0.35rem;
        }
        .hero-support {
          font-size: 0.9rem;
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
        .flow-box {
          background: var(--pg-card);
          border: 1px solid var(--pg-line);
          border-radius: 10px;
          padding: 0.85rem 1.1rem;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .flow-box-accent {
          border-color: var(--pg-purple);
          background: rgba(139, 92, 246, 0.08);
          color: var(--pg-purple-deep);
          font-weight: 600;
        }
        .flow-arrow {
          color: var(--pg-muted);
          font-size: 1.1rem;
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
          font-size: 1.65rem;
          font-weight: 600;
          margin-bottom: 0.6rem;
        }
        .section-sub {
          color: var(--pg-muted);
          font-size: 1rem;
          line-height: 1.6;
          max-width: 680px;
          margin-bottom: 2rem;
        }

        .problem {
          max-width: 1120px;
          margin: 0 auto;
          padding: 4rem 1.5rem;
          border-top: 1px solid var(--pg-line);
        }
        .problem-grid,
        .build-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        .problem-card,
        .build-card {
          background: var(--pg-card);
          border: 1px solid var(--pg-line);
          border-radius: 14px;
          padding: 1.5rem;
        }
        .problem-card h3,
        .build-card h3 {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .problem-card p,
        .build-card p {
          color: var(--pg-muted);
          line-height: 1.6;
          font-size: 0.95rem;
        }
        .build-examples {
          margin-top: 0.6rem;
          font-size: 0.85rem;
          color: var(--pg-purple-deep);
        }

        .build {
          max-width: 1120px;
          margin: 0 auto;
          padding: 1rem 1.5rem 4rem;
        }

        .gallery {
          max-width: 1120px;
          margin: 0 auto;
          padding: 1rem 1.5rem 4rem;
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
        .card-top {
          display: flex;
        }
        .card-category {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--pg-purple-deep);
          background: rgba(139, 92, 246, 0.08);
          border-radius: 6px;
          padding: 0.25rem 0.55rem;
        }
        .card h3 {
          font-family: var(--font-display);
          font-size: 1.2rem;
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
          font-size: 0.85rem;
          color: var(--pg-ink);
        }
        .card-specs li {
          padding-left: 1rem;
          position: relative;
        }
        .card-specs li::before {
          content: '\u2013';
          position: absolute;
          left: 0;
          color: var(--pg-purple);
        }
        .card :global(.card-cta),
        .pricing-card :global(.card-cta) {
          margin-top: auto;
          align-self: flex-start;
          text-decoration: none;
          font-weight: 600;
          color: var(--pg-ink);
          border-bottom: 2px solid var(--pg-purple);
          padding-bottom: 0.15rem;
        }
        .card :global(.card-cta:hover),
        .pricing-card :global(.card-cta:hover) {
          color: var(--pg-purple-deep);
        }

        .how {
          max-width: 780px;
          margin: 0 auto;
          padding: 4rem 1.5rem;
          border-top: 1px solid var(--pg-line);
        }
        .how-list {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }
        .how-step {
          display: flex;
          gap: 1.1rem;
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
        }
        .how-step h3 {
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.3rem;
        }
        .how-step p {
          color: var(--pg-muted);
          line-height: 1.6;
          font-size: 0.95rem;
        }

        .pricing {
          max-width: 1120px;
          margin: 0 auto;
          padding: 1rem 1.5rem 3rem;
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .pricing-card {
          background: var(--pg-card);
          border: 1px solid var(--pg-line);
          border-radius: 14px;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }
        .pricing-card h3 {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 600;
        }
        .pricing-amount {
          font-family: var(--font-display);
          font-size: 1.3rem;
          font-weight: 600;
          color: var(--pg-purple-deep);
        }
        .pricing-bestfor {
          color: var(--pg-muted);
          font-size: 0.9rem;
          line-height: 1.5;
        }
        .pricing-timeline {
          font-size: 0.85rem;
          color: var(--pg-muted);
        }
        .pricing-note {
          color: var(--pg-muted);
          font-size: 0.85rem;
        }

        .ownership {
          max-width: 1120px;
          margin: 0 auto;
          padding: 4rem 1.5rem;
          border-top: 1px solid var(--pg-line);
        }
        .ownership-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }
        .ownership-col h3 {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .ownership-col p {
          color: var(--pg-muted);
          line-height: 1.6;
          font-size: 0.95rem;
          margin-bottom: 0.9rem;
        }

        .who-for {
          max-width: 1120px;
          margin: 0 auto;
          padding: 1rem 1.5rem 4rem;
        }
        .who-list {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .who-list li {
          font-size: 0.9rem;
          color: var(--pg-ink);
          background: var(--pg-card);
          border: 1px solid var(--pg-line);
          border-radius: 999px;
          padding: 0.55rem 1.1rem;
        }

        .request {
          background: var(--pg-ink);
          color: var(--pg-paper);
          padding: 4.5rem 1.5rem;
        }
        .request-inner {
          max-width: 640px;
          margin: 0 auto;
        }
        .request-inner h2 {
          font-family: var(--font-display);
          font-size: 1.75rem;
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
          min-height: 80px;
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
          max-width: 780px;
          margin: 0 auto;
          padding: 4rem 1.5rem;
        }
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
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
          padding: 1rem 1.25rem;
          font-size: 0.95rem;
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
          padding: 0 1.25rem 1.1rem;
          color: var(--pg-muted);
          font-size: 0.9rem;
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
          .problem-grid,
          .build-grid,
          .gallery-grid,
          .pricing-grid,
          .ownership-grid {
            grid-template-columns: 1fr;
          }
          .nav-links {
            gap: 0.9rem;
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
