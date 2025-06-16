import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  FileText,
  Image,
  Zap,
  Shield,
  Scissors,
  Palette,
  Download,
  RefreshCw,
  ArrowRight,
  Star,
  Users,
  Globe,
  Sparkles,
  CheckCircle,
  Play,
  Award,
  TrendingUp,
  Clock,
  Lock,
  Layers,
  Target,
  Cpu,
  Heart,
  Infinity,
  Brain,
  EyeOff,
} from "lucide-react";

const Home: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: "Privacy First",
      description: "All processing happens locally. Zero data collection.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "WebAssembly algorithms deliver results in seconds.",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: Cpu,
      title: "AI-Powered",
      description: "Advanced ML for intelligent processing.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Layers,
      title: "Batch Processing",
      description: "Handle hundreds of files simultaneously.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Target,
      title: "Precision Tools",
      description: "Professional accuracy with pixel-perfect results.",
      color: "from-red-500 to-rose-500",
    },
    {
      icon: Award,
      title: "Enterprise Ready",
      description: "Built for professionals with advanced features.",
      color: "from-indigo-500 to-purple-500",
    },
  ];

  const stats = [
    {
      label: "Professional Tools",
      value: "50+",
      icon: Zap,
      color: "from-blue-600 to-indigo-600",
    },
    {
      label: "Files Processed",
      value: "2M+",
      icon: TrendingUp,
      color: "from-green-600 to-emerald-600",
    },
    {
      label: "Active Users",
      value: "100K+",
      icon: Users,
      color: "from-purple-600 to-pink-600",
    },
    {
      label: "Countries",
      value: "180+",
      icon: Globe,
      color: "from-orange-600 to-red-600",
    },
  ];

  const popularTools = [
    {
      name: "STRAP Secure",
      path: "/en-US/strap-secure",
      icon: Shield,
      category: "AI Security",
      description: "AI-powered document security with STRAP levels",
      color: "from-red-500 to-orange-500",
      usage: "NEW",
      isNew: true,
    },
    {
      name: "Word to PDF",
      path: "/en-US/tool/word-to-pdf",
      icon: FileText,
      category: "PDF Conversion",
      description: "Convert Word documents with perfect formatting",
      color: "from-red-500 to-rose-500",
      usage: "2.1M",
    },
    {
      name: "PDF to Word",
      path: "/en-US/tool/pdf-to-word",
      icon: FileText,
      category: "PDF Conversion",
      description: "Extract editable text with OCR technology",
      color: "from-blue-500 to-indigo-500",
      usage: "1.8M",
    },
    {
      name: "Remove Background",
      path: "/en-US/tool/background-remove",
      icon: Image,
      category: "AI Image Tools",
      description: "AI-powered background removal in one click",
      color: "from-green-500 to-emerald-500",
      usage: "1.5M",
    },
    {
      name: "Merge PDF",
      path: "/en-US/tool/pdf-merge",
      icon: Layers,
      category: "PDF Tools",
      description: "Combine multiple PDFs with custom ordering",
      color: "from-purple-500 to-violet-500",
      usage: "1.2M",
    },
    {
      name: "Resize Image",
      path: "/en-US/tool/image-resize",
      icon: Image,
      category: "Image Tools",
      description: "Smart resize with AI upscaling technology",
      color: "from-orange-500 to-amber-500",
      usage: "980K",
    },
  ];

  return (
    <>
      <Helmet>
        <title>
          Doclair - Professional PDF & Image Toolkit | Free Online Tools
        </title>
        <meta
          name="description"
          content="Professional PDF and image tools for free. Convert Word to PDF, edit images, remove backgrounds, merge PDFs and more. No registration required."
        />
        <meta
          name="keywords"
          content="PDF converter, Word to PDF, PDF to Word, image editor, remove background, merge PDF, split PDF, compress PDF, resize image"
        />
        <link rel="canonical" href="https://doclair.com/en-US" />
        <meta
          property="og:title"
          content="Doclair - Professional PDF & Image Toolkit"
        />
        <meta
          property="og:description"
          content="Free online tools for PDF and image processing. Convert, edit, optimize, and manage your documents professionally."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://doclair.com/en-US" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative overflow-hidden apple-hero-bg pt-16 pb-24">
        {/* Apple-style floating elements */}
        <div className="absolute top-20 left-12 floating-element opacity-20">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl shadow-lg"></div>
        </div>
        <div
          className="absolute top-32 right-16 floating-element opacity-20"
          style={{ animationDelay: "3s" }}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl shadow-lg"></div>
        </div>
        <div
          className="absolute bottom-20 left-1/4 floating-element opacity-20"
          style={{ animationDelay: "6s" }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-lg"></div>
        </div>
        <div
          className="absolute top-1/2 right-1/4 floating-element opacity-15"
          style={{ animationDelay: "9s" }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg shadow-lg"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-3xl shadow-2xl floating-element apple-bounce">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
            </div>

            <h1 className="hero-title text-shadow-sm mb-6">
              <span className="cursive-text text-5xl md:text-7xl apple-gradient-text">
                Professional
              </span>
              <br />
              <span className="block">PDF & Image</span>
              <span className="cursive-accent apple-gradient-text">
                Toolkit
              </span>
            </h1>

            <p className="hero-subtitle mb-10">
              The{" "}
              <span className="cursive-text text-blue-600 text-xl">
                ultimate
              </span>{" "}
              open-source solution for document and image processing. Convert,
              edit, optimize with{" "}
              <span className="cursive-text text-purple-600 text-xl">
                enterprise-grade
              </span>{" "}
              tools, completely free.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/en-US/strap-secure"
                className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-3 rounded-full font-bold hover:from-red-700 hover:to-orange-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-2xl hover:shadow-3xl text-base"
              >
                <Shield className="h-5 w-5" />
                Try STRAP Secure
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                  NEW
                </span>
              </Link>
              <Link
                to="/en-US/pdf-tools"
                className="btn-primary px-8 py-3 text-base shadow-2xl hover:shadow-3xl"
              >
                <FileText className="h-5 w-5" />
                Explore PDF Tools
              </Link>
              <Link
                to="/en-US/image-tools"
                className="btn-secondary px-8 py-3 text-base shadow-lg hover:shadow-xl"
              >
                <Image className="h-5 w-5" />
                Discover Image Tools
              </Link>
            </div>

            {/* Apple-style trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-3 text-gray-600">
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="compact-text font-semibold">100% Secure</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="compact-text font-semibold">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="compact-text font-semibold">
                  Lightning Fast
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="compact-text font-semibold">
                  Privacy First
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <span className="compact-text font-semibold">
                  No Registration
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STRAP Secure Feature Highlight */}
      <section className="py-16 bg-gradient-to-r from-red-600 via-orange-600 to-red-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex p-4 bg-white/10 backdrop-blur-xl rounded-3xl mb-6">
              <Shield className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Introducing <span className="cursive-text text-5xl">STRAP</span>{" "}
              Secure
            </h2>
            <p className="text-xl text-red-100 max-w-3xl mx-auto mb-8">
              Revolutionary AI-powered document security tool. Apply{" "}
              <span className="cursive-text text-2xl text-white">
                military-grade&nbsp;
              </span>
              sensitivity levels to your documents and images.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center bg-white/10 backdrop-blur-xl rounded-2xl p-6">
              <Brain className="h-12 w-12 mx-auto mb-4 text-red-200" />
              <h3 className="text-xl font-bold mb-2">AI Detection</h3>
              <p className="text-red-100">
                Automatically identifies sensitive content like emails, names,
                and signatures
              </p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-xl rounded-2xl p-6">
              <EyeOff className="h-12 w-12 mx-auto mb-4 text-red-200" />
              <h3 className="text-xl font-bold mb-2">Smart Redaction</h3>
              <p className="text-red-100">
                Permanent removal of sensitive information with
                professional-grade security
              </p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-xl rounded-2xl p-6">
              <Lock className="h-12 w-12 mx-auto mb-4 text-red-200" />
              <h3 className="text-xl font-bold mb-2">AES-256 Encryption</h3>
              <p className="text-red-100">
                Military-grade encryption with STRAP-level security markings
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/en-US/strap-secure"
              className="bg-white text-red-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-all duration-500 inline-flex items-center gap-3 shadow-2xl hover:scale-105"
            >
              <Shield className="h-6 w-6" />
              Try STRAP Secure Now
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Trusted by{" "}
              <span className="cursive-text text-3xl text-blue-600">
                millions
              </span>{" "}
              worldwide
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div
                  className={`inline-flex p-3 bg-gradient-to-br ${stat.color} rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-500 shadow-lg`}
                >
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="stats-number text-4xl">{stat.value}</div>
                <div className="text-gray-600 font-medium compact-text">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">
              Why Choose{" "}
              <span className="cursive-text text-4xl text-blue-600">
                Doclair
              </span>
              ?
            </h2>
            <p className="section-subtitle">
              Built with{" "}
              <span className="cursive-text text-purple-600 text-xl">
                cutting-edge
              </span>{" "}
              technology and designed for professionals who demand excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="apple-floating-card group">
                <div
                  className={`inline-flex p-3 rounded-2xl bg-gradient-to-r ${feature.color} mb-4 group-hover:scale-110 transition-transform duration-500 shadow-lg`}
                >
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 compact-text leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Tools Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">
              Most{" "}
              <span className="cursive-text text-4xl text-green-600">
                Popular
              </span>{" "}
              Tools
            </h2>
            <p className="section-subtitle">
              Start with our{" "}
              <span className="cursive-text text-orange-600 text-xl">
                most-used
              </span>{" "}
              tools, trusted by millions of professionals worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularTools.map((tool, index) => (
              <Link
                key={index}
                to={tool.path}
                className="tool-card group relative"
              >
                {tool.isNew && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
                    NEW
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`inline-flex p-3 rounded-2xl bg-gradient-to-r ${tool.color} group-hover:scale-110 transition-transform duration-500 shadow-lg`}
                  >
                    <tool.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-2 transition-all duration-500 mb-1" />
                    <div
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        tool.isNew
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {tool.usage}
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-500">
                  {tool.name}
                </h3>

                <p className="text-gray-600 compact-text mb-4 leading-relaxed">
                  {tool.description}
                </p>

                <div
                  className={`category-badge ${
                    tool.isNew
                      ? "bg-red-50/80 text-red-700 border-red-200/50"
                      : "category-conversion"
                  }`}
                >
                  {tool.category}
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/en-US/pdf-tools"
              className="btn-primary px-8 py-3 text-base shadow-2xl hover:shadow-3xl"
            >
              View All Tools
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>

        {/* Apple-style floating elements */}
        <div className="absolute top-10 left-10 floating-element opacity-20">
          <Heart className="h-8 w-8 text-white" />
        </div>
        <div
          className="absolute bottom-10 right-10 floating-element opacity-20"
          style={{ animationDelay: "4s" }}
        >
          <Infinity className="h-10 w-10 text-white" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <Sparkles className="h-12 w-12 mx-auto text-white/90 floating-element" />
          </div>

          <h2 className="text-3xl md:text-4xl font-black mb-4 text-shadow-sm">
            Ready to <span className="cursive-text text-5xl">Transform</span>{" "}
            Your Workflow?
          </h2>

          <p className="text-lg text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join{" "}
            <span className="cursive-text text-xl text-white">millions</span> of
            professionals who trust Doclair for their document and image
            processing needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/en-US/strap-secure"
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-gray-50 transition-all duration-500 flex items-center justify-center gap-2 shadow-2xl text-base hover:scale-105"
            >
              <Shield className="h-5 w-5" />
              Try STRAP Secure
            </Link>
            <Link
              to="/en-US/pdf-tools"
              className="bg-white text-blue-600 px-8 py-3 rounded-full font-bold hover:bg-gray-50 transition-all duration-500 flex items-center justify-center gap-2 shadow-2xl text-base hover:scale-105"
            >
              <FileText className="h-5 w-5" />
              Start with PDF Tools
            </Link>
            <Link
              to="/en-US/image-tools"
              className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-blue-600 transition-all duration-500 flex items-center justify-center gap-2 text-base hover:scale-105"
            >
              <Image className="h-5 w-5" />
              Explore Image Tools
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
