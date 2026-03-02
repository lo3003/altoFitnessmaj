// src/pages/ClientProgramPage.jsx
import React, { useMemo } from 'react';
import ClientHistoryWidget from '../components/ClientHistoryWidget';

const CheckmarkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/></svg>
);
const PlayIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7L8 5z" fill="currentColor"/></svg>
);

const ClientProgramPage = ({ assignedPrograms, workoutLogs, loading, onSelectProgram, client, isDesktop }) => {
  const welcomeMessage = (client && client.full_name) 
    ? `Bonjour, ${client.full_name.split(' ')[0]} !`
    : "Bonjour !";

  // --- LOGIQUE SMART FOCUS ---
  const sortedPrograms = useMemo(() => {
      if (!assignedPrograms || assignedPrograms.length === 0) return [];

      const programsWithDates = assignedPrograms.map(assignment => {
          if (!assignment.programs) return null;
          const latestLog = workoutLogs.find(log => log.program_id === assignment.programs.id);
          return {
              ...assignment,
              lastCompletedAt: latestLog ? new Date(latestLog.completed_at) : null
          };
      }).filter(p => p !== null);

      return programsWithDates.sort((a, b) => {
          if (a.lastCompletedAt === null && b.lastCompletedAt === null) return 0;
          if (a.lastCompletedAt === null) return -1;
          if (b.lastCompletedAt === null) return 1;
          return a.lastCompletedAt - b.lastCompletedAt;
      });
  }, [assignedPrograms, workoutLogs]);

  const priorityProgram = sortedPrograms.length > 0 ? sortedPrograms[0] : null;
  const otherPrograms = sortedPrograms.slice(1);
  // ---------------------------

  const ProgramCard = ({ assignmentData, isFeatured = false }) => {
    const program = assignmentData.programs;
    const lastDate = assignmentData.lastCompletedAt;
    
    const formattedDate = lastDate 
        ? lastDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) 
        : null;

    const exercises = program.exercises?.filter(item => !item.is_section_header) || [];
    const exerciseCount = exercises.length;

    if (isFeatured) {
      return (
        <div className="featured-program-card clickable" onClick={() => onSelectProgram(assignmentData)}>
          <div className="featured-program-info">
            <div className="priority-badge">🎯 Objectif du jour</div>
            <h3>{program.name}</h3>
            {/* Suppression du type ici aussi pour être cohérent */}
            <span>{exerciseCount} exercices</span>
          </div>
          <button className="start-workout-btn">Démarrer</button>
        </div>
      );
    }

    return (
      <div className="program-card client clickable" onClick={() => onSelectProgram(assignmentData)}>
        {/* SUPPRESSION DE LA DIV .program-icon ICI */}
        <div className="program-info">
          <h3>{program.name}</h3>
          <p className="program-stats">
              {exerciseCount} exercices
              {formattedDate && <span className="last-completed-date"> • Fait le {formattedDate}</span>}
          </p>
        </div>
        <div className={`program-status ${formattedDate ? 'completed' : 'todo'}`}>
            {formattedDate ? <CheckmarkIcon /> : <PlayIcon />}
        </div>
      </div>
    );
  };

  const MainContent = () => (
    <>
      <div className="client-header">
        <h1>{welcomeMessage}</h1>
        <p className="subtitle">Prêt pour votre séance ?</p>
      </div>

      {loading && <p className="loading-text">Chargement...</p>}
      
      {!loading && sortedPrograms.length === 0 && (
        <div className="empty-state"><p>Votre coach ne vous a encore assigné aucun programme.</p></div>
      )}

      {!loading && priorityProgram && (
        <>
          <ProgramCard assignmentData={priorityProgram} isFeatured={true} />
          
          {otherPrograms.length > 0 && (
            <h3 className="other-programs-title">Autres séances disponibles</h3>
          )}

          <div className={isDesktop ? "program-grid-desktop" : "program-list"}>
            {otherPrograms.map(assignment => (
              <ProgramCard key={assignment.id} assignmentData={assignment} />
            ))}
          </div>
        </>
      )}
    </>
  );

  if (isDesktop) {
      return (
          <div className="screen client-dashboard-grid">
              <div className="main-col">
                  <MainContent />
              </div>
              <div className="side-col">
                  <ClientHistoryWidget workoutLogs={workoutLogs} />
              </div>
          </div>
      )
  }

  return (
    <div className="screen">
        <MainContent />
    </div>
  );
};

export default ClientProgramPage;