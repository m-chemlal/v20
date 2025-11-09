import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, UserRole } from "@/types/auth";
import { Loader2 } from "lucide-react";
import { usersAPI } from '@/services/api';
import { toast } from 'sonner';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SPECIAL = "!@#$%^&*()_+-=[]{}|;:,.<>?";

const getRandomInt = (max: number) => {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % max;
  }

  return Math.floor(Math.random() * max);
};

const pickRandomChar = (source: string) => source[getRandomInt(source.length)];

const generateStrongPassword = (length = 16) => {
  const allChars = UPPERCASE + LOWERCASE + DIGITS + SPECIAL;
  const requiredChars = [
    pickRandomChar(UPPERCASE),
    pickRandomChar(LOWERCASE),
    pickRandomChar(DIGITS),
    pickRandomChar(SPECIAL),
  ];

  const remainingLength = Math.max(length, 12) - requiredChars.length;
  const passwordChars = [...requiredChars];

  for (let i = 0; i < remainingLength; i++) {
    passwordChars.push(pickRandomChar(allChars));
  }

  // Shuffle characters to avoid predictable order of required characters
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
};

export const userFormSchema = z.object({
  firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères." }),
  lastName: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  email: z.string().email({ message: "Adresse email invalide." }),
  role: z.enum(['admin', 'chef_projet', 'donateur'], { message: "Veuillez sélectionner un rôle." }),
});

type AddUserFormData = z.infer<typeof userFormSchema>;

export function AddUserForm({ onUserAdded }: { onUserAdded?: (user: User) => void }) {
  const { control, register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<AddUserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      role: 'donateur',
    }
  });
  const onSubmit = async (data: AddUserFormData) => {
    try {
      const randomPassword = generateStrongPassword();

      const response = await usersAPI.create({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        password: randomPassword,
      });
      toast.success(`Utilisateur ${data.firstName} ${data.lastName} créé.`);
      reset({
        firstName: '',
        lastName: '',
        email: '',
        role: 'donateur',
      });
      const createdUser: User = {
        id: response.id.toString(),
        email: response.email,
        firstName: response.firstName,
        lastName: response.lastName,
        name: `${response.firstName ?? ''} ${response.lastName ?? ''}`.trim(),
        role: response.role,
        createdAt: response.createdAt ? new Date(response.createdAt) : new Date(),
        avatar:
          response.avatar ??
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(response.email)}`,
      };
      onUserAdded?.(createdUser);
    } catch (error: any) {
      console.error('Failed to create user', error);
      toast.error(
        error?.response?.data?.message ??
          "Impossible de créer l'utilisateur. Vérifiez les informations fournies.",
      );
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
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? 'donateur'}
              onValueChange={(value) => field.onChange(value as UserRole)}
              onOpenChange={(open) => {
                if (!open) {
                  field.onBlur();
                }
              }}
            >
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
          )}
        />
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
