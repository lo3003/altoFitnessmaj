// src/components/WorkoutFeedbackModal.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

const WorkoutFeedbackModal = ({ client, program, onClose, onWorkoutLogged }) => {
  const [rating, setRating] = useState(3);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useNotification();

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return null;

    // --- CORRECTION ICI : Nettoyage du nom de fichier (comme pour l'éditeur) ---
    const cleanName = photoFile.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")    // Enlève les accents
        .replace(/[^a-zA-Z0-9.]/g, "_")     // Remplace caractères spéciaux par _
        .toLowerCase();                     // Tout en minuscule

    // On garde la structure de dossier par client : "clientId/timestamp_nom"
    const fileName = `${client.id}/${Date.now()}_${cleanName}`;
    
    const { data, error } = await supabase.storage
      .from('confirmation-photo')
      .upload(fileName, photoFile);

    if (error) {
        console.error("Erreur upload:", error);
        throw new Error("Erreur lors de l'envoi de la photo. Vérifiez le format.");
    }
    
    // On récupère l'URL publique de l'image
    const { data: { publicUrl } } = supabase.storage
      .from('confirmation-photo')
      .getPublicUrl(fileName);
      
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const photoUrl = await uploadPhoto();

      const { error } = await supabase.from('workout_logs').insert({
        client_id: client.id,
        program_id: program.id,
        rating,
        feedback_notes: feedbackNotes,
        confirmation_photo_url: photoUrl,
      });
      if (error) throw error;

      addToast('success', 'Séance validée, bravo !');
      onWorkoutLogged();
      onClose();
    } catch (error) {
      addToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const ratings = [
    { value: 1, emoji: '😩', label: 'Très difficile' },
    { value: 2, emoji: '😟', label: 'Difficile' },
    { value: 3, emoji: '🙂', label: 'Modérée' },
    { value: 4, emoji: '😊', label: 'Facile' },
    { value: 5, emoji: '😎', label: 'Très facile' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Bravo !</h2>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <p className="feedback-question">Comment était la séance ?</p>
          <div className="rating-selector">
            {ratings.map(r => (
              <div key={r.value} className={`rating-option ${rating === r.value ? 'selected' : ''}`} onClick={() => setRating(r.value)}>
                <span className="rating-emoji">{r.emoji}</span>
                <span className="rating-label">{r.label}</span>
              </div>
            ))}
          </div>
          <textarea value={feedbackNotes} onChange={(e) => setFeedbackNotes(e.target.value)} placeholder="Ajoutez un commentaire (optionnel)..." rows="3"></textarea>
          <label className="photo-upload-label">
            {photoFile ? `✔️ ${photoFile.name}` : '📷 Ajouter une photo (optionnel)'}
            <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
          </label>
          <button type="submit" disabled={loading}>{loading ? 'Envoi...' : 'Valider ma séance'}</button>
        </form>
      </div>
    </div>
  );
};

export default WorkoutFeedbackModal;