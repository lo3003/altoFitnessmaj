// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Mettez à jour l'état pour que le prochain rendu affiche l'interface de secours.
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    // Vous pouvez aussi logger l'erreur ici, par exemple vers un service externe
    console.error("Erreur attrapée par l'Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Vous pouvez personnaliser cette interface d'erreur
      return (
        <div className="screen" style={{ justifyContent: 'center', textAlign: 'center' }}>
          <div className="content-centered">
            <h2>😕 Oups !</h2>
            <p style={{textAlign: 'center'}}>Quelque chose s'est mal passé.</p>
            <p style={{fontSize: '12px', color: '#999', textAlign: 'center'}}>
                {this.state.error?.message}
            </p>
            <div className="button-group">
                 <button onClick={() => window.location.reload()}>
                    Recharger la page
                 </button>
            </div>
          </div>
        </div>
      );
    }

    // Si pas d'erreur, on affiche les composants enfants normalement
    return this.props.children; 
  }
}

export default ErrorBoundary;