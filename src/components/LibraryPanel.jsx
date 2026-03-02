// src/components/LibraryPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

const LibraryPanel = ({ onAddExercise }) => {
    const [library, setLibrary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [typeFilter, setTypeFilter] = useState('Tous');
    const [bodyPartFilter, setBodyPartFilter] = useState('Tous');

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

    useEffect(() => { fetchLibrary(); }, [fetchLibrary]);

    const getEmojiForType = (type) => {
        switch(type) {
            case 'Renforcement': return '🏋️‍♂️';
            case 'Cardio': return '❤️';
            case 'Mobilité': return '🧘';
            case 'Étirement': return '🤸';
            default: return '🔹';
        }
    };

    const filteredLibrary = library.filter(exo => {
        const matchesSearch = exo.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = typeFilter === 'Tous' || exo.type === typeFilter;
        const matchesBodyPart = bodyPartFilter === 'Tous' || exo.body_part === bodyPartFilter;
        return matchesSearch && matchesType && matchesBodyPart;
    });

    // Helper pour l'affichage dans la liste latérale
    const formatDuration = (val) => {
        if(!val) return '';
        if(String(val).match(/[ms]/)) return val;
        return `${val} min`;
    };
    
    const getDetailsString = (exo) => {
        if (exo.sets && exo.reps) return `${exo.sets} × ${exo.reps}`;
        if (exo.duration_minutes) {
            const dur = formatDuration(exo.duration_minutes);
            return exo.sets ? `${exo.sets} × ${dur}` : dur;
        }
        return '';
    };

    return (
        <div className="library-panel-component">
            <div className="library-panel-header">
                <h3>Bibliothèque</h3>
                <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ marginBottom: '12px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div className="filter-row" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {['Tous', 'Renforcement', 'Cardio', 'Mobilité', 'Étirement'].map(type => (
                            <button key={type} onClick={() => setTypeFilter(type)} className={`small ${typeFilter === type ? '' : 'secondary'}`} style={{ whiteSpace: 'nowrap', padding: '4px 10px', fontSize: '11px', borderRadius: '12px' }}>
                                {type === 'Tous' ? 'Tout' : getEmojiForType(type) + ' ' + type}
                            </button>
                        ))}
                    </div>
                    <select value={bodyPartFilter} onChange={(e) => setBodyPartFilter(e.target.value)} style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px', backgroundColor: 'white', width: '100%' }}>
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
            
            <div className="library-panel-list">
                {loading && <p className="loading-text">Chargement...</p>}
                {!loading && filteredLibrary.length === 0 && <div className="empty-state" style={{ padding: '20px', textAlign: 'center', fontSize: '13px' }}><p>Aucun exercice.</p></div>}

                {!loading && filteredLibrary.map(exo => (
                    <div key={exo.id} className="library-panel-item" onClick={() => onAddExercise(exo)} title="Cliquer pour ajouter">
                        <div className={`exercise-type-icon ${exo.type?.toLowerCase()}`}>{getEmojiForType(exo.type)}</div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <span className="item-name" style={{ display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {exo.name}
                            </span>
                            <div style={{fontSize: '10px', color: 'var(--text-light)'}}>
                                {getDetailsString(exo)}
                            </div>
                            {/* Commentaire tronqué */}
                            {exo.comment && (
                                <div style={{fontSize: '9px', color: '#aaa', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                    {exo.comment}
                                </div>
                            )}
                        </div>
                        <span className="add-icon">+</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LibraryPanel;