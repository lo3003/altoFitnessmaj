// src/pages/ClientContactPage.jsx
import React, { useState } from 'react';
import { useClientContact } from '../hooks/useClientContact';
import ChatWindow from '../components/ChatWindow';
import AppointmentModal from '../components/AppointmentModal';

const ClientContactPage = ({ client, isDesktop }) => {
  const { coach, loading, isSubmittingRDV, handleBookAppointment } = useClientContact(client);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const onBookAppointment = async (date, notes) => {
      const success = await handleBookAppointment(date, notes);
      if (success) setShowAppointmentModal(false);
  };

  if (loading) return <div className="screen"><p className="loading-text">Chargement...</p></div>;
  if (!coach) return <div className="screen"><div className="empty-state"><p>Coach introuvable.</p></div></div>;

  return (
    <>
        <div className={`screen client-contact-page ${isDesktop ? 'desktop' : ''}`}>
        <div className="contact-header">
            <div className="coach-info">
                <h2>{coach.full_name || 'Votre Coach'}</h2>
                <p className="coach-status">Disponible</p>
            </div>
            <button 
                className="secondary small appointment-btn" 
                onClick={() => setShowAppointmentModal(true)}
            >
                📅 Prendre RDV
            </button>
        </div>

        <div className="chat-container-wrapper">
            <ChatWindow currentUserIds={client.id} otherUserIds={coach.id} />
        </div>
        </div>

        {showAppointmentModal && (
            <AppointmentModal 
                onClose={() => setShowAppointmentModal(false)}
                onConfirm={onBookAppointment}
                loading={isSubmittingRDV}
            />
        )}
    </>
  );
};

export default ClientContactPage;