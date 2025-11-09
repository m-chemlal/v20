import { useEffect, useState } from 'react';
import { Controller, Resolver, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Loader2 } from 'lucide-react';
import { Project, ProjectStatus } from '@/types/project';
import { PROJECT_STATUSES } from './AddProjectForm';
import { fetchChefsDeProjet, useAppStore } from '@/store/appStore';

const editProjectSchema = z.object({
  name: z.string().min(5, {
    message: 'Le nom du projet doit contenir au moins 5 caractères.',
  }),
  description: z.string().min(20, {
    message: 'La description doit contenir au moins 20 caractères.',
  }),
  chefDeProjetId: z.string().min(1, {
    message: 'Veuillez sélectionner un Chef de Projet.',
  }),
  budget: z.coerce.number()
    .refine((value) => !Number.isNaN(value), {
      message: 'Le budget doit être un nombre.',
    })
    .min(1000, { message: "Le budget doit être d'au moins 1000." }),
  status: z.enum(PROJECT_STATUSES, {
    message: 'Veuillez sélectionner un statut.',
  }),
  startDate: z
    .string()
    .min(1, { message: 'La date de début est obligatoire.' })
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'Date de début invalide.',
    }),
  endDate: z
    .string()
    .optional()
    .refine((value) => {
      if (!value) {
        return true;
      }
      return !Number.isNaN(Date.parse(value));
    }, { message: 'Date de fin invalide.' }),
});

type EditProjectFormData = z.infer<typeof editProjectSchema>;

interface EditProjectFormProps {
  project: Project;
  onProjectUpdated?: (project: Project) => void;
}

function formatDateInput(value: Date | string | null | undefined): string {
  if (!value) {
    return '';
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString().split('T')[0];
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
  }
  return '';
}

export function EditProjectForm({ project, onProjectUpdated }: EditProjectFormProps) {
  const updateProject = useAppStore((state) => state.updateProject);
  const [chefs, setChefs] = useState<Array<{ id: string; name: string }>>([]);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditProjectFormData, any, EditProjectFormData>({
    resolver: zodResolver(editProjectSchema) as Resolver<
      EditProjectFormData,
      any,
      EditProjectFormData
    >,
    defaultValues: {
      name: project.name,
      description: project.description,
      status: project.status,
      chefDeProjetId: project.chefProjectId,
      budget: project.budget,
      startDate: formatDateInput(project.startDate),
      endDate: formatDateInput(project.endDate),
    },
  });

  useEffect(() => {
    fetchChefsDeProjet().then(setChefs);
  }, []);

  useEffect(() => {
    reset({
      name: project.name,
      description: project.description,
      status: project.status,
      chefDeProjetId: project.chefProjectId,
      budget: project.budget,
      startDate: formatDateInput(project.startDate),
      endDate: formatDateInput(project.endDate),
    });
  }, [project, reset]);

  const onSubmit = async (data: EditProjectFormData) => {
    const updated = await updateProject(project.id, {
      name: data.name,
      description: data.description,
      status: data.status as ProjectStatus,
      startDate: data.startDate,
      endDate: data.endDate ? data.endDate : null,
      budget: data.budget,
      spent: project.spent,
      chefProjectId: data.chefDeProjetId,
      donatorIds: project.donatorIds,
    });

    if (updated) {
      onProjectUpdated?.(updated);
      reset({
        name: updated.name,
        description: updated.description,
        status: updated.status,
        chefDeProjetId: updated.chefProjectId,
        budget: updated.budget,
        startDate: formatDateInput(updated.startDate),
        endDate: formatDateInput(updated.endDate),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-project-name">Nom du Projet</Label>
        <Input id="edit-project-name" {...register('name')} />
        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-project-description">Description</Label>
        <Textarea id="edit-project-description" rows={4} {...register('description')} />
        {errors.description && (
          <p className="text-red-500 text-xs">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-project-chef">Chef de Projet</Label>
          <Controller
            control={control}
            name="chefDeProjetId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                <SelectTrigger id="edit-project-chef">
                  <SelectValue placeholder="Sélectionner un Chef" />
                </SelectTrigger>
                <SelectContent>
                  {chefs.map((chef) => (
                    <SelectItem key={chef.id} value={chef.id}>
                      {chef.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.chefDeProjetId && (
            <p className="text-red-500 text-xs">{errors.chefDeProjetId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-project-budget">Budget (€)</Label>
          <Input
            id="edit-project-budget"
            type="number"
            {...register('budget', { valueAsNumber: true })}
          />
          {errors.budget && (
            <p className="text-red-500 text-xs">{errors.budget.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-project-start">Date de Début</Label>
          <Input id="edit-project-start" type="date" {...register('startDate')} />
          {errors.startDate && (
            <p className="text-red-500 text-xs">{errors.startDate.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-project-end">Date de Fin</Label>
          <Input id="edit-project-end" type="date" {...register('endDate')} />
          {errors.endDate && <p className="text-red-500 text-xs">{errors.endDate.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-project-status">Statut</Label>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(value) => field.onChange(value as ProjectStatus)}
            >
              <SelectTrigger id="edit-project-status">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.status && <p className="text-red-500 text-xs">{errors.status.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Mise à jour...
          </>
        ) : (
          'Mettre à jour le Projet'
        )}
      </Button>
    </form>
  );
}
