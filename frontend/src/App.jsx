import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import PreviewSheet from './components/PreviewSheet';
import ProjectModals from './components/ProjectModals';
import { useProject } from './hooks/useProject';
import { calculatePages } from './utils/pagination';

function App() {
  const [deviceId] = useState(() => {
    let id = localStorage.getItem('cetelec_device_id');
    if (!id) {
      id = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('cetelec_device_id', id);
    }
    return id;
  });

  const {
    projects, activeProject, setActiveProject, isLoading,
    fetchProjects, loadProject, createProject, renameProject, deleteProject, duplicateProject,
    createSection, updateSection, deleteSection, duplicateSection,
    addLabel, deleteLabel, updateLabel, batchGenerate, persistProject
  } = useProject(deviceId);

  const [view, setView] = useState('dashboard');
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [unit, setUnit] = useState('mm');

  // Modal state
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState({});

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  useEffect(() => {
    document.title = activeProject
      ? `LabelGen — ${activeProject.name}`
      : 'CETELEC LabelGen';
  }, [activeProject]);

  // Sync project ID with URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('projectId');
    if (idFromUrl && projects.length > 0 && !activeProject) {
      handleLoadProject(idFromUrl);
    }
  }, [projects, activeProject]);

  // Sauvegarde automatique du brouillon local
  useEffect(() => {
    if (activeProject) {
      localStorage.setItem(`cetelec_draft_${activeProject.id}`, JSON.stringify(activeProject));
    }
  }, [activeProject]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleLoadProject = async (id) => {
    const data = await loadProject(id);
    if (data) {
      const savedDraft = localStorage.getItem(`cetelec_draft_${id}`);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (JSON.stringify(draft) !== JSON.stringify(data)) {
            if (confirm("Une version non sauvegardée de ce projet a été trouvée. Voulez-vous la restaurer ?")) {
              setActiveProject(draft);
            }
          } else {
            localStorage.removeItem(`cetelec_draft_${id}`);
          }
        } catch (e) {
          localStorage.removeItem(`cetelec_draft_${id}`);
        }
      }
      
      if (data.sections?.length > 0) setSelectedSectionId(data.sections[0].id);
      setView('editor');
      const url = new URL(window.location);
      url.searchParams.set('projectId', id);
      window.history.pushState({}, '', url);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (modalData.name) {
      const newProj = await createProject(modalData.name);
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
    if (confirm('⚠️ Supprimer définitivement ce projet ?')) {
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
    const body = type === '1'
      ? { type: 'count', text, count }
      : { type: 'sequence', prefix, start, end };
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

  const pages = useMemo(() => calculatePages(activeProject), [activeProject]);

  return (
    <div className="app-container">
      <Header onHome={() => {
        setView('dashboard');
        const url = new URL(window.location);
        url.searchParams.delete('projectId');
        window.history.pushState({}, '', url);
      }} project={activeProject} view={view} />

      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {view === 'dashboard' ? (
          <Dashboard
            projects={projects}
            onCreate={() => { setModalType('createProject'); setModalData({ name: '' }); }}
            onLoad={handleLoadProject}
            onDelete={handleDeleteProject}
            onDuplicate={duplicateProject}
            onRename={(id, name) => { setModalType('renameProject'); setModalData({ id, name }); }}
          />
        ) : (
          <div className="editor-layout">
            <Sidebar
              activeTab={activeTab} setActiveTab={setActiveTab}
              project={activeProject}
              activeSection={activeProject?.sections?.find(s => s.id === selectedSectionId)}
              selectedSectionId={selectedSectionId}
              setSelectedSectionId={setSelectedSectionId}
              onAddLabel={async (sectionId, text) => {
                if (await addLabel(sectionId, text)) await loadProject(activeProject.id);
              }}
              onBatch={() => {
                setModalType('batch');
                setModalData({ type: '1', text: '', count: 10, prefix: 'F', start: 1, end: 10 });
              }}
              onUpdateLabel={(id, text) => { setModalType('editLabel'); setModalData({ id, text }); }}
              onDeleteLabel={async (id) => {
                if (await deleteLabel(id)) await loadProject(activeProject.id);
              }}
              onUpdateSection={(id, updates) => {
                setActiveProject(prev => ({
                  ...prev,
                  sections: prev.sections.map(s => s.id === id ? { ...s, ...updates } : s)
                }));
              }}
              onUpdateProjectConfig={(updates) => {
                setActiveProject(prev => ({ ...prev, ...updates }));
              }}
              onSave={async () => {
                if (await persistProject(activeProject)) {
                  localStorage.removeItem(`cetelec_draft_${activeProject.id}`);
                  alert("Projet sauvegardé avec succès !");
                }
              }}
              onDuplicateSection={async (id) => {
                if (await duplicateSection(id)) await loadProject(activeProject.id);
              }}
              onDeleteSection={async (id) => {
                if (confirm('Supprimer cette catégorie et toutes ses étiquettes ?')) {
                  if (await deleteSection(id)) await loadProject(activeProject.id);
                }
              }}
              onCreateSection={() => { setModalType('createSection'); setModalData({ name: '' }); }}
              unit={unit} setUnit={setUnit}
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
            />
          </div>
        )}
      </main>

      <ProjectModals 
        modalType={modalType} 
        setModalType={setModalType}
        modalData={modalData}
        setModalData={setModalData}
        handlers={{
          handleCreateProject,
          handleRenameProject,
          handleCreateSection,
          handleUpdateLabel,
          handleBatchGenerate
        }}
      />
    </div>
  );
}

export default App;