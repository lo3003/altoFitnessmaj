import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// Remplacez par votre URL (trouvée dans votre JSON) et votre CLÉ SERVICE_ROLE
const SUPABASE_URL = 'https://pzugyhdafteoqyaafbwk.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6dWd5aGRhZnRlb3F5YWFmYndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNDQzMDksImV4cCI6MjA3NTcyMDMwOX0.ry_MbjueW5rJSpkO_IhUcQ77Gl5X1VWubJnr_dFhHdk'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- LOGIQUE DE DÉTECTION ---
const getDetails = (name) => {
    const n = name.toLowerCase();
    let type = 'Renforcement';
    let body_part = 'Corps entier'; // Valeur par défaut si rien n'est trouvé

    // 1. TYPE
    if (n.match(/run|course|vélo|velo|corde|jumping|burpee|cardio|rameur|elliptique|airbike|stepper|box jump|skipping|shadow|debout-allongé/)) {
        type = 'Cardio';
    } else if (n.match(/cercle de cheville|ange de neige|chenille|étirement|etirement|stretching/)) {
        type = 'Mobilité';
    }

    // 2. PARTIE DU CORPS (Ordre d'importance)
    
    // Bras / Haut
    if (n.match(/pompe|dips|développé|curl|triceps|biceps|élévation|tirage|rowing|shadow|boxing/)) {
        body_part = 'Bras';
    }
    // Dos
    else if (n.match(/traction|lombaire|bird dog|soulevé de terre|planche inversée|ange de neige/)) {
        body_part = 'Dos';
    }
    // Fessier (spécifique)
    else if (n.match(/pont|hip thrust|fire hydrant|donkey kick/)) {
        body_part = 'Fessier';
    }
    // Jambes
    else if (n.match(/squat|fente|chaise|mollet|jambe|step-up|abduction|dorsiflexion|chute faciale|vélo|velo|tapis|stepper|box jump/)) {
        body_part = 'Jambe';
    }
    // Corps entier / Abdos
    else if (n.match(/gainage|planche|abdo|dead bug|twist|ciseaux|mountain|ours|crunch|toucher|proprioception|burpee|rameur|elliptique/)) {
        body_part = 'Corps entier';
    }

    // Correction spécifique Kick-back
    if (n.includes('kick-back') || n.includes('kick back')) {
        if (n.includes('ours')) body_part = 'Fessier'; // Posture de l'ours kick back
        else body_part = 'Bras'; // Kick back triceps
    }

    return { type, body_part };
};

const run = async () => {
    console.log("🔍 Démarrage du diagnostic et de la migration...");

    // 1. Test de lecture
    const { data: exercises, error } = await supabase.from('exercises').select('*');
    
    if (error) {
        console.error("❌ CRITIQUE : Impossible de lire la base de données.");
        console.error(error);
        return;
    }

    console.log(`✅ ${exercises.length} exercices récupérés.`);
    console.log("------------------------------------------------");

    let successCount = 0;
    let failCount = 0;

    for (const exo of exercises) {
        // Calcul des nouvelles valeurs
        const { type, body_part } = getDetails(exo.name);

        // On affiche ce qu'on va faire pour être sûr
        // console.log(`Traitement : "${exo.name}" -> [${type}] / [${body_part}]`);

        // 2. MISE À JOUR FORCÉE
        const { error: updateError } = await supabase
            .from('exercises')
            .update({ 
                type: type, 
                body_part: body_part 
            })
            .eq('id', exo.id);

        if (updateError) {
            console.error(`❌ Erreur update sur ID ${exo.id} (${exo.name}) :`, updateError.message);
            failCount++;
        } else {
            // Petit check visuel pour les premiers
            if (successCount < 3) console.log(`✅ Update OK : ${exo.name} est maintenant ${body_part}`);
            successCount++;
        }
    }

    console.log("------------------------------------------------");
    console.log(`BILAN : ${successCount} réussites, ${failCount} échecs.`);
    
    // 3. Vérification finale sur un exemple
    if (exercises.length > 0) {
        const { data: check } = await supabase.from('exercises').select('name, body_part').eq('id', exercises[0].id).single();
        console.log(`Vérification finale en base pour "${check.name}" : body_part = "${check.body_part}"`);
    }
};

run();