// src/pages/ExerciseLibraryPage.jsx
import React, { useState } from 'react';
import { useExerciseLibrary } from '../hooks/useExerciseLibrary';
import ExerciseEditorModal from '../components/ExerciseEditorModal';
import ConfirmModal from '../components/ConfirmModal';

const ExerciseLibraryPage = ({ isModalOpen, setIsModalOpen }) => {
    const { exercises, loading, handleSaveExercise, handleDeleteExercise } = useExerciseLibrary();
    const [searchTerm, setSearchTerm] = useState('');

    const [typeFilter, setTypeFilter] = useState('Tous');
    const [bodyPartFilter, setBodyPartFilter] = useState('Tous');

    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const handleOpenModalForNew = () => { setItemToEdit(null); setIsModalOpen(true); };
    const handleOpenModalForEdit = (exercise) => { setItemToEdit(exercise); setIsModalOpen(true); };

    const onSaveExercise = async (exerciseData) => {
        await handleSaveExercise(exerciseData, itemToEdit);
    };

    const onDeleteExercise = async () => {
        await handleDeleteExercise(itemToDelete);
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
                
                <div className="lib-controls">
                    <input 
                        type="text" 
                        placeholder="🔍 Rechercher un exercice..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="lib-filter-row">
                            {['Tous', 'Renforcement', 'Cardio', 'Mobilité', 'Étirement'].map(type => (
                                <button 
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`small ${typeFilter === type ? '' : 'secondary'}`}
                                    style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '13px', flexShrink: 0, width: 'auto' }}
                                >
                                    {type === 'Tous' ? 'Tout' : getEmojiForType(type) + ' ' + type}
                                </button>
                            ))}
                        </div>

                        <select 
                            value={bodyPartFilter} 
                            onChange={(e) => setBodyPartFilter(e.target.value)}
                            className="lib-select"
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
                    <div className="lib-grid">
                        {filteredExercises.map(exo => (
                            <div key={exo.id} className="lib-card" onClick={() => handleOpenModalForEdit(exo)}>
                                <div className="lib-badge">{getEmojiForType(exo.type)}</div>

                                {exo.photo_url ? (
                                    <div className="lib-photo-container">
                                        <img src={exo.photo_url} alt={exo.name} />
                                    </div>
                                ) : (
                                    <div className="lib-photo-empty"></div>
                                )}
                                
                                <div className="lib-content">
                                    <h3>{exo.name}</h3>
                                    
                                    <div className="lib-details-container">
                                        <span className="lib-stats">
                                            {getDetailsString(exo)}
                                        </span>

                                        {exo.comment && (
                                            <span className="lib-comment">
                                                "{exo.comment}"
                                            </span>
                                        )}
                                        
                                        {exo.body_part && (
                                            <span className="lib-part">
                                                {exo.body_part === 'Tout le corps' && '🧍'}
                                                {exo.body_part === 'Dos' && '🔙'}
                                                {exo.body_part === 'Pectoraux' && '👕'}
                                                {exo.body_part === 'Epaules' && '🥥'}
                                                {exo.body_part === 'Bras' && '💪'}
                                                {exo.body_part === 'Abdo' && '🍫'}
                                                {exo.body_part === 'Fessiers' && '🍑'}
                                                {exo.body_part === 'Jambes' && '🦵'}
                                                {exo.body_part}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <button className="lib-delete" onClick={(e) => { e.stopPropagation(); setItemToDelete(exo); }}>&times;</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {isModalOpen && <ExerciseEditorModal exercise={itemToEdit} onClose={() => setIsModalOpen(false)} onSave={onSaveExercise} />}
            {itemToDelete && <ConfirmModal title="Supprimer" message={`Supprimer "${itemToDelete.name}" ?`} onConfirm={onDeleteExercise} onCancel={() => setItemToDelete(null)} />}
        </>
    );
};

export default ExerciseLibraryPage;