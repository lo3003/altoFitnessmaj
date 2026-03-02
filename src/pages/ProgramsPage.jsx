// src/pages/ProgramsPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const ProgramsPage = ({ programs, clients, loading, onSelectProgram, onNewProgram }) => {
  const [filterEnv, setFilterEnv] = useState('Tous');
  const [filterClient, setFilterClient] = useState(''); // '' = Tous, 'global' = Non assignés, ID = Client spécifique

  // Récupérer la liste des clients pour le filtre (au cas où elle ne serait pas passée en props ou pour rafraîchir)
  const [localClients, setLocalClients] = useState([]);
  
  useEffect(() => {
      // On utilise les clients passés en props s'ils existent, sinon on fetch
      if (clients && clients.length > 0) {
          setLocalClients(clients);
      } else {
          const fetchClients = async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                  const { data } = await supabase.from('clients').select('id, full_name').eq('coach_id', user.id).order('full_name');
                  if (data) setLocalClients(data);
              }
          };
          fetchClients();
      }
  }, [clients]);

  // Logique de filtrage CORRIGÉE
  const filteredPrograms = useMemo(() => {
      return programs.filter(p => {
          // Filtre Environnement
          const matchesEnv = filterEnv === 'Tous' || p.environment === filterEnv;
          
          // Filtre Client
          let matchesClient = true;
          
          // On récupère la liste des IDs clients assignés à ce programme
          const assignedClientIds = p.client_programs?.map(cp => cp.client_id) || [];

          if (filterClient === 'global') {
              // "Non assignés" : personne n'a ce programme
              matchesClient = assignedClientIds.length === 0;
          } else if (filterClient !== '') {
              // "Client spécifique"
              // --- CORRECTION ICI : Conversion en String pour comparer "12" (select) et 12 (bdd) ---
              matchesClient = assignedClientIds.some(id => String(id) === String(filterClient));
          }

          return matchesEnv && matchesClient;
      });
  }, [programs, filterEnv, filterClient]);

  // Helper pour afficher les noms des clients assignés
  const getAssignedClientNames = (program) => {
      const assignedIds = program.client_programs?.map(cp => cp.client_id) || [];
      if (assignedIds.length === 0) return null;

      const names = assignedIds.map(id => {
          // On cherche dans localClients
          const client = localClients.find(c => c.id === id);
          return client ? client.full_name.split(' ')[0] : '?';
      });

      if (names.length > 2) return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
      return names.join(', ');
  };

  return (
    <div className="screen">
      <div className="page-header">
        <h1>Mes Programmes</h1>
        <button className="add-button" onClick={onNewProgram}>+</button>
      </div>

      <div className="library-controls" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          
          {/* Filtre Lieu */}
          <div className="filter-row" style={{ display: 'flex', gap: '8px' }}>
              {['Tous', 'Salle', 'Domicile'].map(env => (
                  <button 
                      key={env}
                      onClick={() => setFilterEnv(env)}
                      className={`small ${filterEnv === env ? '' : 'secondary'}`}
                      style={{ flex: 1, fontSize: '13px' }}
                  >
                      {env === 'Salle' ? '🏋️‍♂️ Salle' : (env === 'Domicile' ? '🏠 Maison' : 'Tout')}
                  </button>
              ))}
          </div>

          {/* Filtre Client */}
          <select 
              value={filterClient} 
              onChange={(e) => setFilterClient(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white', fontSize: '14px' }}
          >
              <option value="">Tous les programmes</option>
              <option value="global">🌍 Non assignés</option>
              <optgroup label="Assignés à...">
                  {localClients.map(c => (
                      <option key={c.id} value={c.id}>👤 {c.full_name}</option>
                  ))}
              </optgroup>
          </select>
      </div>

      {loading && <p className="loading-text">Chargement des programmes...</p>}

      {!loading && filteredPrograms.length === 0 && (
        <div className="empty-state">
          <p>Aucun programme ne correspond aux filtres.</p>
        </div>
      )}

      {!loading && filteredPrograms.length > 0 && (
        <div className="program-list">
          {filteredPrograms.map(program => {
            const assignedNames = getAssignedClientNames(program);
            return (
                <div key={program.id} className="program-card clickable" onClick={() => onSelectProgram(program)}>
                <div className="program-info">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3>{program.name}</h3>
                        <span style={{ 
                            fontSize: '18px', marginLeft: '8px',
                            backgroundColor: 'var(--background-color)', padding: '4px', borderRadius: '6px'
                        }}>
                            {program.environment === 'Domicile' ? '🏠' : '🏋️‍♂️'}
                        </span>
                    </div>
                    
                    <p style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {assignedNames ? (
                            <span style={{ color: 'var(--primary-color)', fontWeight: 500 }}>
                                👤 {assignedNames}
                            </span>
                        ) : (
                            <span style={{ color: 'var(--text-light)' }}>🌍 Non assigné</span>
                        )}
                    </p>
                </div>
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProgramsPage;