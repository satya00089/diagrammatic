import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useTheme } from "../hooks/useTheme";

const Home: React.FC = () => {
  useTheme();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: "🎯",
      title: "Practice Problems",
      description:
        "Master system design through curated problems with real-world scenarios",
      action: "Browse Problems",
      route: "/problems",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: "🎨",
      title: "Free Design Canvas",
      description:
        "Create your own system designs from scratch. Perfect for planning your next project",
      action: "Start Designing",
      route: "/playground/free",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: "📝",
      title: "Custom Problems",
      description:
        "Bring your own problem statements and design solutions in an interactive environment",
      action: "Create Problem",
      route: "/create-problem",
      gradient: "from-orange-500 to-red-500",
    },
  ];

  const capabilities = [
    {
      icon: "🧩",
      title: "45+ Components",
      description: "Databases, APIs, caches, queues, and more",
    },
    {
      icon: "🔗",
      title: "Smart Connections",
      description: "Define data flow and relationships visually",
    },
    {
      icon: "⚡",
      title: "Custom Properties",
      description: "Add metadata to any component",
    },
    {
      icon: "🎯",
      title: "AI Assessment",
      description: "Get feedback on your designs",
    },
    {
      icon: "🌓",
      title: "Dark Mode",
      description: "Beautiful themes for any preference",
    },
    {
      icon: "💾",
      title: "Export & Share",
      description: "Save and share your designs",
    },
  ];

  const stats = [
    { value: "45+", label: "Components", icon: "🧩" },
    { value: "1000+", label: "Users", icon: "👥" },
    { value: "∞", label: "Possibilities", icon: "✨" },
  ];

  const testimonials = [
    {
      quote: "This tool transformed how I prepare for system design interviews.",
      author: "Software Engineer",
      role: "FAANG Company",
    },
    {
      quote: "Perfect for teaching distributed systems to my students.",
      author: "Professor",
      role: "University CS Dept",
    },
    {
      quote: "I use it daily to plan architecture for client projects.",
      author: "Solutions Architect",
      role: "Tech Consulting",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--surface)] via-[var(--bg)] to-[var(--surface)] text-theme relative grid-pattern-overlay">


      {/* Global Animated Architecture Diagram Background - Scrolls with page */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.16] z-0 min-h-full">
        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          {/* Horizontal connections */}
          <line x1="10%" y1="15%" x2="25%" y2="15%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme" opacity="0.6" />
          <line x1="25%" y1="15%" x2="40%" y2="25%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-200" opacity="0.6" />
          <line x1="40%" y1="25%" x2="60%" y2="20%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-400" opacity="0.6" />
          <line x1="60%" y1="20%" x2="75%" y2="25%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-600" opacity="0.6" />
          <line x1="75%" y1="25%" x2="90%" y2="15%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-800" opacity="0.6" />
          
          {/* Middle layer connections */}
          <line x1="15%" y1="40%" x2="30%" y2="45%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-300" opacity="0.6" />
          <line x1="30%" y1="45%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-500" opacity="0.6" />
          <line x1="50%" y1="50%" x2="70%" y2="45%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-700" opacity="0.6" />
          <line x1="70%" y1="45%" x2="85%" y2="40%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-900" opacity="0.6" />
          
          {/* Lower connections */}
          <line x1="20%" y1="70%" x2="35%" y2="75%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-400" opacity="0.6" />
          <line x1="35%" y1="75%" x2="50%" y2="80%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-600" opacity="0.6" />
          <line x1="50%" y1="80%" x2="65%" y2="75%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-800" opacity="0.6" />
          <line x1="65%" y1="75%" x2="80%" y2="70%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-1000" opacity="0.6" />
          
          {/* Vertical connections */}
          <line x1="25%" y1="15%" x2="30%" y2="45%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-500" opacity="0.6" />
          <line x1="50%" y1="20%" x2="50%" y2="50%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-700" opacity="0.6" />
          <line x1="75%" y1="25%" x2="70%" y2="45%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-900" opacity="0.6" />
          <line x1="50%" y1="50%" x2="50%" y2="80%" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse text-theme delay-1100" opacity="0.6" />
        </svg>
        
        {/* Component nodes - Top layer */}
        <div className="absolute top-[15%] left-[10%] w-16 h-16 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl animate-float shadow-lg">
          🗄️
        </div>
        <div className="absolute top-[15%] left-[25%] w-20 h-20 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl animate-float-delayed shadow-lg">
          🔐
        </div>
        <div className="absolute top-[25%] left-[40%] w-16 h-16 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl animate-float shadow-lg delay-300">
          ⚡
        </div>
        <div className="absolute top-[20%] left-[60%] w-20 h-20 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl animate-float-delayed shadow-lg">
          🌐
        </div>
        <div className="absolute top-[25%] left-[75%] w-16 h-16 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl animate-float shadow-lg delay-600">
          ⚙️
        </div>
        <div className="absolute top-[15%] left-[90%] w-20 h-20 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl animate-float-delayed shadow-lg">
          📡
        </div>
        
        {/* Component nodes - Middle layer */}
        <div className="absolute top-[40%] left-[15%] w-16 h-16 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl animate-float shadow-lg delay-400">
          🔗
        </div>
        <div className="absolute top-[45%] left-[30%] w-20 h-20 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl animate-float-delayed shadow-lg">
          💾
        </div>
        <div className="absolute top-[50%] left-[50%] w-20 h-20 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl animate-float shadow-lg delay-500">
          🎯
        </div>
        <div className="absolute top-[45%] left-[70%] w-20 h-20 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl animate-float-delayed shadow-lg">
          📊
        </div>
        <div className="absolute top-[40%] left-[85%] w-16 h-16 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl animate-float shadow-lg delay-700">
          🔄
        </div>
        
        {/* Component nodes - Bottom layer */}
        <div className="absolute top-[69%] left-[17%] w-16 h-16 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl shadow-lg">
          🎨
        </div>
        <div className="absolute top-[75%] left-[35%] w-20 h-20 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl animate-float-delayed shadow-lg">
          💡
        </div>
        <div className="absolute top-[80%] left-[48%] w-16 h-16 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl shadow-lg">
          ✨
        </div>
        <div className="absolute top-[74%] left-[65%] w-20 h-20 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl animate-float-delayed shadow-lg">
          🚀
        </div>
        <div className="absolute top-[70%] left-[79%] w-16 h-16 bg-[var(--theme)]/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl animate-float shadow-lg delay-1000">
          🌟
        </div>
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[var(--brand)] to-[var(--header-gradient-end)] transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center space-x-3 group cursor-pointer"
            >
              <img
                src="./logo.png"
                alt="Logo"
                className="h-10 transition-transform group-hover:scale-110 duration-300"
              />
              <span className="text-xl font-bold text-white">
                Diagrammatic
              </span>
            </button>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate("/problems")}
                className="hidden md:block px-4 py-2 text-sm font-medium text-white hover:text-white/80 transition-colors cursor-pointer"
              >
                Problems
              </button>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20">
        {/* Hero Background Card */}
        <div 
          className="relative overflow-hidden bg-gradient-to-br from-[var(--brand)] to-[var(--accent)]"
        >
          {/* Animated decorative system architecture diagram */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Animated connecting lines */}
              <line x1="10%" y1="20%" x2="30%" y2="40%" stroke="white" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse" opacity="0.6" />
              <line x1="30%" y1="40%" x2="50%" y2="30%" stroke="white" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse delay-500" opacity="0.6" />
              <line x1="50%" y1="30%" x2="70%" y2="45%" stroke="white" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse delay-1000" opacity="0.6" />
              <line x1="70%" y1="45%" x2="90%" y2="25%" stroke="white" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse delay-1500" opacity="0.6" />
              <line x1="30%" y1="40%" x2="50%" y2="70%" stroke="white" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse delay-700" opacity="0.6" />
              <line x1="50%" y1="70%" x2="70%" y2="45%" stroke="white" strokeWidth="2" strokeDasharray="5,5" className="animate-pulse delay-1200" opacity="0.6" />
            </svg>
            
            {/* Component nodes */}
            <div className="absolute top-[20%] left-[10%] w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl animate-float shadow-lg">
              🗄️
            </div>
            <div className="absolute top-[40%] left-[30%] w-20 h-20 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl animate-float-delayed shadow-lg">
              ⚡
            </div>
            <div className="absolute top-[30%] left-[50%] w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl animate-float shadow-lg delay-500">
              🔗
            </div>
            <div className="absolute top-[45%] left-[70%] w-20 h-20 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl animate-float-delayed shadow-lg">
              💾
            </div>
            <div className="absolute top-[25%] left-[90%] w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl animate-float shadow-lg delay-1000">
              📊
            </div>
            <div className="absolute top-[70%] left-[50%] w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl animate-float-delayed shadow-lg delay-300">
              🚀
            </div>
          </div>
          
          {/* Grid overlay for design aesthetic */}
          <div 
            className="absolute inset-0 opacity-[0.03] hero-grid-overlay"
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div
              className={`relative z-10 text-center transition-all duration-1000 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
            >
              <div className="inline-block mb-6">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold rounded-full shadow-lg">
                  ✨ Now with 45+ Components & AI Assessment
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white">
                <span className="inline-block animate-gradient bg-gradient-to-r from-white via-white/90 to-white bg-clip-text">
                  Design Systems
                </span>
                <br />
                <span className="text-white/95">Visually, Intuitively</span>
              </h1>
              <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
                The interactive playground for system design — practice, learn, and
                create architecture diagrams with ease
              </p>

              {/* Stats Bar */}
              <div className="flex flex-wrap justify-center gap-8 mb-12">
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`text-center transition-all duration-500 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 hover:bg-white/20 hover:scale-105 ${
                      isVisible ? 'fade-in-up' : 'opacity-0 translate-y-5'
                    } ${index === 0 ? 'fade-in-up-delay-100' : index === 1 ? 'fade-in-up-delay-200' : 'fade-in-up-delay-300'}`}
                  >
                    <div className="text-3xl mb-1">{stat.icon}</div>
                    <div className="text-3xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-white/80">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  type="button"
                  onClick={() => navigate("/playground/free")}
                  className="group relative px-8 py-4 bg-white text-[var(--brand)] text-lg font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Get Started Free{" "}
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/problems")}
                  className="group px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white text-lg font-semibold rounded-xl hover:bg-white/20 hover:border-white/50 hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  Explore Problems{" "}
                  <span className="inline-block group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </button>
              </div>

              <p className="mt-6 text-sm text-white/80">
                No signup required • Free forever • 45+ components
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Choose Your Path
          </h2>
          <p className="text-muted text-center mb-16 text-lg max-w-2xl mx-auto">
            Whether you're learning, building, or teaching — we've got you
            covered
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={`group relative backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-8 hover:shadow-[0_20px_60px_rgba(0,0,0,0.25)] hover:scale-[1.02] cursor-pointer overflow-hidden transition-all duration-500 elevated-card-bg ${
                  index === 0 ? 'delay-0' : index === 1 ? 'delay-100' : 'delay-200'
                }`}
                onClick={() => navigate(feature.route)}
                onKeyDown={(e) => e.key === 'Enter' && navigate(feature.route)}
                role="button"
                tabIndex={0}
              >
                {/* Animated gradient background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}
                />
                
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />

                <div className="relative z-10">
                  <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-theme group-hover:text-[var(--brand)] transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted mb-8 leading-relaxed text-[15px]">
                    {feature.description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-[var(--brand)] font-semibold text-sm group-hover:gap-3 transition-all duration-300">
                    {feature.action}
                    <span className="text-lg group-hover:translate-x-1 transition-transform duration-300">
                      →
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-surface/30 to-transparent relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Powerful Features
          </h2>
          <p className="text-muted text-center mb-16 text-lg max-w-2xl mx-auto">
            Everything you need to design, document, and share system
            architectures
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((capability, capIndex) => (
              <div
                key={capability.title}
                className={`group backdrop-blur-md rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-300 hover:-translate-y-1 elevated-card-bg ${
                  capIndex === 0 ? 'delay-0' : capIndex === 1 ? 'delay-[50ms]' : capIndex === 2 ? 'delay-[100ms]' : capIndex === 3 ? 'delay-[150ms]' : capIndex === 4 ? 'delay-[200ms]' : 'delay-[250ms]'
                }`}
              >
                <div className="text-4xl mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  {capability.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-theme group-hover:text-[var(--brand)] transition-colors duration-300">
                  {capability.title}
                </h3>
                <p className="text-muted text-sm leading-relaxed">
                  {capability.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Loved by Designers Worldwide
          </h2>
          <p className="text-muted text-center mb-16 text-lg max-w-2xl mx-auto">
            Join thousands who trust Diagrammatic for their system design needs
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, testIndex) => (
              <div
                key={`testimonial-${testIndex}`}
                className="group relative backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-8 hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-2 elevated-card-bg"
              >
                {/* Quote decoration */}
                <div className="absolute top-6 right-6 text-7xl text-[var(--brand)]/5 font-serif leading-none">
                  "
                </div>
                
                <div className="relative z-10">
                  <div className="text-5xl mb-6 text-[var(--brand)]/20 font-serif">
                    "
                  </div>
                  <p className="text-theme mb-8 leading-relaxed text-[15px] italic">
                    {testimonial.quote}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--accent)] flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-theme">
                        {testimonial.author}
                      </div>
                      <div className="text-muted text-sm">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-surface/20 to-transparent relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Perfect For Every Role
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div 
              className="group text-center p-8 rounded-3xl hover:elevated-card-bg hover:backdrop-blur-md hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all duration-500 hover:-translate-y-2"
              role="button"
              tabIndex={0}
            >
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 gradient-icon-blue-cyan rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
                <div className="relative w-20 h-20 mx-auto gradient-icon-blue-cyan rounded-full flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  🎓
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-theme group-hover:text-[var(--brand)] transition-colors duration-300">
                Students
              </h3>
              <p className="text-muted leading-relaxed mb-6">
                Learn system design concepts through hands-on practice with
                real-world problems
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-[var(--brand)] font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                Start practicing{' '}
                <span className="group-hover:translate-x-1 transition-transform duration-300">
                  →
                </span>
              </div>
            </div>
            <div 
              className="group text-center p-8 rounded-3xl hover:elevated-card-bg hover:backdrop-blur-md hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all duration-500 hover:-translate-y-2"
              role="button"
              tabIndex={0}
            >
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 gradient-icon-purple-pink rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
                <div className="relative w-20 h-20 mx-auto gradient-icon-purple-pink rounded-full flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  💼
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-theme group-hover:text-[var(--brand)] transition-colors duration-300">
                Professionals
              </h3>
              <p className="text-muted leading-relaxed mb-6">
                Plan and document architecture for your projects with a visual
                approach
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-[var(--brand)] font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                Start designing{' '}
                <span className="group-hover:translate-x-1 transition-transform duration-300">
                  →
                </span>
              </div>
            </div>
            <div 
              className="group text-center p-8 rounded-3xl hover:elevated-card-bg hover:backdrop-blur-md hover:shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all duration-500 hover:-translate-y-2"
              role="button"
              tabIndex={0}
            >
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 gradient-icon-orange-red rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
                <div className="relative w-20 h-20 mx-auto gradient-icon-orange-red rounded-full flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  👨‍🏫
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-theme group-hover:text-[var(--brand)] transition-colors duration-300">
                Educators
              </h3>
              <p className="text-muted leading-relaxed mb-6">
                Create custom problems and assignments for your students to
                solve
              </p>
              <div className="inline-flex items-center gap-2 text-sm text-[var(--brand)] font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                Create problem{' '}
                <span className="group-hover:translate-x-1 transition-transform duration-300">
                  →
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] rounded-3xl p-12 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Start Designing?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of developers and architects who trust Diagrammatic
              for their system design needs
            </p>
            <button
              type="button"
              onClick={() => navigate("/playground/free")}
              className="px-8 py-4 bg-white text-[var(--brand)] text-lg font-bold rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              Launch Free Canvas
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-3">
              <img src="./logo.png" alt="Logo" className="h-8" />
              <span className="font-semibold text-theme">Diagrammatic</span>
            </div>
            <p className="text-muted text-sm">
              © 2025 Diagrammatic. Built with ❤️ for system designers
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s ease infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 8s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
};

export default Home;
