import { useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { Briefcase, TrendingUp, PiggyBank } from 'lucide-react';

export default function DonateurDashboard() {
  const { user } = useAuthStore();
  const fetchProjects = useAppStore((state) => state.fetchProjects);
  const loadedProjects = useAppStore((state) => state.loadedProjects);
  const getProjectsByUser = useAppStore((state) => state.getProjectsByUser);
  const indicators = useAppStore((state) => state.indicators);
  const fetchIndicatorsForProject = useAppStore((state) => state.fetchIndicatorsForProject);

  useEffect(() => {
    if (user && !loadedProjects) {
      fetchProjects();
    }
  }, [user, loadedProjects, fetchProjects]);

  const fundedProjects = useMemo(
    () => getProjectsByUser(user?.id ?? '', user?.role ?? ''),
    [getProjectsByUser, user?.id, user?.role],
  );

  useEffect(() => {
    fundedProjects.forEach((project) => {
      fetchIndicatorsForProject(project.id);
    });
  }, [fundedProjects, fetchIndicatorsForProject]);

  const projectSummaries = useMemo(
    () =>
      fundedProjects.map((project) => {
        const projectIndicators = indicators.filter((indicator) => indicator.projectId === project.id);
        const averageProgress = projectIndicators.length
          ? Math.round(
              projectIndicators.reduce(
                (total, indicator) => total + (indicator.currentValue / indicator.targetValue) * 100,
                0,
              ) / projectIndicators.length,
            )
          : Math.round(project.budget ? (project.spent / project.budget) * 100 : 0);

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          budget: project.budget,
          spent: project.spent,
          startDate: project.startDate,
          endDate: project.endDate,
          indicators: projectIndicators.length,
          averageProgress: Math.min(averageProgress, 100),
        };
      }),
    [fundedProjects, indicators],
  );

  const totalBudget = projectSummaries.reduce((sum, project) => sum + project.budget, 0);
  const totalSpent = projectSummaries.reduce((sum, project) => sum + project.spent, 0);
  const averagePortfolioProgress = projectSummaries.length
    ? Math.round(
        projectSummaries.reduce((sum, project) => sum + project.averageProgress, 0) /
          projectSummaries.length,
      )
    : 0;

  return (
    <DashboardLayout title="Tableau de bord Donateur">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Projets financés</p>
                <p className="text-3xl font-semibold">{projectSummaries.length}</p>
              </div>
              <div className="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-500/20">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget total engagé</p>
                <p className="text-3xl font-semibold">
                  {totalBudget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-500/20">
                <PiggyBank className="h-5 w-5" />
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progression moyenne</p>
                <p className="text-3xl font-semibold">{averagePortfolioProgress}%</p>
              </div>
              <div className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-500/20">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        {projectSummaries.length === 0 ? (
          <Card>
            <Empty>
              <EmptyHeader>
                <EmptyTitle>Aucun projet financé pour le moment</EmptyTitle>
                <EmptyDescription>
                  Lorsque des projets vous seront attribués, vous pourrez suivre ici leur avancement sans possibilité de
                  modification.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {projectSummaries.map((project) => (
              <Card key={project.id} className="p-6 space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{project.name}</h3>
                    <p className="text-sm text-muted-foreground max-w-2xl">{project.description}</p>
                  </div>
                  <Badge variant="secondary" className="self-start capitalize">
                    {project.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Progression globale</span>
                    <span>{project.averageProgress}%</span>
                  </div>
                  <Progress value={project.averageProgress} />
                  <p className="text-xs text-muted-foreground">
                    Basé sur {project.indicators} indicateur{project.indicators > 1 ? 's' : ''} suivi{project.indicators > 1 ? 's' : ''}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Budget engagé</p>
                    <p className="text-base font-semibold">
                      {project.budget.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.spent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} dépensé
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Période</p>
                    <p className="text-base font-semibold">
                      {format(project.startDate, 'dd MMM yyyy')} –{' '}
                      {project.endDate ? format(project.endDate, 'dd MMM yyyy') : 'En cours'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Accès</p>
                    <p className="text-base font-semibold">Lecture seule</p>
                    <p className="text-xs text-muted-foreground">Les données sont fournies à titre informatif.</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
