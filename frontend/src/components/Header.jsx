import React from 'react';
import { Home, Printer } from 'lucide-react';

const Header = ({ onHome, project, view }) => (
  <header className="header no-print">
    <div className="logo-text cursor-pointer" onClick={onHome}>
      CETELEC <span style={{color: '#94a3b8', fontWeight: 400}}>LabelGen</span>
    </div>

    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      {view === 'editor' && (
        <>
          <button className="btn btn-ghost" onClick={onHome}>
            <Home size={18} /> Accueil
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={18} /> Imprimer A4
          </button>
        </>
      )}
    </div>
  </header>
);

export default Header;
