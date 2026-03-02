// src/pages/CoachInboxPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);

const CoachInboxPage = ({ onSelectClient }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // On récupère simplement la liste des clients pour l'instant
        const { data } = await supabase
          .from('clients')
          .select('*')
          .eq('coach_id', user.id)
          .order('full_name', { ascending: true });
        if (data) setClients(data);
      }
      setLoading(false);
    };
    fetchClients();
  }, []);

  return (
    <div className="screen">
      <div className="page-header">
        <h1>Messagerie</h1>
      </div>

      {loading && <p className="loading-text">Chargement des conversations...</p>}
      {!loading && clients.length === 0 && (
        <div className="empty-state">
          <p>Vous n'avez pas encore de clients avec qui discuter.</p>
        </div>
      )}

      <div className="client-list">
        {clients.map(client => (
          <div 
            key={client.id} 
            className="client-card clickable" 
            onClick={() => onSelectClient(client)}
            style={{ justifyContent: 'space-between' }}
          >
            <div>
                <h3>{client.full_name}</h3>
                <p>Ouvrir la conversation</p>
            </div>
            <div style={{ color: 'var(--primary-color)', opacity: 0.7 }}>
                <ChatIcon />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoachInboxPage;