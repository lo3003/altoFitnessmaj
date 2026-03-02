// src/components/ClientHeaderNav.jsx
import React from 'react';

const ProgramIcon = ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? '#2ecc71' : 'none'} stroke={active ? '#2ecc71' : '#1e293b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);
const AccountIcon = ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? '#2ecc71' : 'none'} stroke={active ? '#2ecc71' : '#1e293b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);
const ChatIcon = ({ active }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? '#2ecc71' : 'none'} stroke={active ? '#2ecc71' : '#1e293b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

const ClientHeaderNav = ({ activeView, setActiveView }) => {
  return (
    <nav className="client-header-nav">
      <div className="client-header-nav-content">
        <span className="client-header-logo">FitConnect</span>
        <div className="client-header-links">
          <button onClick={() => setActiveView('program')} className={activeView === 'program' ? 'active' : ''}>
            <ProgramIcon active={activeView === 'program'} />
            <span>Mon Programme</span>
          </button>
          <button onClick={() => setActiveView('contact')} className={activeView === 'contact' ? 'active' : ''}>
            <ChatIcon active={activeView === 'contact'} />
            <span>Mon Coach</span>
          </button>
          <button onClick={() => setActiveView('account')} className={activeView === 'account' ? 'active' : ''}>
            <AccountIcon active={activeView === 'account'} />
            <span>Mon Compte</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default ClientHeaderNav;