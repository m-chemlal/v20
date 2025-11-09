import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Edit2, Trash2, ArrowUpDown } from 'lucide-react';
import { mockUsers } from '@/data/mockData';
import { User } from '@/types/auth';
import { format } from 'date-fns';
import { DataTable } from '@/components/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddUserForm } from '@/components/AddUserForm';

export default function AdminUsers() {
  const [users, setUsers] = useState(mockUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUserAdded = () => {
    // In a real app, we would fetch the new list of users.
    // Here, we just close the modal and show a success message (handled in AddUserForm).
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      setUsers(users.filter((u) => u.id !== id));
      // In a real app, an API call would be made here.
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nom
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img
            src={row.original.avatar}
            alt={row.original.name}
            className="w-8 h-8 rounded-full"
          />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Rôle',
      cell: ({ row }) => (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 capitalize">
          {row.original.role.replace('_', ' ')}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Inscrit
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(row.original.createdAt, 'MMM dd, yyyy')}
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
    <DashboardLayout title="Gestion des Utilisateurs">
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6">
          <DataTable
            columns={columns}
            data={users}
            filterColumnId="name"
            filterPlaceholder="Rechercher par nom..."
            onAddNew={() => setIsModalOpen(true)}
            addNewLabel="Ajouter Utilisateur"
          />
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Utilisateurs</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Administrateurs</p>
            <p className="text-2xl font-bold">{users.filter((u) => u.role === 'admin').length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Chefs de Projet</p>
            <p className="text-2xl font-bold">{users.filter((u) => u.role === 'chef_projet').length}</p>
          </Card>
        </div>
      </motion.div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
          </DialogHeader>
          <AddUserForm onUserAdded={handleUserAdded} />
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
