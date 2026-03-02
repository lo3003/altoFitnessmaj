// src/pages/ClientDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';
import EditClientModal from '../components/EditClientModal';
import AssignProgramModal from '../components/AssignProgramModal';

// --- ICÔNES ---
const CopyIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>);
const MsgIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>);
const HistoryIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>);
const EditIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>);
const TrashIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>);

const ClientDetailPage = ({ client, programs, onBack, onClientAction, onViewHistory, onOpenChat }) => {
  const { addToast } = useNotification();
  const [assignedPrograms, setAssignedPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [programToUnassign, setProgramToUnassign] = useState(null);

  const fetchAssignedPrograms = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('client_programs').select(`programs (id, name)`).eq('client_id', client.id);
    if (data) {
        setAssignedPrograms(data.filter(item => item.programs).map(item => item.programs));
    }
    setLoading(false);
  }, [client.id]);

  useEffect(() => {
    fetchAssignedPrograms();
  }, [fetchAssignedPrograms]);

  const handleDelete = async () => { 
    try {
        const { error } = await supabase.from('clients').delete().eq('id', client.id);
        if (error) throw error;
        addToast('success', `Client "${client.full_name}" supprimé.`);
        onClientAction();
    } catch (error) { addToast('error', "Erreur : " + error.message); }
  };
  
  const handleUnassignProgram = async () => {
    if (!programToUnassign) return;
    try {
        const { error } = await supabase.from('client_programs').delete().match({ client_id: client.id, program_id: programToUnassign.id });
        if (error) throw error;
        addToast('success', `Le programme a été retiré.`);
        setProgramToUnassign(null);
        fetchAssignedPrograms();
    } catch (error) {
        addToast('error', error.message);
        setProgramToUnassign(null);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(client.client_code);
    addToast('success', 'Code d\'accès copié !');
  };

  return (
    <>
      <div className="screen">
        <a href="#" className="back-link" onClick={onBack}>← Retour à la liste</a>
        
        <div className="detail-layout">
          <div className="detail-layout-left">
            <div className="detail-card">
              <h2>{client.full_name}</h2>
              <div className="client-code-wrapper" onClick={handleCopyCode} title="Copier le code">
                <span>Code d'accès : <strong>{client.client_code}</strong></span>
                <CopyIcon />
              </div>
              
              <div className="info-grid full" style={{marginTop: '24px'}}>
                <div><span>Objectif</span><p>{client.main_goal || 'N/A'}</p></div>
                <div><span>Niveau</span><p>{client.fitness_level || 'N/A'}</p></div>
                <div><span>Poids initial</span><p>{client.initial_weight_kg ? `${client.initial_weight_kg} kg` : 'N/A'}</p></div>
                <div><span>Taille</span><p>{client.height_cm ? `${client.height_cm} cm` : 'N/A'}</p></div>
                <div><span>Âge</span><p>{client.age || 'N/A'}</p></div>
                <div><span>Email</span><p>{client.email || 'N/A'}</p></div>
                <div className="full-width"><span>Fréquence d'entraînement</span><p>{client.training_frequency || 'N/A'}</p></div>
                <div className="full-width"><span>Passif Sportif</span><p>{client.sporting_past || 'N/A'}</p></div>
                <div className="full-width"><span>Matériel à disposition</span><p>{client.available_equipment || 'N/A'}</p></div>
                <div className="full-width"><span>Soucis Physiques</span><p>{client.physical_issues || 'N/A'}</p></div>
              </div>
            </div>
            
            {/* --- ACTIONS PRINCIPALES (Message / Historique) --- */}
            <div className="button-group" style={{marginTop: '24px'}}>
                <div className="button-row main-actions">
                  <button onClick={() => onOpenChat(client)}>
                      <MsgIcon /> Message
                  </button>
                  <button className="secondary" onClick={() => onViewHistory(client)}>
                      <HistoryIcon /> Historique
                  </button>
                </div>
            </div>

            {/* --- ACTIONS SECONDAIRES (Admin) --- */}
            <div className="button-group" style={{marginTop: '16px'}}>
               <div className="button-row admin-actions">
                  <button className="tertiary" onClick={() => setShowEditModal(true)}>
                      <EditIcon /> Modifier infos
                  </button>
                  <button className="tertiary danger" onClick={() => setShowDeleteConfirm(true)}>
                      <TrashIcon /> Supprimer
                  </button>
               </div>
            </div>

          </div>
          
          <div className="detail-layout-right">
            <div className="page-header" style={{marginTop: '0px'}}>
              <h3>Programmes Assignés</h3>
              <button className="add-button" onClick={() => setShowAssignModal(true)}>+</button>
            </div>

            {loading && <p className="loading-text">Chargement...</p>}
            {!loading && assignedPrograms.length === 0 && <div className="empty-state"><p>Aucun programme assigné.</p></div>}
            {!loading && assignedPrograms.length > 0 && (
              <div className="program-list">
                {assignedPrograms.map(program => (
                  <div key={program.id} className="program-card">
                    <div className="program-info">
                      <h3>{program.name}</h3>
                      <p>Programme mixte</p>
                    </div>
                    <button className="unassign-button" title="Retirer le programme" onClick={() => setProgramToUnassign(program)}>
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showEditModal && <EditClientModal client={client} onClose={() => setShowEditModal(false)} onClientUpdated={(uc) => { onClientAction(uc); fetchAssignedPrograms(); }} />}
      {showDeleteConfirm && <ConfirmModal title="Supprimer le client" message={`Êtes-vous sûr de vouloir supprimer ${client.full_name} ?`} onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />}
      {showAssignModal && <AssignProgramModal client={client} programs={programs} assignedProgramIds={assignedPrograms.map(p => p.id)} onClose={() => setShowAssignModal(false)} onProgramAssigned={fetchAssignedPrograms} />}
      {programToUnassign && <ConfirmModal title="Retirer le programme" message={`Retirer le programme "${programToUnassign.name}" de ce client ?`} onConfirm={handleUnassignProgram} onCancel={() => setProgramToUnassign(null)} confirmText="Oui, retirer" />}
    </>
  );
};

export default ClientDetailPage;