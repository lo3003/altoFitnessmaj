// src/components/AppointmentModal.jsx
import React, { useState } from 'react';

const AppointmentModal = ({ onClose, onConfirm, loading }) => {
    // Par défaut, on propose demain à 10h00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    // Format YYYY-MM-DDTHH:mm pour l'input datetime-local
    const defaultDateTime = tomorrow.toISOString().slice(0, 16);

    const [scheduledAt, setScheduledAt] = useState(defaultDateTime);
    const [notes, setNotes] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(new Date(scheduledAt), notes);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Demander un RDV</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <p style={{color: 'var(--text-light)', fontSize: '14px', marginBottom: '16px'}}>
                        Proposez un créneau à votre coach. Il devra le confirmer.
                    </p>
                    
                    <div className="form-field">
                        <label>Date et Heure souhaitées</label>
                        <input 
                            type="datetime-local" 
                            value={scheduledAt}
                            onChange={(e) => setScheduledAt(e.target.value)}
                            required
                            min={new Date().toISOString().slice(0, 16)} // Pas de RDV dans le passé
                        />
                    </div>

                    <div className="form-field">
                        <label>Note pour le coach (optionnel)</label>
                        <textarea 
                            placeholder="Ex: Bilan mensuel, questions sur le programme..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows="3"
                        ></textarea>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? 'Envoi de la demande...' : 'Envoyer la proposition'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AppointmentModal;