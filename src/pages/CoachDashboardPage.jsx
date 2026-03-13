// src/pages/CoachDashboardPage.jsx
import React, { useState } from 'react';
import BottomNav from '../components/BottomNav';
import { supabase } from '../services/supabaseClient';
import { useCoachDashboard } from '../hooks/useCoachDashboard';
import ClientsPage from './ClientsPage';
import ClientDetailPage from './ClientDetailPage';
import ProgramsPage from './ProgramsPage';
import ProgramEditorPage from './ProgramEditorPage';
import ClientHistoryPage from './ClientHistoryPage';
import ExerciseLibraryPage from './ExerciseLibraryPage';
import ConfirmModal from '../components/ConfirmModal';
import useWindowSize from '../hooks/useWindowSize';

import CoachInboxPage from './CoachInboxPage';
import CoachChatPage from './CoachChatPage';
import AddClientModal from '../components/AddClientModal';

const AccountPage = () => (
    <div className="screen">
        <div className="content-centered">
            <h2>Mon Compte</h2>
            <div className="button-group">
                <button className="secondary" onClick={() => supabase.auth.signOut()}>
                    Se déconnecter
                </button>
            </div>
        </div>
    </div>
);

/* ─── Dashboard Overview ─── */
const DashboardOverview = ({ clients, programs, loading, onSelectClient, onSelectProgram, onNewProgram, setIsAddClientModalOpen, onOpenChat }) => {
  const [activeTab, setActiveTab] = useState('clients');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = searchQuery
    ? clients.filter(c => c.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : clients;

  const activeClientsCount = clients.length;
  const pendingProgramsCount = programs.filter(p => !(p.client_programs?.length > 0)).length;

  const getClientProgram = (clientId) => {
    return programs.find(p => p.client_programs?.some(cp => cp.client_id === clientId)) || null;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="screen cd-modern-overview">
      {/* ─── Header ─── */}
      <div className="cd-modern-header">
        <div className="cd-title-area">
          <h1>Tableau de Bord Coach</h1>
          <p>Bienvenue, voici votre aperçu quotidien.</p>
        </div>
        <div className="cd-header-actions">
          <div className="cd-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Rechercher un client..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <button className="btn-icon-circular">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </button>
          <button className="cd-btn-primary pill" onClick={onNewProgram}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nouveau Programme
          </button>
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      {!loading && (
        <div className="cd-stats-grid">
          <div className="cd-stat-card">
            <div className="cd-stat-header-row">
              <div className="cd-stat-icon-wrapper green-bg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <span className="cd-stat-badge badge-green">+12%</span>
            </div>
            <div className="cd-stat-info">
              <span className="cd-stat-title">Clients Actifs</span>
              <span className="cd-stat-figure">{activeClientsCount}</span>
            </div>
          </div>
          
          <div className="cd-stat-card">
            <div className="cd-stat-header-row">
              <div className="cd-stat-icon-wrapper orange-bg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <span className="cd-stat-badge badge-orange">Action Requise</span>
            </div>
            <div className="cd-stat-info">
              <span className="cd-stat-title">Progs en attente</span>
              <span className="cd-stat-figure">{pendingProgramsCount}</span>
            </div>
          </div>
          
          <div className="cd-stat-card">
            <div className="cd-stat-header-row">
              <div className="cd-stat-icon-wrapper blue-bg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
              </div>
              <span className="cd-stat-badge badge-grey">Stable</span>
            </div>
            <div className="cd-stat-info">
              <span className="cd-stat-title">Adhérence Moyenne</span>
              <span className="cd-stat-figure">85%</span>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content Tabs ─── */}
      <div className="cd-content-section">
        <div className="cd-tabs-modern">
          <button className={activeTab === 'clients' ? 'active' : ''} onClick={() => setActiveTab('clients')}>Clients</button>
          <button className={activeTab === 'programs' ? 'active' : ''} onClick={() => setActiveTab('programs')}>Programmes</button>
          <button className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')}>Messagerie</button>
        </div>

        {loading && <div className="cd-loading"><div className="cd-spinner"></div><span>Chargement...</span></div>}

        {/* ─── Clients Tab ─── */}
        {!loading && activeTab === 'clients' && (
          <div className="cd-grid-clients">
            {filteredClients.length === 0 && <div className="cd-empty"><p>Aucun client trouvé.</p></div>}
            
            {filteredClients.map(client => {
              const assignedProg = getClientProgram(client.id);
              return (
                <div key={client.id} className="cd-business-card" onClick={() => onSelectClient(client)}>
                  <div className="cd-bc-header">
                    <div className="cd-avatar">{getInitials(client.full_name)}</div>
                    <div className="cd-bc-title">
                      <h4>{client.full_name}</h4>
                      <span className="pill-badge">ACTIF</span>
                    </div>
                  </div>
                  
                  <div className="cd-bc-body">
                    <div className="cd-info-col">
                      <span className="cd-lbl">Objectif</span>
                      <span className="cd-val">{client.main_goal || 'Perte de poids'}</span>
                    </div>
                    <div className="cd-info-col" style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <span className="cd-lbl">Dernier Log</span>
                      <span className="cd-val text-green">Aujourd'hui</span>
                    </div>
                  </div>

                  <div className="cd-bc-footer">
                    <span className="sub-label">PROGRAMME ACTUEL</span>
                    {assignedProg ? (
                      <>
                        <div className="cd-prog-head">
                          <span className="cd-prog-name">{assignedProg.name}</span>
                          <span className="cd-prog-pct">35%</span>
                        </div>
                        <div className="thick-prog-bar"><div className="thick-prog-fill" style={{ width: '35%' }}></div></div>
                      </>
                    ) : (
                      <>
                        <div className="cd-prog-head">
                          <span className="cd-prog-name" style={{ color: 'var(--alto-text-light)' }}>Aucun programme</span>
                          <span className="cd-prog-pct">0%</span>
                        </div>
                        <div className="thick-prog-bar"><div className="thick-prog-fill" style={{ width: '0%', backgroundColor: 'transparent' }}></div></div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add New Client Card */}
            <div className="cd-business-card add-new-client" onClick={() => setIsAddClientModalOpen(true)}>
              <div className="add-new-circle">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </div>
              <span style={{ fontWeight: '600' }}>Ajouter un Client</span>
            </div>
            
          </div>
        )}

        {/* ─── Programs Tab ─── */}
        {!loading && activeTab === 'programs' && (
          <div className="cd-grid-programs">
            {programs.length === 0 && <div className="cd-empty"><p>Aucun programme actif.</p></div>}
            {programs.map(prog => (
              <div key={prog.id} className="cd-program-card" onClick={() => onSelectProgram(prog)}>
                <div className="cd-pc-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
                <div className="cd-pc-info">
                  <h4>{prog.name}</h4>
                  <p>{prog.environment || 'Général'} • {prog.client_programs?.length || 0} participant(s)</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Messages Tab ─── */}
        {!loading && activeTab === 'messages' && (
          <div className="cd-list-messages">
            {clients.length === 0 && <div className="cd-empty"><p>Aucune conversation.</p></div>}
            {clients.map(client => (
              <div key={client.id} className="cd-message-row" onClick={() => onOpenChat(client)}>
                <div className="cd-avatar small">{getInitials(client.full_name)}</div>
                <div className="cd-msg-info">
                  <h4>{client.full_name}</h4>
                  <p>Ouvrir la conversation...</p>
                </div>
                <div className="cd-msg-action">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CoachDashboardPage = () => {
  const [activeView, setActiveView] = useState('dashboard');
  
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [historyClient, setHistoryClient] = useState(null);
  const [isCreatingProgram, setIsCreatingProgram] = useState(false);
  
  const [chatClient, setChatClient] = useState(null);

  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const { clients, programs, loading, fetchData } = useCoachDashboard();

  const { width } = useWindowSize(); 
  const isDesktop = width > 900; 

  const handleNavigation = (targetView) => {
      if (targetView === activeView && !selectedClient && !selectedProgramId && !isCreatingProgram && !chatClient) return;

      if (isDirty) {
          setPendingNavigation(() => () => performNavigation(targetView));
          setShowUnsavedModal(true);
      } else {
          performNavigation(targetView);
      }
  };

  const performNavigation = (targetView) => {
      setSelectedClient(null);
      setSelectedProgramId(null);
      setHistoryClient(null);
      setIsCreatingProgram(false);
      setChatClient(null);

      setActiveView(targetView);
      setIsDirty(false);
      setShowUnsavedModal(false);
  };

  const handleBack = (force = false) => {
      const isForced = (force === true);

      if (!isForced && isDirty) {
          setPendingNavigation(() => () => {
             performNavigation(activeView);
          });
          setShowUnsavedModal(true);
      } else {
          if (selectedProgramId || isCreatingProgram) {
              setSelectedProgramId(null); setIsCreatingProgram(false); fetchData();
          } else if (chatClient) {
              setChatClient(null); 
          } else if (historyClient) {
              setHistoryClient(null);
          } else if (selectedClient) {
              setSelectedClient(null);
          }
      }
  }

  const handleOpenChat = (clientToChatWith) => {
      setChatClient(clientToChatWith);
  };

  const confirmNavigation = () => {
      if (pendingNavigation) pendingNavigation();
      setPendingNavigation(null);
      setShowUnsavedModal(false);
  };

  const cancelNavigation = () => {
      setPendingNavigation(null);
      setShowUnsavedModal(false);
  };

  const renderActiveView = () => {
    if (chatClient) {
        return <CoachChatPage client={chatClient} onBack={() => handleBack()} isDesktop={isDesktop} />;
    }
    if (historyClient) {
      return <ClientHistoryPage client={historyClient} onBack={() => handleBack()} />;
    }
    if (selectedClient) {
      return <ClientDetailPage
                client={selectedClient}
                programs={programs}
                onBack={() => handleBack()}
                onClientAction={() => { fetchData(); setSelectedClient(null); }}
                onViewHistory={setHistoryClient}
                onOpenChat={handleOpenChat}
              />;
    }
    if (isCreatingProgram || selectedProgramId) {
        return <ProgramEditorPage
                    programId={isCreatingProgram ? 'new' : selectedProgramId}
                    onBack={handleBack}
                    onDirtyChange={setIsDirty}
                />
    }

    switch (activeView) {
      case 'dashboard':
        return <DashboardOverview
                  clients={clients}
                  programs={programs}
                  loading={loading}
                  onSelectClient={setSelectedClient}
                  onSelectProgram={(program) => setSelectedProgramId(program.id)}
                  onNewProgram={() => setIsCreatingProgram(true)}
                  setIsAddClientModalOpen={setIsAddClientModalOpen}
                  onOpenChat={handleOpenChat}
                />;
      case 'clients':
        return <ClientsPage 
                  clients={clients} 
                  loading={loading} 
                  onSelectClient={setSelectedClient} 
                  onClientAdded={fetchData} 
                  isModalOpen={isAddClientModalOpen}
                  setIsModalOpen={setIsAddClientModalOpen}
                />;
      case 'programs':
        return <ProgramsPage
                    programs={programs}
                    clients={clients}
                    loading={loading}
                    onSelectProgram={(program) => setSelectedProgramId(program.id)}
                    onNewProgram={() => setIsCreatingProgram(true)}
                />;
      case 'messages':
        return <CoachInboxPage 
                    onSelectClient={handleOpenChat}
                />;
      case 'library':
        return <ExerciseLibraryPage 
                  isModalOpen={isLibraryModalOpen}
                  setIsModalOpen={setIsLibraryModalOpen}
                />;
      case 'account':
        return <AccountPage />;
      default:
        return <DashboardOverview
                  clients={clients}
                  programs={programs}
                  loading={loading}
                  onSelectClient={setSelectedClient}
                  onSelectProgram={(program) => setSelectedProgramId(program.id)}
                  onNewProgram={() => setIsCreatingProgram(true)}
                  setIsAddClientModalOpen={setIsAddClientModalOpen}
                  onOpenChat={handleOpenChat}
                />;
    }
  };

  const showNav = isDesktop || (
                  !selectedClient && 
                  !selectedProgramId && 
                  !historyClient && 
                  !isCreatingProgram &&
                  !chatClient 
                );

  return (
    <div className={`dashboard-layout coach-dashboard ${isDesktop ? 'desktop' : 'mobile'}`}>
      <main className="dashboard-content">
        {renderActiveView()}
      </main>
      {showNav && <BottomNav activeView={activeView} setActiveView={handleNavigation} />}

      {/* Modal Ajout Client (accessible depuis le dashboard) */}
      {isAddClientModalOpen && activeView === 'dashboard' && (
        <AddClientModal onClose={() => setIsAddClientModalOpen(false)} onClientAdded={fetchData} />
      )}

      {showUnsavedModal && (
          <ConfirmModal
              title="Modifications non enregistrées"
              message="Vous avez des modifications en cours. Si vous quittez cette page, elles seront perdues. Voulez-vous vraiment quitter ?"
              confirmText="Quitter sans sauvegarder"
              cancelText="Rester"
              onConfirm={confirmNavigation}
              onCancel={cancelNavigation}
          />
      )}
    </div>
  );
};

export default CoachDashboardPage;