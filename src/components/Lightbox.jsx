// src/components/Lightbox.jsx
import React, { useEffect } from 'react';

const Lightbox = ({ imageUrl, onClose }) => {
  // Ajoute un écouteur pour fermer avec la touche "Echap"
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close-button" onClick={onClose}>&times;</button>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Confirmation du client" className="lightbox-image" />
      </div>
    </div>
  );
};

export default Lightbox;