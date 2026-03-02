// src/pages/ClientLoginPage.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';

const LoadingSpinner = () => (
  <span className="spinner-loader" style={{
    width: '16px', height: '16px', border: '2px solid #FFF', 
    borderBottomColor: 'transparent', borderRadius: '50%', 
    display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px'
  }}></span>
);

const ClientLoginPage = ({ setView }) => {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const { addToast } = useNotification();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [activationStep, setActivationStep] = useState(1);
  const [clientCode, setClientCode] = useState('');
  const [retrievedEmail, setRetrievedEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // --- LOGIQUE 1 : Connexion Classique ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        // CORRECTION ICI : .trim() sur l'email
        const cleanEmail = email.trim();
        
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ 
            email: cleanEmail, 
            password 
        });
        
        if (error) throw error;

        if (user) {
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('id')
                .eq('auth_user_id', user.id)
                .maybeSingle();

            if (clientError || !clientData) {
                await supabase.auth.signOut();
                throw new Error("Ce compte n'est pas associé à une fiche client.");
            }
            addToast('success', 'Bon retour !');
        }
    } catch (error) {
        console.error("Erreur login:", error);
        addToast('error', "Email ou mot de passe incorrect.");
    } finally {
        setLoading(false);
    }
  };

  // --- LOGIQUE 2 : Activation (Étape 1) ---
  const verifyCodeAndFetchEmail = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
          const { data, error } = await supabase
            .from('clients')
            .select('email, auth_user_id')
            .eq('client_code', clientCode.trim().toUpperCase())
            .single();

          if (error || !data) throw new Error("Code invalide.");
          if (data.auth_user_id) throw new Error("Ce code est déjà activé. Connectez-vous avec votre email.");
          if (!data.email) throw new Error("Aucun email associé. Contactez votre coach.");

          setRetrievedEmail(data.email);
          setActivationStep(2);
          addToast('success', `Code validé !`);

      } catch (error) {
          addToast('error', error.message);
      } finally {
          setLoading(false);
      }
  };

  // --- LOGIQUE 3 : Activation (Étape 2) ---
  const handleActivationFinal = async (e) => {
      e.preventDefault();
      if (password !== confirmPassword) {
          addToast('error', "Les mots de passe ne correspondent pas.");
          return;
      }
      if (!termsAccepted) {
          addToast('error', "Veuillez accepter la politique.");
          return;
      }

      setLoading(true);
      try {
          // CORRECTION ICI : On nettoie aussi l'email récupéré de la BDD au cas où
          const cleanRetrievedEmail = retrievedEmail.trim();

          const { data: authData, error: signUpError } = await supabase.auth.signUp({
              email: cleanRetrievedEmail,
              password: password
          });
          if (signUpError) throw signUpError;

          if (authData.user) {
              const { error: updateError } = await supabase
                  .from('clients')
                  .update({ auth_user_id: authData.user.id })
                  .eq('client_code', clientCode.trim().toUpperCase());

              if (updateError) throw updateError;

              addToast('success', 'Compte activé !');
          }
      } catch (error) {
          let msg = error.message;
          if (msg.includes("User already registered")) msg = "Cet email a déjà un compte.";
          addToast('error', msg);
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="screen">
      <a href="#" className="back-link" onClick={() => setView('home')}>← Retour</a>
      
      <div className="content-centered">
        <h2>{mode === 'login' ? 'Connexion' : 'Activation du compte'}</h2>
        <p>
            {mode === 'login' 
                ? 'Accédez à votre espace personnel.' 
                : (activationStep === 1 ? 'Entrez le code fourni par votre coach.' : 'Définissez votre mot de passe.')}
        </p>
      </div>

      {mode === 'login' && (
          <form onSubmit={handleLogin} className="auth-form">
            <input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
            />
            <input 
                type="password" 
                placeholder="Mot de passe" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
            />
            <button type="submit" disabled={loading}>
                {loading ? <><LoadingSpinner /> Connexion...</> : 'Se connecter'}
            </button>
          </form>
      )}

      {mode === 'activation' && (
          <form onSubmit={activationStep === 1 ? verifyCodeAndFetchEmail : handleActivationFinal} className="auth-form">
              {activationStep === 1 && (
                  <div className="form-field">
                      <label>Code d'accès</label>
                      <input 
                        type="text" 
                        placeholder="Ex: ID-A1B2C" 
                        value={clientCode} 
                        onChange={e => setClientCode(e.target.value.toUpperCase())}
                        style={{ textAlign: 'center', letterSpacing: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}
                        required 
                        autoFocus
                      />
                      <button type="submit" disabled={loading || !clientCode}>
                        {loading ? <><LoadingSpinner /> Vérification...</> : 'Continuer'}
                      </button>
                  </div>
              )}

              {activationStep === 2 && (
                  <>
                    <div style={{ textAlign: 'center', marginBottom: '16px', padding: '10px', backgroundColor: 'var(--secondary-color)', borderRadius: '8px', fontSize: '14px' }}>
                        Compte : <strong>{retrievedEmail}</strong>
                    </div>

                    <input 
                        type="password" 
                        placeholder="Mot de passe (6+ car.)" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        minLength={6}
                        required 
                        autoFocus
                    />
                    <input 
                        type="password" 
                        placeholder="Confirmez le mot de passe" 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        required 
                    />

                    <div className="form-options" style={{justifyContent: 'flex-start', marginTop: '8px'}}>
                        <label className="checkbox-container" style={{fontSize: '13px', alignItems: 'flex-start'}}>
                            <input 
                                type="checkbox" 
                                checked={termsAccepted} 
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                style={{marginTop: '3px'}}
                            />
                            <span>
                                J'accepte la <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} style={{color: 'var(--primary-color)'}}>politique de confidentialité</a>.
                            </span>
                        </label>
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? <><LoadingSpinner /> Création...</> : 'Activer mon compte'}
                    </button>
                  </>
              )}
          </form>
      )}

      <p className="auth-toggle">
        {mode === 'login' ? 'Première visite ?' : 'Déjà activé ?'}
        <a href="#" onClick={(e) => { 
            e.preventDefault();
            setMode(mode === 'login' ? 'activation' : 'login');
            setActivationStep(1);
            setLoading(false);
        }}>
          {mode === 'login' ? ' Activer mon compte avec un code' : ' Se connecter'}
        </a>
      </p>

      {showPrivacyModal && <PrivacyPolicyModal onClose={() => setShowPrivacyModal(false)} />}
    </div>
  );
};

export default ClientLoginPage;