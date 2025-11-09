import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AuthForms } from '@/components/AuthForms';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

export default function Login() {
  const [, navigate] = useLocation();

  const { isAuthenticated, user } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRoutes: Record<string, string> = {
        admin: '/admin/dashboard',
        chef_projet: '/chef/dashboard',
        donateur: '/donateur/dashboard',
      };
      navigate(roleRoutes[user.role] || '/');
    }
  }, [isAuthenticated, user, navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="text-center mb-8" variants={itemVariants}>
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">IT</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            ImpactTracker
          </h1>
          <p className="text-muted-foreground">
            NGO Project Management Portal
          </p>
        </motion.div>

        {/* Auth Forms */}
        <motion.div variants={itemVariants}>
          <AuthForms />
        </motion.div>

        {/* Footer Info */}
        <motion.div
          className="mt-6 text-center text-sm text-muted-foreground"
          variants={itemVariants}
        >
          <p>
            This is a demo application. All data is stored locally in your
            browser.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
