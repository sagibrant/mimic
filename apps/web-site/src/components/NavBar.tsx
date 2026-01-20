import React from 'react';

type Props = {
  path: string;
  onNavigate: (to: string) => void;
};

const NavBar: React.FC<Props> = ({ path, onNavigate }) => {
  const isActive = (to: string) => path.startsWith(to) || (to === '/' && path === '/');
  const baseUrl = import.meta.env.BASE_URL;
  return (
    <header className="nav modern-nav">
      <button
        className="brand-btn"
        aria-label="Mimic Home"
        onClick={() => onNavigate('/')}
      >
        <img src={`${baseUrl}icons/icon_32x32.png`} alt="Mimic" className="brand-icon" />
        <span className="brand-name">Mimic</span>
      </button>
      <nav className="menu">
        <a
          href="/docs"
          className={`menu-link ${isActive('/docs') ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); onNavigate('/docs'); }}
        >
          Docs
        </a>
        <a
          href="/apis"
          className={`menu-link ${isActive('/apis') ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); onNavigate('/apis'); }}
        >
          APIs
        </a>
        <a
          href="/demo"
          className={`menu-link ${isActive('/demo') ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); onNavigate('/demo'); }}
        >
          Demo
        </a>
      </nav>
    </header>
  );
};

export default NavBar;
