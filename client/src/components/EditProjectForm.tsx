import { useEffect, useMemo, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { fetchChefsDeProjet, fetchDonateurs, useAppStore } from '@/store/appStore';

const donorAllocationSchema = z
  .object({
    userId: z.string(),
    committedAmount: z.coerce.number().min(0, {
      message: 'Le montant engagé doit être positif.',
    }),
    spentAmount: z.coerce.number().min(0, {
      message: 'Le montant dépensé doit être positif.',
    }),
  })
  .superRefine((value, ctx) => {
    if (value.spentAmount > value.committedAmount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le montant dépensé ne peut pas dépasser le montant engagé.',
        path: ['spentAmount'],
      });
    }
  });

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
  donors: z.array(donorAllocationSchema).default([]),
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
  const [donors, setDonors] = useState<Array<{ id: string; name: string; email?: string }>>([]);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
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
      donors: (project.donorAllocations ?? []).map((allocation) => ({
        userId: allocation.donorId,
        committedAmount: allocation.committedAmount,
        spentAmount: allocation.spentAmount,
      })),
    },
  });

  useEffect(() => {
    fetchChefsDeProjet().then(setChefs);
  }, []);

  useEffect(() => {
    fetchDonateurs().then(setDonors);
  }, []);

  const selectedDonors = watch('donors');
  const donorTotals = useMemo(() => {
    const allocations = Array.isArray(selectedDonors) ? selectedDonors : [];
    const committed = allocations.reduce((sum, donor) => {
      const amount = Number(donor.committedAmount ?? 0);
      return Number.isFinite(amount) ? sum + amount : sum;
    }, 0);
    const spent = allocations.reduce((sum, donor) => {
      const amount = Number(donor.spentAmount ?? 0);
      return Number.isFinite(amount) ? sum + amount : sum;
    }, 0);
    return { committed, spent };
  }, [selectedDonors]);

  const donorOptions = useMemo(() => {
    return donors.map((donor) => ({
      ...donor,
      label: donor.email ? `${donor.name} (${donor.email})` : donor.name,
    }));
  }, [donors]);

  useEffect(() => {
    reset({
      name: project.name,
      description: project.description,
      status: project.status,
      chefDeProjetId: project.chefProjectId,
      budget: project.budget,
      startDate: formatDateInput(project.startDate),
      endDate: formatDateInput(project.endDate),
      donors: (project.donorAllocations ?? []).map((allocation) => ({
        userId: allocation.donorId,
        committedAmount: allocation.committedAmount,
        spentAmount: allocation.spentAmount,
      })),
    });
  }, [project, reset]);

  const onSubmit = async (data: EditProjectFormData) => {
    const donorAllocations = data.donors.map((donor) => ({
      donorId: donor.userId,
      committedAmount: donor.committedAmount,
      spentAmount: donor.spentAmount,
    }));
    const totalSpent = donorAllocations.reduce(
      (sum, donor) => sum + (Number.isFinite(donor.spentAmount) ? donor.spentAmount : 0),
      0,
    );

    const updated = await updateProject(project.id, {
      name: data.name,
      description: data.description,
      status: data.status as ProjectStatus,
      startDate: data.startDate,
      endDate: data.endDate ? data.endDate : null,
      budget: data.budget,
      spent: Math.max(project.spent ?? 0, totalSpent),
      chefProjectId: data.chefDeProjetId,
      donorAllocations,
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
        donors: (updated.donorAllocations ?? []).map((allocation) => ({
          userId: allocation.donorId,
          committedAmount: allocation.committedAmount,
          spentAmount: allocation.spentAmount,
        })),
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

      <Controller
        control={control}
        name="donors"
        render={({ field }) => {
          const value = Array.isArray(field.value) ? field.value : [];
          const donorsErrors = errors.donors;
          return (
            <div className="space-y-3">
              <Label>Financement des Donateurs</Label>
              <div className="rounded-md border p-3 space-y-3 max-h-72 overflow-y-auto">
                {donorOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aucun donateur disponible pour le moment.
                  </p>
                ) : (
                  donorOptions.map((donor) => {
                    const entry = value.find((item) => item.userId === donor.id);
                    const entryIndex = entry
                      ? value.findIndex((item) => item.userId === donor.id)
                      : -1;
                    const entryError =
                      Array.isArray(donorsErrors) && entryIndex >= 0
                        ? donorsErrors[entryIndex]
                        : undefined;
                    return (
                      <div key={donor.id} className="space-y-2 border-b pb-3 last:border-none last:pb-0">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`edit-donor-${donor.id}`}
                            checked={Boolean(entry)}
                            onCheckedChange={(checked) => {
                              const current = Array.isArray(field.value) ? field.value : [];
                              if (checked === true && !entry) {
                                field.onChange([
                                  ...current,
                                  { userId: donor.id, committedAmount: 0, spentAmount: 0 },
                                ]);
                              }
                              if (checked !== true && entry) {
                                field.onChange(current.filter((item) => item.userId !== donor.id));
                              }
                            }}
                          />
                          <Label htmlFor={`edit-donor-${donor.id}`} className="text-sm font-medium">
                            {donor.label}
                          </Label>
                        </div>

                        {entry && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                            <div className="space-y-1">
                              <Label
                                htmlFor={`edit-donor-${donor.id}-committed`}
                                className="text-xs uppercase tracking-wide"
                              >
                                Montant engagé (€)
                              </Label>
                              <Input
                                id={`edit-donor-${donor.id}-committed`}
                                type="number"
                                value={entry.committedAmount}
                                onChange={(event) => {
                                  const next = Number(event.target.value);
                                  const updated = value.map((item) =>
                                    item.userId === donor.id
                                      ? {
                                          ...item,
                                          committedAmount: Number.isNaN(next) ? 0 : next,
                                        }
                                      : item,
                                  );
                                  field.onChange(updated);
                                }}
                              />
                              {entryError?.committedAmount && (
                                <p className="text-xs text-red-500">
                                  {entryError.committedAmount.message}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <Label
                                htmlFor={`edit-donor-${donor.id}-spent`}
                                className="text-xs uppercase tracking-wide"
                              >
                                Montant dépensé (€)
                              </Label>
                              <Input
                                id={`edit-donor-${donor.id}-spent`}
                                type="number"
                                value={entry.spentAmount}
                                onChange={(event) => {
                                  const next = Number(event.target.value);
                                  const updated = value.map((item) =>
                                    item.userId === donor.id
                                      ? {
                                          ...item,
                                          spentAmount: Number.isNaN(next) ? 0 : next,
                                        }
                                      : item,
                                  );
                                  field.onChange(updated);
                                }}
                              />
                              {entryError?.spentAmount && (
                                <p className="text-xs text-red-500">{entryError.spentAmount.message}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Total engagé :{' '}
                <span className="font-semibold">
                  {donorTotals.committed.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </span>{' '}
                • Dépensé :{' '}
                <span className="font-semibold">
                  {donorTotals.spent.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </span>
              </div>
              {typeof donorsErrors?.message === 'string' && (
                <p className="text-xs text-red-500">{donorsErrors.message}</p>
              )}
            </div>
          );
        }}
      />

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
