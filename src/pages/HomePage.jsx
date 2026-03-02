// src/pages/HomePage.jsx
import React from 'react';

const Logo = () => (
    <div style={{ textAlign: 'center', marginBottom: '20px' }}><svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12ZM18.39 14.56C17.71 13.7 16.54 13 15 13H9C7.46 13 6.29 13.7 5.61 14.56C3.6 16.17 3 18.28 3 20H21C21 18.28 20.4 16.17 18.39 14.56Z" fill="#2ecc71"/></svg></div>
);

const HomePage = ({ setView }) => {
  return (
    <div className="screen">
      <div className="content-centered">
        <Logo />
        <h1>AltoFitness</h1>
        <p>L'application de coaching qui vous suit partout.</p>
      </div>
      <div className="button-group">
        <button onClick={() => setView('coach-auth')}>Je suis un Coach</button>
        <button className="secondary" onClick={() => setView('client-auth')}>Je suis un Client</button>
      </div>
    </div>
  );
};

export default HomePage;