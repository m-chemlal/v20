import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Lock, Mail, User, CheckCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useLocation } from "wouter";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";

export function SignupForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signup, isLoading, error } = useAuthStore();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await signup({ firstName, lastName, email, password });
    if (success) {
      // Redirection après inscription (qui connecte automatiquement)
      const user = useAuthStore.getState().user;
      if (user) {
        const roleRoutes: Record<string, string> = {
          admin: '/admin/dashboard',
          chef_projet: '/chef/dashboard',
          donateur: '/donateur/dashboard',
        };
        navigate(roleRoutes[user.role] || '/');
      }
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-2xl border-none rounded-xl">
      <CardHeader className="space-y-1 p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <User className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Join ImpactTracker to start managing your projects.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                className="h-10"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                className="h-10"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10 h-12"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Choose a strong password"
                className="pl-10 h-12"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <PasswordStrengthIndicator password={password} />
          </div>
          <Button type="submit" className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 transition-colors" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <button onClick={onSwitchToLogin} className="text-primary hover:underline font-medium">
            Sign In
          </button>
        </div>
        <div className="mt-6 text-center text-xs text-muted-foreground space-x-4">
          <span className="inline-flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>Secure</span>
          </span>
          <span className="inline-flex items-center space-x-1">
            <Lock className="w-3 h-3 text-green-500" />
            <span>Encrypted</span>
          </span>
          <span className="inline-flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>GDPR</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
