// src/components/ExerciseEditorModal.jsx
// (Copiez ce code complet pour remplacer l'ancien)
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

const TimeInputGroup = ({ label, value, onChange }) => (
  <div className="form-field">
      <label>{label}</label>
      <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input type="number" placeholder="0" value={value.min} onChange={e => onChange({ ...value, min: e.target.value })} /><span style={{ fontSize: '12px', color: 'var(--text-light)' }}>min</span>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input type="number" placeholder="0" value={value.sec} onChange={e => onChange({ ...value, sec: e.target.value })} /><span style={{ fontSize: '12px', color: 'var(--text-light)' }}>sec</span>
          </div>
      </div>
  </div>
);

const ExerciseEditorModal = ({ exercise, onClose, onSave, hideSets = false }) => {
  const { addToast } = useNotification();
  
  const EXERCISE_TYPES = [
      { id: 'Renforcement', label: 'Renfo', emoji: '🏋️‍♂️' },
      { id: 'Cardio', label: 'Cardio', emoji: '❤️' },
      { id: 'Mobilité', label: 'Mobilité', emoji: '🧘' },
      { id: 'Étirement', label: 'Étirement', emoji: '🤸' },
  ];

  const BODY_PARTS = [
      { id: 'Tout le corps', label: 'Tout le corps 🧍' },
      { id: 'Dos', label: 'Dos 🔙' },
      { id: 'Pectoraux', label: 'Pectoraux 👕' },
      { id: 'Epaules', label: 'Épaules 🥥' },
      { id: 'Bras', label: 'Bras 💪' },
      { id: 'Abdo', label: 'Abdos 🍫' },
      { id: 'Fessiers', label: 'Fessiers 🍑' },
      { id: 'Jambes', label: 'Jambes 🦵' },
  ];

  const detectMode = () => {
      if (exercise?.duration_minutes) return 'time';
      return 'reps';
  };
  const [trackingMode, setTrackingMode] = useState(exercise ? detectMode() : 'reps');

  const [exerciseType, setExerciseType] = useState(exercise?.type || 'Renforcement');
  
  const sanitizeData = (data) => {
      const cleaned = { ...data };
      Object.keys(cleaned).forEach(key => { if (cleaned[key] === '') cleaned[key] = null; });
      return cleaned;
  };

  const parseTime = (val) => {
    if (!val) return { min: '', sec: '' };
    if (!isNaN(val)) return { min: val, sec: '' };
    const m = val.match(/(\d+)m/);
    const s = val.match(/(\d+)s/);
    return { min: m ? m[1] : '', sec: s ? s[1] : '' };
  };

  const [duration, setDuration] = useState(parseTime(exercise?.duration_minutes));
  const [rest, setRest] = useState(parseTime(exercise?.rest_time));

  const [formData, setFormData] = useState({
    name: exercise?.name || '',
    sets: exercise?.sets || '',
    reps: exercise?.reps || '',
    charge: exercise?.charge || '',
    intensity: exercise?.intensity || 'Moyenne',
    comment: exercise?.comment || '',
    photo_url: exercise?.photo_url || null,
    body_part: exercise?.body_part || '', 
  });
  
  const [photoFile, setPhotoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return formData.photo_url;
    setIsUploading(true);
    const cleanName = photoFile.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9.]/g, "_").toLowerCase();
    const fileName = `${Date.now()}_${cleanName}`;
    const { error } = await supabase.storage.from('exercices').upload(fileName, photoFile);
    if (error) throw new Error("Erreur upload photo.");
    const { data: { publicUrl } } = supabase.storage.from('exercices').getPublicUrl(fileName);
    setIsUploading(false);
    return publicUrl;
  };

  const formatTime = (t) => {
    if (!t.min && !t.sec) return '';
    let str = '';
    if (t.min) str += `${t.min}m`;
    if (t.sec) str += ` ${t.sec}s`;
    return str.trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newPhotoUrl = await uploadPhoto();
      
      const finalSets = formData.sets; 
      const finalReps = trackingMode === 'reps' ? formData.reps : null;
      const finalCharge = trackingMode === 'reps' ? formData.charge : null;
      const finalDuration = trackingMode === 'time' ? formatTime(duration) : null;

      const finalData = { 
          ...formData, 
          sets: finalSets,
          reps: finalReps,
          charge: finalCharge,
          type: exerciseType, 
          id: exercise?.id || `temp-${Date.now()}`, 
          photo_url: newPhotoUrl,
          duration_minutes: finalDuration,
          rest_time: formatTime(rest)
      };
      
      const cleanedFinalData = sanitizeData(finalData);
      onSave(cleanedFinalData);
      onClose();
    } catch (error) {
      addToast('error', error.message);
    }
  };

  const photoPreview = photoFile ? URL.createObjectURL(photoFile) : formData.photo_url;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{exercise ? "Modifier" : "Nouveau"}</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-dark)', textAlign: 'left' }}>Type</h3>
          <div className="type-selector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {EXERCISE_TYPES.map(t => (
                <button key={t.id} type="button" onClick={() => setExerciseType(t.id)} className={exerciseType === t.id ? 'active' : ''} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', minHeight: '48px', padding: '8px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '18px', lineHeight: 1 }}>{t.emoji}</span><span>{t.label}</span>
                </button>
            ))}
          </div>

          {photoPreview && <div style={{ marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}><img src={photoPreview} alt="Aperçu" style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', display: 'block' }} /></div>}
          
          <div className="form-field"><label>Nom</label><input name="name" value={formData.name} onChange={handleChange} required placeholder="Ex: Squat Bulgare" /></div>
          <div className="form-field"><label>Zone</label><select name="body_part" value={formData.body_part} onChange={handleChange}><option value="">-- Sélectionner --</option>{BODY_PARTS.map(bp => (<option key={bp.id} value={bp.id}>{bp.label}</option>))}</select></div>

          <hr className="form-divider" />

          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', marginTop: '8px', color: 'var(--text-dark)', textAlign: 'left' }}>Paramètres</h3>
          <div className="type-selector" style={{ marginBottom: '16px' }}>
              <button type="button" className={trackingMode === 'reps' ? 'active' : ''} onClick={() => setTrackingMode('reps')}>🔢 Reps</button>
              <button type="button" className={trackingMode === 'time' ? 'active' : ''} onClick={() => setTrackingMode('time')}>⏱️ Chrono</button>
          </div>
          
          {trackingMode === 'reps' ? (
            <>
              <div className="form-row">
                {/* ON CACHE LE CHAMP SERIES SI C'EST UN SUIVEUR DE SUPERSET */}
                {!hideSets && (
                    <div className="form-field">
                        <label>Séries / Tours</label>
                        <input name="sets" type="number" value={formData.sets} onChange={handleChange} placeholder="Ex: 3" />
                    </div>
                )}
                <div className="form-field"><label>Répétitions</label><input name="reps" type="number" value={formData.reps} onChange={handleChange} placeholder="Ex: 12" /></div>
              </div>
              <div className="form-field"><label>Charge (kg)</label><input name="charge" value={formData.charge} onChange={handleChange} placeholder="Ex: 10" /></div>
            </>
          ) : (
            <>
                {!hideSets && (
                    <div className="form-field" style={{ marginBottom: '12px' }}>
                        <label>Séries / Tours</label>
                        <input name="sets" type="number" value={formData.sets} onChange={handleChange} placeholder="Ex: 3" />
                    </div>
                )}
                <TimeInputGroup label="Durée" value={duration} onChange={setDuration} />
            </>
          )}
          
          {/* Message d'info si on cache les séries */}
          {hideSets && (
              <p style={{fontSize: '12px', color: 'var(--primary-color)', fontStyle: 'italic', marginTop: '-10px'}}>
                  ℹ️ Le nombre de tours est défini par le premier exercice du circuit.
              </p>
          )}
          
          <div className="form-field"><label>Intensité</label><select name="intensity" value={formData.intensity} onChange={handleChange}><option>Faible</option><option>Moyenne</option><option>Haute</option></select></div>
          <TimeInputGroup label="Repos après" value={rest} onChange={setRest} />

          <hr className="form-divider" />
          <div className="form-field"><label>Consignes</label><textarea name="comment" value={formData.comment} onChange={handleChange} rows="2" placeholder="Ex: Dos droit..."></textarea></div>
          <div className="form-field"><label>Image</label><label className="photo-upload-label interactive">{photoFile ? `✔️ ${photoFile.name}` : (formData.photo_url ? '✔️ Changer' : "Choisir")} <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} /></label></div>
          
          <button type="submit" disabled={isUploading}>{isUploading ? '...' : 'Sauvegarder'}</button>
        </form>
      </div>
    </div>
  );
};

export default ExerciseEditorModal;