// src/pages/ClientProgramDetailPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import WorkoutFeedbackModal from '../components/WorkoutFeedbackModal';
import RestTimerView from '../components/RestTimerView';

const ClientProgramDetailPage = ({ assignment, client, onBack, onWorkoutLogged, isDesktop }) => {
  const program = assignment.programs;
  
  // On récupère la liste plate des exercices
  const exercises = useMemo(() => program.exercises
    .filter(item => !item.is_section_header)
    .sort((a, b) => a.order - b.order), [program.exercises]);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [sessionState, setSessionState] = useState('exercise'); 

  // --- NOUVEAU : Suivi des tours de circuit ---
  // On stocke : { "superset_uuid": 2 } (signifie qu'on est au tour 2 de ce superset)
  const [roundsTracker, setRoundsTracker] = useState({});

  const totalExercises = exercises.length;
  const currentExercise = exercises[currentExerciseIndex];
  const nextExercise = exercises[currentExerciseIndex + 1];
  const isLastExercise = currentExerciseIndex === totalExercises - 1;

  // Détecter si l'exercice actuel fait partie d'un circuit
  const currentSupersetId = currentExercise?.superset_id;
  
  // Trouver le leader du groupe actuel pour savoir le nombre de tours TOTAL à faire
  const currentSupersetLeader = useMemo(() => {
      if (!currentSupersetId) return null;
      return exercises.find(e => e.superset_id === currentSupersetId); // Le premier trouvé est le leader
  }, [currentSupersetId, exercises]);

  // Calcul du numéro de tour actuel
  const currentRound = currentSupersetId ? (roundsTracker[currentSupersetId] || 1) : 1;
  const totalRounds = currentSupersetLeader ? (currentSupersetLeader.sets || 1) : 1;

  const handleNext = () => {
    // 1. Marquer comme fait (visuel playlist)
    const newCompleted = new Set(completedExercises);
    newCompleted.add(currentExercise.id);
    setCompletedExercises(newCompleted);

    // 2. Logique de fin de séance
    if (isLastExercise) {
        // Si c'est un circuit à la fin, on vérifie les tours
        if (currentSupersetId && currentRound < totalRounds) {
             // Cas rare : circuit à la toute fin du programme
             loopBackToStartOfCircuit();
             return;
        }
        setShowFeedbackModal(true);
        return;
    }

    // 3. Logique Superset / Circuit
    if (currentSupersetId) {
        // Est-ce que le PROCHAIN exercice fait partie du MÊME circuit ?
        const isNextInCircuit = nextExercise && nextExercise.superset_id === currentSupersetId;

        if (isNextInCircuit) {
            // OUI -> On enchaîne sans repos (transition fluide)
            goToNextExercise();
        } else {
            // NON -> C'est la fin du tour (le prochain exo est NULL ou différent)
            
            // Est-ce qu'il reste des tours à faire ?
            if (currentRound < totalRounds) {
                // OUI -> On lance le repos, puis on boucle
                if (currentExercise.rest_time) {
                    setSessionState('rest_loop'); // État spécial pour dire "repos avant de boucler"
                } else {
                    loopBackToStartOfCircuit();
                }
            } else {
                // NON -> Circuit fini, on passe à la suite
                if (currentExercise.rest_time) {
                    setSessionState('rest');
                } else {
                    goToNextExercise();
                }
            }
        }
    } else {
        // 4. Exercice Standard
        if (currentExercise.rest_time) {
            setSessionState('rest');
        } else {
            goToNextExercise();
        }
    }
  };

  const loopBackToStartOfCircuit = () => {
      // Trouver l'index du premier exercice de ce groupe
      const startIndex = exercises.findIndex(e => e.superset_id === currentSupersetId);
      
      // Incrémenter le compteur de tours pour ce groupe
      setRoundsTracker(prev => ({
          ...prev,
          [currentSupersetId]: (prev[currentSupersetId] || 1) + 1
      }));

      // Revenir en arrière
      setCurrentExerciseIndex(startIndex);
      setSessionState('exercise');
  };

  const goToNextExercise = () => {
    setSessionState('exercise');
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handlePreviousExercise = () => {
    setSessionState('exercise');
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const jumpToExercise = (index) => {
      setCurrentExerciseIndex(index);
      setSessionState('exercise');
  }

  if (!currentExercise) return <div className="screen"><div className="empty-state"><p>Programme vide.</p></div></div>;

  const formatDurationDisplay = (val) => {
      if (!val) return '-';
      if (String(val).match(/[ms]/)) return val;
      return `${val} min`;
  };

  const getBodyPartEmoji = (part) => {
      switch(part) {
          case 'Tout le corps': return '🧍';
          case 'Fessiers': return '🍑'; case 'Bras': return '💪'; case 'Jambes': return '🦵';
          case 'Dos': return '🔙'; case 'Pectoraux': return '👕'; case 'Epaules': return '🥥'; case 'Abdo': return '🍫';
          default: return '';
      }
  };

  const MainScreen = () => {
      // Gestion des écrans de repos
      if (sessionState === 'rest' || sessionState === 'rest_loop') {
        const nextName = sessionState === 'rest_loop' 
            ? `Tour ${currentRound + 1} : ${currentSupersetLeader.name}` 
            : (nextExercise?.name || "Fin");
        
        return (
            <RestTimerView
                duration={currentExercise.rest_time}
                nextExerciseName={nextName}
                onComplete={() => sessionState === 'rest_loop' ? loopBackToStartOfCircuit() : goToNextExercise()}
                onSkip={() => sessionState === 'rest_loop' ? loopBackToStartOfCircuit() : goToNextExercise()}
            />
        );
      }

      // Info Superset pour l'affichage
      const isSuperset = !!currentSupersetId;
      const isNextInCircuit = nextExercise && nextExercise.superset_id === currentSupersetId;

      return (
        <div className="workout-focus-content">
            <div className="workout-header">
            {!isDesktop && <a href="#" className="back-link-workout" onClick={onBack}>Quitter</a>}
            {!isDesktop && (
                <div className="workout-progress">
                    <p>{program.name}</p>
                    {/* Barre de progression (approximation simple) */}
                    <div className="progress-bar-container">
                        <div className="progress-bar-fill" style={{ width: `${((currentExerciseIndex + 1) / totalExercises) * 100}%` }}></div>
                    </div>
                </div>
            )}
            </div>

            <div className="current-exercise-display">
            
            {/* INDICATEUR DE TOUR (Nouveau) */}
            {isSuperset && (
                <div style={{marginBottom: '16px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '12px', fontSize: '14px', fontWeight: '600'}}>
                    🔄 Circuit • Tour {currentRound} / {totalRounds}
                </div>
            )}

            {currentExercise.photo_url && (
                <div className="exercise-photo-container">
                    <img src={currentExercise.photo_url} alt="" />
                </div>
            )}

            <h1 className="exercise-name">{currentExercise.name}</h1>

             {currentExercise.body_part && (
                <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '6px', 
                    backgroundColor: 'var(--secondary-color)', color: 'var(--primary-color)',
                    padding: '6px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', marginTop: '12px'
                }}>
                    <span>{getBodyPartEmoji(currentExercise.body_part)}</span>
                    <span>{currentExercise.body_part}</span>
                </div>
             )}

             {currentExercise.comment && <p className="exercise-comment">💡 {currentExercise.comment}</p>}

            <div className="exercise-details">
                {/* Affichage intelligent des détails */}
                
                {/* Cas Spécial : Si on est dans un circuit mais PAS le chef, on affiche les REPS de la carte (ignorer sets du chef) */}
                {/* Mais attention, ici 'currentExercise.sets' contient le nombre de tours si c'est le chef */}
                
                {/* Si c'est un exercice standard (pas superset) */}
                {!isSuperset && currentExercise.sets && (
                    <div className="detail-block"><span>{currentExercise.sets}</span><label>Séries</label></div>
                )}
                
                {(!isSuperset && currentExercise.sets) && <div className="detail-separator">×</div>}

                {/* Reps ou Durée */}
                {currentExercise.reps && <div className="detail-block"><span>{currentExercise.reps}</span><label>Répétitions</label></div>}
                {currentExercise.duration_minutes && <div className="detail-block"><span>{formatDurationDisplay(currentExercise.duration_minutes)}</span><label>Durée</label></div>}
                
                {currentExercise.charge && (
                    <div className="detail-charge" style={{width: '100%', textAlign: 'center', marginTop: '16px'}}>
                        Charge : <strong>{currentExercise.charge}</strong>
                    </div>
                )}
            </div>
            </div>

            {/* Navigation contextuelle */}
            {isNextInCircuit ? (
                 <div className="next-rest-display" style={{backgroundColor: '#fff3cd', color: '#856404'}}>
                    <p>🔥 Enchaîner avec : <strong>{nextExercise.name}</strong></p>
                </div>
            ) : (
                // Fin du circuit ou exercice seul
                !isLastExercise && currentExercise.rest_time && sessionState !== 'rest' && (
                    <div className="next-rest-display">
                        <p>
                            {isSuperset && currentRound < totalRounds 
                                ? `Repos avant Tour ${currentRound + 1}` 
                                : `Repos à suivre`} : <strong>{currentExercise.rest_time}</strong>
                        </p>
                    </div>
                )
            )}

            <div className="workout-navigation">
            <button className="secondary" onClick={handlePreviousExercise} disabled={currentExerciseIndex === 0}>Précédent</button>
            <button onClick={handleNext} className="primary-large">
                {isLastExercise && !(isSuperset && currentRound < totalRounds) 
                    ? 'Terminer' 
                    : (isNextInCircuit ? 'Suivant (Enchaîner)' : 'Suivant (Repos)')}
            </button>
            </div>
        </div>
      );
  }

  return (
    <>
      <div className={`screen workout-focus-mode ${isDesktop ? 'desktop-playlist-layout' : ''}`}>
        <div className="workout-main-area">
             {isDesktop && (<div className="desktop-workout-header"><button onClick={onBack} className="back-button-desktop">← Quitter</button><h2>{program.name}</h2></div>)}
             <MainScreen />
        </div>
        {isDesktop && (
            <div className="workout-playlist-sidebar">
                <h3>Programme</h3>
                <div className="playlist-items">
                    {exercises.map((exo, index) => (
                        <div key={exo.id} className={`playlist-item ${index === currentExerciseIndex ? 'active' : ''}`} onClick={() => jumpToExercise(index)}>
                            <div className="playlist-item-status">{index === currentExerciseIndex ? 'Vm' : (completedExercises.has(exo.id) ? '✓' : (index + 1))}</div>
                            <div className="playlist-item-info"><span className="playlist-item-name">{exo.name}</span></div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
      {showFeedbackModal && <WorkoutFeedbackModal client={client} program={program} onClose={() => setShowFeedbackModal(false)} onWorkoutLogged={() => { onWorkoutLogged(); onBack(); }} />}
    </>
  );
};

export default ClientProgramDetailPage;