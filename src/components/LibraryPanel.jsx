// src/components/LibraryPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
// @dnd-kit : useDraggable pour rendre chaque élément du panel "attrapable"
import { useDraggable } from '@dnd-kit/core';

// --- Liste statique des séparateurs (sections) disponibles ---
const SEPARATORS = [
    { name: 'Échauffement', emoji: '🔥' },
    { name: 'Corps de séance', emoji: '💪' },
    { name: 'Retour au calme', emoji: '🧘' },
    { name: 'Étirement', emoji: '🤸' },
    { name: 'Mobilité', emoji: '🦴' },
];

// --- Composant draggable pour un exercice de la bibliothèque ---
// Chaque exercice est un useDraggable avec un ID préfixé "library-exercise-"
// La propriété data transporte l'objet complet de l'exercice
const DraggableExerciseItem = ({ exo, onAddExercise, getEmojiForType }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `library-exercise-${exo.id}`,
        data: { type: 'exercise', exercise: exo },
    });

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={`lib-exo-card${isDragging ? ' is-dragging' : ''}`}
            onClick={() => !isDragging && onAddExercise(exo)}
            title="Glisser vers la séance ou cliquer pour ajouter"
        >
            <div className="lib-exo-thumb">
                {exo.photo_url ? (
                    <img src={exo.photo_url} alt={exo.name} />
                ) : (
                    <span>{getEmojiForType(exo.type)}</span>
                )}
            </div>
            <div className="lib-exo-info">
                <h4 className="lib-exo-name">{exo.name}</h4>
                {exo.body_part && <span className="lib-exo-muscles">{exo.body_part}</span>}
                <div className="lib-exo-tags">
                    {exo.type && <span className="lib-tag">{exo.type.toUpperCase()}</span>}
                    {exo.charge_type && exo.charge_type !== 'Aucune' && (
                        <span className="lib-tag">{exo.charge_type.toUpperCase()}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Composant draggable pour un séparateur ---
// Chaque séparateur est un useDraggable avec un ID préfixé "library-separator-"
// La propriété data transporte le nom du séparateur
const DraggableSeparatorItem = ({ separator, onAddSeparator }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `library-separator-${separator.name}`,
        data: { type: 'separator', name: separator.name },
    });

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={`library-panel-item separator-item${isDragging ? ' is-dragging' : ''}`}
            onClick={() => !isDragging && onAddSeparator(separator)}
            title="Glisser vers la séance ou cliquer pour ajouter"
        >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>{separator.emoji}</span>
            <div style={{ flex: 1 }}>
                <span className="item-name">{separator.name}</span>
            </div>
            <span className="drag-grip-icon">⠿</span>
        </div>
    );
};

const LibraryPanel = ({ onAddExercise }) => {
    const [library, setLibrary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [bodyPartFilter, setBodyPartFilter] = useState('Tous');

    // Onglet actif : 'exercices' pour la bibliothèque, 'separateurs' pour les sections
    const [activeTab, setActiveTab] = useState('exercices');

    const BODY_PARTS = ['Tous', 'Pectoraux', 'Dos', 'Épaules', 'Bras', 'Jambes', 'Abdo', 'Fessiers'];

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
        const matchesBodyPart = bodyPartFilter === 'Tous' || exo.body_part === bodyPartFilter;
        return matchesSearch && matchesBodyPart;
    });

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

    // Handler clic pour ajouter un séparateur (fallback clic en plus du drag)
    const handleAddSeparator = (separator) => {
        onAddExercise({ id: crypto.randomUUID(), name: separator.name, is_section_header: true });
    };

    return (
        <div className="library-panel-component">
            <div className="library-panel-header">
                {/* Onglets pour basculer entre Exercices et Séparateurs */}
                <div className="library-tabs">
                    <button
                        className={`library-tab${activeTab === 'exercices' ? ' active' : ''}`}
                        onClick={() => setActiveTab('exercices')}
                    >
                        🏋️ Exercices
                    </button>
                    <button
                        className={`library-tab${activeTab === 'separateurs' ? ' active' : ''}`}
                        onClick={() => setActiveTab('separateurs')}
                    >
                        📌 Séparateurs
                    </button>
                </div>

                {/* Filtres affichés uniquement pour l'onglet Exercices */}
                {activeTab === 'exercices' && (
                    <>
                        <div className="lib-search-wrapper">
                            <svg className="lib-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <input type="text" placeholder="Rechercher des exercices..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="lib-search-input" />
                        </div>
                        <div className="lib-filter-pills">
                            {BODY_PARTS.map(bp => (
                                <button key={bp}
                                    className={`lib-pill${bodyPartFilter === bp ? ' active' : ''}`}
                                    onClick={() => setBodyPartFilter(bp)}>
                                    {bp === 'Tous' ? 'TOUS' : bp.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
            
            <div className="library-panel-list">
                {/* --- Onglet Exercices --- */}
                {activeTab === 'exercices' && (
                    <>
                        {loading && <p className="loading-text">Chargement...</p>}
                        {!loading && filteredLibrary.length === 0 && (
                            <div className="empty-state" style={{ padding: '20px', textAlign: 'center', fontSize: '13px' }}>
                                <p>Aucun exercice.</p>
                            </div>
                        )}
                        {!loading && filteredLibrary.map(exo => (
                            <DraggableExerciseItem
                                key={exo.id}
                                exo={exo}
                                onAddExercise={onAddExercise}
                                getEmojiForType={getEmojiForType}
                            />
                        ))}
                    </>
                )}

                {/* --- Onglet Séparateurs --- */}
                {activeTab === 'separateurs' && (
                    <>
                        <p style={{ padding: '12px 24px', fontSize: '12px', color: 'var(--text-light)', margin: 0 }}>
                            Glissez un séparateur dans la séance pour structurer votre programme.
                        </p>
                        {SEPARATORS.map(sep => (
                            <DraggableSeparatorItem
                                key={sep.name}
                                separator={sep}
                                onAddSeparator={handleAddSeparator}
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export default LibraryPanel;