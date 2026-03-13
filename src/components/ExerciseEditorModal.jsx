// src/components/ExerciseEditorModal.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

/* ─── TimeMMSSInput ─── */
const TimeMMSSInput = ({ value, onChange, placeholder = '02:00' }) => {
  const handleTimeChange = (e) => {
    let raw = e.target.value.replace(/[^0-9]/g, '');
    if (raw.length > 4) raw = raw.slice(0, 4);
    if (raw.length >= 3) {
      raw = raw.slice(0, raw.length - 2) + ':' + raw.slice(raw.length - 2);
    }
    onChange(raw);
  };
  return (
    <input type="text" inputMode="numeric" placeholder={placeholder}
      value={value} onChange={handleTimeChange} maxLength={5}
      className="eem-input" />
  );
};

/* ─── TimeInputGroup for duration ─── */
const TimeInputGroup = ({ value, onChange }) => (
  <div className="eem-time-group">
    <input type="number" placeholder="0" value={value.min}
      onChange={e => onChange({ ...value, min: e.target.value })} className="eem-input" />
    <span className="eem-time-sep">min</span>
    <input type="number" placeholder="0" value={value.sec}
      onChange={e => onChange({ ...value, sec: e.target.value })} className="eem-input" />
    <span className="eem-time-sep">sec</span>
  </div>
);

const ExerciseEditorModal = ({ exercise, onClose, onSave, hideSets = false, programName }) => {
  const { addToast } = useNotification();

  const EXERCISE_TYPES = [
    { id: 'Renforcement', label: '🏋️ Renforcement' },
    { id: 'Cardio', label: '❤️ Cardio' },
    { id: 'Mobilité', label: '🧘 Mobilité' },
    { id: 'Étirement', label: '🤸 Étirement' },
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

  const CHARGE_TYPES = [
    { id: 'kg', label: 'kg' },
    { id: 'lbs', label: 'lbs' },
    { id: 'PDC', label: 'Poids du corps' },
    { id: 'Nv', label: 'Niveau (Nv)' },
    { id: 'Aucune', label: 'Aucune' },
  ];

  const EFFORT_TYPES = [
    { id: 'Répétitions', label: 'Répétitions' },
    { id: 'Intervalle', label: 'Intervalle' },
    { id: 'Temps', label: 'Temps (mm:ss)' },
    { id: 'Max Rép', label: 'Max Rép' },
    { id: 'Max Temps', label: 'Max Temps' },
  ];

  const [exerciseType, setExerciseType] = useState(exercise?.type || 'Renforcement');
  const isRenfo = exerciseType === 'Renforcement';
  const [chargeType, setChargeType] = useState(exercise?.charge_type || 'kg');

  const detectEffortType = () => {
    if (exercise?.effort_type) return exercise.effort_type;
    if (exercise?.reps_min && exercise?.reps_max) return 'Intervalle';
    if (exercise?.duration_minutes) return 'Temps';
    return 'Répétitions';
  };
  const [effortType, setEffortType] = useState(detectEffortType());

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

  const parseRestToMMSS = (val) => {
    if (!val) return '';
    if (String(val).match(/^\d{1,2}:\d{2}$/)) return val;
    const t = parseTime(val);
    const mm = String(t.min || 0).padStart(2, '0');
    const ss = String(t.sec || 0).padStart(2, '0');
    if (mm === '00' && ss === '00') return '';
    return `${mm}:${ss}`;
  };

  const [duration, setDuration] = useState(parseTime(exercise?.duration_minutes));
  const [restTime, setRestTime] = useState(parseRestToMMSS(exercise?.rest_time));

  const [formData, setFormData] = useState({
    name: exercise?.name || '',
    sets: exercise?.sets || '',
    reps: exercise?.reps || '',
    reps_min: exercise?.reps_min || '',
    reps_max: exercise?.reps_max || '',
    charge: exercise?.charge || '',
    intensity: exercise?.intensity || 'Moyenne',
    comment: exercise?.comment || '',
    photo_url: exercise?.photo_url || null,
    body_part: exercise?.body_part || '',
  });

  const [variants, setVariants] = useState(exercise?.variants || []);
  const [newVariantName, setNewVariantName] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) setPhotoFile(e.target.files[0]);
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

  const handleAddVariant = () => {
    const name = newVariantName.trim();
    if (!name) return;
    setVariants(prev => [...prev, { id: crypto.randomUUID(), name, photo_url: null }]);
    setNewVariantName('');
  };

  const handleVariantKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAddVariant(); }
  };

  const handleRemoveVariant = (variantId) => {
    setVariants(prev => prev.filter(v => v.id !== variantId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newPhotoUrl = await uploadPhoto();
      let finalReps = null, finalRepsMin = null, finalRepsMax = null, finalDuration = null;
      let finalCharge = null, finalChargeType = null, finalEffortType = null;

      if (isRenfo) {
        finalChargeType = chargeType;
        finalEffortType = effortType;
        finalCharge = chargeType === 'Aucune' ? null : formData.charge;
        switch (effortType) {
          case 'Répétitions': finalReps = formData.reps; break;
          case 'Temps': finalDuration = formatTime(duration); break;
          case 'Intervalle': finalRepsMin = formData.reps_min; finalRepsMax = formData.reps_max; break;
          default: break;
        }
      } else {
        finalDuration = formatTime(duration);
      }

      const finalData = {
        ...formData,
        sets: formData.sets,
        reps: finalReps, reps_min: finalRepsMin, reps_max: finalRepsMax,
        charge: finalCharge, charge_type: finalChargeType, effort_type: finalEffortType,
        type: exerciseType, id: exercise?.id || `temp-${Date.now()}`,
        photo_url: newPhotoUrl, duration_minutes: finalDuration,
        rest_time: restTime || null, variants,
      };

      onSave(sanitizeData(finalData));
      onClose();
    } catch (error) {
      addToast('error', error.message);
    }
  };

  const photoPreview = photoFile ? URL.createObjectURL(photoFile) : formData.photo_url;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="eem-modal" onClick={e => e.stopPropagation()}>

        {/* ─── HEADER ─── */}
        <div className="eem-header">
          <div className="eem-header-left">
            <div className="eem-header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </div>
            <div>
              <h2 className="eem-title">{exercise ? 'Modifier l\'exercice' : 'Nouvel exercice'}</h2>
              <span className="eem-subtitle">ÉDITEUR{programName ? ` • ${programName.toUpperCase()}` : ''}</span>
            </div>
          </div>
          <div className="eem-header-right">
            <button type="button" className="eem-btn-save" onClick={handleSubmit} disabled={isUploading}>
              {isUploading ? '...' : 'Sauvegarder'}
            </button>
            <button type="button" className="eem-btn-cancel" onClick={onClose}>Annuler</button>
          </div>
        </div>

        {/* ─── BODY (scrollable) ─── */}
        <form className="eem-body" onSubmit={handleSubmit}>

          {/* Ligne 1 : Nom + URL média */}
          <div className="eem-row-2col">
            <div className="eem-field">
              <label className="eem-label">Nom de l'exercice</label>
              <input name="name" value={formData.name} onChange={handleChange} required
                placeholder="Ex: Squat Bulgare" className="eem-input" />
            </div>
            <div className="eem-field">
              <label className="eem-label">URL média (Vidéo/Image)</label>
              <input name="photo_url" value={formData.photo_url || ''} onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..." className="eem-input" />
            </div>
          </div>

          {/* Ligne 2 : Type + Zone + aperçu */}
          <div className="eem-row-2col">
            <div className="eem-fields-col">
              <div className="eem-field">
                <label className="eem-label">Type d'exercice</label>
                <select value={exerciseType} onChange={(e) => setExerciseType(e.target.value)} className="eem-select">
                  {EXERCISE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div className="eem-field">
                <label className="eem-label">Zone du corps</label>
                <select name="body_part" value={formData.body_part} onChange={handleChange} className="eem-select">
                  <option value="">-- Sélectionner --</option>
                  {BODY_PARTS.map(bp => <option key={bp.id} value={bp.id}>{bp.label}</option>)}
                </select>
              </div>
            </div>
            <div className="eem-preview-area">
              {photoPreview ? (
                <img src={photoPreview} alt="Aperçu" className="eem-preview-img" />
              ) : (
                <div className="eem-preview-placeholder">
                  <label className="eem-upload-trigger">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                    <span>Uploader ou coller l'URL</span>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                  </label>
                </div>
              )}
              {photoPreview && (
                <label className="eem-change-photo">
                  Changer
                  <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </div>

          {/* ─── PARAMÈTRES D'EXÉCUTION ─── */}
          <div className="eem-section">
            <div className="eem-section-title">
              <span className="eem-section-icon">⚙️</span>
              <h3>Paramètres d'exécution</h3>
            </div>

            {!hideSets && (
              <div className="eem-field eem-sets-field">
                <label className="eem-label">Séries / Tours</label>
                <input name="sets" type="number" value={formData.sets} onChange={handleChange}
                  placeholder="Ex: 4" className="eem-input" />
              </div>
            )}
            {hideSets && (
              <p className="eem-hint">ℹ️ Le nombre de tours est défini par le premier exercice du circuit.</p>
            )}

            {/* ── Renforcement : CHARGE | EFFORT | REPOS ── */}
            {isRenfo ? (
              <div className="eem-params-grid">
                <div className="eem-param-col">
                  <span className="eem-param-num">01. CHARGE</span>
                  <select value={chargeType} onChange={(e) => setChargeType(e.target.value)} className="eem-select">
                    {CHARGE_TYPES.map(ct => <option key={ct.id} value={ct.id}>{ct.label}</option>)}
                  </select>
                  {chargeType !== 'Aucune' && (
                    <div className="eem-input-with-unit">
                      <input name="charge" value={formData.charge} onChange={handleChange}
                        placeholder="0" className="eem-input" type="number" />
                      <span className="eem-unit">{chargeType}</span>
                    </div>
                  )}
                </div>

                <div className="eem-param-col">
                  <span className="eem-param-num">02. EFFORT</span>
                  <select value={effortType} onChange={(e) => setEffortType(e.target.value)} className="eem-select">
                    {EFFORT_TYPES.map(et => <option key={et.id} value={et.id}>{et.label}</option>)}
                  </select>
                  {effortType === 'Répétitions' && (
                    <input name="reps" type="number" value={formData.reps} onChange={handleChange}
                      placeholder="12" className="eem-input" />
                  )}
                  {effortType === 'Intervalle' && (
                    <div className="eem-range-row">
                      <input name="reps_min" type="number" value={formData.reps_min} onChange={handleChange}
                        placeholder="8" className="eem-input" />
                      <span className="eem-range-sep">—</span>
                      <input name="reps_max" type="number" value={formData.reps_max} onChange={handleChange}
                        placeholder="12" className="eem-input" />
                    </div>
                  )}
                  {effortType === 'Temps' && (
                    <TimeInputGroup value={duration} onChange={setDuration} />
                  )}
                  {(effortType === 'Max Rép' || effortType === 'Max Temps') && (
                    <span className="eem-hint-small">Aucun paramètre supplémentaire</span>
                  )}
                </div>

                <div className="eem-param-col">
                  <span className="eem-param-num">03. REPOS</span>
                  <div className="eem-recovery-label">🕒 Temps de repos</div>
                  <TimeMMSSInput value={restTime} onChange={setRestTime} />
                </div>
              </div>
            ) : (
              /* ── Cardio / Mobilité / Étirement : DURÉE | INTENSITÉ | REPOS ── */
              <div className="eem-params-grid">
                <div className="eem-param-col">
                  <span className="eem-param-num">01. DURÉE</span>
                  <TimeInputGroup value={duration} onChange={setDuration} />
                </div>

                <div className="eem-param-col">
                  <span className="eem-param-num">02. INTENSITÉ</span>
                  <select name="intensity" value={formData.intensity} onChange={handleChange} className="eem-select">
                    <option value="Faible">Faible</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                  </select>
                </div>

                <div className="eem-param-col">
                  <span className="eem-param-num">03. REPOS</span>
                  <div className="eem-recovery-label">🕒 Temps de repos</div>
                  <TimeMMSSInput value={restTime} onChange={setRestTime} />
                </div>
              </div>
            )}
          </div>

          {/* ─── CONSIGNES / INSTRUCTIONS ─── */}
          <div className="eem-section">
            <div className="eem-section-title">
              <span className="eem-section-icon">📝</span>
              <h3>Consignes</h3>
            </div>
            <div className="eem-field">
              <textarea name="comment" value={formData.comment} onChange={handleChange}
                rows="3" placeholder="Ex: Dos droit, descendre jusqu'à 90°..." className="eem-input" style={{ resize: 'vertical' }} />
            </div>
          </div>

          {/* ─── VARIANTES ─── */}
          <div className="eem-section">
            <div className="eem-section-title">
              <span className="eem-section-icon">🔄</span>
              <h3>Variantes d'exercice</h3>
              <button type="button" className="eem-add-variant-btn" onClick={() => document.getElementById('eem-variant-input')?.focus()}>
                + Ajouter
              </button>
            </div>
            <div className="eem-variants-row">
              {variants.map(v => (
                <div key={v.id} className="eem-variant-tag">
                  <span>{v.name}</span>
                  <button type="button" onClick={() => handleRemoveVariant(v.id)}>&times;</button>
                </div>
              ))}
              <input id="eem-variant-input" type="text" className="eem-variant-input"
                placeholder="+ Nouvelle variante" value={newVariantName}
                onChange={(e) => setNewVariantName(e.target.value)}
                onKeyDown={handleVariantKeyDown} />
            </div>
          </div>

          {/* ─── FOOTER ─── */}
          <div className="eem-footer">
            <span className="eem-footer-meta">
              {exercise ? '✏️ Modification en cours' : '✨ Création d\'un exercice'}
            </span>
            {exercise && (
              <button type="button" className="eem-btn-delete">SUPPRIMER</button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
};

export default ExerciseEditorModal;