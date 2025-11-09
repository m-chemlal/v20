import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <motion.div
        className="w-full max-w-md text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-8">
          <motion.div
            className="mb-6"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 className="text-6xl font-bold text-purple-500 mb-2">404</h1>
            <h2 className="text-2xl font-bold">Page Not Found</h2>
          </motion.div>

          <p className="text-muted-foreground mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>

          <Button
            onClick={() => navigate("/login")}
            className="w-full gap-2"
            variant="default"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </Button>
        </Card>
      </motion.div>
    </div>
  );
}
