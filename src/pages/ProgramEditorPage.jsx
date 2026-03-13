// src/pages/ProgramEditorPage.jsx
import React, { useState, useMemo } from 'react';
import { useProgramEditor } from '../hooks/useProgramEditor';
import { DndContext, closestCenter, pointerWithin, rectIntersection, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import ConfirmModal from '../components/ConfirmModal';
import ExerciseEditorModal from '../components/ExerciseEditorModal';
import AddFromLibraryModal from '../components/AddFromLibraryModal';
import LibraryPanel from '../components/LibraryPanel';
import useWindowSize from '../hooks/useWindowSize';

/* ─── Icônes ─── */
const DragHandleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
);
const DeleteIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
);
const SupersetIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
);
const CircuitIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
);

const PlusCircleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
);

const getEmojiForType = (type) => {
    switch (type) {
        case 'Renforcement': return '🏋️‍♂️';
        case 'Cardio': return '❤️';
        case 'Mobilité': return '🧘';
        case 'Étirement': return '🤸';
        default: return '🔹';
    }
};

/* ─── Helpers ─── */
const getEffortLabel = (item) => {
    const effortType = item.effort_type;
    if (effortType === 'Intervalle' && item.reps_min && item.reps_max) return `${item.reps_min}-${item.reps_max}`;
    if (effortType === 'Max Rép') return 'Max';
    if (effortType === 'Max Temps') return 'Max';
    if (effortType === 'Temps' && item.duration_minutes) return item.duration_minutes;
    if (item.reps) return `${item.reps}`;
    if (item.duration_minutes) return item.duration_minutes;
    return '—';
};

/** Parse rest_time ("mm:ss", "XmYs", or raw seconds) → number of seconds */
const parseRestToSeconds = (val) => {
    if (val == null || val === '') return '';
    // Already a number
    if (typeof val === 'number') return val;
    const str = String(val).trim();
    // Pure number (seconds)
    if (/^\d+$/.test(str)) return Number(str);
    // mm:ss format
    const mmss = str.match(/^(\d{1,2}):(\d{2})$/);
    if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
    // XmYs format
    let sec = 0;
    const m = str.match(/(\d+)\s*m/);
    const s = str.match(/(\d+)\s*s/);
    if (m) sec += Number(m[1]) * 60;
    if (s) sec += Number(s[1]);
    return sec || '';
};

const getChargeLabel = (item) => {
    const ct = item.charge_type;
    if (ct === 'bw' || ct === 'Poids du corps') return 'POIDS (BW)';
    if (ct === 'lbs') return 'POIDS (LBS)';
    if (ct === 'Aucune') return 'CHARGE';
    return 'POIDS (KG)';
};

/* ─── Execution modes ─── */
const EXECUTION_MODES = [
    { id: 'Classique', label: 'Classique' },
    { id: 'Circuit', label: 'Circuit' },
    { id: 'AMRAP', label: 'AMRAP' },
    { id: 'TABATA', label: 'Tabata' },
    { id: 'EMOM', label: 'EMOM' },
    { id: 'E2MOM', label: 'E2MOM' },
    { id: 'E3MOM', label: 'E3MOM' },
    { id: 'E4MOM', label: 'E4MOM' },
    { id: 'E5MOM', label: 'E5MOM' },
];

const getGroupLabel = (count, mode) => {
    if (mode === 'Circuit' || mode === 'TABATA' || count >= 4) return `Circuit (${count} Exercices)`;
    if (count === 2) return 'Superset';
    if (count === 3) return 'Triset';
    return `Groupe (${count})`;
};

const useCircuitLayout = (mode, count) => mode === 'Circuit' || mode === 'TABATA' || count >= 4;

/* ─── Custom collision detection ─── */
const customCollision = (args) => {
    // First check pointer-within for drop zones (group-drop-*, solo-drop-*)
    const pointerCollisions = pointerWithin(args);
    const dropZoneHit = pointerCollisions.find(c =>
        String(c.id).startsWith('group-drop-') || String(c.id).startsWith('solo-drop-')
    );
    if (dropZoneHit) return [dropZoneHit];

    // Fall back to closestCenter for sortable list reordering
    return closestCenter(args);
};

/* ─── Droppable wrapper ─── */
const DroppableExerciseList = ({ children }) => {
    const { setNodeRef, isOver } = useDroppable({ id: 'exercise-list-droppable' });
    return (
        <div ref={setNodeRef} className={`pe-exercise-list${isOver ? ' drop-target-active' : ''}`}>
            {children}
        </div>
    );
};

/* ─── Section Header (sortable) ─── */
const SortableSectionHeader = ({ item, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <div ref={setNodeRef} style={style} className="pe-section-header" {...attributes}>
            <div {...listeners} className="pe-drag-handle"><DragHandleIcon /></div>
            <h4>{item.name}</h4>
            <button className="pe-delete-btn-sm" onClick={() => onDelete(item)}>🗑️</button>
        </div>
    );
};

/* ─── Superset Exercise Sub-Card (sortable) ─── */
const SortableSupersetExercise = ({ item, onEdit, onDelete, onUpdateItemField }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="pe-superset-exo" {...attributes}>
            <div className="pe-superset-exo-top">
                <div className="pe-superset-exo-left" onClick={() => onEdit(item, true)}>
                    <div className="pe-thumb-round">
                        {item.photo_url ? <img src={item.photo_url} alt={item.name} /> : <span>{getEmojiForType(item.type)}</span>}
                    </div>
                    <div className="pe-exo-details">
                        <h4>{item.name}</h4>
                        <span className="pe-muscles">{item.body_part || ''}</span>
                    </div>
                </div>
                {item.body_part && <span className="pe-body-badge">{item.body_part.split(',')[0].trim().toUpperCase()}</span>}
                <div className="pe-subcard-actions">
                    <div {...listeners} className="pe-drag-handle pe-drag-sm"><DragHandleIcon /></div>
                    <button className="pe-delete-btn-sm" onClick={(e) => { e.stopPropagation(); onDelete(item); }}><DeleteIcon /></button>
                </div>
            </div>
            <div className="pe-inline-fields" onPointerDown={(e) => e.stopPropagation()}>
                <div className="pe-inline-field">
                    <label>SETS</label>
                    <input type="number" value={item.sets || ''} onChange={(e) => onUpdateItemField(item.id, 'sets', e.target.value)} placeholder="—" />
                </div>
                <div className="pe-inline-field">
                    <label>REPS</label>
                    <input type="text" value={getEffortLabel(item) === '—' ? '' : getEffortLabel(item)} onChange={(e) => onUpdateItemField(item.id, 'reps', e.target.value)} placeholder="—" />
                </div>
                <div className="pe-inline-field">
                    <label>REST (SEC)</label>
                    <input type="number" value={parseRestToSeconds(item.rest_time)} onChange={(e) => onUpdateItemField(item.id, 'rest_time', e.target.value)} placeholder="—" />
                </div>
                <div className="pe-inline-field pe-field-accent">
                    <label>{getChargeLabel(item)}</label>
                    <input type="number" value={item.charge || ''} onChange={(e) => onUpdateItemField(item.id, 'charge', e.target.value)} placeholder="—" />
                </div>
            </div>
        </div>
    );
};

/* ─── Circuit Exercise Item (sortable) ─── */
const SortableCircuitExercise = ({ item, circuitNumber, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="pe-circuit-item" {...attributes}>
            <span className="pe-circuit-num">{String(circuitNumber).padStart(2, '0')}</span>
            <span className="pe-circuit-name" onClick={() => onEdit(item, true)}>{item.name}</span>
        </div>
    );
};

/* ─── Droppable Group Zone ─── */
const DroppableGroupZone = ({ supersetId, isOver: isOverProp, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id: `group-drop-${supersetId}` });
    return (
        <div ref={setNodeRef} className={`pe-group-card-drop${isOver ? ' drop-hover' : ''}`}>
            {children}
        </div>
    );
};

/* ─── Droppable Solo Zone ─── */
const DroppableSoloZone = ({ itemId, children }) => {
    const { setNodeRef, isOver } = useDroppable({ id: `solo-drop-${itemId}` });
    return (
        <div ref={setNodeRef} className={`pe-solo-drop${isOver ? ' drop-hover' : ''}`}>
            {children}
        </div>
    );
};

/* ─── Solo Exercise Card (sortable) ─── */
const SortableSoloExercise = ({ item, onEdit, onDelete, onUpdateItemField }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} className="pe-solo-card" {...attributes}>
            <div className="pe-solo-top">
                <div className="pe-solo-left" onClick={() => onEdit(item, false)}>
                    <div className="pe-thumb-round">
                        {item.photo_url ? <img src={item.photo_url} alt={item.name} /> : <span>{getEmojiForType(item.type)}</span>}
                    </div>
                    <div className="pe-exo-details">
                        <h4>{item.name}</h4>
                        <span className="pe-muscles">{item.body_part || ''}</span>
                    </div>
                </div>
                {item.body_part && <span className="pe-body-badge">{item.body_part.split(',')[0].trim().toUpperCase()}</span>}
                <div className="pe-solo-actions">
                    <div {...listeners} className="pe-drag-handle"><DragHandleIcon /></div>
                    <button className="pe-delete-btn-sm" onClick={(e) => { e.stopPropagation(); onDelete(item); }}><DeleteIcon /></button>
                </div>
            </div>
            <div className="pe-inline-fields" onPointerDown={(e) => e.stopPropagation()}>
                <div className="pe-inline-field">
                    <label>SETS</label>
                    <input type="number" value={item.sets || ''} onChange={(e) => onUpdateItemField(item.id, 'sets', e.target.value)} placeholder="—" />
                </div>
                <div className="pe-inline-field">
                    <label>REPS</label>
                    <input type="text" value={getEffortLabel(item) === '—' ? '' : getEffortLabel(item)} onChange={(e) => onUpdateItemField(item.id, 'reps', e.target.value)} placeholder="—" />
                </div>
                <div className="pe-inline-field">
                    <label>REST (SEC)</label>
                    <input type="number" value={parseRestToSeconds(item.rest_time)} onChange={(e) => onUpdateItemField(item.id, 'rest_time', e.target.value)} placeholder="—" />
                </div>
                <div className="pe-inline-field pe-field-accent">
                    <label>{getChargeLabel(item)}</label>
                    <input type="number" value={item.charge || ''} onChange={(e) => onUpdateItemField(item.id, 'charge', e.target.value)} placeholder="—" />
                </div>
            </div>
        </div>
    );
};

/* ═══════════════════════════════════════════
   PAGE PRINCIPALE
   ═══════════════════════════════════════════ */
const ProgramEditorPage = ({ programId, onBack, onDirtyChange }) => {
    const {
        program, items, loading, isSaving, isNewProgram, activeDragData,
        handleProgramChange, handleChangeExecutionMode,
        handleUpdateItemField, handleUngroupItem,
        handleSaveItem, handleSaveNewTemplateAndAdd,
        handleAddExerciseFromPanel, handleAddExercisesFromLibrary, handleDeleteItem,
        handleSaveProgram, handleDeleteProgram,
        handleDragStart, handleDragEnd, handleDragCancel,
    } = useProgramEditor(programId, onDirtyChange);

    const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
    const [isEditingFollower, setIsEditingFollower] = useState(false);
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isCreatingForLibrary, setIsCreatingForLibrary] = useState(false);

    const { width } = useWindowSize();
    const isDesktop = width > 1024;

    /* ─── Visual Groups ─── */
    const visualGroups = useMemo(() => {
        const groups = [];
        let currentGroup = null;
        items.forEach((item, index) => {
            if (item.is_section_header) {
                currentGroup = null;
                groups.push({ type: 'section', items: [{ item, index }] });
                return;
            }
            if (item.superset_id) {
                if (currentGroup && currentGroup.supersetId === item.superset_id) {
                    currentGroup.items.push({ item, index });
                } else {
                    currentGroup = { type: 'group', supersetId: item.superset_id, items: [{ item, index }] };
                    groups.push(currentGroup);
                }
            } else {
                currentGroup = null;
                groups.push({ type: 'solo', items: [{ item, index }] });
            }
        });
        return groups;
    }, [items]);

    const handleOpenModalForEdit = (item, isFollower = false) => {
        if (item.is_section_header) return;
        setItemToEdit(item);
        setIsEditingFollower(isFollower);
        setIsCreatingForLibrary(false);
        setIsExerciseModalOpen(true);
    };

    const handleLaunchCreatorFromLibrary = () => {
        setShowLibraryModal(false); setItemToEdit(null); setIsEditingFollower(false);
        setIsCreatingForLibrary(true); setIsExerciseModalOpen(true);
    };

    const confirmDeleteItem = () => { handleDeleteItem(itemToDelete.id); setItemToDelete(null); };

    const onSaveProgram = async () => {
        const success = await handleSaveProgram();
        if (success) onBack(true);
    };

    const onDeleteProgram = async () => {
        const success = await handleDeleteProgram();
        if (success) onBack(true);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    if (loading) return <div className="screen"><p className="loading-text">Chargement...</p></div>;

    return (
        <>
            <DndContext sensors={sensors} collisionDetection={customCollision}
                onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
                <div className={`program-editor-layout ${isDesktop ? 'desktop' : 'mobile'}`}>
                    <div className="editor-main-panel">
                        <div className="screen pe-screen">
                            {/* ─── Top bar ─── */}
                            <div className="pe-topbar">
                                <div className="pe-topbar-left">
                                    <a href="#" className="pe-back-link" onClick={(e) => { e.preventDefault(); onBack(); }}>← {isNewProgram ? 'Créer un programme' : 'Modifier le programme'}</a>
                                    {!isNewProgram && <span className="pe-editing-label">Modification de {program.name}</span>}
                                </div>
                                <div className="pe-topbar-right">
                                    <button className="pe-btn-cancel" onClick={() => onBack()}>Annuler</button>
                                    <button className="pe-btn-save" onClick={onSaveProgram} disabled={isSaving}>
                                        {isSaving ? '...' : (isNewProgram ? 'Enregistrer le programme' : 'Sauvegarder')}
                                    </button>
                                </div>
                            </div>

                            {/* ─── Form section ─── */}
                            <div className="pe-form-grid">
                                <div className="pe-form-field">
                                    <label>Nom du programme</label>
                                    <input name="name" value={program.name} onChange={handleProgramChange} placeholder="ex. Hypertrophie 12 semaines" />
                                </div>
                                <div className="pe-form-field">
                                    <label>Lieu / Environnement</label>
                                    <select name="environment" value={program.environment} onChange={handleProgramChange}>
                                        <option value="Salle">🏋️‍♂️ Salle de sport</option>
                                        <option value="Domicile">🏠 Domicile</option>
                                    </select>
                                </div>
                            </div>

                            {/* ─── Exercises section ─── */}
                            <div className="pe-exercises-section">
                                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                                    <DroppableExerciseList>
                                        {visualGroups.map((group, gIdx) => {

                                            /* ── Section Header ── */
                                            if (group.type === 'section') {
                                                return <SortableSectionHeader key={group.items[0].item.id} item={group.items[0].item} onDelete={setItemToDelete} />;
                                            }

                                            /* ── Group Card (Superset / Circuit) ── */
                                            if (group.type === 'group') {
                                                const firstItem = group.items[0].item;
                                                const count = group.items.length;
                                                const executionMode = firstItem.execution_mode || 'Classique';
                                                const isCircuit = useCircuitLayout(executionMode, count);
                                                const label = getGroupLabel(count, executionMode);
                                                const isEMOMVariant = ['EMOM', 'E2MOM', 'E3MOM', 'E4MOM', 'E5MOM'].includes(executionMode);
                                                const emomMinutes = parseInt(executionMode.replace('EMOM', '').replace('E', '')) || 1;

                                                return (
                                                    <div key={group.supersetId} className="pe-group-wrapper">
                                                        <DroppableGroupZone supersetId={group.supersetId}>
                                                        <div className={`pe-group-card ${isCircuit ? 'circuit' : 'superset'}`}>
                                                            {/* Group Header */}
                                                            <div className="pe-group-header">
                                                                <div className="pe-group-header-left">
                                                                    <span className="pe-group-icon">{isCircuit ? <CircuitIcon /> : <SupersetIcon />}</span>
                                                                    <span className="pe-group-label">{label}</span>
                                                                </div>
                                                                <div className="pe-group-header-right" onPointerDown={(e) => e.stopPropagation()}>
                                                                    <div className="pe-mode-field">
                                                                        <span className="pe-mode-label">MODE</span>
                                                                        <select value={executionMode}
                                                                            onChange={(e) => handleChangeExecutionMode(group.supersetId, e.target.value)}>
                                                                            {EXECUTION_MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                                                                        </select>
                                                                    </div>
                                                                    {executionMode === 'TABATA' && (
                                                                        <>
                                                                            <div className="pe-mode-param-field">
                                                                                <span className="pe-mode-param-label">EFFORT (SEC)</span>
                                                                                <input type="number" value={firstItem.tabata_work || ''}
                                                                                    onChange={(e) => handleUpdateItemField(firstItem.id, 'tabata_work', e.target.value)} placeholder="20" />
                                                                            </div>
                                                                            <div className="pe-mode-param-field">
                                                                                <span className="pe-mode-param-label">RÉCUP (SEC)</span>
                                                                                <input type="number" value={firstItem.tabata_rest || ''}
                                                                                    onChange={(e) => handleUpdateItemField(firstItem.id, 'tabata_rest', e.target.value)} placeholder="10" />
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                    {executionMode === 'AMRAP' && (
                                                                        <div className="pe-mode-param-field">
                                                                            <span className="pe-mode-param-label">TEMPS (MIN)</span>
                                                                            <input type="number" value={firstItem.amrap_duration || ''}
                                                                                onChange={(e) => handleUpdateItemField(firstItem.id, 'amrap_duration', e.target.value)} placeholder="12" />
                                                                        </div>
                                                                    )}
                                                                    {isEMOMVariant && (
                                                                        <span className="pe-emom-info">⏱️ / {emomMinutes} min</span>
                                                                    )}
                                                                    <button className="pe-ungroup-btn" onClick={() => handleUngroupItem(group.supersetId)} title="Dissocier">✕</button>
                                                                </div>
                                                            </div>

                                                            {/* Group Body */}
                                                            <div className={`pe-group-body ${isCircuit ? 'circuit-grid' : 'superset-list'}`}>
                                                                {group.items.map(({ item }, i) =>
                                                                    isCircuit ? (
                                                                        <SortableCircuitExercise key={item.id} item={item} circuitNumber={i + 1}
                                                                            onEdit={handleOpenModalForEdit} onDelete={setItemToDelete} />
                                                                    ) : (
                                                                        <SortableSupersetExercise key={item.id} item={item}
                                                                            onEdit={handleOpenModalForEdit} onDelete={setItemToDelete}
                                                                            onUpdateItemField={handleUpdateItemField} />
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                        </DroppableGroupZone>
                                                    </div>
                                                );
                                            }

                                            /* ── Solo Exercise ── */
                                            const { item } = group.items[0];
                                            return (
                                                <div key={item.id} className="pe-solo-wrapper">
                                                    <DroppableSoloZone itemId={item.id}>
                                                        <SortableSoloExercise item={item}
                                                            onEdit={handleOpenModalForEdit} onDelete={setItemToDelete}
                                                            onUpdateItemField={handleUpdateItemField} />
                                                    </DroppableSoloZone>
                                                </div>
                                            );
                                        })}
                                    </DroppableExerciseList>
                                </SortableContext>

                                {items.length === 0 && (
                                    <div className="pe-empty-state">
                                        <p>Glissez des exercices depuis la bibliothèque ou utilisez le bouton ci-dessous.</p>
                                    </div>
                                )}
                            </div>

                            {/* Add exercise dashed button */}
                            <button className="pe-add-exercise-dashed" onClick={() => setShowLibraryModal(true)}>
                                <PlusCircleIcon />
                                Ajouter un exercice ou un bloc
                            </button>

                            {/* Pro Tip banner */}
                            {!isNewProgram && (
                                <div className="pe-pro-tip">
                                    <div className="pe-pro-tip-icon">ℹ️</div>
                                    <div>
                                        <strong>Astuce Pro</strong>
                                        <p>La sauvegarde mettra immédiatement à jour le programme pour tous les clients assignés.</p>
                                    </div>
                                </div>
                            )}

                            {/* Delete button */}
                            {!isNewProgram && (
                                <div style={{ marginTop: '24px' }}>
                                    <button className="pe-btn-delete" onClick={() => setShowDeleteConfirm(true)}>Supprimer ce programme</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {isDesktop && <LibraryPanel onAddExercise={handleAddExerciseFromPanel} />}
                </div>

                <DragOverlay dropAnimation={null}>
                    {activeDragData ? (
                        <div className="drag-overlay-card">
                            {activeDragData.type === 'separator' && <><span style={{ fontSize: '18px' }}>📌</span> {activeDragData.name}</>}
                            {activeDragData.type === 'exercise' && <><span style={{ fontSize: '18px' }}>{getEmojiForType(activeDragData.exercise?.type)}</span> {activeDragData.exercise?.name}</>}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {isExerciseModalOpen && (
                <ExerciseEditorModal exercise={itemToEdit} hideSets={isEditingFollower}
                    programName={program.name}
                    onClose={() => setIsExerciseModalOpen(false)}
                    onSave={isCreatingForLibrary ? handleSaveNewTemplateAndAdd : handleSaveItem} />
            )}
            {showLibraryModal && <AddFromLibraryModal onClose={() => setShowLibraryModal(false)} onAddExercises={handleAddExercisesFromLibrary} onLaunchCreator={handleLaunchCreatorFromLibrary} />}
            {itemToDelete && <ConfirmModal title="Supprimer" message={`Supprimer "${itemToDelete.name}" ?`} onConfirm={confirmDeleteItem} onCancel={() => setItemToDelete(null)} />}
            {showDeleteConfirm && <ConfirmModal title="Supprimer" message="Cette action est irréversible." onConfirm={onDeleteProgram} onCancel={() => setShowDeleteConfirm(false)} confirmText="Oui, supprimer" />}
        </>
    );
};

export default ProgramEditorPage;