// src/components/Toast.jsx
import React, { useEffect, useState } from 'react';

const Toast = ({ type = 'success', message, onDismiss }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Rend le toast visible avec une animation
    setVisible(true);

    // Prépare la disparition après un délai
    const timer = setTimeout(() => {
      setVisible(false);
      // Attend la fin de l'animation de sortie pour le supprimer du DOM
      setTimeout(onDismiss, 400);
    }, 4000); // Le toast reste visible 4 secondes

    return () => {
      clearTimeout(timer);
    };
  }, [onDismiss]);

  const Icon = () => {
    if (type === 'success') return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>;
    if (type === 'error') return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>;
    return null;
  };

  return (
    <div className={`toast ${type} ${visible ? 'visible' : ''}`}>
      <div className="toast-icon"><Icon /></div>
      <p>{message}</p>
    </div>
  );
};

export default Toast;