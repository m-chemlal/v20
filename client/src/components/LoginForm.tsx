import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Lock, Mail, CheckCircle, Loader2 } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useLocation } from "wouter";

export function LoginForm({ onSwitchToSignup }: { onSwitchToSignup: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuthStore();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      // Redirection basée sur le rôle
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
    <Card className="w-full max-w-md mx-auto shadow-2xl border-none rounded-xl">
      <CardHeader className="space-y-1 p-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Sign in to your account
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Secure SSL Connection</span>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Enter your password"
                className="pl-10 h-12"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 transition-colors" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Signing In...
              </>
            ) : (
              "→ Sign In"
            )}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Don't have an account?{" "}
          <button type="button" onClick={onSwitchToSignup} className="text-primary hover:underline font-medium">
            Sign up
          </button>
        </div>
        <div className="mt-6 text-center text-xs text-muted-foreground space-x-4">
          <span className="inline-flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>256-bit SSL</span>
          </span>
          <span className="inline-flex items-center space-x-1">
            <Lock className="w-3 h-3 text-green-500" />
            <span>Encrypted</span>
          </span>
          <span className="inline-flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>GDPR Compliant</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
