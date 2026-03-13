// src/components/AssignProgramModal.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

const AssignProgramModal = ({ client, programs, assignedProgramIds, onClose, onProgramAssigned }) => {
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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
    if (!startDate || !endDate) {
      addToast('error', 'Veuillez définir les dates de début et de fin.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      addToast('error', 'La date de fin doit être postérieure à la date de début.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('client_programs').insert({
        client_id: client.id,
        program_id: selectedProgramId,
        start_date: startDate,
        end_date: endDate,
      });
      if (error) {
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
              <div className="assign-dates-row">
                <div className="assign-date-field">
                  <label>Date de début</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                </div>
                <div className="assign-date-field">
                  <label>Date de fin</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                </div>
              </div>
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