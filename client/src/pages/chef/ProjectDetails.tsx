import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import {
  Briefcase,
  DollarSign,
  Calendar,
  TrendingUp,
  FileText,
  History,
  ArrowLeft,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { useRoute, useLocation } from 'wouter';
import { IndicatorEntryFormModal } from '@/components/IndicatorEntryFormModal';
import { useState } from 'react';
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

interface IndicatorChartProps {
  indicator: Indicator;
}

const IndicatorChart = ({ indicator }: IndicatorChartProps) => {
  const { getEntriesByIndicator } = useAppStore();
  const entries = getEntriesByIndicator(indicator.id).sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

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
          <Line type="monotone" dataKey="value" stroke="#8B5CF6" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default function ChefProjectDetails() {
  const [match, params] = useRoute('/chef/projects/:id');
  const [, navigate] = useLocation();
  const { getProjectById, getIndicatorsByProject, mockIndicatorEntries } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(
    null
  );

  if (!match || !params?.id) {
    return (
      <DashboardLayout title="Détails du Projet">
        <div className="text-center py-10">Projet introuvable.</div>
      </DashboardLayout>
    );
  }

  const project = getProjectById(params.id);
  const indicators = getIndicatorsByProject(params.id);

  if (!project) {
    return (
      <DashboardLayout title="Détails du Projet">
        <div className="text-center py-10">Projet introuvable.</div>
      </DashboardLayout>
    );
  }

  const handleUpdateValue = (indicator: Indicator) => {
    setSelectedIndicator(indicator);
    setIsModalOpen(true);
  };

  const avgProgress = indicators.length
    ? Math.round(
        indicators.reduce(
          (sum, ind) => sum + (ind.currentValue / ind.targetValue) * 100,
          0
        ) / indicators.length
      )
    : 0;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      enCours: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
      planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
      completed: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
      paused: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
    };
    return colors[status] || '';
  };

  const timelineData = mockIndicatorEntries
    .filter(entry => indicators.some(ind => ind.id === entry.indicatorId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5); // Show last 5 updates

  return (
    <DashboardLayout title={`Projet: ${project.name}`}>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Button variant="outline" onClick={() => navigate('/chef/dashboard')} className="gap-2">
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
                <p className="font-semibold">{project.chefDeProjetId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="font-semibold">{project.budget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Dépensé</p>
                <p className="font-semibold">{project.spent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Durée</p>
                <p className="font-semibold">
                  {format(project.startDate, 'MMM dd, yyyy')} -{' '}
                  {format(project.endDate, 'MMM dd, yyyy')}
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

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => handleUpdateValue(indicator)}
                >
                  <TrendingUp className="w-4 h-4" />
                  Mettre à jour la valeur
                </Button>
                <Button variant="outline" size="sm" className="flex-1 gap-1">
                  <FileText className="w-4 h-4" />
                  Simuler Preuve
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Indicator History Charts */}
        <h3 className="text-xl font-semibold pt-4">Historique des Indicateurs</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {indicators.map((indicator) => (
            <IndicatorChart key={indicator.id} indicator={indicator} />
          ))}
        </div>

        {/* Timeline of Recent Updates */}
        <h3 className="text-xl font-semibold pt-4">Chronologie des Mises à Jour Récentes</h3>
        <Card className="p-6">
          <div className="space-y-4">
            {timelineData.length > 0 ? (
              timelineData.map((entry, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary mt-1" />
                    {index < timelineData.length - 1 && (
                      <div className="w-px h-full bg-border" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      Mise à jour de l'indicateur{' '}
                      <span className="text-primary">
                        {indicators.find(i => i.id === entry.indicatorId)?.name}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Nouvelle valeur: {entry.value}{' '}
                      {indicators.find(i => i.id === entry.indicatorId)?.unit}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {format(entry.createdAt, 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Aucune mise à jour récente.</p>
            )}
          </div>
        </Card>
      </motion.div>

      <IndicatorEntryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        indicator={selectedIndicator}
      />
    </DashboardLayout>
  );
}
