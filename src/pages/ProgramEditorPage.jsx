// src/pages/ProgramEditorPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import ConfirmModal from '../components/ConfirmModal';
import ExerciseEditorModal from '../components/ExerciseEditorModal';
import AddFromLibraryModal from '../components/AddFromLibraryModal';
import LibraryPanel from '../components/LibraryPanel';
import AddSectionModal from '../components/AddSectionModal';
import useWindowSize from '../hooks/useWindowSize';

const DragHandleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
);

const LinkIcon = ({ active }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
);

const formatDurationDisplay = (duration) => {
    if (!duration) return null;
    if (String(duration).match(/[ms]/)) return duration;
    return `${duration}min`;
};

const getEmojiForType = (type) => {
    switch(type) {
        case 'Renforcement': return '🏋️‍♂️';
        case 'Cardio': return '❤️';
        case 'Mobilité': return '🧘';
        case 'Étirement': return '🤸';
        default: return '🔹';
    }
};

const sanitizeData = (data) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => { if (cleaned[key] === '') cleaned[key] = null; });
    return cleaned;
};

// --- LOGIQUE D'AFFICHAGE INTELLIGENTE ---
const getExerciseDetails = (item, isLeader, isFollower) => {
    // Cas 1 : Suiveur (on cache les séries car définies par le chef)
    if (isFollower) {
        if (item.reps) return `${item.reps} reps`;
        if (item.duration_minutes) return formatDurationDisplay(item.duration_minutes);
        return '...';
    }

    // Cas 2 : Chef de file (Séries = Tours)
    if (isLeader) {
         const tours = item.sets || 1;
         let effort = "";
         if (item.reps) effort = `${item.reps} reps`;
         else if (item.duration_minutes) effort = formatDurationDisplay(item.duration_minutes);
         
         return `🔄 ${tours} Tours • ${effort}`;
    }

    // Cas 3 : Exercice standard
    if (item.sets && item.reps) return `${item.sets} × ${item.reps}`;
    if (item.duration_minutes) {
        const dur = formatDurationDisplay(item.duration_minutes);
        return item.sets ? `${item.sets} × ${dur}` : dur;
    }
    if (item.sets) return `${item.sets} séries`;
    return '';
};

const SortableItem = ({ item, index, items, onEdit, onDelete, onToggleLink }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    if (item.is_section_header) {
        return (
            <div ref={setNodeRef} style={style} className="section-header-item">
                <div {...attributes} {...listeners} className="drag-handle"><DragHandleIcon /></div>
                <h4 className="section-title">{item.name}</h4>
                <button className="delete-icon" onClick={() => onDelete(item)}>🗑️</button>
            </div>
        );
    }

    const isLinkedToNext = item.superset_id && items[index + 1] && items[index + 1].superset_id === item.superset_id;
    const isLinkedToPrev = item.superset_id && items[index - 1] && items[index - 1].superset_id === item.superset_id;
    
    // Leader = Celui qui commence la chaîne (n'est pas lié au précédent, mais lié au suivant)
    // OU Exercice seul (ni l'un ni l'autre -> traité comme Leader standard)
    const isSupersetLeader = isLinkedToNext && !isLinkedToPrev;
    const isSupersetFollower = isLinkedToPrev;

    let cardStyle = "exercise-card editor indented";
    if (isLinkedToNext && !isLinkedToPrev) cardStyle += " superset-top";
    if (isLinkedToPrev && isLinkedToNext) cardStyle += " superset-middle";
    if (isLinkedToPrev && !isLinkedToNext) cardStyle += " superset-bottom";

    return (
        <div ref={setNodeRef} style={style} className={cardStyle}>
            <div className="exercise-content-wrapper">
                <div {...attributes} {...listeners} className="drag-handle"><DragHandleIcon /></div>
                <div className="exercise-card-main-content" onClick={() => onEdit(item, isSupersetFollower)}>
                    <div className={`exercise-type-icon ${item.type?.toLowerCase()}`}>
                        {getEmojiForType(item.type)}
                    </div>
                    <div className="exercise-card-info">
                        <h3>{item.name}</h3>
                        
                        <p style={{fontWeight: 500, color: isSupersetLeader ? 'var(--primary-color)' : 'var(--text-dark)'}}>
                            {getExerciseDetails(item, isSupersetLeader, isSupersetFollower)}
                        </p>

                        {item.charge && <span style={{fontSize: '12px', color: '#666'}}>Charge : {item.charge}</span>}

                        {item.comment && (
                            <p style={{ color: 'var(--text-light)', fontStyle: 'italic', fontSize: '12px', marginTop: '2px' }}>
                                💡 {item.comment}
                            </p>
                        )}

                        {item.body_part && (
                            <p style={{ color: 'var(--primary-color)', fontWeight: 500, fontSize: '12px', marginTop: '4px' }}>
                                {item.body_part === 'Tout le corps' && '🧍 '}
                                {item.body_part === 'Dos' && '🔙 '}
                                {item.body_part === 'Pectoraux' && '👕 '}
                                {item.body_part === 'Epaules' && '🥥 '}
                                {item.body_part === 'Bras' && '💪 '}
                                {item.body_part === 'Abdo' && '🍫 '}
                                {item.body_part === 'Fessiers' && '🍑 '}
                                {item.body_part === 'Jambes' && '🦵 '}
                                {item.body_part}
                            </p>
                        )}
                    </div>
                </div>
                <button className="delete-icon" onClick={() => onDelete(item)}>🗑️</button>
            </div>
            
            <div className="editor-card-footer">
                {item.rest_time ? (
                    <div className="rest-time-indicator" style={{border: 'none', padding: 0, background: 'none'}}>
                        🕒 <span style={{marginLeft: '6px'}}>{item.rest_time}</span>
                    </div>
                ) : (<div></div>)}
                
                {index < items.length - 1 && !items[index+1].is_section_header && (
                    <button 
                        className={`link-button ${isLinkedToNext ? 'active' : ''}`} 
                        onClick={() => onToggleLink(index)}
                        title={isLinkedToNext ? "Dissocier" : "Créer un Superset"}
                    >
                        <LinkIcon active={isLinkedToNext} />
                        <span>{isLinkedToNext ? "Lié" : "Lier"}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

const ProgramEditorPage = ({ programId, onBack, onDirtyChange }) => {
    const { addToast } = useNotification();
    const [program, setProgram] = useState({ name: '', environment: 'Salle' });
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
    // Nouvel état pour savoir si on édite un "suiveur"
    const [isEditingFollower, setIsEditingFollower] = useState(false);

    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isCreatingForLibrary, setIsCreatingForLibrary] = useState(false);

    const { width } = useWindowSize();
    const isDesktop = width > 1024; 
    const isNewProgram = programId === 'new';

    const markAsDirty = useCallback(() => { if (onDirtyChange) onDirtyChange(true); }, [onDirtyChange]);

    const fetchProgramData = useCallback(async () => {
        if (isNewProgram) { setLoading(false); return; }
        setLoading(true);
        const { data: programData } = await supabase.from('programs').select('*').eq('id', programId).single();
        if (programData) {
            setProgram({
                name: programData.name,
                environment: programData.environment || 'Salle',
            });
            const { data: exercisesData } = await supabase.from('exercises').select('*').eq('program_id', programId).order('order', { ascending: true });
            setItems(exercisesData || []);
        }
        setLoading(false);
        if (onDirtyChange) onDirtyChange(false);
    }, [programId, isNewProgram, onDirtyChange]);

    useEffect(() => { fetchProgramData(); }, [fetchProgramData]);

    const handleToggleLink = (index) => {
        const newItems = [...items];
        const currentItem = newItems[index];
        const nextItem = newItems[index + 1];
        if (!nextItem) return;

        if (currentItem.superset_id && currentItem.superset_id === nextItem.superset_id) {
            nextItem.superset_id = null;
        } else {
            const sharedId = currentItem.superset_id || crypto.randomUUID();
            currentItem.superset_id = sharedId;
            nextItem.superset_id = sharedId;
        }
        setItems(newItems);
        markAsDirty();
    };

    // On passe l'info isFollower à la modale
    const handleOpenModalForEdit = (item, isFollower = false) => { 
        if (item.is_section_header) return; 
        setItemToEdit(item); 
        setIsEditingFollower(isFollower);
        setIsCreatingForLibrary(false); 
        setIsExerciseModalOpen(true); 
    };

    const handleLaunchCreatorFromLibrary = () => { setShowLibraryModal(false); setItemToEdit(null); setIsEditingFollower(false); setIsCreatingForLibrary(true); setIsExerciseModalOpen(true); };
    const handleOpenSectionModal = () => { setIsSectionModalOpen(true); };
    
    const handleProgramChange = (e) => { 
        setProgram({ ...program, [e.target.name]: e.target.value }); 
        markAsDirty(); 
    };

    const handleConfirmAddSection = (sectionName) => { setItems([...items, { id: crypto.randomUUID(), name: sectionName, is_section_header: true }]); markAsDirty(); };
    
    const handleSaveItem = (itemData) => {
        const existingIndex = items.findIndex(i => i.id === itemData.id);
        if (existingIndex > -1) {
            const updatedItems = [...items];
            updatedItems[existingIndex] = { ...updatedItems[existingIndex], ...itemData }; 
            setItems(updatedItems);
            markAsDirty();
        }
    };

    const handleSaveNewTemplateAndAdd = async (exerciseData) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: existing } = await supabase.from('exercises').select('id').eq('coach_id', user.id).eq('is_template', true).ilike('name', exerciseData.name.trim()).maybeSingle();
        if (existing) { addToast('error', `L'exercice existe déjà.`); return; }

        const { id, ...dataWithoutId } = exerciseData; 
        const rawData = { ...dataWithoutId, coach_id: user.id, is_template: true, program_id: null };
        const dataToSave = sanitizeData(rawData);
        const { data: newTemplate, error } = await supabase.from('exercises').insert(dataToSave).select().single();
        if (error) { addToast('error', error.message); return; }
        addToast('success', `Exercice ajouté.`);
        setItems(currentItems => [...currentItems, { ...newTemplate, id: crypto.randomUUID(), is_template: false }]);
        markAsDirty();
    };
    
    const handleAddExerciseFromPanel = (exercise) => { setItems([...items, { ...exercise, id: crypto.randomUUID(), is_template: false, superset_id: null }]); markAsDirty(); };
    const handleAddExercisesFromLibrary = (exercisesToAdd) => {
        const newItems = exercisesToAdd.map(t => ({ ...t, id: crypto.randomUUID(), is_template: false, superset_id: null }));
        setItems([...items, ...newItems]);
        markAsDirty();
    };
    const handleDeleteItem = () => { setItems(items.filter(i => i.id !== itemToDelete.id)); setItemToDelete(null); markAsDirty(); };
    
    const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 }, }));
    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setItems((currentItems) => {
                const oldIndex = currentItems.findIndex(item => item.id === active.id);
                const newIndex = currentItems.findIndex(item => item.id === over.id);
                return arrayMove(currentItems, oldIndex, newIndex);
            });
            markAsDirty();
        }
    };

    const handleSaveProgram = async () => {
        setIsSaving(true);
        if (!program.name.trim()) { addToast('error', "Nom requis."); setIsSaving(false); return; }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            let savedProgram = program;
            
            const programDataToSave = {
                name: program.name,
                environment: program.environment,
            };

            if (isNewProgram) {
                const { data, error } = await supabase.from('programs').insert({ ...programDataToSave, coach_id: user.id }).select().single();
                if (error) throw error; savedProgram = data;
            } else {
                const { data, error } = await supabase.from('programs').update(programDataToSave).eq('id', programId).select().single();
                if (error) throw error; savedProgram = data;
            }
            await supabase.from('exercises').delete().eq('program_id', savedProgram.id);
            if (items.length > 0) {
                const itemsToInsert = items.map((item, index) => {
                    const rawItem = {
                        program_id: savedProgram.id, order: index, name: item.name, is_section_header: item.is_section_header || false,
                        type: item.type, body_part: item.body_part, sets: item.sets, reps: item.reps, charge: item.charge,
                        duration_minutes: item.duration_minutes, intensity: item.intensity, comment: item.comment,
                        rest_time: item.rest_time, photo_url: item.photo_url, coach_id: user.id, is_template: false,
                        superset_id: item.superset_id
                    };
                    return sanitizeData(rawItem);
                });
                const { error: itemsError } = await supabase.from('exercises').insert(itemsToInsert);
                if (itemsError) throw itemsError;
            }
            addToast('success', `Programme sauvegardé.`);
            if (onDirtyChange) onDirtyChange(false); onBack(true);
        } catch (error) { addToast('error', error.message); } finally { setIsSaving(false); }
    };
    
    const handleDeleteProgram = async () => {
        if (isNewProgram) return; setIsSaving(true);
        try {
            await supabase.from('client_programs').delete().eq('program_id', programId);
            await supabase.from('exercises').delete().eq('program_id', programId);
            await supabase.from('programs').delete().eq('id', programId);
            addToast('success', `Supprimé.`); onBack(true); 
        } catch (error) { addToast('error', error.message); setIsSaving(false); }
    };
    
    if (loading) return <div className="screen"><p className="loading-text">Chargement...</p></div>;

    return (
        <>
            <div className={`program-editor-layout ${isDesktop ? 'desktop' : 'mobile'}`}>
                <div className="editor-main-panel">
                    <div className="screen">
                        <a href="#" className="back-link" onClick={() => onBack()}>← Retour</a>
                        <div className="program-form-group">
                            <h2>{isNewProgram ? "Nouveau" : "Modifier"} Programme</h2>
                            <input name="name" value={program.name} onChange={handleProgramChange} placeholder="Nom du programme" style={{ marginBottom: '12px' }} />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{fontSize: '12px', fontWeight: 600, color: 'var(--text-light)'}}>Lieu / Matériel</label>
                                    <select name="environment" value={program.environment} onChange={handleProgramChange} style={{ marginTop: '4px' }}>
                                        <option value="Salle">🏋️‍♂️ Salle de sport</option>
                                        <option value="Domicile">🏠 Domicile</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="page-header" style={{ marginTop: '20px', marginBottom: '16px' }}><h3>Contenu de la séance</h3></div>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                                <div className="exercise-list editor">
                                    {items.map((item, index) => (
                                        <SortableItem 
                                            key={item.id} item={item} index={index} items={items}
                                            onEdit={handleOpenModalForEdit} onDelete={setItemToDelete} onToggleLink={handleToggleLink}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                        {items.length === 0 && <div className="empty-state"><p>Ajoutez des exercices.</p></div>}
                        <div className="button-group" style={{ marginTop: '24px' }}>
                            <div className="form-row">
                                <button className="secondary" onClick={handleOpenSectionModal}>+ Section</button>
                                <button className="secondary" onClick={() => setShowLibraryModal(true)}>+ Exercice</button>
                            </div>
                            <button onClick={handleSaveProgram} disabled={isSaving}>{isSaving ? '...' : 'Sauvegarder'}</button>
                            {!isNewProgram && <button className="danger" onClick={() => setShowDeleteConfirm(true)}>Supprimer</button>}
                        </div>
                    </div>
                </div>
                {isDesktop && <LibraryPanel onAddExercise={handleAddExerciseFromPanel} />}
            </div>
            
            {isExerciseModalOpen && (
                <ExerciseEditorModal 
                    exercise={itemToEdit} 
                    // On passe la prop pour cacher les séries si c'est un suiveur
                    hideSets={isEditingFollower}
                    onClose={() => setIsExerciseModalOpen(false)} 
                    onSave={isCreatingForLibrary ? handleSaveNewTemplateAndAdd : handleSaveItem} 
                />
            )}
            {isSectionModalOpen && <AddSectionModal onClose={() => setIsSectionModalOpen(false)} onConfirm={handleConfirmAddSection} />}
            {showLibraryModal && <AddFromLibraryModal onClose={() => setShowLibraryModal(false)} onAddExercises={handleAddExercisesFromLibrary} onLaunchCreator={handleLaunchCreatorFromLibrary} />}
            {itemToDelete && <ConfirmModal title="Supprimer" message={`Supprimer "${itemToDelete.name}" ?`} onConfirm={handleDeleteItem} onCancel={() => setItemToDelete(null)} />}
            {showDeleteConfirm && <ConfirmModal title="Supprimer" message="Irréversible." onConfirm={handleDeleteProgram} onCancel={() => setShowDeleteConfirm(false)} confirmText="Oui" />}
        </>
    );
};

export default ProgramEditorPage;