// src/pages/ClientHistoryPage.jsx
import React, { useState } from 'react';
import { useClientHistory } from '../hooks/useClientHistory';
import Lightbox from '../components/Lightbox';

const ClientHistoryPage = ({ client, onBack }) => {
  const { workoutLogs, loading } = useClientHistory(client.id);
  const [lightboxImageUrl, setLightboxImageUrl] = useState(null);

  const ratings = { 1: '😩', 2: '😟', 3: '🙂', 4: '😊', 5: '😎' };

  return (
    <>
      <div className="screen">
        <a href="#" className="back-link" onClick={onBack}>← Retour au profil</a>
        <div className="page-header">
          <h1>Historique de {client.full_name}</h1>
        </div>

        {loading && <p className="loading-text">Chargement de l'historique...</p>}
        {!loading && workoutLogs.length === 0 && (
          <div className="empty-state"><p>Ce client n'a encore enregistré aucune activité.</p></div>
        )}
        {!loading && workoutLogs.length > 0 && (
          <div className="feedback-list">
            {workoutLogs.map(log => (
              <div key={log.id} className="feedback-card">
                <div className="feedback-header">
                  <h4>{log.programs ? log.programs.name : "Programme supprimé"}</h4>
                  <span>{new Date(log.completed_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="feedback-rating">
                  Ressenti : <span className="rating-emoji">{ratings[log.rating]}</span>
                </div>
                {log.feedback_notes && <p className="feedback-notes">"{log.feedback_notes}"</p>}
                {log.confirmation_photo_url && (
                  <div 
                    className="feedback-photo-thumbnail"
                    onClick={() => setLightboxImageUrl(log.confirmation_photo_url)}
                  >
                    <img src={log.confirmation_photo_url} alt="Confirmation" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {lightboxImageUrl && <Lightbox imageUrl={lightboxImageUrl} onClose={() => setLightboxImageUrl(null)} />}
    </>
  );
};

export default ClientHistoryPage;