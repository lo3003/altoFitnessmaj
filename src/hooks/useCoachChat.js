import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

export function useCoachChat(clientId) {
    const [coachId, setCoachId] = useState(null);
    const [pendingAppointment, setPendingAppointment] = useState(null);
    const [loadingAction, setLoadingAction] = useState(false);
    const { addToast } = useNotification();

    useEffect(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) setCoachId(user.id);
        });
    }, []);

    const fetchPendingAppointment = useCallback(async () => {
        if (!coachId) return;
        const { data } = await supabase
            .from('appointments')
            .select('*')
            .eq('client_id', clientId)
            .eq('coach_id', coachId)
            .eq('status', 'pending')
            .maybeSingle();
        setPendingAppointment(data);
    }, [coachId, clientId]);

    useEffect(() => {
        if (!coachId) return;
        fetchPendingAppointment();

        const subscription = supabase
            .channel('public:appointments')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
                fetchPendingAppointment();
            })
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, [coachId, fetchPendingAppointment]);

    const checkAvailability = async (date) => {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: existingAppointments, error } = await supabase
            .from('appointments')
            .select('scheduled_at')
            .eq('coach_id', coachId)
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

    const handleAppointmentAction = async (status) => {
        if (!pendingAppointment) return;
        setLoadingAction(true);
        try {
            if (status === 'confirmed') {
                const isAvailable = await checkAvailability(new Date(pendingAppointment.scheduled_at));
                if (!isAvailable) {
                    throw new Error("Impossible de confirmer : ce créneau n'est plus disponible.");
                }
            }

            const { error } = await supabase
                .from('appointments')
                .update({ status })
                .eq('id', pendingAppointment.id);
            if (error) throw error;

            const dateStr = new Date(pendingAppointment.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
            const msg = status === 'confirmed' 
                ? `✅ J'ai confirmé le RDV pour le ${dateStr}.` 
                : `❌ Le RDV du ${dateStr} n'est pas possible.`;

            await supabase.from('messages').insert({
                sender_id: String(coachId),
                receiver_id: String(clientId),
                content: msg
            });

            addToast(status === 'confirmed' ? 'success' : 'info', `RDV ${status === 'confirmed' ? 'confirmé' : 'refusé'}.`);
            setPendingAppointment(null);

        } catch (error) {
            addToast('error', error.message || "Erreur lors de l'action.");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleCoachPropose = async (date, notes) => {
        setLoadingAction(true);
        try {
            const isAvailable = await checkAvailability(date);
            if (!isAvailable) {
                throw new Error("Vous avez déjà un RDV confirmé sur ce créneau.");
            }

            const { error } = await supabase.from('appointments').insert({
                client_id: clientId,
                coach_id: coachId,
                scheduled_at: date.toISOString(),
                notes: notes,
                status: 'confirmed'
            });
            if (error) throw error;

            const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
            await supabase.from('messages').insert({
                sender_id: String(coachId),
                receiver_id: String(clientId),
                content: `📅 Je vous ai fixé un RDV pour le ${dateStr}.${notes ? `\nNote: ${notes}` : ''}`
            });

            addToast('success', 'RDV fixé et notifié au client.');
            return true;
        } catch (error) {
            addToast('error', error.message);
            return false;
        } finally {
            setLoadingAction(false);
        }
    };

    return { coachId, pendingAppointment, loadingAction, handleAppointmentAction, handleCoachPropose };
}
