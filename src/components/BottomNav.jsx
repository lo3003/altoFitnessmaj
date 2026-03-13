// src/components/BottomNav.jsx
import React from 'react';

/* ─── Icônes SVG ─── */

const DashboardIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#28a745' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const LibraryIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#28a745' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5V4.5A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const MessagesIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#28a745' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const ClientsIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#28a745' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const BottomNav = ({ activeView, setActiveView }) => {
  return (
    <nav className="bottom-nav">
      {/* ─── Logo (visible desktop seulement via CSS) ─── */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div className="logo-text">
            <span className="logo-name">Alto Fitness</span>
            <span className="logo-label">ESPACE COACH</span>
          </div>
        </div>
      </div>

      {/* ─── Items principaux ─── */}
      <div className="nav-items-group">
        <button onClick={() => setActiveView('dashboard')} className={activeView === 'dashboard' ? 'active' : ''}>
          <DashboardIcon active={activeView === 'dashboard'} />
          <span>Tableau de bord</span>
        </button>
        <button onClick={() => setActiveView('library')} className={activeView === 'library' ? 'active' : ''}>
          <LibraryIcon active={activeView === 'library'} />
          <span>Bibliothèque</span>
        </button>
        <button onClick={() => setActiveView('messages')} className={activeView === 'messages' ? 'active' : ''}>
          <MessagesIcon active={activeView === 'messages'} />
          <span>Messages</span>
        </button>
        <button onClick={() => setActiveView('clients')} className={activeView === 'clients' ? 'active' : ''}>
          <ClientsIcon active={activeView === 'clients'} />
          <span>CRM Clients</span>
        </button>
      </div>

      {/* ─── Footer sidebar (visible desktop seulement via CSS) ─── */}
      <div className="sidebar-footer">
        <button onClick={() => setActiveView('account')} className={activeView === 'account' ? 'active' : ''}>
          <SettingsIcon />
          <span>Paramètres</span>
        </button>
        <div className="sidebar-user-profile">
          <div className="sidebar-avatar">CF</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">Mon Profil</span>
            <span className="sidebar-user-role">Coach Élite</span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;