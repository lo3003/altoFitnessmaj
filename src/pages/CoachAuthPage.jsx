// src/pages/CoachAuthPage.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';

const CoachAuthPage = ({ setView }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!isLoginView) {
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            setLoading(false);
            return;
        }
        if (!termsAccepted) {
            setError("Veuillez accepter la politique de confidentialité pour continuer.");
            setLoading(false);
            return;
        }
    }

    try {
      if (isLoginView) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.user) {
          const { error: insertError } = await supabase
            .from('coaches')
            .insert({ id: data.user.id, full_name: fullName });
          if (insertError) throw insertError;
          
          alert('Inscription réussie ! Veuillez consulter vos e-mails pour valider votre compte.');
          setIsLoginView(true);
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen">
      <a href="#" className="back-link" onClick={() => setView('home')}>← Retour</a>
      <div className="content-centered">
        <h2>{isLoginView ? 'Connexion Coach' : 'Créer un compte Coach'}</h2>
        <p>{isLoginView ? 'Accédez à votre tableau de bord.' : 'Rejoignez la plateforme dès maintenant.'}</p>
      </div>
      <form onSubmit={handleAuth} className="auth-form">
        {!isLoginView && (
          <input
            type="text"
            placeholder="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe (6+ caractères)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength="6"
          required
        />
        {!isLoginView && (
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        )}
        
        {!isLoginView && (
             <div className="form-options" style={{justifyContent: 'flex-start'}}>
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
        )}

        {isLoginView && (
            <div className="form-options">
                <label className="checkbox-container">
                    <input type="checkbox" defaultChecked />
                    Rester connecté
                </label>
            </div>
        )}

        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Chargement...' : (isLoginView ? 'Se connecter' : "S'inscrire")}
        </button>
      </form>
      <p className="auth-toggle">
        {isLoginView ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
        <a href="#" onClick={(e) => {
            e.preventDefault();
            setIsLoginView(!isLoginView);
            setError(null);
            setConfirmPassword('');
        }}>
          {isLoginView ? " S'inscrire" : ' Se connecter'}
        </a>
      </p>

      {showPrivacyModal && <PrivacyPolicyModal onClose={() => setShowPrivacyModal(false)} />}
    </div>
  );
};

export default CoachAuthPage;