import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { Briefcase, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useRoute, useLocation } from 'wouter';
import { IndicatorEntryFormModal } from '@/components/IndicatorEntryFormModal';
import { Indicator } from '@/types/project';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function ChefProjectDetails() {
  const [match, params] = useRoute('/chef/projects/:id');
  const [, navigate] = useLocation();
  const {
    getProjectById,
    getIndicatorsByProject,
    fetchIndicatorsForProject,
    fetchIndicatorEntries,
    getIndicatorEntries,
  } = useAppStore();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);

  const projectId = params?.id ?? '';

  useEffect(() => {
    if (projectId) {
      fetchIndicatorsForProject(projectId);
    }
  }, [projectId, fetchIndicatorsForProject]);

  const project = projectId ? getProjectById(projectId) : undefined;
  const indicators = projectId ? getIndicatorsByProject(projectId) : [];

  useEffect(() => {
    indicators.forEach((indicator) => {
      fetchIndicatorEntries(indicator.id);
    });
  }, [indicators, fetchIndicatorEntries]);

  const handleUpdateValue = (indicator: Indicator) => {
    setSelectedIndicator(indicator);
    setIsModalOpen(true);
  };

  const avgProgress = indicators.length
    ? Math.round(
        indicators.reduce(
          (sum, ind) => sum + (ind.currentValue / (ind.targetValue || 1)) * 100,
          0,
        ) / indicators.length,
      )
    : 0;

  const indicatorHistory = useMemo(() => {
    return indicators.map((indicator) => {
      const entries = getIndicatorEntries(indicator.id).sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
      return {
        indicator,
        entries,
      };
    });
  }, [indicators, getIndicatorEntries]);

  if (!match || !project) {
    return (
      <DashboardLayout title="Détails du Projet">
        <div className="text-center py-10">Projet introuvable.</div>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      enCours: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
      planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
      completed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
      paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
    };
    return colors[status] || '';
  };

  return (
    <DashboardLayout title={`Projet: ${project.name}`}>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          variant="outline"
          onClick={() => navigate('/chef/dashboard')}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au Tableau de Bord
        </Button>

        {/* Project Info */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-2xl font-bold">{project.name}</h2>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${getStatusColor(project.status)}`}
            >
              {project.status}
            </span>
          </div>
          <p className="text-muted-foreground mb-6">{project.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Chef de Projet</p>
                <p className="font-semibold">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="font-semibold">
                  {project.budget.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Dépensé</p>
                <p className="font-semibold">
                  {project.spent.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Durée</p>
                <p className="font-semibold">
                  {format(project.startDate, 'MMM dd, yyyy')} -{' '}
                  {project.endDate ? format(project.endDate, 'MMM dd, yyyy') : 'À définir'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Indicators Section */}
        <h3 className="text-xl font-semibold">Indicateurs Clés ({indicators.length})</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {indicators.map((indicator) => (
            <Card key={indicator.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-lg font-semibold">{indicator.name}</h4>
                <span className="text-sm font-medium text-purple-600">
                  {Math.round(
                    (indicator.currentValue / (indicator.targetValue || 1)) * 100,
                  )}
                  %
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{indicator.description}</p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Valeur Actuelle</span>
                  <span className="font-semibold">
                    {indicator.currentValue} {indicator.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Cible</span>
                  <span className="font-semibold">
                    {indicator.targetValue} {indicator.unit}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={indicatorHistory
                      .find((entry) => entry.indicator.id === indicator.id)
                      ?.entries.map((entry) => ({
                        date: format(entry.createdAt, 'MMM dd'),
                        value: entry.value,
                      })) ?? []}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#8B5CF6" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-end mt-4">
                <Button variant="outline" onClick={() => handleUpdateValue(indicator)}>
                  Mettre à jour la valeur
                </Button>
              </div>
            </Card>
          ))}
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
