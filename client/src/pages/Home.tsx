import { Button } from "@/components/ui/button";
import { APP_TITLE } from "@/const";
import { useLocation } from "wouter";
import { ArrowRight, CheckCircle, Lock, Mail, User } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "@/components/ThemeToggle";

// --- Components for Landing Page ---

function Header() {
  const { isAuthenticated } = useAuthStore();
  const [, navigate] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-sm dark:bg-gray-900/90">
      <div className="container mx-auto h-16 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold text-primary">ImpactTracker</span>
        </div>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <a href="#features" className="text-gray-600 hover:text-primary transition-colors dark:text-gray-300 dark:hover:text-primary">
            Fonctionnalités
          </a>
          <a href="#testimonials" className="text-gray-600 hover:text-primary transition-colors dark:text-gray-300 dark:hover:text-primary">
            Témoignages
          </a>
          <a href="#contact" className="text-gray-600 hover:text-primary transition-colors dark:text-gray-300 dark:hover:text-primary">
            Contact
          </a>
        </nav>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button onClick={() => navigate("/chef/dashboard")} variant="secondary">
              Aller au Tableau de Bord
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/login")} className="hidden sm:inline-flex">
                Se Connecter
              </Button>
              <Button onClick={() => navigate("/login")} className="bg-primary hover:bg-primary/90">
                S'inscrire
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function LandingHero() {
  const [, navigate] = useLocation();
  return (
    <section className="relative pt-20 pb-28 lg:pt-32 lg:pb-40 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap -mx-4 items-center">
          <div className="w-full lg:w-6/12 px-4 mb-12 lg:mb-0">
            <div className="max-w-lg">
              <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight mb-6">
                Transformez l'Impact avec <span className="text-primary">Transparence</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                La plateforme de gestion de projets pour ONG et associations qui connecte donateurs, gestionnaires et bénéficiaires pour un impact mesurable et transparent.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate("/login")} className="bg-primary hover:bg-primary/90 text-white text-lg font-semibold px-8 py-3 rounded-lg shadow-lg transition duration-300">
                  Démarrer Gratuitement
                </Button>
                <Button variant="outline" size="lg" className="text-primary border-primary hover:bg-primary/10 text-lg font-semibold px-8 py-3 rounded-lg transition duration-300">
                  Voir la Démo
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-6/12 px-4">
            {/* Placeholder for the dashboard image preview */}
            <div className="relative p-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl">
              <img
                className="w-full h-auto rounded-lg"
                src="/dashboard-preview.png" // Assuming a dashboard preview image is added to public folder
                alt="ImpactTracker Dashboard Preview"
              />
              <div className="absolute top-0 left-0 w-full h-full bg-primary/10 rounded-xl pointer-events-none"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingFeatures() {
  const features = [
    {
      icon: User,
      title: "Inscription & Configuration",
      description: "Créez votre compte et configurez votre profil selon votre rôle : Administrateur, Chef de projet ou Donateur.",
    },
    {
      icon: Mail,
      title: "Gestion de Projets",
      description: "Créez, gérez et suivez vos projets avec des indicateurs personnalisables et des rapports en temps réel.",
    },
    {
      icon: CheckCircle,
      title: "Suivi & Transparence",
      description: "Visualisez l'impact de vos actions grâce à des tableaux de bord interactifs et des statistiques détaillées.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
          Trois Étapes Simples
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
          De l'inscription au suivi de l'impact, découvrez comment ImpactTracker facilite la gestion de vos projets.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 transition-transform hover:scale-[1.02]">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 text-primary">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-800 dark:bg-gray-950 text-white py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="text-lg font-semibold mb-4">ImpactTracker</h4>
            <p className="text-sm text-gray-400">
              La plateforme de gestion de projets pour ONG.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Liens Rapides</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-primary transition-colors">Fonctionnalités</a></li>
              <li><a href="#testimonials" className="hover:text-primary transition-colors">Témoignages</a></li>
              <li><a href="#contact" className="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="/login" className="hover:text-primary transition-colors">Connexion</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Certifications</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">ISO 27001</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">GDPR Compliant</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Sécurité SSL</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">Contactez-nous</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Centre d'aide</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Politique de confidentialité</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} {APP_TITLE}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

// --- Main Page Component ---

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <LandingHero />
        <LandingFeatures />
        {/* Section for Impact Stats (similar to the image) */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
              Notre Impact en Chiffres
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">
              Des résultats concrets qui témoignent de l'efficacité de notre plateforme.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md">
                <p className="text-4xl font-bold text-primary mb-1">500+</p>
                <p className="text-lg text-gray-600 dark:text-gray-300">Projets Actifs</p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md">
                <p className="text-4xl font-bold text-primary mb-1">2.5M€</p>
                <p className="text-lg text-gray-600 dark:text-gray-300">Fonds Levés</p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md">
                <p className="text-4xl font-bold text-primary mb-1">10K+</p>
                <p className="text-lg text-gray-600 dark:text-gray-300">Bénéficiaires</p>
              </div>
              <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl shadow-md">
                <p className="text-4xl font-bold text-primary mb-1">98%</p>
                <p className="text-lg text-gray-600 dark:text-gray-300">Satisfaction</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
