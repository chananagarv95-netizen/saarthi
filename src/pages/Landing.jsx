import { lazy, Suspense, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, MessageCircle, ScanText, Sparkles, PenLine, CalendarCheck, ShieldCheck, WifiOff, Mic, Smartphone, Languages } from 'lucide-react';
import AskBar from '../components/AskBar';
import { Logo } from '../components/AppShell';

const Scene3D = lazy(() => import('../components/Scene3D'));

const GREETINGS = ['नमस्ते', 'வணக்கம்', 'నమస్కారం', 'ನಮಸ್ಕಾರ', 'নমস্কার', 'નમસ્તે', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', 'ନମସ୍କାର', 'നമസ്കാരം', 'नमस्कार', 'آداب', 'নমস্কাৰ', 'Hello'];
const EXAMPLES = ['I lost my Aadhaar card', 'Someone cheated me on UPI', 'मुझे राशन कार्ड बनवाना है', 'Which schemes can I get as a farmer?'];

const useReveal = () => {
  useEffect(() => {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
};

const Landing = () => {
  const navigate = useNavigate();
  const ask = (text) => navigate('/app/chat', { state: { ask: text } }); // router state: the question never touches the URL
  useReveal();

  return (
    <div className="landing">
      <Suspense fallback={<div className="scene-fixed" style={{ background: 'var(--bg)' }} />}>
        <Scene3D variant="hero" className="scene-fixed" />
      </Suspense>

      <nav className="landing-nav" aria-label="Main">
        <Logo />
        <div className="landing-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#bharat">Built for Bharat</a>
        </div>
        <Link to="/app" className="btn btn-primary btn-sm">Open app <ArrowRight size={15} /></Link>
      </nav>

      <header className="l-section hero">
        <div className="hero-copy">
          <span className="eyebrow" style={{ animation: 'fade-up 0.8s var(--ease) both' }}><span className="dot" /> India’s AI citizen companion</span>
          <h1 style={{ animation: 'fade-up 0.9s 0.08s var(--ease) both' }}>
            Every government service. <span className="serif gradient-text">One conversation.</span>
          </h1>
          <p className="hero-sub" style={{ animation: 'fade-up 0.9s 0.16s var(--ease) both' }}>
            Aadhaar, PAN, passports, pensions, scholarships, fraud, RTI — SAARTHI turns India’s paperwork into clear steps, in your language, by voice or text.
          </p>
          <div style={{ animation: 'fade-up 0.9s 0.24s var(--ease) both' }}>
            <AskBar onSubmit={ask} placeholder="Ask anything… e.g. “I lost my PAN card”" />
            <div className="chips-row">
              {EXAMPLES.map((e) => <button key={e} type="button" className="chip" onClick={() => ask(e)}>{e}</button>)}
            </div>
          </div>
          <div className="hero-stats" style={{ animation: 'fade-up 0.9s 0.32s var(--ease) both' }}>
            <div className="hero-stat"><strong>24</strong><span>services guided</span></div>
            <div className="hero-stat"><strong>19</strong><span>schemes matched</span></div>
            <div className="hero-stat"><strong>13</strong><span>Indian languages</span></div>
            <div className="hero-stat"><strong>0</strong><span>documents stored</span></div>
          </div>
        </div>
        <div className="scroll-cue">Scroll</div>
      </header>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">{[...GREETINGS, ...GREETINGS].map((g, i) => <span key={i}>{g}</span>)}</div>
      </div>

      <section id="features" className="l-section l-block">
        <div className="l-head reveal">
          <span className="eyebrow"><span className="dot" /> Everything in one place</span>
          <h2>Not a chatbot. <span className="serif gradient-text">A companion that gets things done.</span></h2>
          <p>From the first question to the final stamp — SAARTHI explains, checks, drafts, reminds and connects you to the right official counter.</p>
        </div>
        <div className="bento">
          <div className="card hoverable b-wide reveal">
            <div className="b-icon" style={{ background: 'var(--grad)' }}><MessageCircle size={22} /></div>
            <h3>Ask in your words, in your language</h3>
            <p>Type or speak in Hindi, Tamil, Bengali or Hinglish. Get exact steps, the documents you need and the official portal — never a made-up link.</p>
            <div className="demo-chat">
              <div className="q">मेरा PM-KISAN का पैसा नहीं आया</div>
              <div className="a">सबसे आम कारण: e-KYC अधूरा है। pmkisan.gov.in पर “Beneficiary Status” देखें, फिर e-KYC पूरा करें। हेल्पलाइन: 155261</div>
            </div>
          </div>
          <div className="card hoverable b-narrow reveal d1">
            <div className="b-icon" style={{ background: 'linear-gradient(135deg,#3ddc84,#7cf0b7)' }}><ScanText size={22} /></div>
            <h3>Document check</h3>
            <p>Snap a certificate. SAARTHI reads it, flags expiry and errors, and masks your Aadhaar automatically.</p>
          </div>
          <div className="card hoverable b-third reveal">
            <div className="b-icon" style={{ background: 'linear-gradient(135deg,#ffb057,#ff7a6b)' }}><Sparkles size={22} /></div>
            <h3>Scheme finder</h3>
            <p>Answer four questions, discover benefits you qualify for — PM-KISAN, PM-JAY, scholarships, pensions and more.</p>
          </div>
          <div className="card hoverable b-third reveal d1">
            <div className="b-icon" style={{ background: 'linear-gradient(135deg,#a78bfa,#7c8cff)' }}><PenLine size={22} /></div>
            <h3>Letters & RTI drafter</h3>
            <p>RTI applications, grievances, police reports for lost documents, fraud complaints — formatted correctly, ready to print.</p>
          </div>
          <div className="card hoverable b-third reveal d2">
            <div className="b-icon" style={{ background: 'linear-gradient(135deg,#7c8cff,#5ad1ff)' }}><CalendarCheck size={22} /></div>
            <h3>Tracker & vault</h3>
            <p>Never miss a renewal. Deadlines and document expiries become calendar reminders automatically.</p>
          </div>
        </div>
      </section>

      <section id="how" className="l-section l-block" style={{ paddingTop: 0 }}>
        <div className="l-head reveal">
          <span className="eyebrow"><span className="dot" /> How it works</span>
          <h2>Three steps. <span className="serif gradient-text">Zero queues to figure out.</span></h2>
        </div>
        <div className="how">
          {[
            ['01', 'Tell SAARTHI your problem', 'Speak or type the way you’d explain it to a friend — “my ration card name is wrong”.'],
            ['02', 'Get a verified plan', 'Exact steps, documents checklist, fees, timelines, helpline and the official portal — personalised to your state.'],
            ['03', 'Get it done', 'Draft the letter, check your documents, find the nearest office and track every deadline until it’s closed.']
          ].map(([n, t, d], i) => (
            <div key={n} className={`card hoverable reveal d${i}`}>
              <div className="how-num gradient-text">{n}</div>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="bharat" className="l-section l-block" style={{ paddingTop: 0 }}>
        <div className="l-head reveal">
          <span className="eyebrow"><span className="dot" /> Built for Bharat</span>
          <h2>Works for everyone. <span className="serif gradient-text">Everywhere.</span></h2>
        </div>
        <div className="bharat">
          {[
            [Mic, 'Voice first', 'Speak instead of typing; answers can be read aloud in your language.'],
            [WifiOff, 'Works without AI', 'Verified offline guide keeps working even when AI is unavailable.'],
            [ShieldCheck, 'Private by design', 'No accounts, no database. Your profile and history stay on your phone.'],
            [Smartphone, 'Install like an app', 'Add to home screen — light, fast, made for budget phones.']
          ].map(([Icon, t, d], i) => (
            <div key={t} className={`card hoverable reveal d${i % 3}`}>
              <Icon size={22} style={{ color: 'var(--saffron)' }} />
              <strong>{t}</strong>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="l-section">
        <div className="cta reveal">
          <Languages size={28} style={{ color: 'var(--saffron)', margin: '0 auto 18px' }} />
          <h2>Your government. <span className="serif gradient-text">Finally simple.</span></h2>
          <p>Free. No sign-up. Start with a question.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/app/chat" className="btn btn-primary btn-lg">Start a conversation <ArrowRight size={17} /></Link>
            <Link to="/app/schemes" className="btn btn-lg">Find my schemes</Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} SAARTHI · Independent citizen assistant, not affiliated with the Government of India.</span>
        <span>Always confirm on official portals · Emergency: 112 · Cyber fraud: 1930</span>
      </footer>
    </div>
  );
};

export default Landing;
