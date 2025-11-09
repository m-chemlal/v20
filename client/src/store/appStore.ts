import { create } from 'zustand';
import { Project, Indicator, IndicatorEntry } from '@/types/project';
import {
  mockProjects,
  mockIndicators,
  mockIndicatorEntries,
} from '@/data/mockData';

interface AppStoreState {
  projects: Project[];
  indicators: Indicator[];
  indicatorEntries: IndicatorEntry[];
  inactivityTimeout: NodeJS.Timeout | null;

  // Project actions
  getProjects: () => Project[];
  getProjectById: (id: string) => Project | undefined;
  getProjectsByUser: (userId: string, role: string) => Project[];
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Indicator actions
  getIndicators: () => Indicator[];
  getIndicatorsByProject: (projectId: string) => Indicator[];
  getIndicatorById: (id: string) => Indicator | undefined;
  createIndicator: (
    indicator: Omit<Indicator, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  updateIndicator: (id: string, updates: Partial<Indicator>) => void;

  // Indicator Entry actions
  getIndicatorEntries: () => IndicatorEntry[];
  getEntriesByIndicator: (indicatorId: string) => IndicatorEntry[];
  addIndicatorEntry: (entry: Omit<IndicatorEntry, 'id'>) => void;

  // Inactivity management
  setInactivityTimeout: (timeout: NodeJS.Timeout | null) => void;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  projects: mockProjects,
  indicators: mockIndicators,
  indicatorEntries: mockIndicatorEntries,
  inactivityTimeout: null,

  // Project actions
  getProjects: () => get().projects,

  getProjectById: (id: string) => {
    return get().projects.find((p) => p.id === id);
  },

  getProjectsByUser: (userId: string, role: string) => {
    const projects = get().projects;

    if (role === 'admin') {
      return projects;
    } else if (role === 'chef_projet') {
      return projects.filter((p) => p.chefProjectId === userId);
    } else if (role === 'donateur') {
      return projects.filter((p) => p.donatorIds.includes(userId));
    }

    return [];
  },

  createProject: (project) => {
    const newProject: Project = {
      ...project,
      id: `p${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      projects: [...state.projects, newProject],
    }));
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date() }
          : p
      ),
    }));
  },

  deleteProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      indicators: state.indicators.filter((i) => i.projectId !== id),
    }));
  },

  // Indicator actions
  getIndicators: () => get().indicators,

  getIndicatorsByProject: (projectId: string) => {
    return get().indicators.filter((i) => i.projectId === projectId);
  },

  getIndicatorById: (id: string) => {
    return get().indicators.find((i) => i.id === id);
  },

  createIndicator: (indicator) => {
    const newIndicator: Indicator = {
      ...indicator,
      id: `i${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      indicators: [...state.indicators, newIndicator],
    }));
  },

  updateIndicator: (id, updates) => {
    set((state) => ({
      indicators: state.indicators.map((i) =>
        i.id === id
          ? { ...i, ...updates, updatedAt: new Date() }
          : i
      ),
    }));
  },

  // Indicator Entry actions
  getIndicatorEntries: () => get().indicatorEntries,

  getEntriesByIndicator: (indicatorId: string) => {
    return get().indicatorEntries.filter((e) => e.indicatorId === indicatorId);
  },

  addIndicatorEntry: (entry) => {
    const newEntry: IndicatorEntry = {
      ...entry,
      id: `ie${Date.now()}`,
    };

    set((state) => ({
      indicatorEntries: [...state.indicatorEntries, newEntry],
    }));

    // Update the indicator's current value
    const indicator = get().getIndicatorById(entry.indicatorId);
    if (indicator) {
      get().updateIndicator(entry.indicatorId, {
        currentValue: entry.value,
      });
    }
  },

  // Inactivity management
  setInactivityTimeout: (timeout) => {
    set({ inactivityTimeout: timeout });
  },
}));
