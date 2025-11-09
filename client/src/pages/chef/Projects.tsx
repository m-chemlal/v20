import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useLocation } from 'wouter';
import { BarChart3, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function ChefProjects() {
  const { user } = useAuthStore();
  const { projects, indicators } = useAppStore();
  const [, navigate] = useLocation();

  const myProjects = projects.filter((p) => p.chefProjectId === user?.id);

  return (
    <DashboardLayout title="My Projects">
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myProjects.map((project, index) => {
            const projectIndicators = indicators.filter((i) => i.projectId === project.id);
            const avgProgress = projectIndicators.length
              ? Math.round(
                  projectIndicators.reduce((sum, ind) => sum + (ind.currentValue / ind.targetValue) * 100, 0) /
                    projectIndicators.length
                )
              : 0;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
                  <h3 className="font-semibold mb-2 line-clamp-2">{project.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        Indicators
                      </span>
                      <span className="font-semibold">{projectIndicators.length}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        Budget
                      </span>
                      <span className="font-semibold">${project.budget}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-emerald-600">{avgProgress}%</span>
                    </div>
                  </div>

                  <div className="w-full bg-border rounded-full h-2 mb-4">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full"
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Calendar className="w-3 h-3" />
                    {format(project.startDate, 'MMM dd')} - {format(project.endDate, 'MMM dd')}
                  </div>

	                  <Button variant="outline" className="w-full mt-auto" onClick={() => navigate(`/chef/projects/${project.id}`)}>
	                    View Details
	                  </Button>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
