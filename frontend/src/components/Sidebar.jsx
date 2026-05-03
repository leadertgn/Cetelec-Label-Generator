import React from 'react';
import { 
  Plus, LayoutGrid, Ruler, Edit3, Copy, 
  Trash2, X, Palette, Type, Settings, Save 
} from 'lucide-react';
import { mmToCm, cmToMm } from '../utils/api';

const Sidebar = ({ 
  activeTab, setActiveTab, 
  project, activeSection, 
  selectedSectionId, setSelectedSectionId,
  onAddLabel, onBatch, onUpdateLabel, onDeleteLabel,
  onUpdateSection, onUpdateProjectConfig, onSave,
  onDuplicateSection, onDeleteSection, onCreateSection,
  unit, setUnit, onLogoUpload
}) => {
  return (
    <aside className="sidebar no-print">
      <div className="tabs">
        <div className={`tab ${activeTab === 'editor' ? 'active' : ''}`} onClick={() => setActiveTab('editor')}>Édition</div>
        <div className={`tab ${activeTab === 'config' ? 'active' : ''}`} onClick={() => setActiveTab('config')}>Configuration</div>
      </div>

      <div style={{flex: 1, overflowY: 'auto'}}>
        {activeTab === 'editor' ? (
          <div className="tab-content">
            <div className="input-field" style={{marginBottom: '1.5rem'}}>
              <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.5rem'}}>Catégorie Active</label>
              <select 
                className="input-field"
                style={{marginBottom: 0}}
                value={selectedSectionId || ''} 
                onChange={(e) => setSelectedSectionId(e.target.value)}
              >
                <option value="">-- Choisir --</option>
                {project.sections?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {activeSection && (
              <div className="quick-add">
                <div style={{marginBottom: '1rem'}}>
                  <label style={{fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.5rem'}}>Nouvelle Étiquette</label>
                  <input 
                    type="text" 
                    placeholder="Texte + Entrée" 
                    className="input-field"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { onAddLabel(activeSection.id, e.target.value); e.target.value = ''; }
                    }}
                  />
                  <button className="btn btn-ghost" style={{width: '100%', border: '1px dashed #e2e8f0'}} onClick={() => onBatch(activeSection.id)}>
                    <LayoutGrid size={14} /> Génération groupée
                  </button>
                </div>

                <div className="label-list" style={{marginTop: '1.5rem'}}>
                  <div style={{fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.5rem'}}>Étiquettes ({activeSection.name})</div>
                  {activeSection.labels?.map(l => (
                    <div key={l.id} className="label-pill">
                      <span style={{fontWeight: 600, fontSize: '0.875rem'}}>{l.text}</span>
                      <div style={{display: 'flex', gap: '4px'}}>
                        <button onClick={() => onUpdateLabel(l.id, l.text)} className="btn-ghost" style={{padding: '4px'}}><Edit3 size={14}/></button>
                        <button onClick={() => onDeleteLabel(l.id)} className="btn-ghost" style={{padding: '4px', color: '#ef4444'}}><X size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}} onClick={onCreateSection}>
              <Plus size={18} /> Créer une catégorie
            </button>
          </div>
        ) : (
          <div className="tab-content">
            <div className="config-card">
              <div style={{marginBottom: '1rem'}}>
                <label style={{fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem'}}>Unité de mesure</label>
                <select className="input-field" style={{marginBottom: 0}} value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="mm">Millimètres (mm)</option>
                  <option value="cm">Centimètres (cm)</option>
                </select>
              </div>
            </div>

            <div className="config-card">
              <div style={{fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase'}}>Mise en page (A4)</div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
                <div className="input-group">
                  <label style={{fontSize: '0.65rem', fontWeight: 700}}>Marge Haut</label>
                  <input type="number" className="input-field" value={project.marginTop} onChange={e => onUpdateProjectConfig({marginTop: parseFloat(e.target.value)})} />
                </div>
                <div className="input-group">
                  <label style={{fontSize: '0.65rem', fontWeight: 700}}>Marge Bas</label>
                  <input type="number" className="input-field" value={project.marginBottom} onChange={e => onUpdateProjectConfig({marginBottom: parseFloat(e.target.value)})} />
                </div>
                <div className="input-group">
                  <label style={{fontSize: '0.65rem', fontWeight: 700}}>Marge Gauche</label>
                  <input type="number" className="input-field" value={project.marginLeft} onChange={e => onUpdateProjectConfig({marginLeft: parseFloat(e.target.value)})} />
                </div>
                <div className="input-group">
                  <label style={{fontSize: '0.65rem', fontWeight: 700}}>Marge Droite</label>
                  <input type="number" className="input-field" value={project.marginRight} onChange={e => onUpdateProjectConfig({marginRight: parseFloat(e.target.value)})} />
                </div>
                <div className="input-group">
                  <label style={{fontSize: '0.65rem', fontWeight: 700}}>En-tête</label>
                  <input type="number" className="input-field" value={project.headerHeight} onChange={e => onUpdateProjectConfig({headerHeight: parseFloat(e.target.value)})} />
                </div>
                <div className="input-group">
                  <label style={{fontSize: '0.65rem', fontWeight: 700}}>Pied de page</label>
                  <input type="number" className="input-field" value={project.footerHeight} onChange={e => onUpdateProjectConfig({footerHeight: parseFloat(e.target.value)})} />
                </div>
              </div>
            </div>

            <div style={{marginTop: '1.5rem'}}>
              {project.sections?.map(s => (
                <div key={s.id} className="config-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                    <strong style={{fontSize: '0.9rem'}}>{s.name}</strong>
                    <div style={{display: 'flex', gap: '5px'}}>
                      <button onClick={() => onDuplicateSection(s.id)} className="btn-ghost" style={{padding: '4px'}}><Copy size={14}/></button>
                      <button onClick={() => onDeleteSection(s.id)} className="btn-ghost" style={{padding: '4px', color: '#ef4444'}}><Trash2 size={14}/></button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="input-group">
                      <label style={{fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase'}}>Largeur ({unit})</label>
                      <input 
                        type="number" step="0.1" className="input-field" style={{marginBottom: 0}}
                        value={unit === 'cm' ? mmToCm(s.defaultWidth) : s.defaultWidth} 
                        onChange={(e) => onUpdateSection(s.id, { defaultWidth: unit === 'cm' ? cmToMm(e.target.value) : e.target.value })} 
                      />
                    </div>
                    <div className="input-group">
                      <label style={{fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase'}}>Hauteur ({unit})</label>
                      <input 
                        type="number" step="0.1" className="input-field" style={{marginBottom: 0}}
                        value={unit === 'cm' ? mmToCm(s.defaultHeight) : s.defaultHeight} 
                        onChange={(e) => onUpdateSection(s.id, { defaultHeight: unit === 'cm' ? cmToMm(e.target.value) : e.target.value })} 
                      />
                    </div>
                    <div className="input-group"><label style={{fontSize: '0.65rem', fontWeight: 700}}>Fond</label><input type="color" className="input-field" style={{padding: 0, height: '30px'}} value={s.bgColor} onChange={(e) => onUpdateSection(s.id, {bgColor: e.target.value})} /></div>
                    <div className="input-group"><label style={{fontSize: '0.65rem', fontWeight: 700}}>Texte</label><input type="color" className="input-field" style={{padding: 0, height: '30px'}} value={s.textColor} onChange={(e) => onUpdateSection(s.id, {textColor: e.target.value})} /></div>
                    <div className="input-group"><label style={{fontSize: '0.65rem', fontWeight: 700}}>Police (pt)</label><input type="number" className="input-field" value={s.fontSize} onChange={(e) => onUpdateSection(s.id, {fontSize: e.target.value})} /></div>
                    <div className="input-group"><label style={{fontSize: '0.65rem', fontWeight: 700}}>Bord (mm)</label><input type="number" step="0.1" className="input-field" value={s.borderSize} onChange={(e) => onUpdateSection(s.id, {borderSize: e.target.value})} /></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="config-card" style={{marginTop: '1rem'}}>
              <label style={{fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem'}}>Logo Projet</label>
              <input type="file" accept="image/*" onChange={onLogoUpload} style={{fontSize: '0.75rem'}} />
            </div>
          </div>
        )}
      </div>

      <div style={{paddingTop: '1rem', borderTop: '1px solid var(--border)', marginTop: 'auto'}}>
        <button className="btn btn-primary" style={{width: '100%', padding: '0.75rem'}} onClick={onSave}>
          <Save size={18} /> Sauvegarder les modifications
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
