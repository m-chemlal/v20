import { useEffect, useMemo, useRef } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { DollarSign, Calendar, TrendingUp, ArrowLeft, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useRoute, useLocation } from 'wouter';
import { Indicator, IndicatorEntry } from '@/types/project';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { generateProjectReportPdf } from '@/utils/projectReports';

interface IndicatorChartProps {
  indicator: Indicator;
  entries: IndicatorEntry[];
}

const IndicatorChart = ({ indicator, entries }: IndicatorChartProps) => {
  const chartData = entries.map((entry) => ({
    date: format(entry.createdAt, 'MMM dd'),
    value: entry.value,
  }));

  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-2">{indicator.name}</h4>
      <p className="text-sm text-muted-foreground mb-4">
        Cible: {indicator.targetValue} {indicator.unit}
      </p>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#10B981" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default function DonateurProjectDetails() {
  const [match, params] = useRoute('/donateur/projects/:id');
  const [, navigate] = useLocation();
  const projectId = params?.id ?? '';
  const isInvalidRoute = !match || !projectId;
  const fetchIndicatorEntries = useAppStore((state) => state.fetchIndicatorEntries);
  const fetchIndicatorsForProject = useAppStore((state) => state.fetchIndicatorsForProject);
  const refreshProject = useAppStore((state) => state.refreshProject);
  const indicatorEntries = useAppStore((state) => state.indicatorEntries);
  const project = useAppStore((state) =>
    projectId ? state.getProjectById(projectId) : undefined,
  );
  const { user } = useAuthStore();
  const allIndicators = useAppStore((state) => state.indicators);
  const projectIndicators = useMemo(
    () =>
      projectId
        ? allIndicators.filter((indicator) => indicator.projectId === projectId)
        : [],
    [allIndicators, projectId],
  );
  const loadedIndicatorsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!projectId || project) {
      return;
    }
    void refreshProject(projectId);
  }, [projectId, project, refreshProject]);

  useEffect(() => {
    if (!projectId) {
      return;
    }
    void fetchIndicatorsForProject(projectId);
  }, [projectId, fetchIndicatorsForProject]);

  useEffect(() => {
    loadedIndicatorsRef.current.clear();
  }, [projectId]);

  useEffect(() => {
    if (projectIndicators.length === 0) {
      return;
    }

    projectIndicators.forEach((indicator) => {
      if (loadedIndicatorsRef.current.has(indicator.id)) {
        return;
      }
      loadedIndicatorsRef.current.add(indicator.id);
      void fetchIndicatorEntries(indicator.id);
    });
  }, [projectIndicators, fetchIndicatorEntries]);

  if (isInvalidRoute) {
    return (
      <DashboardLayout title="Détails du Projet">
        <div className="text-center py-10">Projet introuvable.</div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout title="Détails du Projet">
        <div className="text-center py-10">Chargement du projet...</div>
      </DashboardLayout>
    );
  }

  const allocation = project.donorAllocations?.find((donor) => donor.donorId === (user?.id ?? ''));
  const committedBudget = allocation ? allocation.committedAmount : project.budget;
  const committedSpent = allocation ? allocation.spentAmount : project.spent;

  const entriesByIndicator = useMemo(() => {
    const grouped = new Map<string, IndicatorEntry[]>();
    projectIndicators.forEach((indicator) => {
      const entries = indicatorEntries
        .filter((entry) => entry.indicatorId === indicator.id)
        .slice()
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      grouped.set(indicator.id, entries);
    });
    return grouped;
  }, [projectIndicators, indicatorEntries]);

  const avgProgress = projectIndicators.length
    ? Math.round(
        projectIndicators.reduce(
          (sum, ind) => sum + (ind.currentValue / ind.targetValue) * 100,
          0
        ) / projectIndicators.length
      )
    : 0;

  const handlePdfExport = async () => {
    if (!params?.id || !project) {
      toast.error('Projet introuvable pour la génération du rapport.');
      return;
    }

    try {
      await refreshProject(params.id);
      const latestProject = useAppStore.getState().getProjectById(params.id);
      const latestIndicators = await fetchIndicatorsForProject(params.id);
      await Promise.all(
        latestIndicators.map((indicator) => fetchIndicatorEntries(indicator.id)),
      );
      const entriesForReport = useAppStore.getState().indicatorEntries;

      if (!latestProject) {
        throw new Error('Project not found after refresh');
      }

      generateProjectReportPdf({
        project: latestProject,
        indicators: latestIndicators,
        entries: entriesForReport,
      });
      toast.success('Rapport PDF téléchargé avec succès.');
    } catch (error) {
      console.error('Failed to generate donor project PDF', error);
      toast.error("Impossible de générer le rapport PDF du projet.");
    }
  };

  return (
    <DashboardLayout title={`Projet: ${project.name}`}>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            onClick={() => navigate('/donateur/projects')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux Projets
          </Button>
          <Button onClick={handlePdfExport} className="gap-2">
            <Download className="w-4 h-4" />
            Exporter le rapport PDF
          </Button>
        </div>

        {/* Project Info */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold">{project.name}</h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold capitalize bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200`}
            >
              {project.status}
            </span>
          </div>
          <p className="text-muted-foreground mb-6">{project.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Budget engagé</p>
                <p className="font-semibold">
                  {committedBudget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Dépensé</p>
                <p className="font-semibold">
                  {committedSpent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Progression Moyenne</p>
                <p className="font-semibold text-emerald-600">{avgProgress}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Durée</p>
                <p className="font-semibold">
                  {format(project.startDate, 'MMM dd, yyyy')} -{' '}
                  {project.endDate ? format(project.endDate, 'MMM dd, yyyy') : 'En cours'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Indicators Section */}
        <h3 className="text-xl font-semibold">
          Indicateurs Clés ({projectIndicators.length})
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projectIndicators.map((indicator) => (
            <Card key={indicator.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-semibold">{indicator.name}</h4>
                <span className="text-sm font-medium text-purple-600">
                  {Math.round(
                    (indicator.currentValue / indicator.targetValue) * 100
                  )}
                  %
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {indicator.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Valeur Actuelle:</span>
                  <span className="font-medium">
                    {indicator.currentValue} {indicator.unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Valeur Cible:</span>
                  <span className="font-medium">
                    {indicator.targetValue} {indicator.unit}
                  </span>
                </div>
              </div>

              <div className="w-full bg-border rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-purple-500 to-purple-700 h-2 rounded-full"
                  style={{
                    width: `${Math.min(
                      (indicator.currentValue / indicator.targetValue) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Indicator History Charts */}
        <h3 className="text-xl font-semibold pt-4">Historique des Indicateurs</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projectIndicators.map((indicator) => (
            <IndicatorChart
              key={indicator.id}
              indicator={indicator}
              entries={entriesByIndicator.get(indicator.id) ?? []}
            />
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
