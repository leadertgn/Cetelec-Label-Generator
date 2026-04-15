import React, { useState, useEffect } from 'react';
import { Plus, Printer, FolderOpen, Tag, Settings, Save, Trash2, Edit3, Type, Maximize2 } from 'lucide-react';

function App() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error("Erreur chargement projets", err);
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
      const newProj = await res.json();
      setProjects([newProj, ...projects]);
      loadProject(newProj.id);
    } catch (err) {
      console.error("Erreur création projet", err);
    }
  };

  const loadProject = async (id) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      const data = await res.json();
      setActiveProject(data);
      setActiveSection(data.sections?.[0] || null);
    } catch (err) {
      console.error("Erreur chargement projet", err);
    }
  };

  const createSection = async () => {
    if (!activeProject) return;
    const name = prompt("Nom de la section (ex: Disjoncteurs) :");
    if (!name) return;
    try {
      const res = await fetch(`/api/projects/${activeProject.id}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name,
          defaultWidth: 20,
          defaultHeight: 15,
          bgColor: '#ffffff',
          textColor: '#000000',
          borderSize: 1,
          borderColor: '#000000',
          borderRadius: 2
        })
      });
      const newSection = await res.json();
      const updatedProject = {
        ...activeProject,
        sections: [...(activeProject.sections || []), { ...newSection, labels: [] }]
      };
      setActiveProject(updatedProject);
      setActiveSection(newSection);
    } catch (err) {
      console.error("Erreur création section", err);
    }
  };

  const createLabel = async (sectionId) => {
    const text = prompt("Texte de l'étiquette :");
    if (!text) return;
    try {
      const res = await fetch(`/api/sections/${sectionId}/labels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const newLabel = await res.json();
      
      const updatedSections = activeProject.sections.map(sec => {
        if (sec.id === sectionId) {
          return { ...sec, labels: [...sec.labels, newLabel] };
        }
        return sec;
      });
      
      setActiveProject({ ...activeProject, sections: updatedSections });
    } catch (err) {
      console.error("Erreur création étiquette", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="app-container">
      <header className="header no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1d4ed8', letterSpacing: '-0.025em' }}>
            CETELEC <span style={{ fontWeight: '400', color: '#64748b' }}>Labels</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handlePrint} className="btn-print" style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.625rem 1.25rem', background: '#2563eb', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
          }}>
            <Printer size={18} />
            Imprimer A4
          </button>
        </div>
      </header>

      <main className="main-content">
        <aside className="sidebar no-print">
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Projets</h2>
              <button onClick={createProject} className="icon-btn">
                <Plus size={16} />
              </button>
            </div>
            <div className="project-list">
              {projects.map(proj => (
                <div 
                  key={proj.id} 
                  className={`project-item ${activeProject?.id === proj.id ? 'active' : ''}`}
                  onClick={() => loadProject(proj.id)}
                  style={{
                    padding: '0.625rem 0.875rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '0.375rem',
                    background: activeProject?.id === proj.id ? '#eff6ff' : 'transparent',
                    color: activeProject?.id === proj.id ? '#1d4ed8' : '#475569',
                    fontWeight: activeProject?.id === proj.id ? '600' : '400',
                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                  }}
                >
                  <FolderOpen size={18} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.name}</span>
                </div>
              ))}
            </div>
          </div>

          {activeProject && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>Sections</h2>
                <button onClick={createSection} className="icon-btn">
                  <Plus size={16} />
                </button>
              </div>
              <div className="section-list">
                {activeProject.sections?.map(sec => (
                  <div key={sec.id} style={{ marginBottom: '1rem' }}>
                    <div 
                      onClick={() => setActiveSection(sec)}
                      style={{
                        padding: '0.625rem 0.875rem', borderRadius: '8px', cursor: 'pointer',
                        background: activeSection?.id === sec.id ? '#f1f5f9' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        border: activeSection?.id === sec.id ? '1px solid #cbd5e1' : '1px solid transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Tag size={18} color="#64748b" />
                        <span style={{ fontSize: '0.875rem' }}>{sec.name}</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); createLabel(sec.id); }} className="add-label-btn">
                         <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection && (
            <div className="config-panel" style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Settings size={16} /> Style: {activeSection.name}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="input-group">
                  <label>Largeur (mm)</label>
                  <input type="number" defaultValue={activeSection.defaultWidth} />
                </div>
                <div className="input-group">
                  <label>Hauteur (mm)</label>
                  <input type="number" defaultValue={activeSection.defaultHeight} />
                </div>
              </div>
            </div>
          )}
        </aside>

        <section className="canvas-area">
          <div className="a4-sheet">
            {activeProject?.sections?.map(section => (
              section.labels.map(label => (
                <div 
                  key={label.id} 
                  className="label-item"
                  style={{
                    width: `${section.defaultWidth}mm`,
                    height: `${section.defaultHeight}mm`,
                    backgroundColor: section.bgColor,
                    color: section.textColor,
                    border: `${section.borderSize}mm solid ${section.borderColor}`,
                    borderRadius: `${section.borderRadius}mm`,
                    fontSize: '8pt',
                    padding: '1mm'
                  }}
                >
                  {label.text}
                </div>
              ))
            ))}
            
            {(!activeProject || (activeProject.sections?.length === 0)) && (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <Maximize2 size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                <p>Prêt pour l'impression A4</p>
                <p style={{ fontSize: '0.875rem' }}>Créez un projet et des sections pour commencer.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <style>{`
        .icon-btn {
          padding: 4px; border-radius: 6px; border: 1px solid #e2e8f0; cursor: pointer; background: white; color: #64748b;
          transition: all 0.2s;
        }
        .icon-btn:hover { background: #f8fafc; color: #1e293b; border-color: #cbd5e1; }
        .add-label-btn {
          background: #2563eb; color: white; border: none; border-radius: 4px; width: 20px; height: 20px;
          display: flex; alignItems: center; justifyContent: center; cursor: pointer; opacity: 0.8;
        }
        .add-label-btn:hover { opacity: 1; }
        .input-group label { display: block; font-size: 0.7rem; color: #64748b; margin-bottom: 0.25rem; text-transform: uppercase; font-weight: 600; }
        .input-group input { width: 100%; padding: 0.375rem; border-radius: 4px; border: 1px solid #e2e8f0; font-size: 0.875rem; }
        
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default App;
