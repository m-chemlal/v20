import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, UserRole } from '@/types/auth';
import { mockUsers } from '@/data/mockData';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: User | null;
  onSave: (user: User) => void;
}

const generateRandomPassword = () => {
  const length = 12;
  const charset =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
  let password = '';
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
};

export function UserFormModal({
  isOpen,
  onClose,
  userToEdit,
  onSave,
}: UserFormModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('donateur');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      setPassword(''); // Never pre-fill password for security
    } else {
      setName('');
      setEmail('');
      setRole('donateur');
      setPassword(generateRandomPassword());
    }
  }, [userToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newUser: User = {
      id: userToEdit?.id || `u${Date.now()}`,
      name,
      email,
      role,
      createdAt: userToEdit?.createdAt || new Date(),
      avatar:
        userToEdit?.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(
          /\s/g,
          ''
        )}`,
    };

    // In a real app, the password would be sent to the server for hashing
    // For this mock, we just log it for the new user
    if (!userToEdit) {
      console.log(`New user password for ${email}: ${password}`);
    }

    onSave(newUser);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {userToEdit ? 'Edit User' : 'Create New User'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as UserRole)}
              required
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="chef_projet">Chef de Projet</SelectItem>
                <SelectItem value="donateur">Donateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!userToEdit && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="password"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1"
                  required
                  readOnly
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPassword(generateRandomPassword())}
                >
                  Generate
                </Button>
              </div>
              <div className="col-span-4 text-center text-xs text-muted-foreground">
                (For demo, the password is not actually used for login, but it is generated here)
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : userToEdit ? (
                'Save Changes'
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
