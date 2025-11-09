import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddUserForm } from '@/components/AddUserForm';
import { User } from '@/types/auth';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated?: (user: User) => void;
}

export function UserFormModal({ isOpen, onClose, onUserCreated }: UserFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
        </DialogHeader>
        <AddUserForm
          onUserAdded={(user) => {
            onUserCreated?.(user);
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export default UserFormModal;
