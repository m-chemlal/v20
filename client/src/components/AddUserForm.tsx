import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole } from "@/types/auth";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/store/appStore";

const formSchema = z.object({
  firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères." }),
  lastName: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  email: z.string().email({ message: "Adresse email invalide." }),
  role: z.enum(['admin', 'chef_projet', 'donateur'], { message: "Veuillez sélectionner un rôle." }),
  // Password is auto-generated, but we keep it in the schema for validation if we were to use it
  password: z.string().optional(),
});

type AddUserFormData = z.infer<typeof formSchema>;

export function AddUserForm({ onUserAdded }: { onUserAdded: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AddUserFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'donateur',
    }
  });
  const { showToast } = useAppStore();

  const onSubmit = async (data: AddUserFormData) => {
    // In a real application, this would be an API call to the backend to create a user.
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real app, the admin would create the user, not sign them up.
      // Since we don't have a backend, we'll just show a success message.
      console.log("Simulating user creation:", data);

      showToast({
        title: "Utilisateur créé",
        description: `L'utilisateur ${data.firstName} ${data.lastName} a été créé avec le rôle ${data.role}.`,
        variant: "success",
      });
      onUserAdded();
    } catch (error) {
      showToast({
        title: "Erreur",
        description: "Échec de la création de l'utilisateur.",
        variant: "error",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input id="firstName" {...register("firstName")} />
          {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input id="lastName" {...register("lastName")} />
          {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rôle</Label>
        <Select onValueChange={(value) => register("role").onChange({ target: { value } })} defaultValue="donateur">
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un rôle" />
          </SelectTrigger>
          <SelectContent>
            {['admin', 'chef_projet', 'donateur'].map((role) => (
              <SelectItem key={role} value={role}>
                {role.replace('_', ' ').toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.role && <p className="text-red-500 text-xs">{errors.role.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe (Généré)</Label>
        <Input id="password" type="text" value="Auto-Generated-Password" disabled />
        <p className="text-xs text-muted-foreground">Le mot de passe sera généré automatiquement et envoyé à l'utilisateur.</p>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Création...
          </>
        ) : (
          "Créer l'utilisateur"
        )}
      </Button>
    </form>
  );
}
