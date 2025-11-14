import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Sparkles, BookOpen, GraduationCap, TrendingUp, Award, 
  Zap, ArrowRight, Clock, Star, Users 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import RecommendationsSection from "../components/RecommendationsSection";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error("User not authenticated");
      }
    };
    loadUser();
  }, []);

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list('-created_date'),
    initialData: [],
  });

  const { data: books = [] } = useQuery({
    queryKey: ['books'],
    queryFn: () => base44.entities.Book.list('-created_date'),
    initialData: [],
  });

  const myCourses = courses.filter(c => c.created_by === user?.email);
  const myBooks = books.filter(b => b.created_by === user?.email);

  const stats = [
    { 
      icon: GraduationCap, 
      label: "Courses Created", 
      value: myCourses.length,
      color: "from-purple-500 to-blue-600",
      bgColor: "bg-purple-50 dark:bg-purple-950"
    },
    { 
      icon: BookOpen, 
      label: "Books Written", 
      value: myBooks.length,
      color: "from-blue-500 to-cyan-600",
      bgColor: "bg-blue-50 dark:bg-blue-950"
    },
    { 
      icon: Users, 
      label: "Total Enrollments", 
      value: myCourses.reduce((sum, c) => sum + (c.total_enrollments || 0), 0),
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950"
    },
    { 
      icon: Star, 
      label: "Avg Rating", 
      value: myCourses.length > 0 
        ? (myCourses.reduce((sum, c) => sum + (c.rating || 0), 0) / myCourses.length).toFixed(1)
        : "0.0",
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50 dark:bg-amber-950"
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: "Multi-AI System",
      description: "Grok AI + Claude AI + Agent collaboration",
      gradient: "from-purple-500 to-blue-600"
    },
    {
      icon: TrendingUp,
      title: "AI Recommendations",
      description: "Personalized content suggestions",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: Award,
      title: "Multi-Language",
      description: "Create content in any language",
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      icon: Zap,
      title: "Smart Refinement",
      description: "90%+ originality with citations",
      gradient: "from-amber-500 to-orange-600"
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950 dark:to-blue-950 mb-6">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Powered by Multi-AI Collaboration
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Create. Educate.</span>
            <br />
            <span className="text-slate-800 dark:text-slate-200">Transform Learning.</span>
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8">
            Generate world-class educational content with AI precision. From beginner guides 
            to PhD-level research—crafted with creativity, backed by intelligence.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to={createPageUrl("Generate")}>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl px-8 py-6 text-lg font-semibold group"
              >
                <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Start Creating
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to={createPageUrl("MyCourses")}>
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-2xl px-8 py-6 text-lg font-semibold border-2 hover:border-purple-500 dark:hover:border-purple-400 transition-all duration-300"
              >
                Browse My Content
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Grid */}
        {user && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className={`${stat.bgColor} border-0 p-6 hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {stat.label}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* AI Recommendations Section */}
        {user && (myCourses.length > 0 || myBooks.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <RecommendationsSection />
          </motion.div>
        )}

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-800 dark:text-slate-200">
            Why Choose <span className="gradient-text">EduForge AI</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="glass-effect border-0 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105 group cursor-pointer h-full">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-800 dark:text-slate-200">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Content */}
        {user && (myCourses.length > 0 || myBooks.length > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">
                Recent Content
              </h2>
              <Link to={createPageUrl("MyCourses")}>
                <Button variant="ghost" className="group">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...myCourses.slice(0, 3), ...myBooks.slice(0, 3 - myCourses.length)].map((item, index) => {
                const isCourse = item.content_structure !== undefined;
                return (
                  <Link 
                    key={item.id} 
                    to={createPageUrl(isCourse ? "CourseView" : "BookView", `?id=${item.id}`)}
                  >
                    <Card className="glass-effect border-0 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer group">
                      <div className="h-48 bg-gradient-to-br from-purple-400 via-blue-500 to-cyan-500 relative overflow-hidden">
                        {item.thumbnail_url || item.cover_url ? (
                          <img 
                            src={item.thumbnail_url || item.cover_url} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            {isCourse ? (
                              <GraduationCap className="w-20 h-20 text-white/30" />
                            ) : (
                              <BookOpen className="w-20 h-20 text-white/30" />
                            )}
                          </div>
                        )}
                        <div className="absolute top-4 right-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white backdrop-blur-sm ${
                            item.tier === 'premium' ? 'bg-amber-500/80' :
                            item.tier === 'paid' ? 'bg-blue-500/80' :
                            'bg-emerald-500/80'
                          }`}>
                            {item.tier || 'free'}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          {isCourse ? (
                            <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                            {isCourse ? 'Course' : 'Book'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                          {item.description || item.subtitle || item.topic}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.level}
                          </span>
                          <Clock className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* CTA Section */}
        {(!user || (myCourses.length === 0 && myBooks.length === 0)) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-16 text-center"
          >
            <Card className="glass-effect border-0 p-12 max-w-3xl mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto mb-6 glow-effect">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-slate-800 dark:text-slate-200">
                Ready to Create Your First Course?
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                Let Multi-AI guide you through creating engaging educational content 
                that inspires and educates.
              </p>
              <Link to={createPageUrl("Generate")}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-xl rounded-2xl px-8 py-6 text-lg font-semibold"
                >
                  Get Started Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}