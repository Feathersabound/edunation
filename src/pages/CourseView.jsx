import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, CheckCircle2, Clock, Star, Users, 
  ChevronRight, Play, Award, ArrowLeft 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from "react-markdown";

export default function CourseView() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');

  const [selectedModule, setSelectedModule] = useState(0);
  const [selectedSection, setSelectedSection] = useState(0);
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

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const courses = await base44.entities.Course.filter({ id: courseId });
      return courses[0];
    },
    enabled: !!courseId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-effect border-0 p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Button onClick={() => navigate(createPageUrl("MyCourses"))}>
            Back to Courses
          </Button>
        </Card>
      </div>
    );
  }

  const currentModule = course.content_structure?.[selectedModule];
  const currentSection = currentModule?.sections?.[selectedSection];

  const levelColors = {
    beginner: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    advanced: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    phd: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-96 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 overflow-hidden">
        {course.thumbnail_url && (
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("MyCourses"))}
            className="absolute top-8 left-8 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className={`${levelColors[course.level]} text-sm`}>
                {course.level}
              </Badge>
              <Badge className="bg-white/20 text-white backdrop-blur-sm border-0">
                {course.tier}
              </Badge>
              <Badge className="bg-white/20 text-white backdrop-blur-sm border-0">
                {course.content_structure?.length || 0} Modules
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {course.title}
            </h1>
            
            <p className="text-xl text-white/90 mb-6 max-w-3xl">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{course.total_enrollments || 0} enrolled</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                <span>{course.rating || 0} rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Self-paced</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar - Curriculum */}
          <div className="lg:col-span-1">
            <Card className="glass-effect border-0 p-6 sticky top-24">
              <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">
                Course Curriculum
              </h3>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {course.content_structure?.map((module, moduleIndex) => (
                  <div key={moduleIndex} className="space-y-1">
                    <button
                      onClick={() => {
                        setSelectedModule(moduleIndex);
                        setSelectedSection(0);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedModule === moduleIndex
                          ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">
                          Module {moduleIndex + 1}: {module.module_title}
                        </span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${
                          selectedModule === moduleIndex ? 'rotate-90' : ''
                        }`} />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {module.sections?.length || 0} sections
                      </div>
                    </button>

                    {selectedModule === moduleIndex && (
                      <div className="ml-4 space-y-1">
                        {module.sections?.map((section, sectionIndex) => (
                          <button
                            key={sectionIndex}
                            onClick={() => setSelectedSection(sectionIndex)}
                            className={`w-full text-left p-2 rounded-lg text-sm transition-all ${
                              selectedSection === sectionIndex
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Play className="w-3 h-3" />
                              {section.title}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <Card className="glass-effect border-0 p-8 mb-6">
              {currentSection ? (
                <div>
                  <h2 className="text-3xl font-bold mb-6 text-slate-800 dark:text-slate-200">
                    {currentSection.title}
                  </h2>

                  <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
                    <ReactMarkdown>{currentSection.content}</ReactMarkdown>
                  </div>

                  {currentSection.key_points && currentSection.key_points.length > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-6 mb-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Award className="w-5 h-5" />
                        Key Takeaways
                      </h3>
                      <ul className="space-y-2">
                        {currentSection.key_points.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentSection.media_urls && currentSection.media_urls.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {currentSection.media_urls.map((url, idx) => (
                        <img 
                          key={idx}
                          src={url} 
                          alt={`Visual ${idx + 1}`}
                          className="w-full rounded-lg shadow-md"
                        />
                      ))}
                    </div>
                  )}

                  {currentSection.quiz_questions && currentSection.quiz_questions.length > 0 && (
                    <div className="bg-purple-50 dark:bg-purple-950 rounded-xl p-6">
                      <h3 className="text-lg font-semibold mb-4 text-purple-700 dark:text-purple-300">
                        Quick Quiz
                      </h3>
                      <div className="space-y-4">
                        {currentSection.quiz_questions.map((quiz, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg p-4">
                            <p className="font-medium mb-3 text-slate-800 dark:text-slate-200">
                              {idx + 1}. {quiz.question}
                            </p>
                            <div className="space-y-2">
                              {quiz.options?.map((option, optIdx) => (
                                <button
                                  key={optIdx}
                                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                                    optIdx === quiz.correct_answer
                                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
                                      : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                  }`}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (selectedSection > 0) {
                          setSelectedSection(selectedSection - 1);
                        } else if (selectedModule > 0) {
                          setSelectedModule(selectedModule - 1);
                          setSelectedSection(course.content_structure[selectedModule - 1].sections.length - 1);
                        }
                      }}
                      disabled={selectedModule === 0 && selectedSection === 0}
                    >
                      Previous
                    </Button>

                    <Button
                      className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
                      onClick={() => {
                        if (selectedSection < currentModule.sections.length - 1) {
                          setSelectedSection(selectedSection + 1);
                        } else if (selectedModule < course.content_structure.length - 1) {
                          setSelectedModule(selectedModule + 1);
                          setSelectedSection(0);
                        }
                      }}
                      disabled={
                        selectedModule === course.content_structure.length - 1 &&
                        selectedSection === currentModule.sections.length - 1
                      }
                    >
                      Next Section
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    Select a module to get started
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}