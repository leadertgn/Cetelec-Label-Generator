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

  return {
    projects, activeProject, isLoading,
    fetchProjects, loadProject, createProject, renameProject, deleteProject,
    createSection, updateSection, deleteSection, duplicateSection,
    addLabel, deleteLabel, updateLabel, batchGenerate
  };
};
