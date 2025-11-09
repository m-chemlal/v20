import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Edit2, Trash2, ArrowUpDown, DollarSign, Briefcase } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { Project } from '@/types/project';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddProjectForm } from '@/components/AddProjectForm';
import { EditProjectForm } from '@/components/EditProjectForm';
import { useAppStore } from '@/store/appStore';

export default function AdminProjects() {
  const projects = useAppStore((state) => state.projects);
  const isLoading = useAppStore((state) => state.isLoading);
  const fetchProjects = useAppStore((state) => state.fetchProjects);
  const loadedProjects = useAppStore((state) => state.loadedProjects);
  const deleteProject = useAppStore((state) => state.deleteProject);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!loadedProjects) {
      fetchProjects();
    }
  }, [loadedProjects, fetchProjects]);

  const openAddModal = () => {
    setModalMode('add');
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setModalMode('edit');
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleProjectAdded = async () => {
    setIsModalOpen(false);
    await fetchProjects({ force: true });
  };

  const handleProjectUpdated = async () => {
    setIsModalOpen(false);
    await fetchProjects({ force: true });
  };

  const handleDelete = async (project: Project) => {
    const confirmed = window.confirm(
      `Voulez-vous vraiment supprimer le projet "${project.name}" ? Cette action est irréversible.`,
    );

    if (!confirmed) {
      return;
    }

    const success = await deleteProject(project.id);
    if (success) {
      await fetchProjects({ force: true });
    }
  };

  const safeNumber = (value: number | null | undefined) =>
    typeof value === 'number' && Number.isFinite(value) ? value : 0;

  const formatCurrency = (value: number | null | undefined) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
      safeNumber(value),
    );

  const formatDateValue = (value: Date | string | null | undefined) => {
    if (!value) {
      return '—';
    }
    const dateValue = value instanceof Date ? value : new Date(value);
    if (!isValid(dateValue)) {
      return '—';
    }
    return format(dateValue, 'dd MMM yyyy', { locale: fr });
  };

  const safeNumber = (value: number | null | undefined) =>
    typeof value === 'number' && Number.isFinite(value) ? value : 0;

  const formatCurrency = (value: number | null | undefined) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
      safeNumber(value),
    );

  const formatDateValue = (value: Date | string | null | undefined) => {
    if (!value) {
      return '—';
    }
    const dateValue = value instanceof Date ? value : new Date(value);
    if (!isValid(dateValue)) {
      return '—';
    }
    return format(dateValue, 'dd MMM yyyy', { locale: fr });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      enCours: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
      planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
      completed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
      paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
    };
    return colors[status] || '';
  };

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nom du Projet
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-purple-500" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(row.original.status)}`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'budget',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Budget
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm font-medium flex items-center gap-1">
          <DollarSign className="w-4 h-4" />
          {formatCurrency(row.original.budget)}
        </div>
      ),
    },
    {
      accessorKey: 'spent',
      header: 'Dépensé',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{formatCurrency(row.original.spent)}</div>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'Date de Début',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">{formatDateValue(row.original.startDate)}</div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => openEditModal(row.original)}
          >
            <Edit2 className="w-4 h-4" />
            Modifier
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive gap-1"
            onClick={() => handleDelete(row.original)}
          >
            <Trash2 className="w-4 h-4" />
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Gestion des Projets">
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6">
          <DataTable
            columns={columns}
            data={projects}
            isLoading={isLoading}
            filterColumnId="name"
            filterPlaceholder="Rechercher par nom de projet..."
            onAddNew={openAddModal}
            addNewLabel="Ajouter Projet"
          />
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Projets</p>
            <p className="text-2xl font-bold">{projects.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Actifs</p>
            <p className="text-2xl font-bold text-emerald-600">
              {projects.filter((p) => p.status === 'enCours').length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Budget Total</p>
            <p className="text-2xl font-bold">
              {formatCurrency(projects.reduce((sum, p) => sum + safeNumber(p.budget), 0))}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Dépensé Total</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(projects.reduce((sum, p) => sum + safeNumber(p.spent), 0))}
            </p>
          </Card>
        </div>
      </motion.div>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setSelectedProject(null);
            setModalMode('add');
          }
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {modalMode === 'add' ? 'Créer un nouveau projet' : 'Modifier le projet'}
            </DialogTitle>
          </DialogHeader>
          {modalMode === 'add' && <AddProjectForm onProjectAdded={handleProjectAdded} />}
          {modalMode === 'edit' && selectedProject && (
            <EditProjectForm project={selectedProject} onProjectUpdated={handleProjectUpdated} />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
