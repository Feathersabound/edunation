import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Shield, Search, Pencil, Trash2, Sparkles, Lock, Unlock,
  BookOpen, GraduationCap, AlertCircle, CheckCircle, Activity, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RefineContentModal from "../components/RefineContentModal";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchCourses, setSearchCourses] = useState("");
  const [searchBooks, setSearchBooks] = useState("");
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [auditResults, setAuditResults] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.role !== 'admin') {
          navigate(createPageUrl("Dashboard"));
        }
      } catch (error) {
        console.error("User not authenticated");
        navigate(createPageUrl("Dashboard"));
      }
    };
    loadUser();
  }, [navigate]);

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list('-created_date'),
    initialData: [],
  });

  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ['books'],
    queryFn: () => base44.entities.Book.list('-created_date'),
    initialData: [],
  });

  const toggleProtectionMutation = useMutation({
    mutationFn: async ({ id, type, currentStatus }) => {
      if (type === 'course') {
        return base44.entities.Course.update(id, { protected: !currentStatus });
      } else {
        return base44.entities.Book.update(id, { protected: !currentStatus });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      queryClient.invalidateQueries(['books']);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, type, isProtected }) => {
      if (isProtected) {
        throw new Error('Cannot delete protected content');
      }
      if (type === 'course') {
        return base44.entities.Course.delete(id);
      } else {
        return base44.entities.Book.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['courses']);
      queryClient.invalidateQueries(['books']);
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const runSystemAudit = async () => {
    setAuditLoading(true);
    try {
      const response = await base44.functions.invoke('systemAudit', {});
      setAuditResults(response.data.audit);
    } catch (error) {
      console.error("Audit failed:", error);
      alert("System audit failed: " + error.message);
    } finally {
      setAuditLoading(false);
    }
  };

  const cleanupInvalidContent = async (dryRun = true) => {
    setCleanupLoading(true);
    try {
      const response = await base44.functions.invoke('cleanupInvalidContent', { 
        contentType: 'all',
        dryRun 
      });
      alert(response.data.message);
      if (!dryRun) {
        queryClient.invalidateQueries(['courses']);
        queryClient.invalidateQueries(['books']);
      }
    } catch (error) {
      console.error("Cleanup failed:", error);
      alert("Cleanup failed: " + error.message);
    } finally {
      setCleanupLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => 
    course.title?.toLowerCase().includes(searchCourses.toLowerCase()) ||
    course.topic?.toLowerCase().includes(searchCourses.toLowerCase()) ||
    course.created_by?.toLowerCase().includes(searchCourses.toLowerCase())
  );

  const filteredBooks = books.filter(book => 
    book.title?.toLowerCase().includes(searchBooks.toLowerCase()) ||
    book.topic?.toLowerCase().includes(searchBooks.toLowerCase()) ||
    book.created_by?.toLowerCase().includes(searchBooks.toLowerCase())
  );

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-400">
                System management and content moderation
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={runSystemAudit}
              disabled={auditLoading}
              variant="outline"
              className="gap-2"
            >
              <Activity className="w-4 h-4" />
              {auditLoading ? "Running..." : "System Audit"}
            </Button>
            <Button
              onClick={() => cleanupInvalidContent(true)}
              disabled={cleanupLoading}
              variant="outline"
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              Preview Cleanup
            </Button>
            <Button
              onClick={() => {
                if (confirm("Delete all invalid content? This cannot be undone.")) {
                  cleanupInvalidContent(false);
                }
              }}
              disabled={cleanupLoading}
              className="bg-red-600 hover:bg-red-700 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Execute Cleanup
            </Button>
          </div>
        </div>

        {auditResults && (
          <Card className="glass-effect border-0 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold">System Audit Results</h2>
              <Badge className={auditResults.issues.length === 0 ? "bg-green-500" : "bg-amber-500"}>
                {auditResults.issues.length === 0 ? "Healthy" : `${auditResults.issues.length} Issues`}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {Object.entries(auditResults.aiServices).map(([key, value]) => (
                <div key={key} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{key}</span>
                    {value.configured ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    {value.apiStatus || value.status}
                  </div>
                </div>
              ))}
            </div>

            {auditResults.issues.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">Issues Found:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-amber-700 dark:text-amber-300">
                  {auditResults.issues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">AI Orchestration:</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                {auditResults.aiOrchestration.strategy}
              </p>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                Order: {auditResults.aiOrchestration.order.join(" → ")}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                Override: {auditResults.aiOrchestration.override}
              </div>
            </div>
          </Card>
        )}

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="courses" className="gap-2">
              <GraduationCap className="w-4 h-4" />
              Courses ({courses.length})
            </TabsTrigger>
            <TabsTrigger value="books" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Books ({books.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-4">
            <Card className="glass-effect border-0 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search courses..."
                  value={searchCourses}
                  onChange={(e) => setSearchCourses(e.target.value)}
                  className="pl-10"
                />
              </div>
            </Card>

            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="glass-effect border-0 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{course.title}</h3>
                        {course.protected && (
                          <Badge className="bg-blue-500 text-white gap-1">
                            <Lock className="w-3 h-3" />
                            Protected
                          </Badge>
                        )}
                        {course.adult_content && (
                          <Badge className="bg-red-500 text-white">18+</Badge>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mb-3">
                        {course.description}
                      </p>
                      <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                        <span>Topic: {course.topic}</span>
                        <span>•</span>
                        <span>Level: {course.level}</span>
                        <span>•</span>
                        <span>By: {course.created_by}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`${createPageUrl("CourseAuthor")}?id=${course.id}`)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedContent({ id: course.id, type: 'course' });
                          setShowRefineModal(true);
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-purple-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleProtectionMutation.mutate({ 
                          id: course.id, 
                          type: 'course',
                          currentStatus: course.protected
                        })}
                      >
                        {course.protected ? (
                          <Unlock className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-600" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (course.protected) {
                            alert("Cannot delete protected content. Remove protection first.");
                            return;
                          }
                          if (confirm(`Delete "${course.title}"?`)) {
                            deleteMutation.mutate({ 
                              id: course.id, 
                              type: 'course',
                              isProtected: course.protected
                            });
                          }
                        }}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="books" className="space-y-4">
            <Card className="glass-effect border-0 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search books..."
                  value={searchBooks}
                  onChange={(e) => setSearchBooks(e.target.value)}
                  className="pl-10"
                />
              </div>
            </Card>

            <div className="space-y-4">
              {filteredBooks.map((book) => (
                <Card key={book.id} className="glass-effect border-0 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{book.title}</h3>
                        {book.protected && (
                          <Badge className="bg-blue-500 text-white gap-1">
                            <Lock className="w-3 h-3" />
                            Protected
                          </Badge>
                        )}
                        {book.adult_content && (
                          <Badge className="bg-red-500 text-white">18+</Badge>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mb-3">
                        {book.subtitle}
                      </p>
                      <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                        <span>Topic: {book.topic}</span>
                        <span>•</span>
                        <span>Level: {book.level}</span>
                        <span>•</span>
                        <span>By: {book.created_by}</span>
                        <span>•</span>
                        <span>{book.chapters?.length || 0} chapters</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(`${createPageUrl("BookAuthor")}?id=${book.id}`)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedContent({ id: book.id, type: 'book' });
                          setShowRefineModal(true);
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-purple-600" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleProtectionMutation.mutate({ 
                          id: book.id, 
                          type: 'book',
                          currentStatus: book.protected
                        })}
                      >
                        {book.protected ? (
                          <Unlock className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-600" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (book.protected) {
                            alert("Cannot delete protected content. Remove protection first.");
                            return;
                          }
                          if (confirm(`Delete "${book.title}"?`)) {
                            deleteMutation.mutate({ 
                              id: book.id, 
                              type: 'book',
                              isProtected: book.protected
                            });
                          }
                        }}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {showRefineModal && selectedContent && (
          <RefineContentModal
            open={showRefineModal}
            onClose={() => {
              setShowRefineModal(false);
              setSelectedContent(null);
            }}
            contentId={selectedContent.id}
            contentType={selectedContent.type}
            onSuccess={() => {
              queryClient.invalidateQueries(['courses']);
              queryClient.invalidateQueries(['books']);
            }}
          />
        )}
      </div>
    </div>
  );
}