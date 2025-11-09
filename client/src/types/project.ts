export type ProjectStatus = 'planning' | 'enCours' | 'completed' | 'paused';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: Date;
  endDate: Date | null;
  budget: number;
  spent: number;
  adminId: string | null;
  chefProjectId: string;
  donatorIds: string[];
  donorAllocations: ProjectDonorAllocation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDonorAllocation {
  donorId: string;
  committedAmount: number;
  spentAmount: number;
}

export interface Indicator {
  id: string;
  projectId: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IndicatorEntry {
  id: string;
  indicatorId: string;
  value: number;
  evidence?: string;
  notes?: string;
  createdAt: Date;
  createdBy?: string;
  createdByName?: string;
}

export interface ProjectWithIndicators extends Project {
  indicators: Indicator[];
}
