import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, UserRole } from "@/types/auth";
import { Loader2 } from "lucide-react";
import { usersAPI } from "@/services/api";
import { toast } from "sonner";
import { userFormSchema } from "./AddUserForm";

const editUserSchema = userFormSchema.extend({
  password: z
    .string()
    .min(8, { message: "Le mot de passe doit contenir au moins 8 caractères." })
    .optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserFormProps {
  user: User;
  onUserUpdated?: (user: User) => void;
}

export function EditUserForm({ user, onUserUpdated }: EditUserFormProps) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  });

  useEffect(() => {
    reset({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      password: undefined,
    });
  }, [user, reset]);

  const onSubmit = async (data: EditUserFormData) => {
    try {
      const payload = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        prenom: data.firstName,
        nom: data.lastName,
        role: data.role,
        ...(data.password ? { password: data.password } : {}),
      };

      const response = await usersAPI.update(user.id, payload);

      const firstName = response.firstName ?? response.prenom ?? '';
      const lastName = response.lastName ?? response.nom ?? '';
      const updatedUser: User = {
        id: response.id.toString(),
        email: response.email,
        firstName,
        lastName,
        name: `${firstName ?? ""} ${lastName ?? ""}`.trim(),
        role: response.role,
        createdAt: response.createdAt
          ? new Date(response.createdAt)
          : response.date_creation
          ? new Date(response.date_creation)
          : user.createdAt,
        avatar:
          response.avatar ??
          response.photo_profil ??
          user.avatar ??
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(response.email)}`,
      };

      toast.success(`Utilisateur ${updatedUser.name} mis à jour.`);
      onUserUpdated?.(updatedUser);
      reset({
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        password: undefined,
      });
    } catch (error: any) {
      console.error('Failed to update user', error);
      toast.error(
        error?.response?.data?.message ??
          "Impossible de mettre à jour l'utilisateur. Vérifiez les informations fournies.",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="edit-firstName">Prénom</Label>
          <Input id="edit-firstName" {...register("firstName")} />
          {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-lastName">Nom</Label>
          <Input id="edit-lastName" {...register("lastName")} />
          {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-email">Email</Label>
        <Input id="edit-email" type="email" {...register("email")} />
        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-role">Rôle</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? user.role}
              onValueChange={(value) => field.onChange(value as UserRole)}
              onOpenChange={(open) => {
                if (!open) {
                  field.onBlur();
                }
              }}
            >
              <SelectTrigger id="edit-role">
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
          )}
        />
        {errors.role && <p className="text-red-500 text-xs">{errors.role.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-password">Nouveau mot de passe (optionnel)</Label>
        <Input
          id="edit-password"
          type="password"
          placeholder="Laisser vide pour conserver"
          {...register("password", { setValueAs: (value) => value?.trim() || undefined })}
        />
        {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Mise à jour...
          </>
        ) : (
          "Mettre à jour l'utilisateur"
        )}
      </Button>
    </form>
  );
}

