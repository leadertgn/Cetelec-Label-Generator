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
      id = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('cetelec_device_id', id);
    }
    return id;
  });

  const {
    projects, activeProject, setActiveProject, isLoading,
    fetchProjects, loadProject, createProject, renameProject, deleteProject,
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
      // Vérifier si un brouillon local existe pour ce projet
      const savedDraft = localStorage.getItem(`cetelec_draft_${id}`);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          // Comparaison profonde simplifiée pour détecter de vrais changements
          const isDifferent = JSON.stringify(draft) !== JSON.stringify(data);
          
          if (isDifferent) {
            if (confirm("Une version non sauvegardée de ce projet a été trouvée. Voulez-vous la restaurer ?")) {
              setActiveProject(draft);
            }
          } else {
            // Si le brouillon est identique au serveur, on le supprime pour ne plus avoir le prompt
            localStorage.removeItem(`cetelec_draft_${id}`);
          }
        } catch (e) {
          localStorage.removeItem(`cetelec_draft_${id}`);
        }
      }
      
      if (data.sections?.length > 0) setSelectedSectionId(data.sections[0].id);
      setView('editor');
      // Update URL
      const url = new URL(window.location);
      url.searchParams.set('projectId', id);
      window.history.pushState({}, '', url);
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

  const pages = useMemo(() => {
    if (!activeProject?.sections) return [];

    const {
      marginTop = 15, marginBottom = 10, marginLeft = 15, marginRight = 15,
      headerHeight = 20, footerHeight = 10
    } = activeProject;

    // Fallbacks sécurisés pendant la saisie (évite le NaN)
    const mT = parseFloat(marginTop) || 0;
    const mB = parseFloat(marginBottom) || 0;
    const mL = parseFloat(marginLeft) || 0;
    const mR = parseFloat(marginRight) || 0;
    const hH = parseFloat(headerHeight) || 0;
    const fH = parseFloat(footerHeight) || 0;

    const PAGE_WIDTH_MM  = Math.max(10, 210 - mL - mR);
    const PAGE_HEIGHT_MM = Math.max(10, 297 - mT - mB - hH - fH);
    const GAP_MM         = 3;
    const SECTION_HEADER_MM = 8;

    const pagesArr = [];

    // Crée une nouvelle page vide
    const newPage = () => ({ sections: [] });

    let currentPage = newPage();
    let currentY = 0; // curseur vertical en mm sur la page courante

    activeProject.sections.forEach(section => {
      const labels = section.labels || [];
      if (labels.length === 0) return;

      // Utiliser des valeurs par défaut si les saisies sont invalides (ex: pendant la frappe)
      const defW = parseFloat(section.defaultWidth) || 20;
      const defH = parseFloat(section.defaultHeight) || 15;

      const labelW = defW + GAP_MM;
      const labelH = defH + GAP_MM;

      // Combien d'étiquettes rentrent par ligne ?
      const labelsPerRow = Math.max(1, Math.floor(PAGE_WIDTH_MM / labelW));

      // ── Vérifier si on peut commencer cette section sur la page courante ──
      // Il faut au moins : header de section + 1 ligne d'étiquettes
      const minSpaceNeeded = SECTION_HEADER_MM + labelH;
      if (currentY + minSpaceNeeded > PAGE_HEIGHT_MM) {
        // Plus assez de place : on finalise la page courante et on en ouvre une nouvelle
        pagesArr.push(currentPage);
        currentPage = newPage();
        currentY = 0;
      }

      // ── Initialiser le bloc de cette section pour la page courante ──
      let sectionBlock = { ...section, labels: [] };
      currentY += SECTION_HEADER_MM;

      // ── Placer les étiquettes une par une ──
      labels.forEach((label, idx) => {
        const positionInRow = sectionBlock.labels.length % labelsPerRow;
        const isStartOfNewRow = positionInRow === 0;

        if (isStartOfNewRow) {
          // On va commencer une nouvelle ligne : vérifier si elle rentre
          if (currentY + labelH > PAGE_HEIGHT_MM) {
            // ── Saut de page ──
            // Sauvegarder le bloc courant s'il a des étiquettes
            if (sectionBlock.labels.length > 0) {
              currentPage.sections.push(sectionBlock);
            }
            pagesArr.push(currentPage);

            // Nouvelle page
            currentPage = newPage();
            currentY = 0;

            // Le bloc de la section continue sur la nouvelle page
            // (même nom, mêmes styles, mais nouvelles étiquettes)
            sectionBlock = { ...section, labels: [] };
            currentY += SECTION_HEADER_MM; // re-ajouter le header de section
          }
          // Avancer le curseur d'une hauteur de ligne
          currentY += labelH;
        }

        sectionBlock.labels.push(label);
      });

      // ── Finaliser le bloc de la section (dernières étiquettes) ──
      if (sectionBlock.labels.length > 0) {
        currentPage.sections.push(sectionBlock);
      }
    });

    // ── Finaliser la dernière page ──
    if (currentPage.sections.length > 0) {
      pagesArr.push(currentPage);
    }

    // Si aucune étiquette, retourner une page vide pour afficher le canvas
    return pagesArr.length > 0 ? pagesArr : [newPage()];
  }, [activeProject]);

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="app-container">
      <Header onHome={() => {
        setView('dashboard');
        const url = new URL(window.location);
        url.searchParams.delete('projectId');
        window.history.pushState({}, '', url);
      }} project={activeProject} view={view} />

      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
              project={activeProject}
              activeSection={activeProject.sections.find(s => s.id === selectedSectionId)}
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
              // Modifications locales sans appel API immédiat
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

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

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
    </div>
  );
}

export default App;