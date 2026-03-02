// src/pages/ClientContactPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import ChatWindow from '../components/ChatWindow';
import AppointmentModal from '../components/AppointmentModal';
import { useNotification } from '../contexts/NotificationContext';

const ClientContactPage = ({ client, isDesktop }) => {
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
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

  // --- NOUVELLE FONCTION DE VÉRIFICATION ---
  const checkAvailability = async (date) => {
      // 1. Définir la plage de recherche (la journée entière du RDV demandé)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // 2. Récupérer les RDV CONFIRMÉS du coach ce jour-là
      const { data: existingAppointments, error } = await supabase
          .from('appointments')
          .select('scheduled_at')
          .eq('coach_id', coach.id)
          .eq('status', 'confirmed') // On ne regarde que ceux qui sont validés
          .gte('scheduled_at', startOfDay.toISOString())
          .lte('scheduled_at', endOfDay.toISOString());

      if (error || !existingAppointments) return true; // Dans le doute, on laisse passer (ou on bloque, au choix)

      // 3. Vérifier les conflits (Hypothèse : RDV de 60 minutes)
      const RDV_DURATION = 60 * 60 * 1000; // 1 heure en millisecondes
      const proposedStart = date.getTime();
      const proposedEnd = proposedStart + RDV_DURATION;

      const hasConflict = existingAppointments.some(app => {
          const appStart = new Date(app.scheduled_at).getTime();
          const appEnd = appStart + RDV_DURATION;
          // Formule magique de chevauchement d'intervalles
          return (proposedStart < appEnd && proposedEnd > appStart);
      });

      return !hasConflict;
  };

  const handleBookAppointment = async (date, notes) => {
      setIsSubmittingRDV(true);
      try {
          // ÉTAPE 1 : VÉRIFICATION DE LA DISPONIBILITÉ
          const isAvailable = await checkAvailability(date);
          if (!isAvailable) {
              throw new Error("Ce créneau est déjà pris par un autre RDV confirmé.");
          }

          // ÉTAPE 2 : INSERTION SI LIBRE
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

          // ÉTAPE 3 : NOTIFICATION CHAT
          const formattedDate = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
          await supabase.from('messages').insert({
              sender_id: String(client.id),
              receiver_id: String(coach.id),
              content: `📅 J'ai proposé un RDV pour le ${formattedDate}.${notes ? `\nNote: ${notes}` : ''}`
          });

          addToast('success', 'Demande de RDV envoyée au coach !');
          setShowAppointmentModal(false);

      } catch (error) {
          // Affichage de l'erreur spécifique (ex: créneau pris)
          addToast('error', error.message || "Impossible d'envoyer la demande.");
      } finally {
          setIsSubmittingRDV(false);
      }
  };

  if (loading) return <div className="screen"><p className="loading-text">Chargement...</p></div>;
  if (!coach) return <div className="screen"><div className="empty-state"><p>Coach introuvable.</p></div></div>;

  return (
    <>
        <div className={`screen client-contact-page ${isDesktop ? 'desktop' : ''}`}>
        <div className="contact-header">
            <div className="coach-info">
                <h2>{coach.full_name || 'Votre Coach'}</h2>
                <p className="coach-status">Disponible</p>
            </div>
            <button 
                className="secondary small appointment-btn" 
                onClick={() => setShowAppointmentModal(true)}
            >
                📅 Prendre RDV
            </button>
        </div>

        <div className="chat-container-wrapper">
            <ChatWindow currentUserIds={client.id} otherUserIds={coach.id} />
        </div>
        </div>

        {showAppointmentModal && (
            <AppointmentModal 
                onClose={() => setShowAppointmentModal(false)}
                onConfirm={handleBookAppointment}
                loading={isSubmittingRDV}
            />
        )}
    </>
  );
};

export default ClientContactPage;