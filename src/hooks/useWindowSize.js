// src/hooks/useWindowSize.js
import { useState, useEffect } from 'react';

// Ce hook nous permet de connaître la largeur de la fenêtre en temps réel.
export default function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    // Appelle la fonction une fois au début pour avoir la bonne taille
    handleResize(); 

    // Nettoie l'écouteur d'événement quand le composant est retiré
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Le tableau vide assure que l'effet ne se lance qu'au montage/démontage

  return windowSize;
}