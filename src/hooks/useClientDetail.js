import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

export function useClientDetail(clientId) {
  const { addToast } = useNotification();
  const [assignedPrograms, setAssignedPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignedPrograms = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('client_programs')
      .select(`id, start_date, end_date, program_id, programs (id, name)`)
      .eq('client_id', clientId);

    if (data) {
        // Fetch workout log counts per program for this client
        const { data: logs } = await supabase
          .from('workout_logs')
          .select('program_id')
          .eq('client_id', clientId);

        const logCounts = {};
        if (logs) {
          logs.forEach(l => { logCounts[l.program_id] = (logCounts[l.program_id] || 0) + 1; });
        }

        setAssignedPrograms(
          data.filter(item => item.programs).map(item => ({
            ...item.programs,
            assignment_id: item.id,
            start_date: item.start_date,
            end_date: item.end_date,
            sessions_done: logCounts[item.programs.id] || 0,
          }))
        );
    }
    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchAssignedPrograms();
  }, [fetchAssignedPrograms]);

  const handleDeleteClient = async (clientName) => {
    try {
        const { error } = await supabase.from('clients').delete().eq('id', clientId);
        if (error) throw error;
        addToast('success', `Client "${clientName}" supprimé.`);
        return true;
    } catch (error) {
        addToast('error', "Erreur : " + error.message);
        return false;
    }
  };
  
  const handleUnassignProgram = async (programId) => {
    try {
        const { error } = await supabase.from('client_programs').delete().match({ client_id: clientId, program_id: programId });
        if (error) throw error;
        addToast('success', `Le programme a été retiré.`);
        fetchAssignedPrograms();
        return true;
    } catch (error) {
        addToast('error', error.message);
        return false;
    }
  };

  const handleCopyCode = (clientCode) => {
    navigator.clipboard.writeText(clientCode);
    addToast('success', 'Code d\'accès copié !');
  };

  return { assignedPrograms, loading, fetchAssignedPrograms, handleDeleteClient, handleUnassignProgram, handleCopyCode };
}
