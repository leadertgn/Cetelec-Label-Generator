import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import PreviewSheet from './components/PreviewSheet';
import { apiFetch } from './utils/api';

function App() {
  const [deviceId] = useState(() => {
    let id = localStorage.getItem('cetelec_device_id');
    if (!id) {
      id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('cetelec_device_id', id);
    }
    return id;
  });

  const [view, setView] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [showCuttingMarks, setShowCuttingMarks] = useState(false);
  const [unit, setUnit] = useState('mm');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { apiFetchProjects(); }, []);
  useEffect(() => {
    document.title = activeProject ? `LabelGen - ${activeProject.name}` : "CETELEC LabelGen";
  }, [activeProject]);

  const apiFetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/projects', {}, deviceId);
      if (res.ok) setProjects(await res.json());
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const loadProject = async (id) => {
    try {
      const res = await apiFetch(`/api/projects/${id}`, {}, deviceId);
      if (res.ok) {
        const data = await res.json();
        setActiveProject(data);
        if (data.sections?.length > 0) setSelectedSectionId(data.sections[0].id);
        setView('editor');
      }
    } catch (err) { console.error(err); }
  };

  const createProject = async () => {
    const name = prompt("Nom du nouveau projet :");
    if (!name) return;
    try {
      const res = await apiFetch('/api/projects', { method: 'POST', body: JSON.stringify({ name }) }, deviceId);
      if (res.ok) {
        const newProj = await res.json();
        setProjects([newProj, ...projects]);
        loadProject(newProj.id);
      }
    } catch (err) { console.error(err); }
  };

  const renameProject = async (id, currentName) => {
    const newName = prompt("Nouveau nom du projet :", currentName);
    if (!newName || newName === currentName) return;
    try {
      const res = await apiFetch(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify({ name: newName }) }, deviceId);
      if (res.ok) {
        setProjects(projects.map(p => p.id === id ? { ...p, name: newName } : p));
        if (activeProject?.id === id) setActiveProject({ ...activeProject, name: newName });
      }
    } catch (err) { console.error(err); }
  };

  const deleteProject = async (id) => {
    if (!confirm("⚠️ Supprimer définitivement ce projet ?")) return;
    try {
      const res = await apiFetch(`/api/projects/${id}`, { method: 'DELETE' }, deviceId);
      if (res.ok) {
        setProjects(projects.filter(p => p.id !== id));
        if (activeProject?.id === id) { setView('dashboard'); setActiveProject(null); }
      }
    } catch (err) { console.error(err); }
  };

  const createSection = async () => {
    const name = prompt("Nom de la catégorie :");
    if (!name) return;
    try {
      const res = await apiFetch(`/api/sections/projects/${activeProject.id}/sections`, {
        method: 'POST',
        body: JSON.stringify({ name, defaultWidth: 20, defaultHeight: 15 })
      }, deviceId);
      if (res.ok) loadProject(activeProject.id);
    } catch (err) { console.error(err); }
  };

  const updateSection = async (id, updates) => {
    try {
      const res = await apiFetch(`/api/sections/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }, deviceId);
      if (res.ok) {
        const updated = await res.json();
        setActiveProject(prev => ({
          ...prev,
          sections: prev.sections.map(s => s.id === id ? { ...s, ...updated } : s)
        }));
      }
    } catch (err) { console.error(err); }
  };

  const deleteSection = async (id) => {
    if (!confirm("Supprimer cette catégorie ?")) return;
    try {
      await apiFetch(`/api/sections/${id}`, { method: 'DELETE' }, deviceId);
      loadProject(activeProject.id);
    } catch (err) { console.error(err); }
  };

  const duplicateSection = async (id) => {
    try {
      const res = await apiFetch(`/api/sections/${id}/duplicate`, { method: 'POST' }, deviceId);
      if (res.ok) loadProject(activeProject.id);
    } catch (err) { console.error(err); }
  };

  const addLabel = async (sectionId, text) => {
    try {
      const res = await apiFetch(`/api/sections/${sectionId}/labels`, { method: 'POST', body: JSON.stringify({ text }) }, deviceId);
      if (res.ok) loadProject(activeProject.id);
    } catch (err) { console.error(err); }
  };

  const deleteLabel = async (id) => {
    try {
      await apiFetch(`/api/sections/labels/${id}`, { method: 'DELETE' }, deviceId);
      loadProject(activeProject.id);
    } catch (err) { console.error(err); }
  };

  const updateLabel = async (id, current) => {
    const text = prompt("Modifier :", current);
    if (!text) return;
    try {
      const res = await apiFetch(`/api/sections/labels/${id}`, { method: 'PATCH', body: JSON.stringify({ text }) }, deviceId);
      if (res.ok) loadProject(activeProject.id);
    } catch (err) { console.error(err); }
  };

  const batchGenerate = async (sectionId) => {
    const type = prompt("1: Multiple, 2: Séquence", "1");
    let body = {};
    if (type === "1") {
      const text = prompt("Texte :", "D1");
      const count = prompt("Nombre :", "10");
      body = { type: 'count', text, count };
    } else {
      const prefix = prompt("Préfixe :", "F");
      const start = prompt("Début :", "1");
      const end = prompt("Fin :", "10");
      body = { type: 'sequence', prefix, start, end };
    }
    await apiFetch(`/api/sections/${sectionId}/batch`, { method: 'POST', body: JSON.stringify(body) }, deviceId);
    loadProject(activeProject.id);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const getPages = () => {
    if (!activeProject?.sections) return [];
    const pages = [];
    let currentPage = { sections: [] };
    const PAGE_WIDTH = 180, PAGE_HEIGHT = 260; // Increased available height
    const GAP = 3; // Matches CSS gap
    let currentY = 0;

    activeProject.sections.forEach(section => {
      const labels = section.labels || [];
      if (labels.length === 0) return;

      const labelW = section.defaultWidth + GAP, labelH = section.defaultHeight + GAP;
      const labelsPerRow = Math.floor(PAGE_WIDTH / labelW);
      const sectionHeaderHeight = 8;
      
      if (currentY + sectionHeaderHeight + labelH > PAGE_HEIGHT) {
        pages.push(currentPage); currentPage = { sections: [] }; currentY = 0;
      }

      let sectionInPage = { ...section, labels: [] };
      currentY += sectionHeaderHeight;

      labels.forEach(label => {
        const isFirstInRow = sectionInPage.labels.length % labelsPerRow === 0;
        if (isFirstInRow && currentY + labelH > PAGE_HEIGHT) {
          currentPage.sections.push(sectionInPage);
          pages.push(currentPage); currentPage = { sections: [] };
          sectionInPage = { ...section, labels: [label] };
          currentY = sectionHeaderHeight + labelH;
        } else {
          if (isFirstInRow) currentY += labelH;
          sectionInPage.labels.push(label);
        }
      });
      if (sectionInPage.labels.length > 0) currentPage.sections.push(sectionInPage);
    });
    if (currentPage.sections.length > 0) pages.push(currentPage);
    return pages.length > 0 ? pages : [{ sections: [] }];
  };

  return (
    <div className="app-container">
      <Header onHome={() => setView('dashboard')} project={activeProject} view={view} />
      
      <main style={{flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
        {view === 'dashboard' ? (
          <Dashboard 
            projects={projects} 
            onCreate={createProject} 
            onLoad={loadProject} 
            onDelete={deleteProject} 
            onRename={renameProject}
          />
        ) : (
          <div className="editor-layout">
            <Sidebar 
              activeTab={activeTab} setActiveTab={setActiveTab}
              project={activeProject} activeSection={activeProject.sections.find(s => s.id === selectedSectionId)}
              selectedSectionId={selectedSectionId} setSelectedSectionId={setSelectedSectionId}
              onAddLabel={addLabel} onBatch={batchGenerate} onUpdateLabel={updateLabel} onDeleteLabel={deleteLabel}
              onUpdateSection={updateSection} onDuplicateSection={duplicateSection} onDeleteSection={deleteSection} onCreateSection={createSection}
              unit={unit} setUnit={setUnit} showCuttingMarks={showCuttingMarks} setShowCuttingMarks={setShowCuttingMarks} onLogoUpload={handleLogoUpload}
            />
            <PreviewSheet 
              pages={getPages()} 
              project={activeProject} 
              logoBase64={logoBase64} 
              showCuttingMarks={showCuttingMarks} 
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
