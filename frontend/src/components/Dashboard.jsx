import React from 'react';
import { Plus, Trash2, Edit3, FolderOpen } from 'lucide-react';

const Dashboard = ({ projects, onCreate, onLoad, onDelete, onRename }) => (
  <div className="dashboard">
    <div className="dashboard-header">
      <h1 style={{fontSize: '1.5rem', fontWeight: 800}}>Mes Projets</h1>
      <button className="btn btn-primary" onClick={onCreate}>
        <Plus size={18} /> Nouveau Projet
      </button>
    </div>

    <div className="project-list">
      {projects.length === 0 ? (
        <div style={{padding: '3rem', textAlign: 'center', color: '#94a3b8'}}>
          Aucun projet. Créez votre premier projet pour commencer.
        </div>
      ) : (
        projects.map(p => (
          <div key={p.id} className="project-item">
            <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
              <div style={{color: '#2563eb'}}><FolderOpen size={24}/></div>
              <div>
                <div style={{fontWeight: 700}}>{p.name}</div>
                <div style={{fontSize: '0.75rem', color: '#94a3b8'}}>
                  {p._count?.sections || 0} catégories • {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div style={{display: 'flex', gap: '8px'}}>
              <button className="btn btn-primary" onClick={() => onLoad(p.id)}>
                Ouvrir
              </button>
              <button className="btn btn-ghost" onClick={() => onRename(p.id, p.name)} title="Renommer">
                <Edit3 size={18} />
              </button>
              <button className="btn btn-danger" onClick={() => onDelete(p.id)} title="Supprimer">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

export default Dashboard;
