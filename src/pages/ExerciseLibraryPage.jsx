// src/pages/ExerciseLibraryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import ExerciseEditorModal from '../components/ExerciseEditorModal';
import ConfirmModal from '../components/ConfirmModal';
import { useNotification } from '../contexts/NotificationContext';

const ExerciseLibraryPage = ({ isModalOpen, setIsModalOpen }) => {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useNotification();

    const [typeFilter, setTypeFilter] = useState('Tous');
    const [bodyPartFilter, setBodyPartFilter] = useState('Tous');

    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchLibrary = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .eq('coach_id', user.id)
                .eq('is_template', true)
                .order('name', { ascending: true });
            
            if (error) addToast('error', "Erreur chargement.");
            else setExercises(data);
        }
        setLoading(false);
    }, [addToast]);

    useEffect(() => { fetchLibrary(); }, [fetchLibrary]);

    const handleOpenModalForNew = () => { setItemToEdit(null); setIsModalOpen(true); };
    const handleOpenModalForEdit = (exercise) => { setItemToEdit(exercise); setIsModalOpen(true); };

    const handleSaveExercise = async (exerciseData) => {
        const { data: { user } } = await supabase.auth.getUser();
        const rawData = { ...exerciseData, coach_id: user.id, is_template: true, program_id: null };
        if (rawData.id && String(rawData.id).startsWith('temp-')) delete rawData.id;

        // Petite fonction locale de nettoyage pour éviter duplication
        const sanitize = (d) => {
             const c = { ...d };
             Object.keys(c).forEach(k => { if (c[k] === '') c[k] = null; });
             return c;
        };

        const dataToSave = sanitize(rawData);
        let error;
        if (itemToEdit) {
            ({ error } = await supabase.from('exercises').update(dataToSave).eq('id', itemToEdit.id));
        } else {
            ({ error } = await supabase.from('exercises').insert(dataToSave));
        }

        if (error) addToast('error', `Erreur: ${error.message}`);
        else {
            addToast('success', `Sauvegardé.`);
            fetchLibrary();
        }
    };

    const handleDeleteExercise = async () => {
        const { error } = await supabase.from('exercises').delete().eq('id', itemToDelete.id);
        if (error) addToast('error', error.message);
        else {
            addToast('success', "Supprimé.");
            fetchLibrary();
        }
        setItemToDelete(null);
    };

    const filteredExercises = exercises.filter(exo => {
        const matchesSearch = exo.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'Tous' || exo.type === typeFilter;
        const matchesBodyPart = bodyPartFilter === 'Tous' || exo.body_part === bodyPartFilter;
        return matchesSearch && matchesType && matchesBodyPart;
    });

    const getEmojiForType = (type) => {
        switch(type) {
            case 'Renforcement': return '🏋️‍♂️';
            case 'Cardio': return '❤️';
            case 'Mobilité': return '🧘';
            case 'Étirement': return '🤸';
            default: return '🔹';
        }
    };

    const formatDuration = (val) => {
        if(!val) return '';
        if(String(val).match(/[ms]/)) return val;
        return `${val} min`;
    };

    // Helper pour l'affichage combiné
    const getDetailsString = (exo) => {
        if (exo.sets && exo.reps) return `${exo.sets} × ${exo.reps}`; // Priorité Reps
        if (exo.duration_minutes) {
            const dur = formatDuration(exo.duration_minutes);
            return exo.sets ? `${exo.sets} × ${dur}` : dur; // Si durée + sets
        }
        if (exo.sets) return `${exo.sets} séries`;
        return '';
    };

    return (
        <>
            <div className="screen">
                <div className="page-header">
                    <h1>Bibliothèque</h1>
                    <button className="add-button" onClick={handleOpenModalForNew}>+</button>
                </div>
                
                <div className="library-controls" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                    <input 
                        type="text" 
                        placeholder="🔍 Rechercher un exercice..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="filter-row" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                            {['Tous', 'Renforcement', 'Cardio', 'Mobilité', 'Étirement'].map(type => (
                                <button 
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`small ${typeFilter === type ? '' : 'secondary'}`}
                                    style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '13px' }}
                                >
                                    {type === 'Tous' ? 'Tout' : getEmojiForType(type) + ' ' + type}
                                </button>
                            ))}
                        </div>

                        <select 
                            value={bodyPartFilter} 
                            onChange={(e) => setBodyPartFilter(e.target.value)}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white' }}
                        >
                            <option value="Tous">Toutes les zones</option>
                            <option value="Tout le corps">🧍 Tout le corps</option>
                            <option value="Dos">🔙 Dos</option>
                            <option value="Pectoraux">👕 Pectoraux</option>
                            <option value="Epaules">🥥 Épaules</option>
                            <option value="Bras">💪 Bras</option>
                            <option value="Abdo">🍫 Abdos</option>
                            <option value="Fessiers">🍑 Fessiers</option>
                            <option value="Jambes">🦵 Jambes</option>
                        </select>
                    </div>
                </div>

                {loading && <p className="loading-text">Chargement...</p>}
                {!loading && filteredExercises.length === 0 && <div className="empty-state"><p>Aucun exercice trouvé.</p></div>}
                
                {!loading && (
                    <div className="exercise-list library-grid">
                        {filteredExercises.map(exo => (
                            <div key={exo.id} className="exercise-card library-item" onClick={() => handleOpenModalForEdit(exo)}>
                                <div className={`exercise-type-badge ${exo.type?.toLowerCase()}`} style={{
                                    backgroundColor: 'var(--background-color)', border: '1px solid var(--border-color)', color: 'var(--text-dark)', fontSize: '16px'
                                }}>{getEmojiForType(exo.type)}</div>

                                <div className="library-item-content" style={{ width: '100%' }}>
                                    {exo.photo_url ? (
                                        <div style={{ width: '100%', height: '140px', marginBottom: '12px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f0f0f0', marginTop: '20px' }}>
                                            <img src={exo.photo_url} alt={exo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ) : (<div style={{ height: '30px' }}></div>)}
                                    
                                    <h3>{exo.name}</h3>
                                    
                                    <div className="library-item-details" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{fontSize: '13px'}}>
                                            {getDetailsString(exo)}
                                        </span>

                                        {exo.comment && (
                                            <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic', marginTop: '2px' }}>
                                                "{exo.comment}"
                                            </span>
                                        )}
                                        
                                        {exo.body_part && (
                                            <span style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: '600', marginTop: '2px' }}>
                                                {exo.body_part === 'Tout le corps' && '🧍 '}
                                                {exo.body_part === 'Dos' && '🔙 '}
                                                {exo.body_part === 'Pectoraux' && '👕 '}
                                                {exo.body_part === 'Epaules' && '🥥 '}
                                                {exo.body_part === 'Bras' && '💪 '}
                                                {exo.body_part === 'Abdo' && '🍫 '}
                                                {exo.body_part === 'Fessiers' && '🍑 '}
                                                {exo.body_part === 'Jambes' && '🦵 '}
                                                {exo.body_part}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button className="delete-icon-library" onClick={(e) => { e.stopPropagation(); setItemToDelete(exo); }}>&times;</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {isModalOpen && <ExerciseEditorModal exercise={itemToEdit} onClose={() => setIsModalOpen(false)} onSave={handleSaveExercise} />}
            {itemToDelete && <ConfirmModal title="Supprimer" message={`Supprimer "${itemToDelete.name}" ?`} onConfirm={handleDeleteExercise} onCancel={() => setItemToDelete(null)} />}
        </>
    );
};

export default ExerciseLibraryPage;