import { create } from 'zustand';
import { Project, Indicator, IndicatorEntry } from '@/types/project';
import { projectsAPI, indicatorsAPI, usersAPI } from '@/services/api';
import { toast } from 'sonner';

interface AppStoreState {
  projects: Project[];
  indicators: Indicator[];
  indicatorEntries: IndicatorEntry[];
  isLoading: boolean;
  error: string | null;
  inactivityTimeout: NodeJS.Timeout | null;
  loadedProjects: boolean;
  fetchProjects: (options?: { force?: boolean }) => Promise<void>;
  refreshProject: (projectId: string) => Promise<void>;
  getProjects: () => Project[];
  getProjectById: (id: string) => Project | undefined;
  getProjectsByUser: (userId: string, role: string) => Project[];
  createProject: (
    project: Omit<
      Project,
      'id' | 'createdAt' | 'updatedAt' | 'donatorIds' | 'startDate' | 'endDate'
    > & { startDate: Date; endDate: Date | null; donatorIds?: string[] }
  ) => Promise<Project | null>;
  updateProject: (
    projectId: string,
    project: {
      name: string;
      description: string;
      status: Project['status'];
      startDate: Date | string;
      endDate: Date | string | null;
      budget: number;
      spent: number;
      chefProjectId: string;
      donatorIds?: string[];
    }
  ) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<boolean>;
  getIndicators: () => Indicator[];
  getIndicatorsByProject: (projectId: string) => Indicator[];
  fetchIndicatorsForProject: (projectId: string) => Promise<Indicator[]>;
  createIndicator: (
    indicator: Omit<Indicator, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Indicator | null>;
  updateIndicatorValue: (
    indicatorId: string,
    payload: { value: number; notes?: string; evidence?: string }
  ) => Promise<Indicator | null>;
  getIndicatorById: (id: string) => Indicator | undefined;
  getIndicatorEntries: (indicatorId: string) => IndicatorEntry[];
  fetchIndicatorEntries: (indicatorId: string) => Promise<IndicatorEntry[]>;
  setInactivityTimeout: (timeout: NodeJS.Timeout | null) => void;
  clearData: () => void;
}

function parseDate(value: any): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function requireDate(value: any, fallback?: Date): Date {
  return parseDate(value) ?? fallback ?? new Date();
}

function coerceNumber(value: any, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function toDateOnly(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().split('T')[0];
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
  }
  return null;
}

function mapProjectResponse(data: any): Project {
  const adminRaw = data.adminId ?? data.admin_id;
  const chefRaw = data.chefProjectId ?? data.chef_project_id;
  const donorRaw =
    Array.isArray(data.donatorIds)
      ? data.donatorIds
      : Array.isArray(data.donor_ids)
        ? data.donor_ids
        : [];
  const startSource = data.startDate ?? data.start_date ?? data.createdAt ?? data.created_at;
  const endSource = data.endDate ?? data.end_date ?? null;
  return {
    id: data.id.toString(),
    name: data.name,
    description: data.description,
    status: data.status,
    startDate: requireDate(startSource),
    endDate: parseDate(endSource),
    budget: coerceNumber(data.budget),
    spent: coerceNumber(data.spent ?? data.spent_amount ?? 0),
    adminId: adminRaw != null ? adminRaw.toString() : null,
    chefProjectId: chefRaw != null ? chefRaw.toString() : '',
    donatorIds: donorRaw.map((id: any) => id.toString()),
    createdAt: requireDate(data.createdAt ?? data.created_at ?? Date.now()),
    updatedAt: requireDate(data.updatedAt ?? data.updated_at ?? Date.now()),
  };
}

function mapIndicatorResponse(data: any): Indicator {
  return {
    id: data.id.toString(),
    projectId: data.projectId ?? data.project_id?.toString(),
    name: data.name,
    description: data.description,
    targetValue: Number(data.targetValue ?? data.target_value ?? 0),
    currentValue: Number(data.currentValue ?? data.current_value ?? 0),
    unit: data.unit,
    createdAt: new Date(data.createdAt ?? data.created_at ?? Date.now()),
    updatedAt: new Date(data.updatedAt ?? data.updated_at ?? Date.now()),
  };
}

function mapEntryResponse(data: any): IndicatorEntry {
  return {
    id: data.id.toString(),
    indicatorId: data.indicatorId ?? data.indicator_id?.toString(),
    value: Number(data.value ?? 0),
    notes: data.notes ?? undefined,
    evidence: data.evidence ?? undefined,
    createdAt: new Date(data.createdAt ?? data.created_at ?? Date.now()),
    createdBy: data.createdBy ?? data.created_by?.toString(),
    createdByName: data.createdByName ?? data.created_by_name ?? undefined,
  };
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  projects: [],
  indicators: [],
  indicatorEntries: [],
  isLoading: false,
  error: null,
  inactivityTimeout: null,
  loadedProjects: false,

  async fetchProjects(options = {}) {
    const { force = false } = options;
    const { loadedProjects, isLoading } = get();

    if (isLoading) {
      return;
    }

    if (loadedProjects && !force) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const data = await projectsAPI.getAll();
      const projects = data.map(mapProjectResponse);
      set({ projects, isLoading: false, loadedProjects: true });
    } catch (error: any) {
      console.error('Failed to load projects', error);
      set({
        isLoading: false,
        loadedProjects: true,
        error:
          error?.response?.data?.message ??
          "Impossible de charger les projets. Vérifiez la connexion avec l'API.",
      });
    }
  },

  async refreshProject(projectId) {
    try {
      const data = await projectsAPI.getById(projectId);
      const project = mapProjectResponse(data);
      set((state) => ({
        projects: state.projects.some((p) => p.id === project.id)
          ? state.projects.map((p) => (p.id === project.id ? project : p))
          : [...state.projects, project],
      }));
    } catch (error) {
      console.error('Failed to refresh project', error);
    }
  },

  getProjects: () => get().projects,

  getProjectById: (id: string) => get().projects.find((project) => project.id === id),

  getProjectsByUser: (userId: string, role: string) => {
    const projects = get().projects;
    if (role === 'admin') {
      return projects;
    }
    if (role === 'chef_projet') {
      return projects.filter((project) => project.chefProjectId === userId);
    }
    if (role === 'donateur') {
      return projects.filter((project) => project.donatorIds.includes(userId));
    }
    return [];
  },

  async createProject(project) {
    try {
      const payload = {
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: project.startDate.toISOString().split('T')[0],
        endDate: project.endDate ? project.endDate.toISOString().split('T')[0] : null,
        budget: project.budget,
        spent: project.spent,
        chefProjectId: project.chefProjectId,
        donatorIds: project.donatorIds ?? [],
      };
      const response = await projectsAPI.create(payload);
      const created = mapProjectResponse(response);
      set((state) => ({ projects: [created, ...state.projects] }));
      toast.success(`Projet "${created.name}" créé avec succès.`);
      return created;
    } catch (error: any) {
      console.error('Failed to create project', error);
      toast.error(
        error?.response?.data?.message ??
          "Impossible de créer le projet. Vérifiez les informations saisies.",
      );
      return null;
    }
  },

  async updateProject(projectId, project) {
    try {
      const payload = {
        name: project.name,
        description: project.description,
        status: project.status,
        startDate: toDateOnly(project.startDate) ?? new Date().toISOString().split('T')[0],
        endDate: toDateOnly(project.endDate),
        budget: project.budget,
        spent: project.spent,
        chefProjectId: project.chefProjectId,
        donatorIds: project.donatorIds ?? [],
      };

      const response = await projectsAPI.update(projectId, payload);
      const updated = mapProjectResponse(response);
      set((state) => ({
        projects: state.projects.map((existing) =>
          existing.id === updated.id ? updated : existing,
        ),
      }));
      toast.success(`Projet "${updated.name}" mis à jour.`);
      return updated;
    } catch (error: any) {
      console.error('Failed to update project', error);
      toast.error(
        error?.response?.data?.message ??
          "Impossible de mettre à jour le projet. Vérifiez les informations fournies.",
      );
      return null;
    }
  },

  async deleteProject(projectId) {
    try {
      await projectsAPI.delete(projectId);
      set((state) => ({
        projects: state.projects.filter((project) => project.id !== projectId),
      }));
      toast.success('Projet supprimé avec succès.');
      return true;
    } catch (error: any) {
      console.error('Failed to delete project', error);
      toast.error(
        error?.response?.data?.message ??
          "Impossible de supprimer le projet. Réessayez plus tard.",
      );
      return false;
    }
  },

  getIndicators: () => get().indicators,

  getIndicatorsByProject: (projectId: string) =>
    get().indicators.filter((indicator) => indicator.projectId === projectId),

  async fetchIndicatorsForProject(projectId) {
    try {
      const response = await indicatorsAPI.getByProject(projectId);
      const indicators = response.map(mapIndicatorResponse);
      set((state) => ({
        indicators: [
          ...state.indicators.filter((indicator) => indicator.projectId !== projectId),
          ...indicators,
        ],
      }));
      return indicators;
    } catch (error) {
      console.error('Failed to load indicators', error);
      toast.error("Impossible de charger les indicateurs du projet.");
      return [];
    }
  },

  async createIndicator(indicator) {
    try {
      const response = await indicatorsAPI.create({
        projectId: indicator.projectId,
        name: indicator.name,
        description: indicator.description,
        targetValue: indicator.targetValue,
        currentValue: indicator.currentValue,
        unit: indicator.unit,
      });
      const created = mapIndicatorResponse(response);
      set((state) => ({ indicators: [...state.indicators, created] }));
      toast.success(`Indicateur "${created.name}" créé.`);
      return created;
    } catch (error: any) {
      console.error('Failed to create indicator', error);
      toast.error(
        error?.response?.data?.message ??
          "Impossible de créer l'indicateur. Vérifiez les données envoyées.",
      );
      return null;
    }
  },

  async updateIndicatorValue(indicatorId, payload) {
    try {
      const response = await indicatorsAPI.update(indicatorId, {
        currentValue: payload.value,
        notes: payload.notes,
        evidence: payload.evidence,
      });
      const updated = mapIndicatorResponse(response);
      set((state) => ({
        indicators: state.indicators.map((indicator) =>
          indicator.id === updated.id ? updated : indicator,
        ),
      }));
      await get().fetchIndicatorEntries(indicatorId);
      toast.success('Valeur de l\'indicateur mise à jour.');
      return updated;
    } catch (error: any) {
      console.error('Failed to update indicator', error);
      toast.error(
        error?.response?.data?.message ??
          "Impossible de mettre à jour l'indicateur.",
      );
      return null;
    }
  },

  getIndicatorById: (id: string) => get().indicators.find((indicator) => indicator.id === id),

  getIndicatorEntries: (indicatorId: string) =>
    get().indicatorEntries.filter((entry) => entry.indicatorId === indicatorId),

  async fetchIndicatorEntries(indicatorId) {
    try {
      const response = await indicatorsAPI.getEntries(indicatorId);
      const entries = response.map(mapEntryResponse);
      set((state) => ({
        indicatorEntries: [
          ...state.indicatorEntries.filter((entry) => entry.indicatorId !== indicatorId),
          ...entries,
        ],
      }));
      return entries;
    } catch (error) {
      console.error('Failed to load indicator entries', error);
      toast.error("Impossible de charger l'historique de l'indicateur.");
      return [];
    }
  },

  setInactivityTimeout: (timeout) => {
    set({ inactivityTimeout: timeout });
  },

  clearData: () => {
    set({
      projects: [],
      indicators: [],
      indicatorEntries: [],
      loadedProjects: false,
    });
  },
}));

// Helper to preload administrators for forms
export async function fetchChefsDeProjet() {
  try {
    const users = await usersAPI.getAll('chef_projet');
    return users.map((user: any) => ({
      id: user.id.toString(),
      name: `${user.firstName} ${user.lastName}`.trim(),
    }));
  } catch (error) {
    console.error('Failed to fetch chefs de projet', error);
    return [];
  }
}
