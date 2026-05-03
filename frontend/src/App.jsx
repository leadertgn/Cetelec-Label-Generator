import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import PreviewSheet from './components/PreviewSheet';
import Modal from './components/Modal';
import { useProject } from './hooks/useProject';

function App() {
  const [deviceId] = useState(() => {
    let id = localStorage.getItem('cetelec_device_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('cetelec_device_id', id);
    }
    return id;
  });

  const {
    projects, activeProject, isLoading,
    fetchProjects, loadProject, createProject, renameProject, deleteProject,
    createSection, updateSection, deleteSection, duplicateSection,
    addLabel, deleteLabel, updateLabel, batchGenerate
  } = useProject(deviceId);

  const [view, setView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [showCuttingMarks, setShowCuttingMarks] = useState(false);
  const [unit, setUnit] = useState('mm');

  // Modal States
  const [modalType, setModalType] = useState(null); // 'createProject' | 'renameProject' | 'batch' | 'editLabel' | 'createSection'
  const [modalData, setModalData] = useState({});

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // Handlers
  const handleLoadProject = async (id) => {
    const data = await loadProject(id);
    if (data) {
      if (data.sections?.length > 0) setSelectedSectionId(data.sections[0].id);
      setView('editor');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const name = modalData.name;
    if (name) {
      const newProj = await createProject(name);
      if (newProj) {
        setModalType(null);
        handleLoadProject(newProj.id);
      }
    }
  };

  const handleRenameProject = async (e) => {
    e.preventDefault();
    if (modalData.id && modalData.name) {
      await renameProject(modalData.id, modalData.name);
      setModalType(null);
    }
  };

  const handleDeleteProject = async (id) => {
    if (confirm("⚠️ Supprimer définitivement ce projet ?")) {
      if (await deleteProject(id)) {
        if (activeProject?.id === id) setView('dashboard');
      }
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (modalData.name && activeProject) {
      await createSection(activeProject.id, modalData.name);
      await loadProject(activeProject.id);
      setModalType(null);
    }
  };

  const handleBatchGenerate = async (e) => {
    e.preventDefault();
    const { type, text, count, prefix, start, end } = modalData;
    const body = type === '1' ? { type: 'count', text, count } : { type: 'sequence', prefix, start, end };
    if (await batchGenerate(selectedSectionId, body)) {
      await loadProject(activeProject.id);
      setModalType(null);
    }
  };

  const handleUpdateLabel = async (e) => {
    e.preventDefault();
    if (modalData.id && modalData.text) {
      if (await updateLabel(modalData.id, modalData.text)) {
        await loadProject(activeProject.id);
        setModalType(null);
      }
    }
  };

  const pages = useMemo(() => {
    if (!activeProject?.sections) return [];
    const pagesArr = [];
    let currentPage = { sections: [] };
    
    const PAGE_WIDTH = 180; 
    const PAGE_HEIGHT = 237; 
    const GAP = 3; 
    let currentY = 0;

    activeProject.sections.forEach(section => {
      const labels = section.labels || [];
      if (labels.length === 0) return;

      const labelW = section.defaultWidth + GAP;
      const labelH = section.defaultHeight + GAP;
      const labelsPerRow = Math.floor(PAGE_WIDTH / labelW) || 1;
      const sectionHeaderHeight = 8;
      
      if (currentY + sectionHeaderHeight + labelH > PAGE_HEIGHT) {
        pagesArr.push(currentPage); 
        currentPage = { sections: [] }; 
        currentY = 0;
      }

      let sectionInPage = { ...section, labels: [] };
      currentY += sectionHeaderHeight;

      labels.forEach(label => {
        const isFirstInRow = sectionInPage.labels.length % labelsPerRow === 0;
        if (isFirstInRow && currentY + labelH > PAGE_HEIGHT) {
          currentPage.sections.push(sectionInPage);
          pagesArr.push(currentPage); 
          currentPage = { sections: [] };
          sectionInPage = { ...section, labels: [label] };
          currentY = sectionHeaderHeight + labelH;
        } else {
          if (isFirstInRow) currentY += labelH;
          sectionInPage.labels.push(label);
        }
      });
      if (sectionInPage.labels.length > 0) currentPage.sections.push(sectionInPage);
    });
    if (currentPage.sections.length > 0) pagesArr.push(currentPage);
    return pagesArr;
  }, [activeProject]);

  return (
    <div className="app-container">
      <Header onHome={() => setView('dashboard')} project={activeProject} view={view} />
      
      <main style={{flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
        {view === 'dashboard' ? (
          <Dashboard 
            projects={projects} 
            onCreate={() => { setModalType('createProject'); setModalData({ name: '' }); }} 
            onLoad={handleLoadProject} 
            onDelete={handleDeleteProject} 
            onRename={(id, name) => { setModalType('renameProject'); setModalData({ id, name }); }}
          />
        ) : (
          <div className="editor-layout">
            <Sidebar 
              activeTab={activeTab} setActiveTab={setActiveTab}
              project={activeProject} activeSection={activeProject.sections.find(s => s.id === selectedSectionId)}
              selectedSectionId={selectedSectionId} setSelectedSectionId={setSelectedSectionId}
              onAddLabel={addLabel} 
              onBatch={() => { setModalType('batch'); setModalData({ type: '1', text: '', count: 10, prefix: 'F', start: 1, end: 10 }); }} 
              onUpdateLabel={(id, text) => { setModalType('editLabel'); setModalData({ id, text }); }} 
              onDeleteLabel={async (id) => { if (await deleteLabel(id)) await loadProject(activeProject.id); }}
              onUpdateSection={updateSection} 
              onDuplicateSection={async (id) => { if (await duplicateSection(id)) await loadProject(activeProject.id); }} 
              onDeleteSection={async (id) => { if (confirm("Supprimer cette catégorie ?")) { if (await deleteSection(id)) await loadProject(activeProject.id); } }} 
              onCreateSection={() => { setModalType('createSection'); setModalData({ name: '' }); }}
              unit={unit} setUnit={setUnit} showCuttingMarks={showCuttingMarks} setShowCuttingMarks={setShowCuttingMarks} 
              onLogoUpload={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setLogoBase64(reader.result);
                  reader.readAsDataURL(file);
                }
              }}
            />
            <PreviewSheet 
              pages={pages} 
              project={activeProject} 
              logoBase64={logoBase64} 
              showCuttingMarks={showCuttingMarks} 
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <Modal isOpen={modalType === 'createProject'} onClose={() => setModalType(null)} title="Nouveau Projet">
        <form onSubmit={handleCreateProject}>
          <input 
            autoFocus className="input-field" placeholder="Nom du projet" required
            value={modalData.name || ''} onChange={e => setModalData({...modalData, name: e.target.value})}
          />
          <button type="submit" className="btn btn-primary w-full">Créer</button>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'renameProject'} onClose={() => setModalType(null)} title="Renommer Projet">
        <form onSubmit={handleRenameProject}>
          <input 
            autoFocus className="input-field" placeholder="Nom du projet" required
            value={modalData.name || ''} onChange={e => setModalData({...modalData, name: e.target.value})}
          />
          <button type="submit" className="btn btn-primary w-full">Enregistrer</button>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'createSection'} onClose={() => setModalType(null)} title="Nouvelle Catégorie">
        <form onSubmit={handleCreateSection}>
          <input 
            autoFocus className="input-field" placeholder="Nom (ex: Disjoncteurs)" required
            value={modalData.name || ''} onChange={e => setModalData({...modalData, name: e.target.value})}
          />
          <button type="submit" className="btn btn-primary w-full">Créer</button>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'editLabel'} onClose={() => setModalType(null)} title="Modifier Étiquette">
        <form onSubmit={handleUpdateLabel}>
          <input 
            autoFocus className="input-field" placeholder="Texte" required
            value={modalData.text || ''} onChange={e => setModalData({...modalData, text: e.target.value})}
          />
          <button type="submit" className="btn btn-primary w-full">Enregistrer</button>
        </form>
      </Modal>

      <Modal isOpen={modalType === 'batch'} onClose={() => setModalType(null)} title="Génération Groupée">
        <form onSubmit={handleBatchGenerate} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Type</label>
            <select className="input-field" value={modalData.type} onChange={e => setModalData({...modalData, type: e.target.value})}>
              <option value="1">Multiple (Même texte)</option>
              <option value="2">Séquence (Nombres)</option>
            </select>
          </div>
          {modalData.type === '1' ? (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-bold">Texte</label><input className="input-field" value={modalData.text} onChange={e => setModalData({...modalData, text: e.target.value})} required/></div>
              <div><label className="text-xs font-bold">Nombre</label><input type="number" className="input-field" value={modalData.count} onChange={e => setModalData({...modalData, count: e.target.value})} required/></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-xs font-bold">Préfixe</label><input className="input-field" value={modalData.prefix} onChange={e => setModalData({...modalData, prefix: e.target.value})}/></div>
              <div><label className="text-xs font-bold">Début</label><input type="number" className="input-field" value={modalData.start} onChange={e => setModalData({...modalData, start: e.target.value})} required/></div>
              <div><label className="text-xs font-bold">Fin</label><input type="number" className="input-field" value={modalData.end} onChange={e => setModalData({...modalData, end: e.target.value})} required/></div>
            </div>
          )}
          <button type="submit" className="btn btn-primary w-full">Générer</button>
        </form>
      </Modal>
    </div>
  );
}

export default App;
