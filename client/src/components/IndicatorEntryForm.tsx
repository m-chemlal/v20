import { useForm, Controller, Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Indicator } from '@/types/project';
import { useState } from 'react';
import { toast } from 'sonner';

const formSchema = z.object({
  indicatorId: z.string().min(1, { message: 'Veuillez sélectionner un indicateur.' }),
  value: z.coerce.number()
    .refine((val) => !Number.isNaN(val), {
      message: 'La valeur doit être un nombre.',
    })
    .min(0, { message: 'La valeur doit être positive.' }),
  notes: z.string().optional(),
  evidenceFile: z.any().optional(),
});

type IndicatorEntryFormData = z.infer<typeof formSchema>;

export function IndicatorEntryForm({
  onEntryAdded,
  indicators,
}: {
  onEntryAdded: () => void;
  indicators: Indicator[];
}) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<IndicatorEntryFormData, any, IndicatorEntryFormData>({
    resolver: zodResolver(formSchema) as Resolver<IndicatorEntryFormData, any, IndicatorEntryFormData>,
  });
  const { updateIndicatorValue } = useAppStore();
  const [fileUploaded, setFileUploaded] = useState(false);

  const onSubmit = async (data: IndicatorEntryFormData) => {
    const indicator = indicators.find((item) => item.id === data.indicatorId);
    if (!indicator) {
      toast.error('Indicateur introuvable.');
      return;
    }

    try {
      await updateIndicatorValue(indicator.id, {
        value: data.value,
        notes: data.notes,
      });
      toast.success("Entrée d'indicateur enregistrée.");
      reset();
      setFileUploaded(false);
      onEntryAdded();
    } catch (error) {
      toast.error("Échec de l'enregistrement de l'entrée d'indicateur.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="indicatorId">Indicateur</Label>
        <Controller
          control={control}
          name="indicatorId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={(value) => field.onChange(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un indicateur" />
              </SelectTrigger>
              <SelectContent>
                {indicators.map((indicator) => (
                  <SelectItem key={indicator.id} value={indicator.id}>
                    {indicator.name} ({indicator.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.indicatorId && (
          <p className="text-red-500 text-xs">{errors.indicatorId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Nouvelle Valeur</Label>
        <Input id="value" type="number" {...register('value', { valueAsNumber: true })} />
        {errors.value && <p className="text-red-500 text-xs">{errors.value.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes/Commentaires</Label>
        <Textarea id="notes" {...register('notes')} rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="evidenceFile">Preuve (Simulation d'Upload)</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="evidenceFile"
            type="file"
            className="hidden"
            {...register('evidenceFile')}
            onChange={() => setFileUploaded(true)}
          />
          <Label htmlFor="evidenceFile" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              {fileUploaded ? 'Fichier sélectionné' : 'Sélectionner un fichier'}
            </Button>
          </Label>
          {fileUploaded && <CheckCircle className="w-5 h-5 text-green-500" />}
        </div>
        <p className="text-xs text-muted-foreground">
          Ceci simule l'upload d'une preuve (photo, document, etc.).
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Enregistrement...
          </>
        ) : (
          "Enregistrer l'Entrée"
        )}
      </Button>
    </form>
  );
}
