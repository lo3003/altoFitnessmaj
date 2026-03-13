import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export function useClientHistory(clientId) {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('workout_logs')
      .select(`*, programs (name)`)
      .eq('client_id', clientId)
      .order('completed_at', { ascending: false });
    
    if (data) setWorkoutLogs(data);
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { workoutLogs, loading };
}
