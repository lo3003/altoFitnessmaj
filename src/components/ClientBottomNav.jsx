// src/components/ClientBottomNav.jsx
import React from 'react';

// Icônes adaptées pour le Client
const ProgramIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#28a745' : 'none'} stroke={active ? 'none' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
);

const ChatIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#28a745' : 'none'} stroke={active ? 'none' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

const AccountIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#28a745' : 'none'} stroke={active ? 'none' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const ClientBottomNav = ({ activeView, setActiveView }) => {
  return (
    <nav className="bottom-nav">
      <button onClick={() => setActiveView('program')} className={activeView === 'program' ? 'active' : ''}>
        <ProgramIcon active={activeView === 'program'} />
        <span>Programme</span>
      </button>
      
      <button onClick={() => setActiveView('contact')} className={activeView === 'contact' ? 'active' : ''}>
        <ChatIcon active={activeView === 'contact'} />
        <span>Coach</span>
      </button>
      
      <button onClick={() => setActiveView('account')} className={activeView === 'account' ? 'active' : ''}>
        <AccountIcon active={activeView === 'account'} />
        <span>Compte</span>
      </button>
    </nav>
  );
};

export default ClientBottomNav;