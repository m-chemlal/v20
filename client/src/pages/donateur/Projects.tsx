import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useLocation } from 'wouter';
import { Search, Eye, Download, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function DonateurProjects() {
  const { user } = useAuthStore();
  const { projects, indicators, showToast } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [, navigate] = useLocation();

  const handlePdfExport = (projectName: string) => {
    // Simulation of PDF export
    showToast({
      title: "Export PDF",
      description: `Le rapport pour le projet "${projectName}" a été exporté avec succès (simulation).`,
      variant: "success",
    });
  };

  const fundedProjects = projects.filter((p) => p.donatorIds.includes(user?.id || ''));
  const filteredProjects = fundedProjects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Projets Financés">
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des projets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project, index) => {
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
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold line-clamp-2">{project.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
		                      project.status === 'enCours'
		                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
		                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
	                    }`}>
                      {project.status}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

                  {/* Budget */}
                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
		                      <span className="text-xs text-muted-foreground flex items-center gap-1">
		                        <DollarSign className="w-3 h-3" />
		                        Investissement
		                      </span>
	                      <span className="text-sm font-semibold">{project.budget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-700 h-2 rounded-full"
                        style={{ width: `${(project.spent / project.budget) * 100}%` }}
                      />
                    </div>
		                    <p className="text-xs text-muted-foreground mt-2">
		                      {project.spent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} dépensé ({Math.round((project.spent / project.budget) * 100)}%)
		                    </p>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
		                      <span className="text-xs text-muted-foreground">Progression Globale</span>
                      <span className="text-sm font-semibold text-emerald-600">{avgProgress}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full"
                        style={{ width: `${avgProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Calendar className="w-3 h-3" />
                    {format(project.startDate, 'MMM dd')} - {format(project.endDate, 'MMM dd')}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
		                    <Button variant="outline" className="flex-1 gap-1" size="sm" onClick={() => navigate(`/donateur/projects/${project.id}`)}>
		                      <Eye className="w-4 h-4" />
		                      Voir Détails
		                    </Button>
		                    <Button variant="ghost" size="sm" onClick={() => handlePdfExport(project.name)}>
		                      <Download className="w-4 h-4" />
		                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
