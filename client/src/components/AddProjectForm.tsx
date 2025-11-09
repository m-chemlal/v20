import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { ProjectStatus } from "@/types/project";
const PROJECT_STATUSES = ['planning', 'enCours', 'completed', 'paused'] as const;

const formSchema = z.object({
  name: z.string().min(5, { message: "Le nom du projet doit contenir au moins 5 caractères." }),
  description: z.string().min(20, { message: "La description doit contenir au moins 20 caractères." }),
  chefDeProjetId: z.string().min(1, { message: "Veuillez assigner un Chef de Projet." }),
  budget: z.number().min(1000, { message: "Le budget doit être d'au moins 1000." }),
  status: z.enum(PROJECT_STATUSES, { message: "Veuillez sélectionner un statut." }),
});

type AddProjectFormData = z.infer<typeof formSchema>;

export function AddProjectForm({ onProjectAdded }: { onProjectAdded: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AddProjectFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'enCours',
    }
  });
  const { showToast } = useAppStore();

  // Mock data for Chef de Projet selection
  const mockChefs = [
    { id: "chef2", name: "Bob Smith" },
    { id: "chef4", name: "David Brown" },
  ];

  const onSubmit = async (data: AddProjectFormData) => {
    // In a real application, this would be an API call to the backend to create a project.
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log("Simulating project creation:", data);

      showToast({
        title: "Projet créé",
        description: `Le projet "${data.name}" a été créé avec succès.`,
        variant: "success",
      });
      onProjectAdded();
    } catch (error) {
      showToast({
        title: "Erreur",
        description: "Échec de la création du projet.",
        variant: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom du Projet</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} rows={4} />
        {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="chefDeProjetId">Chef de Projet</Label>
          <Select onValueChange={(value) => register("chefDeProjetId").onChange({ target: { value } })}>
            <SelectTrigger>
              <SelectValue placeholder="Assigner un Chef" />
            </SelectTrigger>
            <SelectContent>
              {mockChefs.map((chef) => (
                <SelectItem key={chef.id} value={chef.id}>
                  {chef.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.chefDeProjetId && <p className="text-red-500 text-xs">{errors.chefDeProjetId.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget">Budget (€)</Label>
          <Input id="budget" type="number" {...register("budget", { valueAsNumber: true })} />
          {errors.budget && <p className="text-red-500 text-xs">{errors.budget.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Statut</Label>
        <Select onValueChange={(value) => register("status").onChange({ target: { value } })} defaultValue="enCours">
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
        {errors.status && <p className="text-red-500 text-xs">{errors.status.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Création...
          </>
        ) : (
          "Créer le Projet"
        )}
      </Button>
    </form>
  );
}
