import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

export function useClientContact(client) {
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmittingRDV, setIsSubmittingRDV] = useState(false);
  const { addToast } = useNotification();

  useEffect(() => {
    const fetchCoach = async () => {
        const { data } = await supabase.from('coaches').select('*').eq('id', client.coach_id).single();
        if (data) setCoach(data);
        setLoading(false);
    };
    fetchCoach();
  }, [client.coach_id]);

  const checkAvailability = async (date) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: existingAppointments, error } = await supabase
          .from('appointments')
          .select('scheduled_at')
          .eq('coach_id', coach.id)
          .eq('status', 'confirmed')
          .gte('scheduled_at', startOfDay.toISOString())
          .lte('scheduled_at', endOfDay.toISOString());

      if (error || !existingAppointments) return true;

      const RDV_DURATION = 60 * 60 * 1000;
      const proposedStart = date.getTime();
      const proposedEnd = proposedStart + RDV_DURATION;

      const hasConflict = existingAppointments.some(app => {
          const appStart = new Date(app.scheduled_at).getTime();
          const appEnd = appStart + RDV_DURATION;
          return (proposedStart < appEnd && proposedEnd > appStart);
      });

      return !hasConflict;
  };

  const handleBookAppointment = async (date, notes) => {
      setIsSubmittingRDV(true);
      try {
          const isAvailable = await checkAvailability(date);
          if (!isAvailable) {
              throw new Error("Ce créneau est déjà pris par un autre RDV confirmé.");
          }

          const { error: rdvError } = await supabase
              .from('appointments')
              .insert({
                  client_id: client.id,
                  coach_id: coach.id,
                  scheduled_at: date.toISOString(),
                  notes: notes,
                  status: 'pending'
              });

          if (rdvError) throw rdvError;

          const formattedDate = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
          await supabase.from('messages').insert({
              sender_id: String(client.id),
              receiver_id: String(coach.id),
              content: `📅 J'ai proposé un RDV pour le ${formattedDate}.${notes ? `\nNote: ${notes}` : ''}`
          });

          addToast('success', 'Demande de RDV envoyée au coach !');
          return true;

      } catch (error) {
          addToast('error', error.message || "Impossible d'envoyer la demande.");
          return false;
      } finally {
          setIsSubmittingRDV(false);
      }
  };

  return { coach, loading, isSubmittingRDV, handleBookAppointment };
}
