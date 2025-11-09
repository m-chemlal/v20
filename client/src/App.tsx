import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Unauthorized from "@/pages/Unauthorized";
import Login from "@/pages/Login";
import Home from "@/pages/Home";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAuthStore } from "./store/authStore";

// Lazy imports for role-based pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminProjects from "./pages/admin/Projects";
import ChefDashboard from "./pages/chef/Dashboard";
import ChefProjects from "./pages/chef/Projects";
import ChefProjectDetails from "./pages/chef/ProjectDetails";
import ChefIndicators from "./pages/chef/Indicators";
import ChefProjectDetails from "./pages/chef/ProjectDetails";
import DonateurDashboard from "./pages/donateur/Dashboard";
import DonateurProjects from "./pages/donateur/Projects";
import DonateurProjectDetails from "./pages/donateur/ProjectDetails";

function Router() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login" component={Login} />
      <Route path="/unauthorized" component={Unauthorized} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedRoute requiredRole="admin">
          <AdminUsers />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/projects">
        <ProtectedRoute requiredRole="admin">
          <AdminProjects />
        </ProtectedRoute>
      </Route>

      {/* Chef de Projet Routes */}
      <Route path="/chef/dashboard">
        <ProtectedRoute requiredRole="chef_projet">
          <ChefDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/chef/projects">
        <ProtectedRoute requiredRole="chef_projet">
          <ChefProjects />
        </ProtectedRoute>
      </Route>
      <Route path="/chef/projects/:id">
        <ProtectedRoute requiredRole="chef_projet">
          <ChefProjectDetails />
        </ProtectedRoute>
      </Route>
      <Route path="/chef/indicators">
        <ProtectedRoute requiredRole="chef_projet">
          <ChefIndicators />
        </ProtectedRoute>
      </Route>
      <Route path="/chef/projects/:id">
        <ProtectedRoute requiredRole="chef_projet">
          <ChefProjectDetails />
        </ProtectedRoute>
      </Route>

      {/* Donateur Routes */}
      <Route path="/donateur/dashboard">
        <ProtectedRoute requiredRole="donateur">
          <DonateurDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/donateur/projects">
        <ProtectedRoute requiredRole="donateur">
          <DonateurProjects />
        </ProtectedRoute>
      </Route>
      <Route path="/donateur/projects/:id">
        <ProtectedRoute requiredRole="donateur">
          <DonateurProjectDetails />
        </ProtectedRoute>
      </Route>

	      {/* Public Routes */}
	      <Route path="/">
	        <Home />
	      </Route>

      {/* 404 Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { loadUser } = useAuthStore();
  
  // Load user on app start if token exists
  useEffect(() => {
    loadUser();
  }, [loadUser]);
  
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
