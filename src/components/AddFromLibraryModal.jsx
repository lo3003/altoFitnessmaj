// src/components/AddFromLibraryModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

const AddFromLibraryModal = ({ onClose, onAddExercises, onLaunchCreator }) => {
    const [library, setLibrary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());

    const fetchLibrary = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('exercises')
                .select('*')
                .eq('coach_id', user.id)
                .eq('is_template', true)
                .order('name', { ascending: true });
            setLibrary(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchLibrary();
    }, [fetchLibrary]);
    
    const handleSelect = (exerciseId) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(exerciseId)) {
            newSelection.delete(exerciseId);
        } else {
            newSelection.add(exerciseId);
        }
        setSelectedIds(newSelection);
    };
    
    const handleAdd = () => {
        const exercisesToAdd = library.filter(exo => selectedIds.has(exo.id));
        onAddExercises(exercisesToAdd);
        onClose();
    };

    const filteredLibrary = library.filter(exo => 
        exo.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Ajouter depuis la bibliothèque</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <input 
                    type="text" 
                    placeholder="Rechercher un exercice..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ marginBottom: '16px' }}
                />
                
                <div className="library-list">
                    {loading && <p className="loading-text">Chargement...</p>}
                    {!loading && filteredLibrary.map(exo => (
                        <div 
                            key={exo.id} 
                            className={`library-item ${selectedIds.has(exo.id) ? 'selected' : ''}`}
                            onClick={() => handleSelect(exo.id)}
                        >
                            <input type="checkbox" checked={selectedIds.has(exo.id)} readOnly />
                            <span>{exo.name}</span>
                        </div>
                    ))}
                </div>

                <div className="button-group" style={{ marginTop: '24px' }}>
                    {/* --- NOUVEAU BOUTON DE CRÉATION --- */}
                    <button className="secondary" onClick={onLaunchCreator}>
                        + Créer un nouvel exercice
                    </button>
                    <button onClick={handleAdd} disabled={selectedIds.size === 0}>
                        Ajouter {selectedIds.size > 0 ? `(${selectedIds.size})` : ''} exercice{selectedIds.size > 1 ? 's' : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddFromLibraryModal;