import { useNavigate } from 'react-router';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="home-page">
      <main className="home-hero">
        <div className="home-hero-inner">
          <h1><span className="em">Mimic</span> enables reliable browser automation for modern web apps.</h1>
          <p>
            Automate real browsers with a clean SDK and an extension runtime. Power RPA, testing, and AI agents with{' '}
            <span className="home-inline-em">mimic-sdk</span> — directly from your web app.
          </p>
          <div className="cta">
            <button type="button" onClick={() => navigate('/docs/quickstart')}>Start Quickstart</button>
            <button type="button" onClick={() => navigate('/apis')}>Browse APIs</button>
            <button type="button" onClick={() => navigate('/demo')}>Run Demo</button>
          </div>
        </div>
      </main>

      <section className="home-highlights" aria-label="Why Mimic">
        <div className="home-section-inner">
          <div className="home-section-head">
            <p>
              Mimic replaces local automation toolchains with an extension runtime — fast to adopt, safe by default, and
              built to run in real user browsers.
            </p>
          </div>
          <div className="home-cards">
            <article className="home-card">
              <h3>Zero local setup</h3>
              <p>Small extension, no drivers, no complex local environment.</p>
            </article>
            <article className="home-card">
              <h3>Operate existing sessions</h3>
              <p>No browser restart. Automate the tabs your users already have open.</p>
            </article>
            <article className="home-card">
              <h3>Sandboxed &amp; privacy-first</h3>
              <p>Runs inside the extension sandbox. No collection of local machine data.</p>
            </article>
            <article className="home-card">
              <h3>Familiar developer model</h3>
              <p>Locators + Objects — a modern automation model, designed for reliability.</p>
            </article>
            <article className="home-card">
              <h3>Automate user browsers from web</h3>
              <p>Call mimic-sdk in your app to trigger automation where it matters: on the user’s machine.</p>
            </article>
            <article className="home-card">
              <h3>Agent-ready browser</h3>
              <p>Pair with AI agents to turn your browser into an automation-native AI runtime.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="home-dev" aria-label="Developer experience">
        <div className="home-section-inner home-dev-grid">
          <div>
            <h2>Build it like a library. Deliver it like a web app.</h2>
            <p className="home-subtle">
              Embed automation inside your product: onboarding, support, RPA, QA helpers, and agent workflows — without
              asking developers to install local automation toolchains (e.g. Playwright, Selenium).
            </p>
            <ul className="home-bullets">
              <li>Control real tabs and real auth sessions (cookies, SSO, MFA) without re-login scripts</li>
              <li>Integrate in minutes via mimic-sdk, keep your UX web-native</li>
              <li>Extension sandbox reduces the security surface area by default</li>
            </ul>
            <div className="home-mini-cta">
              <button type="button" onClick={() => navigate('/docs')}>Docs</button>
              <button type="button" onClick={() => navigate('/docs/installation')}>Install</button>
            </div>
          </div>
          <div className="home-code">
            <pre aria-label="Example code">
              <code>{`import { BrowserLocator } from 'mimic-sdk';

const browser = await new BrowserLocator().get();
const page = await browser.lastActivePage();
await page.element('#user-name').fill('username');
await page.element('#password').fill('password');
await page.element('#login-button').click();`}</code>
            </pre>
            <div className="home-code-foot">
              <span className="home-code-pill">Typed SDK</span>
              <span className="home-code-pill">Runs in extension</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
