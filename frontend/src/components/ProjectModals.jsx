import React from 'react';
import Modal from './Modal';

const ProjectModals = ({ 
  modalType, setModalType, 
  modalData, setModalData,
  handlers 
}) => {
  const {
    handleCreateProject,
    handleRenameProject,
    handleCreateSection,
    handleUpdateLabel,
    handleBatchGenerate
  } = handlers;

  return (
    <>
      <Modal isOpen={modalType === 'createProject'} onClose={() => setModalType(null)} title="Nouveau Projet">
        <form onSubmit={handleCreateProject}>
          <input
            autoFocus className="input-field" placeholder="Nom du projet" required
            value={modalData.name || ''}
            onChange={e => setModalData({ ...modalData, name: e.target.value })}
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Créer</button>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'renameProject'} onClose={() => setModalType(null)} title="Renommer Projet">
        <form onSubmit={handleRenameProject}>
          <input
            autoFocus className="input-field" placeholder="Nom du projet" required
            value={modalData.name || ''}
            onChange={e => setModalData({ ...modalData, name: e.target.value })}
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Enregistrer</button>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'createSection'} onClose={() => setModalType(null)} title="Nouvelle Catégorie">
        <form onSubmit={handleCreateSection}>
          <input
            autoFocus className="input-field" placeholder="Nom (ex: Disjoncteurs)" required
            value={modalData.name || ''}
            onChange={e => setModalData({ ...modalData, name: e.target.value })}
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Créer</button>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'editLabel'} onClose={() => setModalType(null)} title="Modifier Étiquette">
        <form onSubmit={handleUpdateLabel}>
          <input
            autoFocus className="input-field" placeholder="Texte" required
            value={modalData.text || ''}
            onChange={e => setModalData({ ...modalData, text: e.target.value })}
          />
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Enregistrer</button>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'batch'} onClose={() => setModalType(null)} title="Génération Groupée">
        <form onSubmit={handleBatchGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
              Type de génération
            </label>
            <select
              className="input-field" style={{ marginBottom: 0 }}
              value={modalData.type}
              onChange={e => setModalData({ ...modalData, type: e.target.value })}
            >
              <option value="1">Multiple — même texte répété X fois</option>
              <option value="2">Séquence — numérotation automatique</option>
            </select>
          </div>

          {modalData.type === '1' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Texte</label>
                <input
                  className="input-field" style={{ marginBottom: 0 }}
                  value={modalData.text}
                  onChange={e => setModalData({ ...modalData, text: e.target.value })}
                  required placeholder="ex: REPARTITEUR"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Nombre</label>
                <input
                  type="number" min="1" max="500" className="input-field" style={{ marginBottom: 0 }}
                  value={modalData.count}
                  onChange={e => setModalData({ ...modalData, count: e.target.value })}
                  required
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Préfixe</label>
                <input
                  className="input-field" style={{ marginBottom: 0 }}
                  value={modalData.prefix}
                  onChange={e => setModalData({ ...modalData, prefix: e.target.value })}
                  placeholder="ex: F"
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Début</label>
                <input
                  type="number" className="input-field" style={{ marginBottom: 0 }}
                  value={modalData.start}
                  onChange={e => setModalData({ ...modalData, start: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Fin</label>
                <input
                  type="number" className="input-field" style={{ marginBottom: 0 }}
                  value={modalData.end}
                  onChange={e => setModalData({ ...modalData, end: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Générer les étiquettes
          </button>
        </form>
      </Modal>
    </>
  );
};

export default ProjectModals;
