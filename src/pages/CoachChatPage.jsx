// src/pages/CoachChatPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import ChatWindow from '../components/ChatWindow';
import AppointmentModal from '../components/AppointmentModal';
import { useNotification } from '../contexts/NotificationContext';

const CoachChatPage = ({ client, onBack, isDesktop }) => {
  const [coachId, setCoachId] = useState(null);
  const [pendingAppointment, setPendingAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
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
          .eq('client_id', client.id)
          .eq('coach_id', coachId)
          .eq('status', 'pending')
          .maybeSingle();
      setPendingAppointment(data);
  }, [coachId, client.id]);

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

  // --- FONCTION DE VÉRIFICATION (Identique à celle du client, adaptée pour le coach) ---
  const checkAvailability = async (date) => {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // On vérifie MES propres RDV confirmés (coachId)
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
          // Si le coach confirme, on revérifie quand même que le créneau est TOUJOURS libre
          // (au cas où il aurait accepté un autre RDV entre temps sur un autre appareil)
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
              receiver_id: String(client.id),
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
          // ÉTAPE 1 : VÉRIFICATION
          const isAvailable = await checkAvailability(date);
          if (!isAvailable) {
              throw new Error("Vous avez déjà un RDV confirmé sur ce créneau.");
          }

          // ÉTAPE 2 : INSERTION
          const { error } = await supabase.from('appointments').insert({
              client_id: client.id,
              coach_id: coachId,
              scheduled_at: date.toISOString(),
              notes: notes,
              status: 'confirmed'
          });
          if (error) throw error;

          // ÉTAPE 3 : NOTIFICATION
          const dateStr = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
          await supabase.from('messages').insert({
              sender_id: String(coachId),
              receiver_id: String(client.id),
              content: `📅 Je vous ai fixé un RDV pour le ${dateStr}.${notes ? `\nNote: ${notes}` : ''}`
          });

          addToast('success', 'RDV fixé et notifié au client.');
          setShowAppointmentModal(false);
      } catch (error) {
          addToast('error', error.message);
      } finally {
          setLoadingAction(false);
      }
  };

  if (!coachId) return <div className="screen"><p className="loading-text">Chargement...</p></div>;

  return (
    <>
        <div className={`screen coach-chat-page ${isDesktop ? 'desktop' : ''}`} style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--background-color)' }}>
        
        <div className="contact-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={onBack} className="chat-back-button" title="Retour">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
                <div className="coach-info">
                    <h2 style={{ fontSize: '18px', margin: 0 }}>{client.full_name}</h2>
                    <p className="coach-status" style={{ margin: 0, fontSize: '12px', color: 'var(--text-light)' }}>Client</p>
                </div>
            </div>
            <button className="secondary small appointment-btn" onClick={() => setShowAppointmentModal(true)}>
                📅 Fixer un RDV
            </button>
        </div>

        {pendingAppointment && (
            <div className="appointment-banner">
                <div className="banner-info">
                    <strong>📅 Demande de RDV</strong>
                    <p>
                        {new Date(pendingAppointment.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        {pendingAppointment.notes && <span className="banner-notes">Note: "{pendingAppointment.notes}"</span>}
                    </p>
                </div>
                <div className="banner-actions">
                    <button className="small danger-light" onClick={() => handleAppointmentAction('rejected')} disabled={loadingAction}>Refuser</button>
                    <button className="small success" onClick={() => handleAppointmentAction('confirmed')} disabled={loadingAction}>Confirmer</button>
                </div>
            </div>
        )}

        <div className="chat-container-wrapper" style={{ flex: 1, overflow: 'hidden' }}>
            <ChatWindow 
                currentUserIds={coachId}
                otherUserIds={client.id}
            />
        </div>
        </div>

        {showAppointmentModal && (
            <AppointmentModal 
                onClose={() => setShowAppointmentModal(false)}
                onConfirm={handleCoachPropose}
                loading={loadingAction}
            />
        )}
    </>
  );
};

export default CoachChatPage;