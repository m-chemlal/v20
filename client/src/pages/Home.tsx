import { Button } from "@/components/ui/button";
import { APP_TITLE } from "@/const";
import { useLocation } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  FileDown,
  LayoutDashboard,
  Paperclip,
  ShieldCheck,
  Users,
} from "lucide-react";
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
          <a
            href="#features"
            className="text-gray-600 hover:text-primary transition-colors dark:text-gray-300 dark:hover:text-primary"
          >
            Features
          </a>
          <a
            href="#process"
            className="text-gray-600 hover:text-primary transition-colors dark:text-gray-300 dark:hover:text-primary"
          >
            How it Works
          </a>
          <a
            href="#impact"
            className="text-gray-600 hover:text-primary transition-colors dark:text-gray-300 dark:hover:text-primary"
          >
            Impact
          </a>
        </nav>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {isAuthenticated ? (
            <Button onClick={() => navigate("/chef/dashboard")} variant="secondary">
              Go to Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/login")} className="hidden sm:inline-flex">
                Sign In
              </Button>
              <Button onClick={() => navigate("/login")} className="bg-primary hover:bg-primary/90">
                Get Started
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
  const donors = [
    {
      name: "Acme Foundation",
      amount: "€75,000",
      focus: "Infrastructure for new boreholes",
      initials: "AF",
      status: "Active pledge",
    },
    {
      name: "Hope For All",
      amount: "€32,000",
      focus: "Community hygiene training",
      initials: "HA",
      status: "Renewed",
    },
    {
      name: "United Impact",
      amount: "€18,500",
      focus: "Water quality testing kits",
      initials: "UI",
      status: "Committed",
    },
  ];
  return (
    <section className="relative pt-20 pb-28 lg:pt-32 lg:pb-36 bg-gradient-to-b from-white to-primary/10 dark:from-gray-950 dark:to-gray-900 overflow-hidden">
      <div className="absolute inset-x-0 top-10 -z-10 flex justify-center opacity-30 blur-3xl">
        <div className="h-56 w-96 rounded-full bg-primary/40 dark:bg-primary/30" />
      </div>
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              New in v2.0 — Unified analytics for every project
            </div>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
              Transform your Impact with <span className="text-primary">Transparency</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
              ImpactTracker centralises project monitoring for NGOs and social organisations. Engage donors, coordinate project managers, and report measurable outcomes with one intuitive dashboard.
            </p>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Administrators can inspect every donor contribution, validate the chef&apos;s latest indicator values, and instantly download supporting files before publishing updates.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="bg-primary px-8 py-6 text-lg font-semibold shadow-lg hover:bg-primary/90"
              >
                Start for Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-primary px-8 py-6 text-lg font-semibold text-primary hover:bg-primary/10"
              >
                View Live Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                GDPR-ready data security
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Built for NGOs & foundations
              </div>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -top-8 -left-6 hidden h-20 w-20 rounded-full bg-primary/20 blur-2xl md:block" />
            <div className="absolute -bottom-10 -right-8 hidden h-24 w-24 rounded-full bg-primary/30 blur-3xl md:block" />
            <div className="relative rounded-3xl border border-primary/10 bg-white/80 p-6 shadow-2xl backdrop-blur dark:border-primary/20 dark:bg-gray-900/80">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-300" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">Admin view</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Rural Water Initiative</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Live sync</span>
              </div>
              <div className="space-y-5">
                <div className="rounded-2xl border border-gray-200/80 bg-white/90 p-5 shadow-lg dark:border-gray-800/70 dark:bg-gray-950/70">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Project overview</p>
                      <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Rural Water Initiative</h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Chef de projet: Marie Ndiaye • Last sync 5 minutes ago
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Budget used</p>
                      <p className="mt-1 text-2xl font-bold text-primary">€120K</p>
                      <p className="text-xs font-semibold text-emerald-500">+4% this month</p>
                    </div>
                  </div>
                  <div className="mt-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Donors</p>
                    <div className="mt-3 space-y-3">
                      {donors.map((donor) => (
                        <div
                          key={donor.name}
                          className="flex items-center justify-between rounded-xl bg-white/90 px-3 py-3 shadow-sm dark:bg-gray-900/80"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {donor.initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{donor.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{donor.focus}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-primary">{donor.amount}</p>
                            <p className="text-xs text-emerald-500">{donor.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 shadow-lg dark:border-primary/20 dark:bg-primary/10">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Latest indicator update</p>
                      <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                        Percentage of households with safe water access
                      </h3>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                        Uploaded by Chef Marie Ndiaye • 5 minutes ago
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg bg-white/80 px-3 py-2 text-xs font-semibold text-primary shadow-sm transition hover:bg-white dark:bg-gray-950/70 dark:hover:bg-gray-900"
                    >
                      <FileDown className="h-4 w-4" />
                      Download evidence
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-white/90 p-4 shadow-inner dark:bg-gray-950/80">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">New value</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">82%</p>
                      <p className="text-xs text-emerald-500">+7 pts vs last report</p>
                    </div>
                    <div className="rounded-lg bg-white/90 p-4 shadow-inner dark:bg-gray-950/80">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Target</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">90% • Q4</p>
                      <p className="text-xs text-primary">On track</p>
                    </div>
                    <div className="rounded-lg bg-white/90 p-4 shadow-inner dark:bg-gray-950/80">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</p>
                      <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-500">
                        <CheckCircle2 className="h-4 w-4" />
                        Verified by Admin D. Traoré
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Notes / Comments</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                      Community wells 4 and 5 are now operational. Remaining households scheduled for connection after delivery of additional filters next week.
                    </p>
                  </div>
                  <div className="mt-4 rounded-lg border border-dashed border-primary/30 bg-white/80 p-4 dark:border-primary/20 dark:bg-gray-950/80">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Paperclip className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">water-sampling-report.pdf</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Chef upload • 2.4 MB • Field photos included</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                        Reviewed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
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
      icon: LayoutDashboard,
      title: "Unified project dashboards",
      description:
        "Monitor every initiative in real time with configurable indicators, rich analytics, and role-based workflows from the same control centre.",
    },
    {
      icon: Users,
      title: "Complete donor visibility",
      description:
        "Track donor commitments, contributions, and focus areas so administrators always know who funds each milestone.",
    },
    {
      icon: FileDown,
      title: "Chef uploads with evidence",
      description:
        "Review the chef's indicator submissions, preview supporting documents, and download proof files without leaving the dashboard.",
    },
    {
      icon: ShieldCheck,
      title: "Enterprise-grade compliance",
      description:
        "Keep sensitive beneficiary data safe with encrypted storage, audit logs, and GDPR-ready workflows for your entire team.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-white dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Everything you need to drive measurable change
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            ImpactTracker connects project teams, field data, and donor visibility so you can focus on delivering outcomes instead of managing spreadsheets.
          </p>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-8 text-left shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="inline-flex rounded-full bg-primary/10 p-3 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingProcess() {
  const steps = [
    {
      title: "Onboard your organisation",
      description: "Invite administrators, project managers, and donors with tailored permissions in minutes.",
      icon: Users,
    },
    {
      title: "Collect field updates",
      description: "Chefs upload new indicator values, notes, and supporting files directly from the project zones.",
      icon: CheckCircle2,
    },
    {
      title: "Validate & share impact",
      description: "Admins verify submissions, download evidence, and publish donor-ready dashboards in real time.",
      icon: ArrowRight,
    },
  ];

  return (
    <section id="process" className="py-20 bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">Three simple steps to full visibility</h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Launch projects, streamline collaboration, and demonstrate impact without juggling disconnected tools.
          </p>
        </div>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <div className="mt-6 text-sm font-semibold uppercase tracking-wide text-primary">Step {index + 1}</div>
              <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingImpact() {
  return (
    <section id="impact" className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Our impact in numbers
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Thousands of organisations rely on ImpactTracker to increase transparency, unlock funding, and prove outcomes to their communities.
          </p>
        </div>
        <div className="mt-14 grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Projects launched", value: "500+" },
            { label: "Funds monitored", value: "€2.5M" },
            { label: "Beneficiaries reached", value: "10K+" },
            { label: "Stakeholder satisfaction", value: "98%" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-gray-200 bg-gray-50 px-8 py-10 shadow-md transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="text-4xl font-bold text-primary">{stat.value}</div>
              <p className="mt-3 text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingCTA() {
  const [, navigate] = useLocation();
  return (
    <section className="py-20 bg-primary text-white">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to amplify the impact of your projects?
            </h2>
            <p className="mt-4 text-lg text-primary-50">
              Join ImpactTracker and give every donor, partner, and field team a shared source of truth.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 lg:justify-end">
            <Button
              size="lg"
              onClick={() => navigate("/login")}
              className="bg-white px-8 py-6 text-lg font-semibold text-primary hover:bg-white/90"
            >
              Create your free account
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/login")}
              className="border-white px-8 py-6 text-lg font-semibold text-white hover:bg-white/10"
            >
              Talk to our team
            </Button>
          </div>
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
              The mission control centre for transparent, high-impact projects.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#features" className="hover:text-primary transition-colors">Platform Features</a></li>
              <li><a href="#process" className="hover:text-primary transition-colors">How it Works</a></li>
              <li><a href="#impact" className="hover:text-primary transition-colors">Impact Metrics</a></li>
              <li><a href="/login" className="hover:text-primary transition-colors">Sign In</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Compliance</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">ISO 27001</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">GDPR Compliant</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">SSL Encryption</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#" className="hover:text-primary transition-colors">Contact our team</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Help centre</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy policy</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved.
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
        <LandingProcess />
        <LandingImpact />
        <LandingCTA />
      </main>
      <Footer />
    </div>
  );
}
