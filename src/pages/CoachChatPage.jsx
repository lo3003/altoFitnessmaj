// src/pages/CoachChatPage.jsx
import React, { useState } from 'react';
import { useCoachChat } from '../hooks/useCoachChat';
import ChatWindow from '../components/ChatWindow';
import AppointmentModal from '../components/AppointmentModal';

const CoachChatPage = ({ client, onBack, isDesktop }) => {
  const { coachId, pendingAppointment, loadingAction, handleAppointmentAction, handleCoachPropose } = useCoachChat(client.id);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const onCoachPropose = async (date, notes) => {
      const success = await handleCoachPropose(date, notes);
      if (success) setShowAppointmentModal(false);
  };

  if (!coachId) return <div className="screen"><p className="loading-text">Chargement...</p></div>;

  return (
    <>
        <div className={`screen coach-chat-page ${isDesktop ? 'desktop' : ''}`} style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--background-color)' }}>
        
        <div className="contact-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={onBack} className="chat-back-button" title="Retour">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
                <div className="coach-info">
                    <h2 style={{ fontSize: '18px', margin: 0 }}>{client.full_name}</h2>
                    <p className="coach-status" style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)' }}>Client</p>
                </div>
            </div>
            <button className="secondary small appointment-btn" onClick={() => setShowAppointmentModal(true)}>
                📅 Fixer un RDV
            </button>
        </div>

        {pendingAppointment && (
            <div className="appointment-banner">
                <div className="banner-info">
                    <strong>📅 Demande de RDV</strong>
                    <p>
                        {new Date(pendingAppointment.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        {pendingAppointment.notes && <span className="banner-notes">Note: "{pendingAppointment.notes}"</span>}
                    </p>
                </div>
                <div className="banner-actions">
                    <button className="small danger-light" onClick={() => handleAppointmentAction('rejected')} disabled={loadingAction}>Refuser</button>
                    <button className="small success" onClick={() => handleAppointmentAction('confirmed')} disabled={loadingAction}>Confirmer</button>
                </div>
            </div>
        )}

        <div className="chat-container-wrapper" style={{ flex: 1, overflow: 'hidden' }}>
            <ChatWindow 
                currentUserIds={coachId}
                otherUserIds={client.id}
            />
        </div>
        </div>

        {showAppointmentModal && (
            <AppointmentModal 
                onClose={() => setShowAppointmentModal(false)}
                onConfirm={onCoachPropose}
                loading={loadingAction}
            />
        )}
    </>
  );
};

export default CoachChatPage;