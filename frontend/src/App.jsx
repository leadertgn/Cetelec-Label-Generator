import React, { useState, useEffect } from 'react';
import { 
  Plus, Printer, FolderOpen, Tag, Settings, Save, 
  Trash2, Type, Maximize2, Palette, Image as ImageIcon,
  ChevronRight, LayoutGrid, Ruler, Edit3, ArrowUp, ArrowDown,
  ChevronDown, X, Edit
} from 'lucide-react';

function App() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'config'
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data || []);
      }
    } catch (err) {
      console.error("Erreur API projets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProject = async (id) => {
    if (!id) {
      setActiveProject(null);
      return;
    }
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setActiveProject(data);
        if (data.sections?.length > 0 && !selectedSectionId) {
          setSelectedSectionId(data.sections[0].id);
        }
      }
    } catch (err) {
      console.error("Erreur chargement projet:", err);
    }
  };

  const createProject = async () => {
    const name = prompt("Nom du nouveau projet :");
    if (!name) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const newProj = await res.json();
        setProjects([newProj, ...projects]);
        loadProject(newProj.id);
      }
    } catch (err) {
      console.error("Erreur création projet:", err);
    }
  };

  const renameProject = async (id, currentName) => {
    const newName = prompt("Nouveau nom du projet :", currentName);
    if (!newName || newName === currentName) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        const updated = await res.json();
        setProjects(projects.map(p => p.id === id ? { ...p, name: newName } : p));
        if (activeProject?.id === id) {
          setActiveProject({ ...activeProject, name: newName });
        }
      }
    } catch (err) {
      console.error("Erreur renommage projet:", err);
    }
  };

  const createSection = async () => {
    if (!activeProject) return;
    const name = prompt("Nom de la catégorie (ex: Disjoncteurs, Fusibles) :");
    if (!name) return;
    try {
      const res = await fetch(`/api/projects/${activeProject.id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name,
          defaultWidth: 20,
          defaultHeight: 15,
          order: activeProject.sections?.length || 0
        })
      });
      if (res.ok) {
        loadProject(activeProject.id);
      }
    } catch (err) {
      console.error("Erreur création section:", err);
    }
  };

  const deleteSection = async (id) => {
    if (!confirm("Supprimer cette catégorie et toutes ses étiquettes ?")) return;
    try {
      await fetch(`/api/sections/${id}`, { method: 'DELETE' });
      loadProject(activeProject.id);
    } catch (err) { console.error(err); }
  };

  const updateSection = async (id, updates) => {
    try {
      const res = await fetch(`/api/sections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setActiveProject(prev => ({
          ...prev,
          sections: prev.sections.map(s => s.id === id ? { ...s, ...updated } : s)
        }));
      }
    } catch (err) { console.error(err); }
  };

  const addLabel = async (sectionId, text) => {
    if (!text) return;
    try {
      const res = await fetch(`/api/sections/${sectionId}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        loadProject(activeProject.id);
      }
    } catch (err) { console.error(err); }
  };

  const deleteLabel = async (id) => {
    try {
      await fetch(`/api/labels/${id}`, { method: 'DELETE' });
      loadProject(activeProject.id);
    } catch (err) { console.error(err); }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const activeSection = activeProject?.sections?.find(s => s.id === selectedSectionId);

  return (
    <div className="app">
      <header className="header no-print">
        <div className="logo-text">CETELEC <span style={{color: '#94a3b8', fontWeight: 400}}>LabelGen</span></div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeProject && (
            <button className="btn btn-ghost" onClick={() => renameProject(activeProject.id, activeProject.name)}>
              <Edit size={16} /> Renommer
            </button>
          )}
          <button className="btn btn-primary" onClick={() => window.print()}>
            <Printer size={18} /> Imprimer A4
          </button>
        </div>
      </header>

      <main className="main">
        <aside className="sidebar no-print">
          <div className="sidebar-section">
            <div className="sidebar-title">
              Projets
              <button onClick={createProject} className="btn-ghost" style={{padding: '4px'}}><Plus size={16}/></button>
            </div>
            {isLoading ? <p>Chargement...</p> : (
              <select 
                className="input-field" 
                value={activeProject?.id || ''} 
                onChange={(e) => loadProject(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)' }}
              >
                <option value="">Sélectionner un projet</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>

          {activeProject && (
            <>
              <div className="tabs">
                <div className={`tab ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>Édition</div>
                <div className={`tab ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>Configuration</div>
              </div>

              {activeTab === 'editor' ? (
                <div className="tab-content">
                  <div className="input-field">
                    <label>Catégorie Active</label>
                    <select 
                      value={selectedSectionId || ''} 
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                    >
                      <option value="">-- Choisir une catégorie --</option>
                      {activeProject.sections?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>

                  {activeSection && (
                    <div className="quick-add">
                      <div className="input-field" style={{ marginBottom: '1rem' }}>
                        <label>Nouvelle Étiquette</label>
                        <input 
                          type="text" 
                          placeholder="Texte + Entrée" 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addLabel(activeSection.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                      </div>
                      <div className="label-list">
                        <div className="sidebar-title">Liste en temps réel ({activeSection.name})</div>
                        {activeSection.labels?.map(l => (
                          <div key={l.id} className="label-pill">
                            <span>{l.text}</span>
                            <button onClick={() => deleteLabel(l.id)} className="btn-ghost" style={{color: '#ef4444', padding: '4px'}}><X size={14}/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {!activeSection && (
                    <button className="btn btn-primary" onClick={createSection} style={{ width: '100%', marginTop: '1rem' }}>
                      <Plus size={18} /> Créer une catégorie
                    </button>
                  )}
                </div>
              ) : (
                <div className="tab-content">
                  <div className="sidebar-title">Réglages des catégories</div>
                  {activeProject.sections?.map(s => (
                    <div key={s.id} className="config-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <strong style={{fontSize: '0.9rem'}}>{s.name}</strong>
                        <div style={{display: 'flex', gap: '5px'}}>
                           <button onClick={() => updateSection(s.id, {order: s.order - 1})} className="btn-ghost" style={{padding: '2px'}}><ArrowUp size={14}/></button>
                           <button onClick={() => updateSection(s.id, {order: s.order + 1})} className="btn-ghost" style={{padding: '2px'}}><ArrowDown size={14}/></button>
                           <button onClick={() => deleteSection(s.id)} className="btn-ghost" style={{padding: '2px', color: '#ef4444'}}><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                         <div className="input-field">
                            <label>Larg (mm)</label>
                            <input type="number" step="0.5" value={s.defaultWidth} onChange={(e) => updateSection(s.id, {defaultWidth: e.target.value})} />
                         </div>
                         <div className="input-field">
                            <label>Haut (mm)</label>
                            <input type="number" step="0.5" value={s.defaultHeight} onChange={(e) => updateSection(s.id, {defaultHeight: e.target.value})} />
                         </div>
                         <div className="input-field">
                            <label>Fond</label>
                            <input type="color" value={s.bgColor} onChange={(e) => updateSection(s.id, {bgColor: e.target.value})} />
                         </div>
                         <div className="input-field">
                            <label>Texte</label>
                            <input type="color" value={s.textColor} onChange={(e) => updateSection(s.id, {textColor: e.target.value})} />
                         </div>
                         <div className="input-field">
                            <label>Police (pt)</label>
                            <input type="number" value={s.fontSize} onChange={(e) => updateSection(s.id, {fontSize: e.target.value})} />
                         </div>
                         <div className="input-field" style={{ gridColumn: 'span 2' }}>
                            <label>Famille de police</label>
                            <select value={s.fontFamily} onChange={(e) => updateSection(s.id, {fontFamily: e.target.value})}>
                               <option value="sans-serif">Sans-Serif (Standard)</option>
                               <option value="monospace">Monospace (Code)</option>
                               <option value="serif">Serif (Classique)</option>
                            </select>
                         </div>
                         <div className="input-field">
                            <label>Bordure (mm)</label>
                            <input type="number" step="0.1" value={s.borderSize} onChange={(e) => updateSection(s.id, {borderSize: e.target.value})} />
                         </div>
                         <div className="input-field">
                            <label>Couleur Bordure</label>
                            <input type="color" value={s.borderColor} onChange={(e) => updateSection(s.id, {borderColor: e.target.value})} />
                         </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-ghost" onClick={createSection} style={{ width: '100%', border: '1px dashed var(--border)' }}>
                     <Plus size={16}/> Nouvelle catégorie
                  </button>
                  
                  <div className="config-group" style={{marginTop: '2rem'}}>
                    <div className="sidebar-title">Logo du Projet</div>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{fontSize: '0.75rem'}} />
                  </div>
                </div>
              )}
            </>
          )}
        </aside>

        <section className="canvas">
          <div className="sheet">
            <header className="sheet-header">
              <div>
                <h2 style={{fontSize: '14pt', fontWeight: 'bold'}}>{activeProject?.name || "Nouveau Projet"}</h2>
                <p style={{fontSize: '8pt', color: '#64748b'}}>Plan d'étiquetage Électrique</p>
              </div>
              {logoBase64 ? (
                <img src={logoBase64} alt="Project Logo" className="project-logo" />
              ) : (
                <div style={{fontSize: '8pt', color: '#cbd5e1', border: '1px dashed #cbd5e1', padding: '10px'}}>CETELEC SA</div>
              )}
            </header>

            <div className="sheet-content">
              {activeProject?.sections?.map(section => {
                if (!section.labels || section.labels.length === 0) return null;
                return (
                  <div key={section.id} className="sheet-category-group">
                    <div className="category-label-title no-print">{section.name}</div>
                    {section.labels.map(label => (
                      <div 
                        key={label.id} 
                        className="label"
                        style={{
                          width: `${section.defaultWidth}mm`,
                          height: `${section.defaultHeight}mm`,
                          backgroundColor: section.bgColor,
                          color: section.textColor,
                          border: `${section.borderSize}mm solid ${section.borderColor}`,
                          borderRadius: `${section.borderRadius}mm`,
                          fontSize: `${section.fontSize}pt`,
                          fontFamily: section.fontFamily
                        }}
                      >
                        {label.text}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {!activeProject && (
              <div style={{flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1'}}>
                <LayoutGrid size={64}/>
                <p style={{marginTop: '1rem'}}>Sélectionnez un projet pour commencer</p>
              </div>
            )}
            
            {activeProject && activeProject.sections?.length === 0 && (
              <div style={{width: '100%', textAlign: 'center', marginTop: '50mm', color: '#cbd5e1'}}>
                Ajoutez une section pour créer des étiquettes
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
