import React, { useState, useEffect } from 'react';
import {
  Zap, Target, Brain, Utensils, Dumbbell, TrendingUp,
  ChevronRight, Play, Star, CheckCircle, ArrowRight,
  Activity, Calendar, BarChart3, Users, Clock, Flame
} from 'lucide-react';

const TESTIMONIALS = [
  {
    name: "Marcus J.",
    role: "Lost 35 lbs in 4 months",
    quote: "MOTUS completely transformed how I approach fitness. The AI knew exactly when to push me and when to recover.",
    avatar: "MJ"
  },
  {
    name: "Sarah K.",
    role: "Marathon PR by 18 minutes",
    quote: "The periodization and nutrition timing were game-changers for my endurance training. Couldn't have done it without MOTUS.",
    avatar: "SK"
  },
  {
    name: "Derek T.",
    role: "Added 85 lbs to total",
    quote: "Finally a program that understands powerlifting. The progressive overload and deload timing is spot on.",
    avatar: "DT"
  }
];

const FEATURES = [
  {
    icon: Brain,
    title: "AI-Powered Programming",
    description: "Your program adapts in real-time based on your performance, recovery, and progress. No generic templates."
  },
  {
    icon: Target,
    title: "Goal-Specific Plans",
    description: "Whether you're chasing strength PRs, running a marathon, or building your ideal physique—we've got you."
  },
  {
    icon: Utensils,
    title: "Precision Nutrition",
    description: "Macros calculated for YOUR metabolism, activity level, and goals. Meal timing optimized for performance."
  },
  {
    icon: TrendingUp,
    title: "Smart Progression",
    description: "Research-backed periodization with built-in deloads. Progress without burnout or plateaus."
  },
  {
    icon: Activity,
    title: "Real-Time Tracking",
    description: "Log workouts and meals in seconds. Track every rep, every calorie, every win."
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description: "Visualize your progress with detailed insights on strength gains, body composition, and performance metrics."
  }
];

const STATS = [
  { value: "10K+", label: "Active Athletes" },
  { value: "2.5M", label: "Workouts Logged" },
  { value: "94%", label: "Goal Achievement" },
  { value: "4.9", label: "App Rating" }
];

export function LandingPage({ onGetStarted }) {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
            <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Results</a>
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
            <span className="text-sm text-accent-primary font-medium">AI-Powered Performance</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight mb-6">
            <span className="block">TRAIN SMARTER.</span>
            <span className="block bg-gradient-to-r from-accent-primary via-accent-primaryHover to-accent-secondary bg-clip-text text-transparent">
              PERFORM BETTER.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            The only fitness platform that builds <span className="text-white font-medium">personalized workout programs</span> and{' '}
            <span className="text-white font-medium">nutrition plans</span> that adapt to you in real-time.
            Powered by AI. Backed by science.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onGetStarted}
              className="group px-8 py-4 bg-accent-primary hover:bg-accent-primaryHover text-dark-950 font-bold text-lg rounded-xl transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-accent-primary/25"
            >
              Start Your Transformation
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 bg-dark-800 hover:bg-dark-700 text-white font-semibold text-lg rounded-xl transition-all flex items-center gap-2 border border-dark-600">
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {STATS.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-4xl font-display font-bold text-accent-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
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
                Generic Programs <span className="text-accent-danger">Don't Work.</span>
              </h2>
              <div className="space-y-4 text-gray-400">
                <p className="flex items-start gap-3">
                  <span className="text-accent-danger mt-1">✕</span>
                  Cookie-cutter workout plans that ignore your goals and starting point
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-accent-danger mt-1">✕</span>
                  Nutrition advice that doesn't account for your metabolism or lifestyle
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-accent-danger mt-1">✕</span>
                  Programs that never adjust, leading to plateaus and burnout
                </p>
                <p className="flex items-start gap-3">
                  <span className="text-accent-danger mt-1">✕</span>
                  Separate apps for workouts, nutrition, and tracking
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                MOTUS is <span className="text-accent-success">Different.</span>
              </h2>
              <div className="space-y-4 text-gray-400">
                <p className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-success mt-0.5 flex-shrink-0" />
                  <span>Programs built specifically for YOUR body, goals, and schedule</span>
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-success mt-0.5 flex-shrink-0" />
                  <span>Nutrition plans that calculate your exact needs and adapt as you progress</span>
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-success mt-0.5 flex-shrink-0" />
                  <span>AI that learns from your performance and adjusts in real-time</span>
                </p>
                <p className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent-success mt-0.5 flex-shrink-0" />
                  <span>One unified platform for everything—workouts, meals, and progress</span>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-800 rounded-full mb-4">
              <Star className="w-4 h-4 text-accent-primary" />
              <span className="text-sm text-gray-400">Why Athletes Choose MOTUS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Everything You Need. <span className="text-accent-primary">Nothing You Don't.</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built by athletes, for athletes. Every feature designed to maximize your results.
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
              From Setup to <span className="text-accent-primary">Results</span>
            </h2>
            <p className="text-xl text-gray-400">Get your personalized program in under 5 minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Tell Us Your Goals",
                description: "Strength, endurance, fat loss, muscle building—whatever drives you. Share your current fitness level and available equipment.",
                icon: Target
              },
              {
                step: "02",
                title: "Get Your Custom Program",
                description: "Our AI builds your personalized workout schedule and nutrition plan. Periodization, macros, and meal timing—all optimized for you.",
                icon: Brain
              },
              {
                step: "03",
                title: "Train, Track, Transform",
                description: "Follow your program, log your workouts and meals, and watch the AI adapt your plan based on your progress.",
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
      <section className="py-24 bg-dark-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Programs for <span className="text-accent-primary">Every Goal</span>
            </h2>
            <p className="text-xl text-gray-400">Specialized training systems backed by exercise science</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Strength",
                subtitle: "Build Raw Power",
                description: "Powerlifting-focused programs with periodized progression for squat, bench, and deadlift.",
                icon: "🏋️",
                color: "from-red-500/20 to-orange-500/20",
                border: "border-red-500/30"
              },
              {
                title: "Endurance",
                subtitle: "Go The Distance",
                description: "5K to marathon training with pace-based workouts and smart mileage progression.",
                icon: "🏃",
                color: "from-blue-500/20 to-cyan-500/20",
                border: "border-blue-500/30"
              },
              {
                title: "Aesthetic",
                subtitle: "Sculpt Your Physique",
                description: "Hypertrophy-focused bodybuilding programs for maximum muscle development.",
                icon: "💪",
                color: "from-purple-500/20 to-pink-500/20",
                border: "border-purple-500/30"
              },
              {
                title: "Fat Loss",
                subtitle: "Transform Your Body",
                description: "Strategic training and nutrition to maximize fat loss while preserving muscle.",
                icon: "🔥",
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

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-dark-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Real Athletes. <span className="text-accent-primary">Real Results.</span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 md:p-12 relative">
              <div className="text-6xl text-accent-primary/20 absolute top-4 left-6">"</div>
              <div className="relative">
                <p className="text-xl md:text-2xl text-gray-300 mb-8 italic">
                  {TESTIMONIALS[activeTestimonial].quote}
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-accent-primary rounded-full flex items-center justify-center font-bold text-dark-950">
                    {TESTIMONIALS[activeTestimonial].avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{TESTIMONIALS[activeTestimonial].name}</div>
                    <div className="text-accent-primary text-sm">{TESTIMONIALS[activeTestimonial].role}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestimonial(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === activeTestimonial ? 'bg-accent-primary w-8' : 'bg-dark-600 hover:bg-dark-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-dark-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/5 via-transparent to-accent-secondary/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-accent-primary/50 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent-success/10 border border-accent-success/30 rounded-full mb-8">
            <Flame className="w-4 h-4 text-accent-success" />
            <span className="text-sm text-accent-success font-medium">Free to Start • No Credit Card Required</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">
            Ready to <span className="text-accent-primary">Transform?</span>
          </h2>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of athletes who've unlocked their potential with MOTUS.
            Your personalized program is waiting.
          </p>

          <button
            onClick={onGetStarted}
            className="group px-10 py-5 bg-accent-primary hover:bg-accent-primaryHover text-dark-950 font-bold text-xl rounded-xl transition-all hover:scale-105 flex items-center gap-3 mx-auto shadow-lg shadow-accent-primary/25"
          >
            Build My Program
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="mt-6 text-sm text-gray-500">
            Setup takes less than 5 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-dark-900 border-t border-dark-800">
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
              © 2024 MOTUS. Train Smarter.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
