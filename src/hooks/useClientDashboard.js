import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export function useClientDashboard(clientId) {
  const [assignedPrograms, setAssignedPrograms] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClientData = useCallback(async () => {
    setLoading(true);
    const { data: programsData } = await supabase
      .from('client_programs')
      .select(`*, programs (*, exercises (*))`)
      .eq('client_id', clientId);
      
    if (programsData) {
        const now = new Date();
        const validPrograms = programsData.filter(assignment => {
          if (!assignment.programs) return false;
          // Filter out expired programs
          if (assignment.end_date && new Date(assignment.end_date) < now) return false;
          return true;
        });
        setAssignedPrograms(validPrograms);
    }

    const { data: logsData } = await supabase
        .from('workout_logs')
        .select('*, programs(name)')
        .eq('client_id', clientId)
        .order('completed_at', { ascending: false });

    if (logsData) setWorkoutLogs(logsData);
    
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  return { assignedPrograms, workoutLogs, loading, fetchClientData };
}
