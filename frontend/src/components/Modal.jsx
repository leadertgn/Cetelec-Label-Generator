import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay no-print">
      <div className="modal-content animate-in zoom-in-95 duration-200">
        <div className="modal-header">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1"><X size={20}/></button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
