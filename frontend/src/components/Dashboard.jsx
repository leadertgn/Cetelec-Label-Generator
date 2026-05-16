import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, FolderOpen, ChevronLeft, ChevronRight, Copy } from 'lucide-react';

const Dashboard = ({ projects, onCreate, onLoad, onDelete, onRename, onDuplicate }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 6;
  
  const totalPages = Math.ceil(projects.length / projectsPerPage);
  
  // Ensure we don't end up on an empty page if projects are deleted
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [projects.length, totalPages, currentPage]);

  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = projects.slice(indexOfFirstProject, indexOfLastProject);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
          <h1 style={{fontSize: '1.5rem', fontWeight: 800}}>Mes Projets</h1>
          <p style={{fontSize: '0.875rem', color: '#64748b'}}>Gérez vos étiquettes électriques</p>
        </div>
        <button className="btn btn-primary" onClick={onCreate}>
          <Plus size={18} /> Nouveau Projet
        </button>
      </div>

      <div className="project-list" style={{ minHeight: '300px' }}>
        {projects.length === 0 ? (
          <div style={{padding: '3rem', textAlign: 'center', color: '#94a3b8'}}>
            <FolderOpen size={48} style={{margin: '0 auto 1rem', opacity: 0.2}} />
            <p>Aucun projet trouvé. Créez votre premier projet pour commencer.</p>
          </div>
        ) : (
          <>
            {currentProjects.map(p => (
              <div key={p.id} className="project-item">
                <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                  <div style={{
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '8px', 
                    background: '#eff6ff', 
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FolderOpen size={20}/>
                  </div>
                  <div>
                    <div style={{fontWeight: 700, color: '#1e293b'}}>{p.name}</div>
                    <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>
                      {p._count?.sections || 0} catégories • Créé le {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div style={{display: 'flex', gap: '8px'}}>
                  <button className="btn btn-primary" onClick={() => onLoad(p.id)} style={{padding: '0.5rem 1.25rem'}}>
                    Ouvrir
                  </button>
                  <button className="btn btn-ghost" onClick={() => onDuplicate(p.id)} title="Dupliquer">
                    <Copy size={18} />
                  </button>
                  <button className="btn btn-ghost" onClick={() => onRename(p.id, p.name)} title="Renommer">
                    <Edit3 size={18} />
                  </button>
                  <button className="btn btn-danger" onClick={() => onDelete(p.id)} title="Supprimer">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: '20px', 
          marginTop: '2rem',
          padding: '1rem',
          borderTop: '1px solid #f1f5f9'
        }}>
          <button 
            className="btn btn-ghost" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1}
            style={{ 
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px'
            }}
          >
            <ChevronLeft size={20} /> Précédent
          </button>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                style={{
                  width: '35px',
                  height: '35px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: currentPage === i + 1 ? 'var(--primary)' : 'var(--border)',
                  background: currentPage === i + 1 ? 'var(--primary)' : 'transparent',
                  color: currentPage === i + 1 ? 'white' : 'var(--text-main)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button 
            className="btn btn-ghost" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage === totalPages}
            style={{ 
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '10px'
            }}
          >
            Suivant <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
