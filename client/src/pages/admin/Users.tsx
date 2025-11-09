import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Edit2, Trash2, ArrowUpDown } from 'lucide-react';
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
import { usersAPI } from '@/services/api';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const mapUser = useCallback(
    (data: any): User => ({
      id: data.id.toString(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      name: `${data.firstName} ${data.lastName}`.trim(),
      role: data.role,
      avatar: data.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.email)}`,
      createdAt: new Date(data.createdAt),
    }),
    [],
  );

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await usersAPI.getAll();
      setUsers(response.map(mapUser));
    } catch (error: any) {
      console.error('Failed to load users', error);
      toast.error(
        error?.response?.data?.message ??
          "Impossible de charger la liste des utilisateurs.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [mapUser]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleUserAdded = async () => {
    setIsModalOpen(false);
    await loadUsers();
  };

  const handleDelete = () => {
    toast.info("La suppression d'utilisateurs sera disponible prochainement.");
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
            onClick={() => handleDelete()}
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
            isLoading={isLoading}
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
