// src/components/AddClientModal.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

const AddClientModal = ({ onClose, onClientAdded }) => {
  const { addToast } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', email: '', initial_weight_kg: '', height_cm: '', age: '', main_goal: '', fitness_level: 'Débutant',
    // Ajout des nouveaux champs
    sporting_past: '',
    available_equipment: '',
    training_frequency: '',
    physical_issues: '',
  });

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const generateClientCode = () => `ID-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Coach non identifié.");
      const newClient = { coach_id: user.id, client_code: generateClientCode(), ...formData };
      const { error } = await supabase.from('clients').insert(newClient);
      if (error) throw error;

      addToast('success', `Client "${formData.full_name}" ajouté ! Code : ${newClient.client_code}`);
      
      onClientAdded();
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
            <div className="modal-header"><h2>Nouveau Client</h2><button onClick={onClose} className="close-button">&times;</button></div>
            <form onSubmit={handleSubmit} className="modal-form">
                <input name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Nom complet" required />
                <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Adresse e-mail" required />
                <div className="form-row">
                    <input name="initial_weight_kg" type="number" value={formData.initial_weight_kg} onChange={handleChange} placeholder="Poids (kg)" />
                    <input name="height_cm" type="number" value={formData.height_cm} onChange={handleChange} placeholder="Taille (cm)" />
                    <input name="age" type="number" value={formData.age} onChange={handleChange} placeholder="Âge" />
                </div>
                <input name="main_goal" value={formData.main_goal} onChange={handleChange} placeholder="Objectif principal (ex: Perte de poids)" />
                <select name="fitness_level" value={formData.fitness_level} onChange={handleChange}>
                    <option>Débutant</option><option>Intermédiaire</option><option>Avancé</option>
                </select>

                {/* --- NOUVEAUX CHAMPS --- */}
                <hr className="form-divider" />
                <textarea name="sporting_past" value={formData.sporting_past} onChange={handleChange} placeholder="Passif sportif..." rows="2"></textarea>
                <textarea name="available_equipment" value={formData.available_equipment} onChange={handleChange} placeholder="Matériel à disposition..." rows="2"></textarea>
                <input name="training_frequency" value={formData.training_frequency} onChange={handleChange} placeholder="Fréquence d'entraînement souhaitée" />
                <textarea name="physical_issues" value={formData.physical_issues} onChange={handleChange} placeholder="Soucis physiques (blessures, douleurs...)" rows="2"></textarea>
                
                <button type="submit" disabled={loading}>{loading ? 'Création...' : 'Créer le client'}</button>
            </form>
        </div>
    </div>
  );
};

export default AddClientModal;