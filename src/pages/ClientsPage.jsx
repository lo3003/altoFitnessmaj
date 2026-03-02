// src/pages/ClientsPage.jsx
import React from 'react'; // On enlève useState
import AddClientModal from '../components/AddClientModal';

// On reçoit 'isModalOpen' et 'setIsModalOpen' en props
const ClientsPage = ({ clients, loading, onSelectClient, onClientAdded, isModalOpen, setIsModalOpen }) => {
  
  // On supprime l'état local
  // const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="screen">
      <div className="page-header">
        <h1>Mes Clients</h1>
        {/* On utilise le setter des props */}
        <button className="add-button" onClick={() => setIsModalOpen(true)}>+</button>
      </div>

      {loading && <p className="loading-text">Chargement des clients...</p>}
      
      {!loading && clients.length === 0 && (
        <div className="empty-state">
          <p>Vous n'avez pas encore de client.</p>
          <p>Cliquez sur '+' pour commencer.</p>
        </div>
      )}

      {!loading && clients.length > 0 && (
        <div className="client-list">
          {clients.map(client => (
              <div key={client.id} className="client-card clickable" onClick={() => onSelectClient(client)}>
                  <h3>{client.full_name}</h3>
                  <p>{client.main_goal || 'Objectif non défini'}</p>
              </div>
          ))}
        </div>
      )}
      
      {/* On utilise la prop 'isModalOpen' pour l'affichage */}
      {isModalOpen && <AddClientModal onClose={() => setIsModalOpen(false)} onClientAdded={onClientAdded} />}
    </div>
  );
};

export default ClientsPage;