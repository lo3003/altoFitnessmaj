// src/components/ClientHistoryWidget.jsx
import React from 'react';

const ClientHistoryWidget = ({ workoutLogs }) => {
  // On prend seulement les 3 dernières activités
  const recentLogs = workoutLogs.slice(0, 3);
  const ratings = { 1: '😩', 2: '😟', 3: '🙂', 4: '😊', 5: '😎' };

  return (
    <div className="history-widget">
      <h3>Activité Récente</h3>
      {recentLogs.length === 0 ? (
        <p className="empty-text">Aucune activité récente.</p>
      ) : (
        <div className="widget-list">
          {recentLogs.map(log => (
            <div key={log.id} className="widget-item">
              <div className="widget-info">
                <span className="widget-date">
                  {new Date(log.completed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                </span>
                <span className="widget-program">
                    {log.programs?.name || 'Programme'}
                </span>
              </div>
              <span className="widget-emoji">{ratings[log.rating]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientHistoryWidget;