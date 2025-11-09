import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Unauthorized() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-8 text-center">
          <motion.div
            className="mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          </motion.div>

          <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page. Please contact your
            administrator if you believe this is a mistake.
          </p>

          <Button
            onClick={() => navigate('/login')}
            className="w-full gap-2"
            variant="default"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}
