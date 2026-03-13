import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export function useCoachDashboard() {
  const [clients, setClients] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: clientsData } = await supabase.from('clients').select('*').eq('coach_id', user.id).order('created_at', { ascending: false });
      if (clientsData) setClients(clientsData);

      const { data: programsData } = await supabase
        .from('programs')
        .select(`
            *,
            client_programs (
                client_id
            )
        `)
        .eq('coach_id', user.id)
        .order('created_at', { ascending: false });
      
      if (programsData) setPrograms(programsData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { clients, programs, loading, fetchData };
}
