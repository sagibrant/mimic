import { useEffect, useMemo, useState } from 'react';
import './App.css';
import Demo from './demo';
import Docs from './docs';
import APIs from './apis/index';
import NavBar from './components/NavBar';

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (to: string) => {
    if (to === path) return;
    history.pushState({}, '', to);
    setPath(to);
  };

  const Page = useMemo(() => {
    if (path.startsWith('/docs')) return 'docs';
    if (path.startsWith('/apis')) return 'apis';
    if (path.startsWith('/demo')) return 'demo';
    return 'home';
  }, [path]);

  return (
    <div className="app-root">
      <NavBar path={path} onNavigate={navigate} />
      {Page === 'home' && (
        <main className="home-hero">
          <h1><span className="em">Gogogo</span> enables reliable browser automation for modern web apps.</h1>
          <p>Elegant, powerful automation with Locators and Objects. Click-run demos, accessible APIs, and fast developer experience.</p>
          <div className="cta">
            <button onClick={() => navigate('/docs')}>Explore Docs</button>
            <button onClick={() => navigate('/apis')}>View APIs</button>
            <button onClick={() => navigate('/demo')}>Run Demo</button>
          </div>
        </main>
      )}
      {Page === 'docs' && <Docs />}
      {Page === 'apis' && <APIs />}
      {Page === 'demo' && <Demo />}
    </div>
  );
}

export default App;
