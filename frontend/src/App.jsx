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
  const [activeTab, setActiveTab] = useState('editor');
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
        <div className="logo-text">
          <LayoutGrid size={28} color="#2563eb" />
          CETELEC <span style={{color: '#94a3b8', fontWeight: 500}}>LabelGen</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
              Projets Actifs
              <button onClick={createProject} className="btn-ghost" style={{padding: '4px', borderRadius: '50%'}}><Plus size={16}/></button>
            </div>
            {isLoading ? <p style={{fontSize: '0.8rem', color: '#94a3b8'}}>Chargement des projets...</p> : (
              <div className="project-select-wrapper" style={{position: 'relative'}}>
                <select 
                  className="input-field" 
                  value={activeProject?.id || ''} 
                  onChange={(e) => loadProject(e.target.value)}
                  style={{ width: '100%', marginBottom: '1rem', appearance: 'none' }}
                >
                  <option value="">-- Choisir un chantier --</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ChevronDown size={16} style={{position: 'absolute', right: '12px', top: '12px', pointerEvents: 'none', color: '#64748b'}} />
              </div>
            )}
          </div>

          {activeProject && (
            <>
              <div className="tabs">
                <div className={`tab ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>Édition Rapid</div>
                <div className={`tab ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>Configuration</div>
              </div>

              {activeTab === 'editor' ? (
                <div className="tab-content" style={{animation: 'fadeIn 0.2s'}}>
                  <div className="input-field">
                    <label>Catégorie Active</label>
                    <div style={{position: 'relative'}}>
                      <select 
                        value={selectedSectionId || ''} 
                        onChange={(e) => setSelectedSectionId(e.target.value)}
                        style={{appearance: 'none'}}
                      >
                        <option value="">-- Choisir une catégorie --</option>
                        {activeProject.sections?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <ChevronDown size={16} style={{position: 'absolute', right: '12px', top: '12px', pointerEvents: 'none', color: '#64748b'}} />
                    </div>
                  </div>

                  {activeSection && (
                    <div className="quick-add">
                      <div className="input-field" style={{ marginBottom: '1.5rem' }}>
                        <label>Saisie rapide (Appuyez sur Entrée)</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Disjoncteur Q1" 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addLabel(activeSection.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                      </div>
                      <div className="label-list">
                        <div className="sidebar-title">Logs de saisie ({activeSection.name})</div>
                        <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                          {activeSection.labels?.length === 0 && <p style={{fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '1rem'}}>Aucune étiquette</p>}
                          {activeSection.labels?.map(l => (
                            <div key={l.id} className="label-pill" style={{animation: 'fadeIn 0.2s'}}>
                              <span>{l.text}</span>
                              <button onClick={() => deleteLabel(l.id)} className="btn-ghost" style={{color: '#ef4444', padding: '4px'}}><X size={14}/></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!activeSection && (
                    <div style={{textAlign: 'center', padding: '2rem', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #e2e8f0'}}>
                       <p style={{fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem'}}>Ajoutez une catégorie pour commencer la saisie</p>
                       <button className="btn btn-primary" onClick={createSection} style={{ width: '100%' }}>
                        <Plus size={18} /> Créer une catégorie
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="tab-content" style={{animation: 'fadeIn 0.2s'}}>
                  <div className="sidebar-title">Paramètres des sections</div>
                  {activeProject.sections?.map(s => (
                    <div key={s.id} className="config-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <strong style={{fontSize: '0.9rem', color: '#1e293b'}}>{s.name}</strong>
                        <div style={{display: 'flex', gap: '4px'}}>
                           <button onClick={() => updateSection(s.id, {order: s.order - 1})} className="btn-ghost" title="Monter"><ArrowUp size={14}/></button>
                           <button onClick={() => updateSection(s.id, {order: s.order + 1})} className="btn-ghost" title="Descendre"><ArrowDown size={14}/></button>
                           <button onClick={() => deleteSection(s.id)} className="btn-ghost" style={{color: '#ef4444'}} title="Supprimer"><Trash2 size={14}/></button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                         <div className="input-field">
                            <label>Largeur (mm)</label>
                            <input type="number" step="0.5" value={s.defaultWidth} onChange={(e) => updateSection(s.id, {defaultWidth: e.target.value})} />
                         </div>
                         <div className="input-field">
                            <label>Hauteur (mm)</label>
                            <input type="number" step="0.5" value={s.defaultHeight} onChange={(e) => updateSection(s.id, {defaultHeight: e.target.value})} />
                         </div>
                         <div className="input-field">
                            <label>Couleur Fond</label>
                            <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                              <input type="color" value={s.bgColor} onChange={(e) => updateSection(s.id, {bgColor: e.target.value})} style={{padding: '0', height: '32px', width: '40px', border: 'none'}} />
                              <span style={{fontSize: '0.75rem', color: '#64748b'}}>{s.bgColor}</span>
                            </div>
                         </div>
                         <div className="input-field">
                            <label>Police (pt)</label>
                            <input type="number" value={s.fontSize} onChange={(e) => updateSection(s.id, {fontSize: e.target.value})} />
                         </div>
                         <div className="input-field">
                            <label>Bordure (mm)</label>
                            <input type="number" step="0.1" value={s.borderSize} onChange={(e) => updateSection(s.id, {borderSize: e.target.value})} />
                         </div>
                         <div className="input-field">
                            <label>Couleur Bord</label>
                            <input type="color" value={s.borderColor} onChange={(e) => updateSection(s.id, {borderColor: e.target.value})} style={{padding: '0', height: '32px', width: '100%', border: 'none'}} />
                         </div>
                         <div className="input-field" style={{ gridColumn: 'span 2' }}>
                            <label>Style de Police</label>
                            <select value={s.fontFamily} onChange={(e) => updateSection(s.id, {fontFamily: e.target.value})}>
                               <option value="sans-serif">Sans-Serif (Moderne)</option>
                               <option value="monospace">Monospace (Technique)</option>
                               <option value="serif">Serif (Classique)</option>
                            </select>
                         </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-ghost" onClick={createSection} style={{ width: '100%', border: '1px dashed #cbd5e1', marginBottom: '2rem' }}>
                     <Plus size={16}/> Ajouter une catégorie
                  </button>
                  
                  <div className="config-group" style={{marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem'}}>
                    <div className="sidebar-title">Identité Visuelle</div>
                    <div className="input-field">
                      <label>Logo de l'entreprise (A4)</label>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} style={{fontSize: '0.75rem', padding: '0.5rem'}} />
                    </div>
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
                <h2 style={{fontSize: '18pt', fontWeight: '900', color: '#0f172a'}}>{activeProject?.name || "Nouveau Projet"}</h2>
                <p style={{fontSize: '9pt', color: '#64748b', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Étiquetage Armoire Électrique</p>
              </div>
              {logoBase64 ? (
                <img src={logoBase64} alt="Project Logo" className="project-logo" />
              ) : (
                <div style={{fontSize: '10pt', fontWeight: '800', border: '2px solid #0f172a', padding: '8px 12px', color: '#0f172a'}}>CETELEC SA</div>
              )}
            </header>

            <div className="sheet-content">
              {activeProject?.sections?.map(section => (
                /* On n'affiche le groupe que s'il y a des étiquettes */
                section.labels?.length > 0 && (
                  <div key={section.id} className="sheet-category-group">
                    <div className="category-label-title no-print">{section.name}</div>
                    {section.labels?.map(label => (
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
                          fontFamily: section.fontFamily,
                          fontWeight: '600'
                        }}
                      >
                        {label.text}
                      </div>
                    ))}
                  </div>
                )
              ))}
            </div>

            {!activeProject && (
              <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8'}}>
                <div style={{padding: '2rem', background: 'white', borderRadius: '50%', marginBottom: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.05)'}}>
                   <LayoutGrid size={64}/>
                </div>
                <h3 style={{fontWeight: 700, color: '#1e293b'}}>Prêt pour l'impression</h3>
                <p style={{fontSize: '0.875rem', color: '#64748b'}}>Sélectionnez un chantier pour commencer</p>
              </div>
            )}
            
            {activeProject && activeProject.sections?.every(s => s.labels?.length === 0) && (
              <div style={{width: '100%', textAlign: 'center', marginTop: '50mm', color: '#cbd5e1', fontStyle: 'italic'}}>
                La feuille est vide. Ajoutez des étiquettes dans l'onglet Édition.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
