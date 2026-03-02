// src/App.jsx
import React, { useState, useEffect, useRef } from 'react'; // Importer useRef
import { supabase } from './services/supabaseClient';
import { NotificationProvider } from './contexts/NotificationContext';
import useWindowSize from './hooks/useWindowSize';

// Importer le nouveau composant
import ErrorBoundary from './components/ErrorBoundary';

import HomePage from './pages/HomePage';
import CoachAuthPage from './pages/CoachAuthPage';
import ClientLoginPage from './pages/ClientLoginPage';
import CoachDashboardPage from './pages/CoachDashboardPage';
import ClientDashboardPage from './pages/ClientDashboardPage';

function App() {
  const [coachSession, setCoachSession] = useState(null);
  const [clientSession, setClientSession] = useState(null);
  const [view, setView] = useState('home');
  const [loading, setLoading] = useState(true);

  const { width } = useWindowSize();
  const isDesktop = width > 900;

  // Utiliser un Ref pour mémoriser l'ID de l'utilisateur
  const currentUserIdRef = useRef(null);

  useEffect(() => {
    
    const checkUserRole = async (session) => {
      
      // Cas 1: L'utilisateur est déconnecté (session null)
      if (!session) {
        if (currentUserIdRef.current !== null) {
          setCoachSession(null);
          setClientSession(null);
          currentUserIdRef.current = null;
        }
        setLoading(false);
        return;
      }

      // Cas 2: L'utilisateur est connecté (session existe)
      const newUserId = session.user.id;

      // --- LA CORRECTION CLÉ (Bug de focus) ---
      // Si l'ID est le même que celui en mémoire, c'est un simple
      // rafraîchissement (TOKEN_REFRESHED). ON NE FAIT RIEN.
      if (newUserId === currentUserIdRef.current) {
        return; // <-- Sortie anticipée !
      }
      
      // Si on arrive ici, c'est que l'ID est NOUVEAU.

      // 1. Est-ce un Coach ?
      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('id', newUserId)
        .maybeSingle();

      if (coachData) {
        setCoachSession(session);
        setClientSession(null);
        currentUserIdRef.current = newUserId; // Mémoriser le nouvel ID
        setLoading(false);
        return;
      }

      // 2. Est-ce un Client ?
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_user_id', newUserId)
        .maybeSingle();

      if (clientData) {
        setClientSession(clientData);
        setCoachSession(null);
        currentUserIdRef.current = newUserId; // Mémoriser le nouvel ID
      } else {
        // Cas 3: Authentifié mais sans rôle
        console.error("Utilisateur authentifié sans rôle défini.");
        await supabase.auth.signOut();
        currentUserIdRef.current = null; // Reset
      }
      setLoading(false);
    };

    // Vérification au chargement initial
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserRole(session);
    });

    // Écoute des changements d'état
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUserRole(session);
    });

    return () => subscription.unsubscribe();
    
  }, []); // Le tableau de dépendances doit être vide

  const handleClientLogout = async () => {
    await supabase.auth.signOut();
    // Le 'onAuthStateChange' s'occupera de nettoyer l'état
  };

  // Reste du rendu
  let content;
  let layoutClass = 'layout-mobile-box';

  if (loading) {
    content = <div className="loading-fullscreen">Chargement...</div>;
  } else if (coachSession) {
    content = <CoachDashboardPage />;
    if (isDesktop) layoutClass = 'layout-coach-desktop';
  } else if (clientSession) {
    content = <ClientDashboardPage client={clientSession} onLogout={handleClientLogout} />;
    if (isDesktop) layoutClass = 'layout-client-desktop';
  } else {
    switch (view) {
      case 'coach-auth':
        content = <CoachAuthPage setView={setView} />;
        break;
      case 'client-auth':
        content = <ClientLoginPage setView={setView} />;
        break;
      default:
        content = <HomePage setView={setView} />;
    }
  }

  return (
    <NotificationProvider>
      <div className={`app-container ${layoutClass}`}>
        {/*
          AJOUT : Nous enveloppons le {content} avec notre ErrorBoundary.
        */}
        <ErrorBoundary>
          {content}
        </ErrorBoundary>
      </div>
    </NotificationProvider>
  );
}

export default App;