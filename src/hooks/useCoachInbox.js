import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export function useCoachInbox() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('clients')
          .select('*')
          .eq('coach_id', user.id)
          .order('full_name', { ascending: true });
        if (data) setClients(data);
      }
      setLoading(false);
    };
    fetchClients();
  }, []);

  return { clients, loading };
}
