import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import { arrayMove } from '@dnd-kit/sortable';

const sanitizeData = (data) => {
    const cleaned = { ...data };
    Object.keys(cleaned).forEach(key => { if (cleaned[key] === '') cleaned[key] = null; });
    return cleaned;
};

export function useProgramEditor(programId, onDirtyChange) {
    const { addToast } = useNotification();
    const [program, setProgram] = useState({ name: '', environment: 'Salle' });
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeDragData, setActiveDragData] = useState(null);

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
            
            const allExercises = exercisesData || [];
            const mainExercises = allExercises.filter(e => !e.parent_exercise_id);
            const variantExercises = allExercises.filter(e => e.parent_exercise_id);
            
            const itemsWithVariants = mainExercises.map(ex => ({
                ...ex,
                variants: variantExercises
                    .filter(v => v.parent_exercise_id === ex.id)
                    .map(v => ({ id: v.id, name: v.name, photo_url: v.photo_url })),
            }));
            
            setItems(itemsWithVariants);
        }
        setLoading(false);
        if (onDirtyChange) onDirtyChange(false);
    }, [programId, isNewProgram, onDirtyChange]);

    useEffect(() => { fetchProgramData(); }, [fetchProgramData]);

    const handleProgramChange = (e) => { 
        setProgram(prev => ({ ...prev, [e.target.name]: e.target.value })); 
        markAsDirty(); 
    };

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

    const handleChangeExecutionMode = (supersetId, mode) => {
        setItems(current => current.map(i =>
            i.superset_id === supersetId ? { ...i, execution_mode: mode } : i
        ));
        markAsDirty();
    };

    const handleUpdateItemField = (itemId, field, value) => {
        setItems(current => current.map(i =>
            i.id === itemId ? { ...i, [field]: value } : i
        ));
        markAsDirty();
    };

    const handleUngroupItem = (supersetId) => {
        setItems(current => current.map(i =>
            i.superset_id === supersetId
                ? { ...i, superset_id: null, execution_mode: 'Classique' }
                : i
        ));
        markAsDirty();
    };

    const handleSaveItem = (itemData) => {
        const { variants, ...mainExercise } = itemData;
        const existingIndex = items.findIndex(i => i.id === mainExercise.id);
        if (existingIndex > -1) {
            const updatedItems = [...items];
            updatedItems[existingIndex] = { ...updatedItems[existingIndex], ...mainExercise, variants: variants || [] }; 
            setItems(updatedItems);
            markAsDirty();
        }
    };

    const handleSaveNewTemplateAndAdd = async (exerciseData) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: existing } = await supabase.from('exercises').select('id').eq('coach_id', user.id).eq('is_template', true).ilike('name', exerciseData.name.trim()).maybeSingle();
        if (existing) { addToast('error', `L'exercice existe déjà.`); return; }

        const { id, variants, ...dataWithoutId } = exerciseData; 
        const rawData = { ...dataWithoutId, coach_id: user.id, is_template: true, program_id: null };
        const dataToSave = sanitizeData(rawData);
        const { data: newTemplate, error } = await supabase.from('exercises').insert(dataToSave).select().single();
        if (error) { addToast('error', error.message); return; }
        addToast('success', `Exercice ajouté.`);
        setItems(currentItems => [...currentItems, { ...newTemplate, id: crypto.randomUUID(), is_template: false }]);
        markAsDirty();
    };

    const handleAddExerciseFromPanel = (exercise) => {
        setItems(prev => [...prev, { ...exercise, id: crypto.randomUUID(), is_template: false, superset_id: null }]);
        markAsDirty();
    };

    const handleAddExercisesFromLibrary = (exercisesToAdd) => {
        const newItems = exercisesToAdd.map(t => ({ ...t, id: crypto.randomUUID(), is_template: false, superset_id: null }));
        setItems(prev => [...prev, ...newItems]);
        markAsDirty();
    };

    const handleDeleteItem = (itemId) => {
        setItems(prev => prev.filter(i => i.id !== itemId));
        markAsDirty();
    };

    // --- Drag & Drop handlers ---
    const handleDragStart = (event) => {
        const { active } = event;
        if (String(active.id).startsWith('library-')) {
            setActiveDragData(active.data.current);
        }
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveDragData(null);

        if (!over) return;

        const activeId = String(active.id);
        const overId = String(over.id);

        // ── Library item drag ──
        if (activeId.startsWith('library-')) {
            const data = active.data.current;
            let newItem;

            if (data.type === 'separator') {
                newItem = { id: crypto.randomUUID(), name: data.name, is_section_header: true };
            } else if (data.type === 'exercise') {
                newItem = { ...data.exercise, id: crypto.randomUUID(), is_template: false, superset_id: null, execution_mode: 'Classique' };
            }
            if (!newItem) return;

            // Dropped onto a group zone → add to that group
            if (overId.startsWith('group-drop-')) {
                const groupId = overId.replace('group-drop-', '');
                if (!newItem.is_section_header) {
                    newItem.superset_id = groupId;
                    const groupItems = items.filter(i => i.superset_id === groupId);
                    if (groupItems.length > 0) {
                        newItem.execution_mode = groupItems[0].execution_mode || 'Classique';
                    }
                }
                // Insert after last item of that group
                setItems(currentItems => {
                    const lastIdx = currentItems.reduce((acc, it, idx) => it.superset_id === groupId ? idx : acc, -1);
                    const copy = [...currentItems];
                    copy.splice(lastIdx + 1, 0, newItem);
                    return copy;
                });
                markAsDirty();
                return;
            }

            // Dropped onto a solo exercise card → create a new group
            if (overId.startsWith('solo-drop-')) {
                const targetItemId = overId.replace('solo-drop-', '');
                if (!newItem.is_section_header) {
                    const newGroupId = crypto.randomUUID();
                    newItem.superset_id = newGroupId;
                    newItem.execution_mode = 'Classique';
                    setItems(currentItems => {
                        const targetIdx = currentItems.findIndex(i => i.id === targetItemId);
                        if (targetIdx === -1) return [...currentItems, newItem];
                        const copy = [...currentItems];
                        copy[targetIdx] = { ...copy[targetIdx], superset_id: newGroupId, execution_mode: 'Classique' };
                        copy.splice(targetIdx + 1, 0, newItem);
                        return copy;
                    });
                    markAsDirty();
                    return;
                }
            }

            // Default: insert at position
            setItems(currentItems => {
                const overIndex = currentItems.findIndex(item => item.id === over.id);
                if (overIndex === -1) return [...currentItems, newItem];
                const copy = [...currentItems];
                copy.splice(overIndex, 0, newItem);
                return copy;
            });
            markAsDirty();
            return;
        }

        // ── Internal reorder / group by drag ──
        if (active.id === over.id) return;

        const activeItem = items.find(i => i.id === active.id);
        if (!activeItem || activeItem.is_section_header) {
            // Simple reorder for section headers
            setItems(cur => {
                const oldIdx = cur.findIndex(i => i.id === active.id);
                const newIdx = cur.findIndex(i => i.id === over.id);
                if (oldIdx === -1 || newIdx === -1) return cur;
                return arrayMove(cur, oldIdx, newIdx);
            });
            markAsDirty();
            return;
        }

        // Dropped onto a group zone → merge into that group
        if (overId.startsWith('group-drop-')) {
            const groupId = overId.replace('group-drop-', '');
            // Don't merge if already in this group
            if (activeItem.superset_id === groupId) return;
            setItems(currentItems => {
                const groupItems = currentItems.filter(i => i.superset_id === groupId);
                const targetMode = groupItems.length > 0 ? groupItems[0].execution_mode || 'Classique' : 'Classique';
                // Remove from old position, add after last group member
                const withoutActive = currentItems.filter(i => i.id !== active.id);
                const lastIdx = withoutActive.reduce((acc, it, idx) => it.superset_id === groupId ? idx : acc, -1);
                const updatedItem = { ...activeItem, superset_id: groupId, execution_mode: targetMode };
                const copy = [...withoutActive];
                copy.splice(lastIdx + 1, 0, updatedItem);
                return copy;
            });
            markAsDirty();
            return;
        }

        // Dropped onto a solo exercise → create new group
        if (overId.startsWith('solo-drop-')) {
            const targetItemId = overId.replace('solo-drop-', '');
            const overItem = items.find(i => i.id === targetItemId);
            if (overItem && !overItem.is_section_header && !activeItem.is_section_header) {
                const newGroupId = crypto.randomUUID();
                setItems(currentItems => {
                    const withoutActive = currentItems.filter(i => i.id !== active.id);
                    const targetIdx = withoutActive.findIndex(i => i.id === targetItemId);
                    if (targetIdx === -1) return currentItems;
                    const copy = [...withoutActive];
                    copy[targetIdx] = { ...copy[targetIdx], superset_id: newGroupId, execution_mode: 'Classique' };
                    const updatedActive = { ...activeItem, superset_id: newGroupId, execution_mode: 'Classique' };
                    copy.splice(targetIdx + 1, 0, updatedActive);
                    return copy;
                });
                markAsDirty();
                return;
            }
        }

        // Default: simple reorder
        setItems(cur => {
            const oldIdx = cur.findIndex(i => i.id === active.id);
            const newIdx = cur.findIndex(i => i.id === over.id);
            if (oldIdx === -1 || newIdx === -1) return cur;
            return arrayMove(cur, oldIdx, newIdx);
        });
        markAsDirty();
    };

    const handleDragCancel = () => {
        setActiveDragData(null);
    };

    const handleSaveProgram = async () => {
        setIsSaving(true);
        if (!program.name.trim()) { addToast('error', "Nom requis."); setIsSaving(false); return false; }
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
                const allInserts = [];
                items.forEach((item, index) => {
                    const rawItem = {
                        program_id: savedProgram.id, order: index, name: item.name, is_section_header: item.is_section_header || false,
                        type: item.type, body_part: item.body_part, sets: item.sets, reps: item.reps, charge: item.charge,
                        charge_type: item.charge_type, effort_type: item.effort_type,
                        reps_min: item.reps_min, reps_max: item.reps_max,
                        duration_minutes: item.duration_minutes, intensity: item.intensity, comment: item.comment,
                        rest_time: item.rest_time, photo_url: item.photo_url, coach_id: user.id, is_template: false,
                        superset_id: item.superset_id,
                        execution_mode: item.execution_mode || 'Classique',
                        tabata_work: item.tabata_work || null,
                        tabata_rest: item.tabata_rest || null,
                        amrap_duration: item.amrap_duration || null,
                        parent_exercise_id: item.parent_exercise_id || null
                    };
                    allInserts.push(sanitizeData(rawItem));

                    if (item.variants && item.variants.length > 0) {
                        item.variants.forEach(v => {
                            const variantItem = {
                                program_id: savedProgram.id, order: index, name: v.name,
                                is_section_header: false, type: item.type, body_part: item.body_part,
                                photo_url: v.photo_url, coach_id: user.id, is_template: false,
                                parent_exercise_id: item.id || null
                            };
                            allInserts.push(sanitizeData(variantItem));
                        });
                    }
                });
                const { error: itemsError } = await supabase.from('exercises').insert(allInserts);
                if (itemsError) throw itemsError;
            }
            addToast('success', `Programme sauvegardé.`);
            if (onDirtyChange) onDirtyChange(false);
            return true;
        } catch (error) { addToast('error', error.message); return false; } finally { setIsSaving(false); }
    };
    
    const handleDeleteProgram = async () => {
        if (isNewProgram) return false;
        setIsSaving(true);
        try {
            await supabase.from('client_programs').delete().eq('program_id', programId);
            await supabase.from('exercises').delete().eq('program_id', programId);
            await supabase.from('programs').delete().eq('id', programId);
            addToast('success', `Supprimé.`);
            return true;
        } catch (error) { addToast('error', error.message); return false; } finally { setIsSaving(false); }
    };

    return {
        // State
        program, items, loading, isSaving, isNewProgram, activeDragData,
        // Program changes
        handleProgramChange,
        // Item manipulation
        handleChangeExecutionMode, handleUpdateItemField, handleUngroupItem,
        // Item CRUD
        handleSaveItem, handleSaveNewTemplateAndAdd,
        handleAddExerciseFromPanel, handleAddExercisesFromLibrary, handleDeleteItem,
        // Program CRUD
        handleSaveProgram, handleDeleteProgram,
        // Drag & Drop
        handleDragStart, handleDragEnd, handleDragCancel,
    };
}
