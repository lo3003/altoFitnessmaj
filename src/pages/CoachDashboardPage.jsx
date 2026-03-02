// src/pages/CoachDashboardPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import { supabase } from '../services/supabaseClient';
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

const CoachDashboardPage = () => {
  const [activeView, setActiveView] = useState('clients');
  
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

  const [clients, setClients] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const { width } = useWindowSize(); 
  const isDesktop = width > 900; 

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: clientsData } = await supabase.from('clients').select('*').eq('coach_id', user.id).order('created_at', { ascending: false });
      if (clientsData) setClients(clientsData);

      // --- MODIFICATION ICI : On récupère aussi les assignations ---
      const { data: programsData } = await supabase
        .from('programs')
        .select(`
            *,
            client_programs (
                client_id
            )
        `)
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });
      
      if (programsData) setPrograms(programsData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
                    clients={clients} // On passe la liste des clients pour les noms
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
        return <ClientsPage clients={clients} loading={loading} onSelectClient={setSelectedClient} onClientAdded={fetchData} isModalOpen={isAddClientModalOpen} setIsModalOpen={setIsAddClientModalOpen} />;
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