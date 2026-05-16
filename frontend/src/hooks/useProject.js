import { useState, useCallback } from 'react';
import { apiFetch } from '../utils/api';

export const useProject = (deviceId) => {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch('/api/projects', {}, deviceId);
      if (res.ok) setProjects(await res.json());
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, [deviceId]);

  const loadProject = useCallback(async (id) => {
    if (!id) { setActiveProject(null); return; }
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/projects/${id}`, {}, deviceId);
      if (res.ok) {
        const data = await res.json();
        setActiveProject(data);
        return data;
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, [deviceId]);

  const createProject = async (name) => {
    try {
      const res = await apiFetch('/api/projects', { method: 'POST', body: JSON.stringify({ name }) }, deviceId);
      if (res.ok) {
        const newProj = await res.json();
        setProjects(prev => [newProj, ...prev]);
        return newProj;
      }
    } catch (err) { console.error(err); }
  };

  const renameProject = async (id, name) => {
    try {
      const res = await apiFetch(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }, deviceId);
      if (res.ok) {
        setProjects(prev => prev.map(p => p.id === id ? { ...p, name } : p));
        if (activeProject?.id === id) setActiveProject(prev => ({ ...prev, name }));
      }
    } catch (err) { console.error(err); }
  };

  const deleteProject = async (id) => {
    try {
      const res = await apiFetch(`/api/projects/${id}`, { method: 'DELETE' }, deviceId);
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id));
        return true;
      }
    } catch (err) { console.error(err); }
    return false;
  };

  const duplicateProject = async (id) => {
    try {
      const res = await apiFetch(`/api/projects/${id}/duplicate`, { method: 'POST' }, deviceId);
      if (res.ok) {
        const newProj = await res.json();
        setProjects(prev => [newProj, ...prev]);
        return newProj;
      }
    } catch (err) { console.error(err); }
  };

  // Sections
  const createSection = async (projectId, name) => {
    try {
      const res = await apiFetch(`/api/sections/projects/${projectId}/sections`, {
        method: 'POST',
        body: JSON.stringify({ name, defaultWidth: 20, defaultHeight: 15 })
      }, deviceId);
      if (res.ok) return await res.json();
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
    try {
      const res = await apiFetch(`/api/sections/${id}`, { method: 'DELETE' }, deviceId);
      return res.ok;
    } catch (err) { console.error(err); }
    return false;
  };

  const duplicateSection = async (id) => {
    try {
      const res = await apiFetch(`/api/sections/${id}/duplicate`, { method: 'POST' }, deviceId);
      return res.ok;
    } catch (err) { console.error(err); }
    return false;
  };

  // Labels
  const addLabel = async (sectionId, text) => {
    try {
      const res = await apiFetch(`/api/sections/${sectionId}/labels`, { method: 'POST', body: JSON.stringify({ text }) }, deviceId);
      return res.ok;
    } catch (err) { console.error(err); }
    return false;
  };

  const deleteLabel = async (id) => {
    try {
      const res = await apiFetch(`/api/sections/labels/${id}`, { method: 'DELETE' }, deviceId);
      return res.ok;
    } catch (err) { console.error(err); }
    return false;
  };

  const updateLabel = async (id, text) => {
    try {
      const res = await apiFetch(`/api/sections/labels/${id}`, { method: 'PATCH', body: JSON.stringify({ text }) }, deviceId);
      return res.ok;
    } catch (err) { console.error(err); }
    return false;
  };

  const batchGenerate = async (sectionId, body) => {
    try {
      const res = await apiFetch(`/api/sections/${sectionId}/batch`, { method: 'POST', body: JSON.stringify(body) }, deviceId);
      return res.ok;
    } catch (err) { console.error(err); }
    return false;
  };

  const persistProject = async (projectData) => {
    setIsLoading(true);
    try {
      // 1. Sauvegarder les paramètres du projet
      const projRes = await apiFetch(`/api/projects/${projectData.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: projectData.name,
          marginTop: projectData.marginTop,
          marginBottom: projectData.marginBottom,
          marginLeft: projectData.marginLeft,
          marginRight: projectData.marginRight,
          headerHeight: projectData.headerHeight,
          footerHeight: projectData.footerHeight,
          showSectionTitles: projectData.showSectionTitles
        })
      }, deviceId);

      // 2. Sauvegarder chaque section modifiée
      if (projectData.sections) {
        for (const s of projectData.sections) {
          await apiFetch(`/api/sections/${s.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              name: s.name,
              defaultWidth: s.defaultWidth,
              defaultHeight: s.defaultHeight,
              bgColor: s.bgColor,
              textColor: s.textColor,
              borderSize: s.borderSize,
              borderColor: s.borderColor,
              borderRadius: s.borderRadius,
              spacing: s.spacing,
              fontSize: s.fontSize,
              fontFamily: s.fontFamily,
              order: s.order
            })
          }, deviceId);
        }
      }
      
      // Recharger pour être sûr d'avoir les données à jour
      await loadProject(projectData.id);
      return true;
    } catch (err) { 
      console.error(err); 
      return false;
    } finally { 
      setIsLoading(false); 
    }
  };

  return {
    projects, activeProject, setActiveProject, isLoading,
    fetchProjects, loadProject, createProject, renameProject, deleteProject, duplicateProject,
    createSection, updateSection, deleteSection, duplicateSection,
    addLabel, deleteLabel, updateLabel, batchGenerate, persistProject
  };
};
