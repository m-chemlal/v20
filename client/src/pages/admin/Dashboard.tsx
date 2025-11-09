import { useEffect, useMemo, useRef, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/appStore';
import { usersAPI } from '@/services/api';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  UserCheck,
  Smile,
  Scale,
  ShieldAlert,
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
  const projects = useAppStore((state) => state.projects);
  const indicators = useAppStore((state) => state.indicators);
  const fetchProjects = useAppStore((state) => state.fetchProjects);
  const loadedProjects = useAppStore((state) => state.loadedProjects);
  const fetchIndicatorsForProject = useAppStore((state) => state.fetchIndicatorsForProject);

  const [users, setUsers] = useState<any[]>([]);
  const [recentUserCount, setRecentUserCount] = useState(0);

  useEffect(() => {
    if (!loadedProjects) {
      fetchProjects();
    }
  }, [loadedProjects, fetchProjects]);

  const fetchedIndicatorsRef = useRef(new Set<string>());

  useEffect(() => {
    projects.forEach((project) => {
      if (fetchedIndicatorsRef.current.has(project.id)) {
        return;
      }

      fetchedIndicatorsRef.current.add(project.id);
      fetchIndicatorsForProject(project.id);
    });
  }, [projects, fetchIndicatorsForProject]);

  useEffect(() => {
    let isMounted = true;

    const parseDate = (value: unknown): Date | null => {
      if (!value) {
        return null;
      }

      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }

      if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }

      return null;
    };

    const loadUsers = async () => {
      try {
        const response = await usersAPI.getAll();
        if (!isMounted) {
          return;
        }
        const normalizedUsers = Array.isArray(response) ? response : [];
        setUsers(normalizedUsers);
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const newInLast30Days = normalizedUsers.reduce((count: number, user: any) => {
          const createdAt =
            parseDate(user.createdAt ?? user.created_at ?? user.date_creation ?? user.dateCreated) ?? null;

          if (createdAt && createdAt >= thirtyDaysAgo) {
            return count + 1;
          }

          return count;
        }, 0);

        setRecentUserCount(newInLast30Days);
      } catch (error) {
        console.error('Failed to load user metrics', error);
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const chefs = users.filter((user) => user.role === 'chef_projet');
    const engagedChefIds = new Set(projects.map((project) => project.chefProjectId).filter(Boolean));
    const engagedChefs = engagedChefIds.size;
    const adoptionRate = chefs.length ? Math.round((engagedChefs / chefs.length) * 100) : 0;
    const adoptionTrend = chefs.length
      ? `${engagedChefs}/${chefs.length} chefs actifs${recentUserCount ? ` • +${recentUserCount} nouveaux profils (30j)` : ''}`
      : recentUserCount > 0
        ? `+${recentUserCount} nouveaux profils (30j)`
        : 'Aucun chef enregistré';

    const donors = users.filter((user) => user.role === 'donateur');
    const donorProjects = projects.filter((project) => (project.donorAllocations?.length ?? 0) > 0);
    const activeDonorIds = new Set<string>();
    donorProjects.forEach((project) => {
      project.donorAllocations?.forEach((donor) => activeDonorIds.add(donor.donorId));
    });
    const activeDonors = activeDonorIds.size;

    const projectProgress = (projectId: string) => {
      const projectIndicators = indicators.filter((indicator) => indicator.projectId === projectId);
      if (projectIndicators.length === 0) {
        if (projects.length === 0) {
          return 0;
        }
        const project = projects.find((item) => item.id === projectId);
        if (!project) {
          return 0;
        }
        const ratio = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
        return Math.round(Math.max(0, Math.min(100, ratio)));
      }

      const total = projectIndicators.reduce((sum, indicator) => {
        if (indicator.targetValue > 0) {
          const progress = (indicator.currentValue / indicator.targetValue) * 100;
          return sum + Math.max(0, Math.min(100, progress));
        }
        return sum + (indicator.currentValue > 0 ? 100 : 0);
      }, 0);

      return Math.round(Math.max(0, Math.min(100, total / projectIndicators.length)));
    };

    const donorSatisfaction = donorProjects.length
      ? Math.round(
          donorProjects.reduce((sum, project) => sum + projectProgress(project.id), 0) /
            donorProjects.length,
        )
      : 0;
    const donorSatisfactionScore = donorProjects.length
      ? Math.round((donorSatisfaction / 20) * 10) / 10
      : 0;

    const overBudgetProjects = projects.filter((project) => project.spent > project.budget).length;
    const pausedProjects = projects.filter((project) => project.status === 'paused').length;
    const projectsWithinBudget = Math.max(projects.length - overBudgetProjects, 0);
    const budgetCompliance = projects.length
      ? Math.round((projectsWithinBudget / projects.length) * 100)
      : 0;

    const criticalIssues = overBudgetProjects + pausedProjects;

    return [
      {
        label: 'Adoption Chefs de projet',
        value: `${adoptionRate}%`,
        icon: UserCheck,
        color: 'from-blue-500 to-blue-600',
        trend: adoptionTrend,
        trendColor: adoptionRate >= 70 ? 'text-emerald-600' : 'text-amber-600 dark:text-amber-400',
      },
      {
        label: 'Satisfaction Donateurs',
        value: `${donorSatisfactionScore.toFixed(1)}/5`,
        icon: Smile,
        color: 'from-purple-500 to-purple-600',
        trend: donors.length
          ? `${activeDonors}/${donors.length} donateurs engagés`
          : `${activeDonors} donateurs engagés`,
        trendColor: donorSatisfaction >= 60 ? 'text-emerald-600' : 'text-amber-600 dark:text-amber-400',
      },
      {
        label: 'Respect du budget',
        value: `${budgetCompliance}%`,
        icon: Scale,
        color: 'from-emerald-500 to-emerald-600',
        trend: `${projectsWithinBudget}/${projects.length} projets maîtrisés`,
        trendColor: budgetCompliance >= 75 ? 'text-emerald-600' : 'text-amber-600 dark:text-amber-400',
      },
      {
        label: 'Vulnérabilités critiques',
        value: criticalIssues,
        icon: ShieldAlert,
        color: 'from-red-500 to-red-600',
        trend:
          criticalIssues > 0
            ? `${overBudgetProjects} hors budget • ${pausedProjects} en pause`
            : 'Aucune anomalie majeure',
        trendColor:
          criticalIssues > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600',
      },
    ];
  }, [projects, indicators, users, recentUserCount]);

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
                      <p className={`text-xs mt-2 ${stat.trendColor}`}>{stat.trend}</p>
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
