import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Shield, Trash2, Edit, Lock, Unlock, BookOpen, 
  GraduationCap, Search, Filter, Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    const loadUser = async () => {
      const currentUser = await base44.auth.me();
      if (currentUser.role !== 'admin') {
        navigate(createPageUrl("Dashboard"));
      }
      setUser(currentUser);
    };
    loadUser();
  }, []);

  const { data: courses = [] } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: () => base44.entities.Course.list(),
  });

  const { data: books = [] } = useQuery({
    queryKey: ['admin-books'],
    queryFn: () => base44.entities.Book.list(),
  });

  const toggleProtection = useMutation({
    mutationFn: async ({ id, type, protected: isProtected }) => {
      if (type === 'course') {
        await base44.entities.Course.update(id, { protected: !isProtected });
      } else {
        await base44.entities.Book.update(id, { protected: !isProtected });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-courses']);
      queryClient.invalidateQueries(['admin-books']);
    },
  });

  const deleteContent = useMutation({
    mutationFn: async ({ id, type, protected: isProtected }) => {
      if (isProtected) {
        throw new Error("Cannot delete protected content");
      }
      if (type === 'course') {
        await base44.entities.Course.delete(id);
      } else {
        await base44.entities.Book.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-courses']);
      queryClient.invalidateQueries(['admin-books']);
    },
    onError: (error) => {
      alert(error.message);
    },
  });

  const filteredCourses = courses.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.topic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBooks = books.filter(b => 
    b.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.topic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-400">Manage all content and users</p>
            </div>
          </div>

          <Card className="glass-effect border-0 p-4">
            <div className="flex items-center gap-4">
              <Search className="w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search courses and books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 focus-visible:ring-0"
              />
            </div>
          </Card>
        </div>

        <Tabs defaultValue="courses">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="courses">
              <GraduationCap className="w-4 h-4 mr-2" />
              Courses ({courses.length})
            </TabsTrigger>
            <TabsTrigger value="books">
              <BookOpen className="w-4 h-4 mr-2" />
              Books ({books.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses">
            <div className="space-y-3">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="glass-effect border-0 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{course.title}</h3>
                        {course.protected && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            <Lock className="w-3 h-3 mr-1" />
                            Protected
                          </Badge>
                        )}
                        {course.adult_content && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                            Adult
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mb-2">{course.description}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>Topic: {course.topic}</span>
                        <span>•</span>
                        <span>Level: {course.level}</span>
                        <span>•</span>
                        <span>By: {course.created_by}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`${createPageUrl("CourseAuthor")}?id=${course.id}`)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`${createPageUrl("CourseView")}?id=${course.id}`)}
                      >
                        <Wand2 className="w-4 h-4 mr-1" />
                        AI Refine
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleProtection.mutate({ 
                          id: course.id, 
                          type: 'course', 
                          protected: course.protected 
                        })}
                      >
                        {course.protected ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this course?')) {
                            deleteContent.mutate({ id: course.id, type: 'course', protected: course.protected });
                          }
                        }}
                        disabled={course.protected}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="books">
            <div className="space-y-3">
              {filteredBooks.map((book) => (
                <Card key={book.id} className="glass-effect border-0 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{book.title}</h3>
                        {book.protected && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            <Lock className="w-3 h-3 mr-1" />
                            Protected
                          </Badge>
                        )}
                        {book.adult_content && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                            Adult
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mb-2">{book.subtitle}</p>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>Topic: {book.topic}</span>
                        <span>•</span>
                        <span>Level: {book.level}</span>
                        <span>•</span>
                        <span>By: {book.created_by}</span>
                        <span>•</span>
                        <span>{book.chapters?.length || 0} chapters</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`${createPageUrl("BookAuthor")}?id=${book.id}`)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`${createPageUrl("BookView")}?id=${book.id}`)}
                      >
                        <Wand2 className="w-4 h-4 mr-1" />
                        AI Refine
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleProtection.mutate({ 
                          id: book.id, 
                          type: 'book', 
                          protected: book.protected 
                        })}
                      >
                        {book.protected ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this book?')) {
                            deleteContent.mutate({ id: book.id, type: 'book', protected: book.protected });
                          }
                        }}
                        disabled={book.protected}
                        className="text-red-500 hover:text-red-700"
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
      </div>
    </div>
  );
}