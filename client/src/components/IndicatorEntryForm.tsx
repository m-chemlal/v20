import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { Indicator } from "@/types/project";
import { useState } from "react";

const formSchema = z.object({
  indicatorId: z.string().min(1, { message: "Veuillez sélectionner un indicateur." }),
  value: z.number().min(0, { message: "La valeur doit être positive." }),
  notes: z.string().optional(),
  evidenceFile: z.any().optional(), // File upload simulation
});

type IndicatorEntryFormData = z.infer<typeof formSchema>;

export function IndicatorEntryForm({ onEntryAdded, indicators }: { onEntryAdded: () => void, indicators: Indicator[] }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<IndicatorEntryFormData>({
    resolver: zodResolver(formSchema),
  });
  const { showToast } = useAppStore();
  const [fileUploaded, setFileUploaded] = useState(false);

  const onSubmit = async (data: IndicatorEntryFormData) => {
    // In a real application, this would be an API call to the backend to create an indicator entry.
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log("Simulating indicator entry:", data);

      showToast({
        title: "Entrée d'indicateur enregistrée",
        description: `La valeur ${data.value} a été enregistrée pour l'indicateur.`,
        variant: "success",
      });
      onEntryAdded();
    } catch (error) {
      showToast({
        title: "Erreur",
        description: "Échec de l'enregistrement de l'entrée d'indicateur.",
        variant: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="indicatorId">Indicateur</Label>
        <Select onValueChange={(value) => register("indicatorId").onChange({ target: { value } })}>
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
        {errors.indicatorId && <p className="text-red-500 text-xs">{errors.indicatorId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="value">Nouvelle Valeur</Label>
        <Input id="value" type="number" {...register("value", { valueAsNumber: true })} />
        {errors.value && <p className="text-red-500 text-xs">{errors.value.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes/Commentaires</Label>
        <Textarea id="notes" {...register("notes")} rows={3} />
        {errors.notes && <p className="text-red-500 text-xs">{errors.notes.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="evidenceFile">Preuve (Simulation d'Upload)</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="evidenceFile"
            type="file"
            className="hidden"
            {...register("evidenceFile")}
            onChange={() => setFileUploaded(true)}
          />
          <Label htmlFor="evidenceFile" className="flex-1">
            <Button type="button" variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              {fileUploaded ? "Fichier sélectionné" : "Sélectionner un fichier"}
            </Button>
          </Label>
          {fileUploaded && <CheckCircle className="w-5 h-5 text-green-500" />}
        </div>
        <p className="text-xs text-muted-foreground">Ceci simule l'upload d'une preuve (photo, document, etc.).</p>
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
