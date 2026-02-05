import React from 'react';
import {
  Zap, Target, Brain, Utensils, TrendingUp,
  ChevronRight, CheckCircle, ArrowRight,
  Activity, BarChart3, Flame, Shield, Clock, Layers
} from 'lucide-react';

const FEATURES = [
  {
    icon: Brain,
    title: "Intelligent Programming",
    description: "Periodized training blocks built from proven methodologies. Auto-regulated progression based on your actual performance data."
  },
  {
    icon: Target,
    title: "Sport-Specific Periodization",
    description: "Whether you're peaking for a meet, racing a marathon, or training for a triathlon—your mesocycles are structured for your event."
  },
  {
    icon: Utensils,
    title: "Performance Nutrition",
    description: "Macros calibrated to your training load and body composition goals. Nutrient timing aligned with your session schedule."
  },
  {
    icon: TrendingUp,
    title: "Progressive Overload Engine",
    description: "Systematic volume and intensity progression with strategic deloads. No guesswork, no stalled progress."
  },
  {
    icon: Activity,
    title: "Session Tracking",
    description: "Log sets, reps, RPE, and actual loads. Track deviations from prescribed work to inform future programming."
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Volume load trends, strength curve analysis, and training density metrics. Data-driven decisions, not guesswork."
  }
];

export function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-dark-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-lg border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-primary to-accent-primaryHover rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-dark-950" />
            </div>
            <span className="text-2xl font-display font-bold tracking-tight">MOTUS</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">How It Works</a>
            <a href="#programs" className="text-gray-400 hover:text-white transition-colors">Programs</a>
          </div>
          <button
            onClick={onGetStarted}
            className="px-5 py-2.5 bg-accent-primary hover:bg-accent-primaryHover text-dark-950 font-semibold rounded-lg transition-all hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-secondary/10 rounded-full blur-3xl" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: 'linear-gradient(rgba(212,168,83,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-primary/10 border border-accent-primary/30 rounded-full mb-8">
            <Zap className="w-4 h-4 text-accent-primary" />
            <span className="text-sm text-accent-primary font-medium">Periodized Training + Precision Nutrition</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight mb-6">
            <span className="block">TRAIN WITH</span>
            <span className="block bg-gradient-to-r from-accent-primary via-accent-primaryHover to-accent-secondary bg-clip-text text-transparent">
              INTENT.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Structured programming for serious athletes. <span className="text-white font-medium">Periodized workouts</span>,{' '}
            <span className="text-white font-medium">calibrated nutrition</span>, and{' '}
            <span className="text-white font-medium">intelligent progression</span>—all in one platform.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onGetStarted}
              className="group px-8 py-4 bg-accent-primary hover:bg-accent-primaryHover text-dark-950 font-bold text-lg rounded-xl transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-accent-primary/25"
            >
              Build Your Program
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Key Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 text-gray-400">
              <Layers className="w-5 h-5 text-accent-primary" />
              <span>Mesocycle-based periodization</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-gray-400">
              <Clock className="w-5 h-5 text-accent-primary" />
              <span>Auto-regulated deloads</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-gray-400">
              <Shield className="w-5 h-5 text-accent-primary" />
              <span>Research-backed protocols</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-accent-primary rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-24 bg-dark-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                You Know What You're Doing. <span className="text-accent-danger">Your Tools Should Too.</span>
              </h2>
              <div className="space-y-4 text-gray-400">
                <p className="flex items-start gap-3">
                  <span className="text-accent-danger mt-1">✕</span>
                  Generic apps that don't understand periodization or peaking
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-accent-danger mt-1">✕</span>
                  Nutrition trackers disconnected from your training load
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-accent-danger mt-1">✕</span>
                  No intelligent programming—just random workouts
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-accent-danger mt-1">✕</span>
                  Fragmented tools that don't talk to each other
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                MOTUS Gets It. <span className="text-accent-success">Built for Athletes.</span>
              </h2>
              <div className="space-y-4 text-gray-400">
                <p className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-success mt-0.5 flex-shrink-0" />
                  <span>Proper periodization with base, build, peak, and taper phases</span>
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-success mt-0.5 flex-shrink-0" />
                  <span>Nutrition that scales with your training volume and intensity</span>
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-success mt-0.5 flex-shrink-0" />
                  <span>Progressive overload with strategic deload weeks built in</span>
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-success mt-0.5 flex-shrink-0" />
                  <span>One integrated platform—workouts, nutrition, and tracking</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-dark-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Built for <span className="text-accent-primary">Performance</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Every feature designed around how serious athletes actually train.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, idx) => (
              <div
                key={idx}
                className="group p-6 bg-dark-900 border border-dark-700 rounded-2xl hover:border-accent-primary/50 transition-all hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-accent-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-dark-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Setup in <span className="text-accent-primary">5 Minutes</span>
            </h2>
            <p className="text-xl text-gray-400">Input your data. Get your program. Start training.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Define Your Goal",
                description: "Select your primary focus—strength, endurance, hypertrophy, or triathlon. Set your target event or timeline.",
                icon: Target
              },
              {
                step: "02",
                title: "Input Your Baseline",
                description: "Current lifts, recent race times, training history. We need real numbers to build a real program.",
                icon: Brain
              },
              {
                step: "03",
                title: "Execute & Track",
                description: "Follow your periodized program. Log your sessions. Let the system adjust based on your actual performance.",
                icon: TrendingUp
              }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-7xl font-display font-bold text-dark-800 absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative bg-dark-800 border border-dark-700 rounded-2xl p-6 pt-12">
                  <div className="w-14 h-14 bg-accent-primary rounded-xl flex items-center justify-center mb-4">
                    <item.icon className="w-7 h-7 text-dark-950" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ChevronRight className="w-8 h-8 text-dark-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Types */}
      <section id="programs" className="py-24 bg-dark-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Specialized <span className="text-accent-primary">Programming</span>
            </h2>
            <p className="text-xl text-gray-400">Structured training systems for your discipline</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Strength",
                subtitle: "Powerlifting & Strength Sport",
                description: "Periodized programming for squat, bench, and deadlift. Volume blocks, intensity blocks, and peaking protocols.",
                icon: "🏋️",
                color: "from-red-500/20 to-orange-500/20",
                border: "border-red-500/30"
              },
              {
                title: "Endurance",
                subtitle: "Running & Cycling",
                description: "5K to marathon and beyond. Pace-based training zones, mileage progression, and taper protocols.",
                icon: "🏃",
                color: "from-blue-500/20 to-cyan-500/20",
                border: "border-blue-500/30"
              },
              {
                title: "Hypertrophy",
                subtitle: "Bodybuilding & Physique",
                description: "Volume-driven programming for muscle development. Progressive overload with strategic deloads.",
                icon: "💪",
                color: "from-purple-500/20 to-pink-500/20",
                border: "border-purple-500/30"
              },
              {
                title: "Triathlon",
                subtitle: "Swim • Bike • Run",
                description: "Multi-sport periodization with brick workouts and double days. Injury-prevention strength work built in.",
                icon: "🏊",
                color: "from-accent-primary/20 to-yellow-500/20",
                border: "border-accent-primary/30"
              }
            ].map((program, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl bg-gradient-to-br ${program.color} border ${program.border} hover:scale-105 transition-transform cursor-pointer`}
              >
                <span className="text-4xl mb-4 block">{program.icon}</span>
                <h3 className="text-xl font-bold mb-1">{program.title}</h3>
                <p className="text-accent-primary text-sm font-medium mb-3">{program.subtitle}</p>
                <p className="text-gray-400 text-sm">{program.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-dark-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/5 via-transparent to-accent-secondary/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
            Stop Guessing. <span className="text-accent-primary">Start Training.</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Your personalized program is 5 minutes away.
          </p>

          <button
            onClick={onGetStarted}
            className="group px-10 py-5 bg-accent-primary hover:bg-accent-primaryHover text-dark-950 font-bold text-xl rounded-xl transition-all hover:scale-105 flex items-center gap-3 mx-auto shadow-lg shadow-accent-primary/25"
          >
            Build My Program
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-dark-950 border-t border-dark-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-primary to-accent-primaryHover rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-dark-950" />
              </div>
              <span className="text-xl font-display font-bold">MOTUS</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
            <p className="text-sm text-gray-500">
              © 2024 MOTUS. Train With Intent.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
