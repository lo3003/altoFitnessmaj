// src/components/EditClientModal.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

const EditClientModal = ({ client, onClose, onClientUpdated }) => {
  const { addToast } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: client.full_name || '', email: client.email || '', initial_weight_kg: client.initial_weight_kg || '',
    height_cm: client.height_cm || '', age: client.age || '', main_goal: client.main_goal || '', fitness_level: client.fitness_level || 'Débutant',
    // Ajout des nouveaux champs
    sporting_past: client.sporting_past || '',
    available_equipment: client.available_equipment || '',
    training_frequency: client.training_frequency || '',
    physical_issues: client.physical_issues || '',
  });
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('clients').update(formData).eq('id', client.id).select().single();
      if (error) throw error;

      addToast('success', `Informations de "${formData.full_name}" mises à jour.`);

      onClientUpdated(data);
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
            <div className="modal-header"><h2>Modifier le Client</h2><button onClick={onClose} className="close-button">&times;</button></div>
            <form onSubmit={handleSubmit} className="modal-form">
                <input name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Nom complet" required />
                <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Adresse e-mail (optionnel)" />
                <div className="form-row">
                    <input name="initial_weight_kg" type="number" value={formData.initial_weight_kg} onChange={handleChange} placeholder="Poids (kg)" />
                    <input name="height_cm" type="number" value={formData.height_cm} onChange={handleChange} placeholder="Taille (cm)" />
                    <input name="age" type="number" value={formData.age} onChange={handleChange} placeholder="Âge" />
                </div>
                <input name="main_goal" value={formData.main_goal} onChange={handleChange} placeholder="Objectif principal" />
                <select name="fitness_level" value={formData.fitness_level} onChange={handleChange}>
                    <option>Débutant</option><option>Intermédiaire</option><option>Avancé</option>
                </select>

                {/* --- NOUVEAUX CHAMPS --- */}
                <hr className="form-divider" />
                <textarea name="sporting_past" value={formData.sporting_past} onChange={handleChange} placeholder="Passif sportif..." rows="2"></textarea>
                <textarea name="available_equipment" value={formData.available_equipment} onChange={handleChange} placeholder="Matériel à disposition..." rows="2"></textarea>
                <input name="training_frequency" value={formData.training_frequency} onChange={handleChange} placeholder="Fréquence d'entraînement souhaitée" />
                <textarea name="physical_issues" value={formData.physical_issues} onChange={handleChange} placeholder="Soucis physiques (blessures, douleurs...)" rows="2"></textarea>
                
                <button type="submit" disabled={loading}>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</button>
            </form>
        </div>
    </div>
  );
};

export default EditClientModal;