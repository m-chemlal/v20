import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  Users,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Plus,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { projects, indicators } = useAppStore();

  const stats = [
    {
      label: 'Total Projects',
      value: projects.length,
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600',
      trend: '+12%',
    },
    {
      label: 'Total Users',
      value: 8,
      icon: Users,
      color: 'from-purple-500 to-purple-600',
      trend: '+5%',
    },
    {
      label: 'Active Indicators',
      value: indicators.length,
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      trend: '+23%',
    },
    {
      label: 'Critical Issues',
      value: 2,
      icon: AlertCircle,
      color: 'from-red-500 to-red-600',
      trend: '-8%',
    },
  ];

  const projectsByStatus = [
    { name: 'En Cours', value: projects.filter((p) => p.status === 'enCours').length },
    { name: 'Planning', value: projects.filter((p) => p.status === 'planning').length },
    { name: 'Completed', value: projects.filter((p) => p.status === 'completed').length },
    { name: 'Paused', value: projects.filter((p) => p.status === 'paused').length },
  ];

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <DashboardLayout title="Admin Dashboard">
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* KPI Cards */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <p className="text-xs text-emerald-600 mt-2">{stat.trend}</p>
                    </div>
                    <div
                      className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          variants={itemVariants}
        >
          {/* Projects by Status */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Projects by Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Budget Overview */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Budget Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={projects.map((p) => ({
                  name: p.name.substring(0, 10),
                  budget: p.budget,
                  spent: p.spent,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="budget" fill="#8B5CF6" />
                <Bar dataKey="spent" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate('/admin/users')}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add User
              </Button>
              <Button
                onClick={() => navigate('/admin/projects')}
                variant="outline"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
