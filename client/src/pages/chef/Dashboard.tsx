import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { TrendingUp, Briefcase, BarChart3, Calendar } from 'lucide-react';
import { IndicatorEntryForm } from '@/components/IndicatorEntryForm';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

export default function ChefDashboard() {
  const { user } = useAuthStore();
  const { projects, indicators } = useAppStore();

  const myProjects = projects.filter((p) => p.chefProjectId === user?.id);
  const myIndicators = indicators.filter((i) =>
    myProjects.some((p) => p.id === i.projectId)
  );

  const chartData = myIndicators.slice(0, 5).map((ind) => ({
    name: ind.name.substring(0, 10),
    current: ind.currentValue,
    target: ind.targetValue,
  }));

  const stats = [
    {
      label: 'My Projects',
      value: myProjects.length,
      icon: Briefcase,
      color: 'from-purple-500 to-purple-600',
    },
    {
      label: 'Active Indicators',
      value: myIndicators.length,
      icon: BarChart3,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Avg Progress',
      value: `${Math.round(
        myIndicators.reduce((sum, ind) => sum + (ind.currentValue / ind.targetValue) * 100, 0) /
          (myIndicators.length || 1)
      )}%`,
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <DashboardLayout title="Chef de Projet Dashboard">
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Stats */}
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Chart */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Indicator Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="current" stroke="#8B5CF6" name="Current" />
                <Line type="monotone" dataKey="target" stroke="#06B6D4" name="Target" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

	        {/* Indicator Entry Form */}
	        <motion.div variants={itemVariants}>
	          <Card className="p-6">
	            <h3 className="text-lg font-semibold mb-4">Enregistrer une Nouvelle Entrée d'Indicateur</h3>
	            <IndicatorEntryForm onEntryAdded={() => {}} indicators={myIndicators} />
	          </Card>
	        </motion.div>
	
	        {/* Recent Projects */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">My Projects</h3>
            <div className="space-y-3">
              {myProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{project.name}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200">
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(project.startDate, 'MMM dd')} - {format(project.endDate, 'MMM dd')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
