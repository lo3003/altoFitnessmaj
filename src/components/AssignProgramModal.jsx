// src/components/AssignProgramModal.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

const AssignProgramModal = ({ client, programs, assignedProgramIds, onClose, onProgramAssigned }) => {
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useNotification();

  // On filtre les programmes pour ne montrer que ceux qui ne sont pas déjà assignés
  const availablePrograms = programs.filter(p => !assignedProgramIds.includes(p.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProgramId) {
      addToast('error', 'Veuillez sélectionner un programme.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('client_programs').insert({
        client_id: client.id,
        program_id: selectedProgramId,
      });
      if (error) {
        // Gère le cas où le programme est déjà assigné (contrainte UNIQUE)
        if (error.code === '23505') {
            throw new Error("Ce programme est déjà assigné à ce client.");
        }
        throw error;
      }
      
      const assignedProgram = programs.find(p => p.id === parseInt(selectedProgramId));
      addToast('success', `Programme "${assignedProgram.name}" assigné à ${client.full_name}.`);
      onProgramAssigned();
      onClose();
    } catch (error) {
      addToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assigner un Programme</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {availablePrograms.length > 0 ? (
            <>
              <select value={selectedProgramId} onChange={(e) => setSelectedProgramId(e.target.value)} required>
                <option value="" disabled>Choisir un programme...</option>
                {availablePrograms.map(program => (
                  <option key={program.id} value={program.id}>
                    {program.name} ({program.type})
                  </option>
                ))}
              </select>
              <button type="submit" disabled={loading}>{loading ? 'Assignation...' : 'Assigner le programme'}</button>
            </>
          ) : (
            <p className="empty-state">Tous vos programmes sont déjà assignés à ce client, ou vous n'avez pas encore créé de programme.</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AssignProgramModal;