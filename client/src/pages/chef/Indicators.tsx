import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { IndicatorEntryFormModal } from '@/components/IndicatorEntryFormModal';
import { Indicator } from '@/types/project';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, TrendingUp, Loader2 } from 'lucide-react';

const createIndicatorSchema = z.object({
  projectId: z.string().min(1, { message: 'Veuillez sélectionner un projet.' }),
  name: z.string().min(3, { message: "Le nom doit contenir au moins 3 caractères." }),
  description: z.string().min(10, { message: 'La description doit contenir au moins 10 caractères.' }),
  targetValue: z.number().nonnegative({ message: 'La cible doit être positive.' }),
  currentValue: z.number().min(0, { message: 'La valeur actuelle doit être positive.' }),
  unit: z.string().min(1, { message: "L'unité est obligatoire." }),
});

type CreateIndicatorFormData = z.infer<typeof createIndicatorSchema>;

export default function ChefIndicators() {
  const { user } = useAuthStore();
  const fetchProjects = useAppStore((state) => state.fetchProjects);
  const loadedProjects = useAppStore((state) => state.loadedProjects);
  const getProjectsByUser = useAppStore((state) => state.getProjectsByUser);
  const indicators = useAppStore((state) => state.indicators);
  const fetchIndicatorsForProject = useAppStore(
    (state) => state.fetchIndicatorsForProject,
  );
  const createIndicatorEntry = useAppStore((state) => state.createIndicator);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (user && !loadedProjects) {
      fetchProjects();
    }
  }, [user, loadedProjects, fetchProjects]);

  const myProjects = useMemo(
    () => getProjectsByUser(user?.id ?? '', user?.role ?? ''),
    [getProjectsByUser, user?.id, user?.role],
  );

  const {
    control: createControl,
    register: createRegister,
    handleSubmit: handleCreateSubmit,
    formState: { errors: createErrors, isSubmitting: isCreating },
    reset: resetCreateForm,
  } = useForm<CreateIndicatorFormData>({
    resolver: zodResolver(createIndicatorSchema),
    defaultValues: {
      projectId: '',
      name: '',
      description: '',
      targetValue: 0,
      currentValue: 0,
      unit: '',
    },
  });

  useEffect(() => {
    myProjects.forEach((project) => {
      fetchIndicatorsForProject(project.id);
    });
  }, [myProjects, fetchIndicatorsForProject]);

  const openCreateModal = () => {
    const defaultProjectId = selectedProject ?? myProjects[0]?.id ?? '';
    resetCreateForm({
      projectId: defaultProjectId,
      name: '',
      description: '',
      targetValue: 0,
      currentValue: 0,
      unit: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateIndicator = async (data: CreateIndicatorFormData) => {
    const created = await createIndicatorEntry({
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      targetValue: data.targetValue,
      currentValue: data.currentValue,
      unit: data.unit,
    });

    if (created) {
      await fetchIndicatorsForProject(created.projectId);
      resetCreateForm({
        projectId: created.projectId,
        name: '',
        description: '',
        targetValue: 0,
        currentValue: 0,
        unit: '',
      });
      setIsCreateModalOpen(false);
      setSelectedProject((previous) => previous ?? created.projectId);
    }
  };

  const myIndicators = indicators.filter((indicator) =>
    myProjects.some((project) => project.id === indicator.projectId),
  );

  const filteredIndicators = selectedProject
    ? myIndicators.filter((indicator) => indicator.projectId === selectedProject)
    : myIndicators;

  const handleUpdateValue = (indicator: Indicator) => {
    setSelectedIndicator(indicator);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout title="Indicators">
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Manage Indicators</h2>
            <p className="text-sm text-muted-foreground">
              Track progress on your project indicators
            </p>
          </div>
          <Button className="gap-2" onClick={openCreateModal} disabled={myProjects.length === 0}>
            <Plus className="w-4 h-4" />
            Ajouter un indicateur
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedProject === null ? 'default' : 'outline'}
            onClick={() => setSelectedProject(null)}
            size="sm"
          >
            All Projects
          </Button>
          {myProjects.map((project) => (
            <Button
              key={project.id}
              variant={selectedProject === project.id ? 'default' : 'outline'}
              onClick={() => setSelectedProject(project.id)}
              size="sm"
            >
              {project.name.substring(0, 20)}...
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIndicators.map((indicator, index) => {
            const progress = indicator.targetValue
              ? Math.round((indicator.currentValue / indicator.targetValue) * 100)
              : 0;

            return (
              <motion.div
                key={indicator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold">{indicator.name}</h3>
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {indicator.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current</span>
                      <span className="font-semibold">
                        {indicator.currentValue} {indicator.unit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-semibold">
                        {indicator.targetValue} {indicator.unit}
                      </span>
                    </div>

                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-700 h-2 rounded-full"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-purple-600">{progress}%</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleUpdateValue(indicator)}
                    >
                      Update Value
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <Dialog
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          setIsCreateModalOpen(open);
          if (!open) {
            resetCreateForm({
              projectId: selectedProject ?? myProjects[0]?.id ?? '',
              name: '',
              description: '',
              targetValue: 0,
              currentValue: 0,
              unit: '',
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Créer un nouvel indicateur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit(handleCreateIndicator)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="indicator-project">Projet</Label>
              <Controller
                control={createControl}
                name="projectId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="indicator-project">
                      <SelectValue placeholder="Sélectionner un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      {myProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {createErrors.projectId && (
                <p className="text-xs text-red-500">{createErrors.projectId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="indicator-name">Nom de l'indicateur</Label>
              <Input id="indicator-name" {...createRegister('name')} />
              {createErrors.name && (
                <p className="text-xs text-red-500">{createErrors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="indicator-description">Description</Label>
              <Textarea id="indicator-description" rows={3} {...createRegister('description')} />
              {createErrors.description && (
                <p className="text-xs text-red-500">{createErrors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="indicator-target">Cible</Label>
                <Input
                  id="indicator-target"
                  type="number"
                  step="0.01"
                  {...createRegister('targetValue', { valueAsNumber: true })}
                />
                {createErrors.targetValue && (
                  <p className="text-xs text-red-500">{createErrors.targetValue.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="indicator-current">Valeur actuelle</Label>
                <Input
                  id="indicator-current"
                  type="number"
                  step="0.01"
                  {...createRegister('currentValue', { valueAsNumber: true })}
                />
                {createErrors.currentValue && (
                  <p className="text-xs text-red-500">{createErrors.currentValue.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="indicator-unit">Unité</Label>
                <Input id="indicator-unit" {...createRegister('unit')} />
                {createErrors.unit && (
                  <p className="text-xs text-red-500">{createErrors.unit.message}</p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetCreateForm({
                    projectId: selectedProject ?? myProjects[0]?.id ?? '',
                    name: '',
                    description: '',
                    targetValue: 0,
                    currentValue: 0,
                    unit: '',
                  });
                  setIsCreateModalOpen(false);
                }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isCreating} className="gap-2">
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Créer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {selectedIndicator && (
        <IndicatorEntryFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          indicator={selectedIndicator}
        />
      )}
    </DashboardLayout>
  );
}
