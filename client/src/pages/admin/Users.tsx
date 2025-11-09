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
import { EditUserForm } from '@/components/EditUserForm';
import { usersAPI } from '@/services/api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPendingDeletion, setUserPendingDeletion] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const mapUser = useCallback(
    (data: any): User => {
      const firstName = data.firstName ?? data.prenom ?? '';
      const lastName = data.lastName ?? data.nom ?? '';
      const createdAtSource = data.createdAt ?? data.date_creation ?? Date.now();

      return {
        id: data.id.toString(),
        email: data.email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        role: data.role,
        avatar:
          data.avatar ??
          data.photo_profil ??
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.email)}`,
        createdAt: new Date(createdAtSource),
      };
    },
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

  const handleUserUpdated = (updated: User) => {
    setUsers((previous) => previous.map((user) => (user.id === updated.id ? updated : user)));
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const openDeleteDialog = (user: User) => {
    setUserPendingDeletion(user);
  };

  const handleConfirmDelete = async () => {
    if (!userPendingDeletion) return;

    try {
      setIsDeleting(true);
      await usersAPI.delete(userPendingDeletion.id);
      toast.success(`Utilisateur ${userPendingDeletion.name} supprimé.`);
      setUsers((previous) => previous.filter((user) => user.id !== userPendingDeletion.id));
    } catch (error: any) {
      console.error('Failed to delete user', error);
      toast.error(
        error?.response?.data?.message ??
          "Impossible de supprimer l'utilisateur pour le moment.",
      );
    } finally {
      setIsDeleting(false);
      setUserPendingDeletion(null);
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
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => {
              setSelectedUser(row.original);
              setIsEditModalOpen(true);
            }}
          >
            <Edit2 className="w-4 h-4" />
            Modifier
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive gap-1"
            onClick={() => openDeleteDialog(row.original)}
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

      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open);
        if (!open) {
          setSelectedUser(null);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <EditUserForm
              key={selectedUser.id}
              user={selectedUser}
              onUserUpdated={handleUserUpdated}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!userPendingDeletion} onOpenChange={(open) => {
        if (!open) {
          setUserPendingDeletion(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement {userPendingDeletion?.name}. Cette opération est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
