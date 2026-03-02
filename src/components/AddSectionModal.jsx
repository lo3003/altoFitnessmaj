// src/components/AddSectionModal.jsx
import React, { useState } from 'react';

const AddSectionModal = ({ onClose, onConfirm }) => {
    const [sectionName, setSectionName] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (sectionName.trim()) {
            onConfirm(sectionName.trim());
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Ajouter une section</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-field">
                        <label htmlFor="sectionName">Nom de la section</label>
                        <input
                            id="sectionName"
                            type="text"
                            value={sectionName}
                            onChange={(e) => setSectionName(e.target.value)}
                            placeholder="Ex: Échauffement, Circuit Cardio..."
                            autoFocus
                            required
                        />
                    </div>
                    <div className="button-group" style={{ marginTop: '24px' }}>
                        <button type="submit">Ajouter</button>
                        <button type="button" className="secondary" onClick={onClose}>Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSectionModal;