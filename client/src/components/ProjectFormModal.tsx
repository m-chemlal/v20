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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Project, ProjectStatus } from '@/types/project';
import { mockUsers } from '@/data/mockData';
import { Loader2 } from 'lucide-react';
import { User } from '@/types/auth';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project | null;
  onSave: (project: Project) => void;
}

export function ProjectFormModal({
  isOpen,
  onClose,
  projectToEdit,
  onSave,
}: ProjectFormModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('planning');
  const [budget, setBudget] = useState(0);
  const [chefProjectId, setChefProjectId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chefProjetUsers = mockUsers.filter((u) => u.role === 'chef_projet');
  const adminUser = mockUsers.find((u) => u.role === 'admin'); // Assuming one admin for simplicity

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setDescription(projectToEdit.description);
      setStatus(projectToEdit.status);
      setBudget(projectToEdit.budget);
      setChefProjectId(projectToEdit.chefProjectId);
    } else {
      setName('');
      setDescription('');
      setStatus('planning');
      setBudget(0);
      setChefProjectId(chefProjetUsers[0]?.id || '');
    }
  }, [projectToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const newProject: Project = {
      id: projectToEdit?.id || `p${Date.now()}`,
      name,
      description,
      status,
      budget,
      spent: projectToEdit?.spent || 0,
      startDate: projectToEdit?.startDate || new Date(),
      endDate: projectToEdit?.endDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      adminId: adminUser?.id || '1',
      chefProjectId,
      donatorIds: projectToEdit?.donatorIds || [],
      createdAt: projectToEdit?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    onSave(newProject);
    setIsLoading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {projectToEdit ? 'Edit Project' : 'Create New Project'}
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
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value as ProjectStatus)}
              required
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="budget" className="text-right">
              Budget ($)
            </Label>
            <Input
              id="budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="col-span-3"
              required
              min={0}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="chef" className="text-right">
              Chef de Projet
            </Label>
            <Select
              value={chefProjectId}
              onValueChange={setChefProjectId}
              required
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Assign Chef de Projet" />
              </SelectTrigger>
              <SelectContent>
                {chefProjetUsers.map((user: User) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : projectToEdit ? (
                'Save Changes'
              ) : (
                'Create Project'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
