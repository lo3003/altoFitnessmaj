import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

export function useExerciseLibrary() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useNotification();

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

  const handleSaveExercise = async (exerciseData, itemToEdit) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { variants, ...rest } = exerciseData;
    const rawData = { ...rest, coach_id: user.id, is_template: true, program_id: null };
    if (rawData.id && String(rawData.id).startsWith('temp-')) delete rawData.id;

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

  const handleDeleteExercise = async (item) => {
    const { error } = await supabase.from('exercises').delete().eq('id', item.id);
    if (error) addToast('error', error.message);
    else {
        addToast('success', "Supprimé.");
        fetchLibrary();
    }
  };

  return { exercises, loading, fetchLibrary, handleSaveExercise, handleDeleteExercise };
}
