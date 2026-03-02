// src/components/BottomNav.jsx
import React from 'react';

// --- Icônes SVG pour la navigation ---

const PeopleIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#28a745' : 'none'} stroke={active ? 'none' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);

const ProgramIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#28a745' : 'none'} stroke={active ? 'none' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
);

const LibraryIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#28a745' : 'none'} stroke={active ? 'none' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5V4.5A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
);

const AccountIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#28a745' : 'none'} stroke={active ? 'none' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);


const BottomNav = ({ activeView, setActiveView }) => {
  return (
    <nav className="bottom-nav">
      <button onClick={() => setActiveView('clients')} className={activeView === 'clients' ? 'active' : ''}>
        <PeopleIcon active={activeView === 'clients'} />
        <span>Clients</span>
      </button>
      <button onClick={() => setActiveView('programs')} className={activeView === 'programs' ? 'active' : ''}>
        <ProgramIcon active={activeView === 'programs'} />
        <span>Programmes</span>
      </button>
      <button onClick={() => setActiveView('library')} className={activeView === 'library' ? 'active' : ''}>
        <LibraryIcon active={activeView === 'library'} />
        <span>Bibliothèque</span>
      </button>
      <button onClick={() => setActiveView('account')} className={activeView === 'account' ? 'active' : ''}>
        <AccountIcon active={activeView === 'account'} />
        <span>Compte</span>
      </button>
    </nav>
  );
};

export default BottomNav;