import { useEffect, useState } from 'react';
import { useForm, Controller, Resolver } from 'react-hook-form';
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
import { useAppStore, fetchChefsDeProjet } from '@/store/appStore';
import { Project, ProjectStatus } from '@/types/project';

const PROJECT_STATUSES = ['planning', 'enCours', 'completed', 'paused'] as const;

const formSchema = z.object({
  name: z.string().min(5, {
    message: 'Le nom du projet doit contenir au moins 5 caractères.',
  }),
  description: z.string().min(20, {
    message: 'La description doit contenir au moins 20 caractères.',
  }),
  chefDeProjetId: z.string().min(1, {
    message: 'Veuillez assigner un Chef de Projet.',
  }),
  budget: z.coerce.number()
    .refine((value) => !Number.isNaN(value), {
      message: 'Le budget doit être un nombre.',
    })
    .min(1000, { message: "Le budget doit être d'au moins 1000." }),
  status: z.enum(PROJECT_STATUSES, {
    message: 'Veuillez sélectionner un statut.',
  }),
});

type AddProjectFormData = z.infer<typeof formSchema>;

export function AddProjectForm({ onProjectAdded }: { onProjectAdded?: (project: Project) => void }) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AddProjectFormData, any, AddProjectFormData>({
    resolver: zodResolver(formSchema) as Resolver<AddProjectFormData, any, AddProjectFormData>,
    defaultValues: {
      status: 'enCours',
    },
  });
  const { createProject } = useAppStore();
  const [chefs, setChefs] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchChefsDeProjet().then(setChefs);
  }, []);

  const onSubmit = async (data: AddProjectFormData) => {
    const created = await createProject({
      name: data.name,
      description: data.description,
      status: data.status as ProjectStatus,
      startDate: new Date(),
      endDate: null,
      budget: data.budget,
      spent: 0,
      adminId: null,
      chefProjectId: data.chefDeProjetId,
      donatorIds: [],
    });

    if (created) {
      reset({ status: 'enCours' });
      onProjectAdded?.(created);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom du Projet</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register('description')} rows={4} />
        {errors.description && (
          <p className="text-red-500 text-xs">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="chefDeProjetId">Chef de Projet</Label>
          <Controller
            control={control}
            name="chefDeProjetId"
            render={({ field }) => (
              <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Assigner un Chef" />
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
          <Label htmlFor="budget">Budget (€)</Label>
          <Input
            id="budget"
            type="number"
            {...register('budget', { valueAsNumber: true })}
          />
          {errors.budget && (
            <p className="text-red-500 text-xs">{errors.budget.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Statut</Label>
        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={(value) => field.onChange(value as ProjectStatus)}>
              <SelectTrigger>
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
            Création...
          </>
        ) : (
          'Créer le Projet'
        )}
      </Button>
    </form>
  );
}
