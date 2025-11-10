import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddProjectForm } from '@/components/AddProjectForm';
import { Project } from '@/types/project';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Callback invoked once a project has been created via the modal.
   * The freshly created project returned by the API is passed as an argument.
   */
  onProjectCreated?: (project: Project) => void;
}

export function ProjectFormModal({ isOpen, onClose, onProjectCreated }: ProjectFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Créer un nouveau projet</DialogTitle>
        </DialogHeader>
        <AddProjectForm
          onProjectAdded={(project) => {
            onProjectCreated?.(project);
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

export default ProjectFormModal;
