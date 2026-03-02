// src/components/ConfirmModal.jsx
import React from 'react';

const ConfirmModal = ({ title, message, onConfirm, onCancel, confirmText = "Confirmer", cancelText = "Annuler" }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content confirm-modal">
        <div className="modal-header">
          <h2>{title}</h2>
        </div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="secondary" onClick={onCancel}>{cancelText}</button>
          <button className="danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;