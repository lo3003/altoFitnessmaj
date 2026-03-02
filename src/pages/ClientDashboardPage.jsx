// src/pages/ClientDashboardPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import ClientBottomNav from '../components/ClientBottomNav';
import ClientHeaderNav from '../components/ClientHeaderNav';
import useWindowSize from '../hooks/useWindowSize';
import ClientProgramPage from './ClientProgramPage';
import ClientProgramDetailPage from './ClientProgramDetailPage';
import ClientContactPage from './ClientContactPage'; // Import de la nouvelle page

const ClientAccountPage = ({ client, onLogout }) => (
    <div className="screen">
        <div className="content-centered">
            <h2>Mon Compte</h2>
            <p>Connecté en tant que {client.full_name}</p>
            <div className="button-group">
                <button className="secondary" onClick={onLogout}>Se déconnecter</button>
            </div>
        </div>
    </div>
);

const ClientDashboardPage = ({ client, onLogout }) => {
  const [activeView, setActiveView] = useState('program');
  const [assignedPrograms, setAssignedPrograms] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const { width } = useWindowSize();
  const isDesktop = width > 900;

  const fetchClientData = useCallback(async () => {
    setLoading(true);
    const { data: programsData } = await supabase
      .from('client_programs')
      .select(`*, programs (*, exercises (*))`)
      .eq('client_id', client.id);
      
    if (programsData) {
        const validPrograms = programsData.filter(assignment => assignment.programs);
        setAssignedPrograms(validPrograms);
    }

    const { data: logsData } = await supabase
        .from('workout_logs')
        .select('*, programs(name)')
        .eq('client_id', client.id)
        .order('completed_at', { ascending: false });

    if (logsData) setWorkoutLogs(logsData);
    
    setLoading(false);
  }, [client.id]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const renderActiveView = () => {
    if (selectedAssignment) {
      return <ClientProgramDetailPage 
                assignment={selectedAssignment} 
                client={client}
                onBack={() => setSelectedAssignment(null)}
                onWorkoutLogged={fetchClientData}
                isDesktop={isDesktop}
              />;
    }

    switch (activeView) {
      case 'program':
        return <ClientProgramPage 
                  client={client} 
                  assignedPrograms={assignedPrograms} 
                  workoutLogs={workoutLogs} 
                  loading={loading} 
                  onSelectProgram={setSelectedAssignment}
                  isDesktop={isDesktop}
               />;
      case 'contact': // Nouveau cas pour afficher la page de contact
        return <ClientContactPage 
                  client={client} 
                  isDesktop={isDesktop} 
               />;
      case 'account':
        return <ClientAccountPage client={client} onLogout={onLogout} />;
      default:
        return <ClientProgramPage 
                  client={client} 
                  assignedPrograms={assignedPrograms} 
                  workoutLogs={workoutLogs} 
                  loading={loading} 
                  onSelectProgram={setSelectedAssignment}
                  isDesktop={isDesktop}
               />;
    }
  };

  const showNav = !selectedAssignment;

  return (
    <div className="dashboard-layout client-dashboard">
      {showNav && isDesktop && <ClientHeaderNav activeView={activeView} setActiveView={setActiveView} />}
      <main className="dashboard-content">
        {renderActiveView()}
      </main>
      {showNav && !isDesktop && <ClientBottomNav activeView={activeView} setActiveView={setActiveView} />}
    </div>
  );
};

export default ClientDashboardPage;