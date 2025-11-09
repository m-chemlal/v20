import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { IndicatorEntryFormModal } from '@/components/IndicatorEntryFormModal';
import { Indicator } from '@/types/project';
import { Plus, TrendingUp } from 'lucide-react';

export default function ChefIndicators() {
  const { user } = useAuthStore();
  const {
    projects,
    indicators,
    fetchIndicatorsForProject,
  } = useAppStore();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);

  const myProjects = projects.filter((p) => p.chefProjectId === user?.id);

  useEffect(() => {
    myProjects.forEach((project) => {
      fetchIndicatorsForProject(project.id);
    });
  }, [myProjects, fetchIndicatorsForProject]);

  const myIndicators = indicators.filter((indicator) =>
    myProjects.some((project) => project.id === indicator.projectId),
  );

  const filteredIndicators = selectedProject
    ? myIndicators.filter((indicator) => indicator.projectId === selectedProject)
    : myIndicators;

  const handleUpdateValue = (indicator: Indicator) => {
    setSelectedIndicator(indicator);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout title="Indicators">
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Manage Indicators</h2>
            <p className="text-sm text-muted-foreground">
              Track progress on your project indicators
            </p>
          </div>
          <Button className="gap-2" disabled>
            <Plus className="w-4 h-4" />
            Add Indicator (Admin Only)
          </Button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedProject === null ? 'default' : 'outline'}
            onClick={() => setSelectedProject(null)}
            size="sm"
          >
            All Projects
          </Button>
          {myProjects.map((project) => (
            <Button
              key={project.id}
              variant={selectedProject === project.id ? 'default' : 'outline'}
              onClick={() => setSelectedProject(project.id)}
              size="sm"
            >
              {project.name.substring(0, 20)}...
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredIndicators.map((indicator, index) => {
            const progress = indicator.targetValue
              ? Math.round((indicator.currentValue / indicator.targetValue) * 100)
              : 0;

            return (
              <motion.div
                key={indicator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold">{indicator.name}</h3>
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">
                    {indicator.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current</span>
                      <span className="font-semibold">
                        {indicator.currentValue} {indicator.unit}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-semibold">
                        {indicator.targetValue} {indicator.unit}
                      </span>
                    </div>

                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-700 h-2 rounded-full"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold text-purple-600">{progress}%</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleUpdateValue(indicator)}
                    >
                      Update Value
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {selectedIndicator && (
        <IndicatorEntryFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          indicator={selectedIndicator}
        />
      )}
    </DashboardLayout>
  );
}
