// src/components/PrivacyPolicyModal.jsx
import React from 'react';

const PrivacyPolicyModal = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2>Politique de Confidentialité (RGPD)</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="modal-form" style={{ textAlign: 'left', lineHeight: '1.6', fontSize: '14px' }}>
          <p><strong>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</strong></p>

          <h3>1. Collecte des données</h3>
          <p>Dans le cadre de l'utilisation de l'application AltoFitness, nous collectons les données suivantes :</p>
          <ul>
            <li><strong>Coachs :</strong> Nom, Email, Programmes créés.</li>
            <li><strong>Clients :</strong> Nom, Email, Âge, Poids, Taille, Objectifs, Historique sportif, Blessures éventuelles, Logs d'entraînement, Photos de confirmation (optionnel).</li>
          </ul>

          <h3>2. Utilisation des données</h3>
          <p>Ces données sont collectées uniquement dans le but de :</p>
          <ul>
            <li>Permettre au Coach de créer et d'assigner des programmes sportifs personnalisés.</li>
            <li>Permettre au Client de suivre ses séances et ses progrès.</li>
            <li>Assurer le bon fonctionnement technique de l'application.</li>
          </ul>
          <p><strong>Engagement de non-revente :</strong> AltoFitness s'engage formellement à ne jamais vendre, louer ou céder vos données personnelles à des tiers à des fins publicitaires ou commerciales.</p>

          <h3>3. Stockage et Sécurité</h3>
          <p>Vos données sont stockées de manière sécurisée sur les serveurs de notre prestataire Supabase (hébergés dans l'Union Européenne ou disposant de garanties de sécurité équivalentes). L'accès à vos données est sécurisé par authentification.</p>

          <h3>4. Vos Droits (RGPD)</h3>
          <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants sur vos données :</p>
          <ul>
            <li>Droit d'accès (savoir quelles données nous avons).</li>
            <li>Droit de rectification (modifier des données inexactes).</li>
            <li>Droit à l'effacement (demander la suppression de votre compte et de vos données).</li>
          </ul>
          <p>Pour exercer ces droits, veuillez contacter votre Coach ou l'administrateur de l'application.</p>

          <div className="button-group" style={{marginTop: '24px'}}>
             <button onClick={onClose}>J'ai compris</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;