import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Edit2, Trash2, ArrowUpDown, DollarSign, Briefcase } from 'lucide-react';
import { mockProjects } from '@/data/mockData';
import { format } from 'date-fns';
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

export default function AdminProjects() {
  const [projects, setProjects] = useState(mockProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProjectAdded = () => {
    // In a real app, we would fetch the new list of projects.
    // Here, we just close the modal and show a success message (handled in AddProjectForm).
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      setProjects(projects.filter((p) => p.id !== id));
      // In a real app, an API call would be made here.
    }
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
          {row.original.budget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
        </div>
      ),
    },
    {
      accessorKey: 'spent',
      header: 'Dépensé',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {row.original.spent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
        </div>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'Date de Début',
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(row.original.startDate, 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" className="gap-1">
            <Edit2 className="w-4 h-4" />
            Modifier
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive gap-1"
            onClick={() => handleDelete(row.original.id)}
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
            filterColumnId="name"
            filterPlaceholder="Rechercher par nom de projet..."
            onAddNew={() => setIsModalOpen(true)}
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
              {projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Dépensé Total</p>
            <p className="text-2xl font-bold text-purple-600">
              {projects.reduce((sum, p) => sum + p.spent, 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
          </Card>
        </div>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Créer un nouveau projet</DialogTitle>
          </DialogHeader>
          <AddProjectForm onProjectAdded={handleProjectAdded} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
