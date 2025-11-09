import { useEffect, useMemo, useRef, useState } from 'react';
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
import { toast } from 'sonner';
import type { Project } from '@/types/project';
import { generateProjectReportPdf } from '@/utils/projectReports';

export default function DonateurProjects() {
  const { user } = useAuthStore();
  const fetchProjects = useAppStore((state) => state.fetchProjects);
  const loadedProjects = useAppStore((state) => state.loadedProjects);
  const getProjectsByUser = useAppStore((state) => state.getProjectsByUser);
  const indicators = useAppStore((state) => state.indicators);
  const fetchIndicatorsForProject = useAppStore(
    (state) => state.fetchIndicatorsForProject,
  );
  const fetchIndicatorEntries = useAppStore((state) => state.fetchIndicatorEntries);
  const refreshProject = useAppStore((state) => state.refreshProject);
  const [searchTerm, setSearchTerm] = useState('');
  const [, navigate] = useLocation();

  useEffect(() => {
    if (user && !loadedProjects) {
      fetchProjects();
    }
  }, [user, loadedProjects, fetchProjects]);

  const fundedProjects = useMemo(
    () => getProjectsByUser(user?.id ?? '', user?.role ?? ''),
    [getProjectsByUser, user?.id, user?.role],
  );

  const loadedIndicatorsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadedIndicatorsRef.current.clear();
  }, [user?.id]);

  useEffect(() => {
    fundedProjects.forEach((project) => {
      if (loadedIndicatorsRef.current.has(project.id)) {
        return;
      }
      loadedIndicatorsRef.current.add(project.id);
      void fetchIndicatorsForProject(project.id);
    });
  }, [fundedProjects, fetchIndicatorsForProject]);

  const filteredProjects = fundedProjects.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const generateProjectReport = async (project: Project) => {
    try {
      await refreshProject(project.id);
      const latestProject =
        useAppStore.getState().getProjectById(project.id) ?? project;
      const projectIndicators = await fetchIndicatorsForProject(project.id);
      await Promise.all(
        projectIndicators.map((indicator) => fetchIndicatorEntries(indicator.id)),
      );
      const entriesForReport = useAppStore.getState().indicatorEntries;

      generateProjectReportPdf({
        project: latestProject,
        indicators: projectIndicators,
        entries: entriesForReport,
      });
      toast.success(`Rapport PDF pour "${project.name}" téléchargé.`);
    } catch (error) {
      console.error('Failed to generate donor project report', error);
      toast.error("Impossible de générer le rapport PDF du projet.");
    }
  };

  const handleViewDetails = async (projectId: string) => {
    try {
      await refreshProject(projectId);
    } catch (error) {
      console.error('Failed to refresh project before navigation', error);
    }
    navigate(`/donateur/projects/${projectId}`);
  };

  return (
    <DashboardLayout title="Projets Financés">
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des projets..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project, index) => {
            const projectIndicators = indicators.filter((indicator) => indicator.projectId === project.id);
            const avgProgress = projectIndicators.length
              ? Math.round(
                  projectIndicators.reduce(
                    (sum, indicator) => sum + (indicator.currentValue / indicator.targetValue) * 100,
                    0,
                  ) / projectIndicators.length,
                )
              : 0;
            const allocation = project.donorAllocations?.find((donor) => donor.donorId === (user?.id ?? ''));
            const committedBudget = allocation ? allocation.committedAmount : project.budget;
            const committedSpent = allocation ? allocation.spentAmount : project.spent;
            const spentRatio = committedBudget ? committedSpent / committedBudget : 0;

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
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                        project.status === 'enCours'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="mb-4 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Investissement
                      </span>
                      <span className="text-sm font-semibold">
                        {committedBudget.toLocaleString('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                        })}
                      </span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-700 h-2 rounded-full"
                        style={{ width: `${Math.min(spentRatio * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {committedSpent.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR',
                      })}{' '}
                      dépensé ({Math.round(spentRatio * 100)}%)
                    </p>
                  </div>

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

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Calendar className="w-3 h-3" />
                    {format(project.startDate, 'MMM dd')} -{' '}
                    {project.endDate ? format(project.endDate, 'MMM dd') : 'À définir'}
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <Button
                      variant="outline"
                      className="flex-1 gap-1"
                      size="sm"
                      onClick={() => {
                        void handleViewDetails(project.id);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      Voir Détails
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        void generateProjectReport(project);
                      }}
                    >
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
