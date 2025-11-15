import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Search, BookOpen, GraduationCap, TrendingUp, Star, Users, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

export default function Discover() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [contentType, setContentType] = useState("all");

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

  const showAdultContent = user?.show_adult_content || false;

  const allContent = [
    ...courses.filter(c => !c.adult_content || showAdultContent).map(c => ({ ...c, type: 'course' })),
    ...books.filter(b => !b.adult_content || showAdultContent).map(b => ({ ...b, type: 'book' }))
  ];

  const topics = [...new Set(allContent.map(item => item.topic))].filter(Boolean);

  const filteredContent = allContent
    .filter(item => 
      (item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .filter(item => levelFilter === "all" || item.level === levelFilter)
    .filter(item => topicFilter === "all" || item.topic === topicFilter)
    .filter(item => contentType === "all" || item.type === contentType);

  const featuredContent = allContent
    .sort((a, b) => (b.total_enrollments || 0) - (a.total_enrollments || 0))
    .slice(0, 3);

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Discover</span> Learning Content
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Explore courses and books created by the community
          </p>
        </motion.div>

        {/* Featured Section */}
        {featuredContent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <h2 className="text-2xl font-bold">Featured Content</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredContent.map((item) => (
                <Link key={item.id} to={createPageUrl(item.type === 'course' ? 'CourseView' : 'BookView', `?id=${item.id}`)}>
                  <Card className="glass-effect border-0 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                    <div className="h-48 bg-gradient-to-br from-purple-400 via-blue-500 to-cyan-500 relative">
                      {(item.thumbnail_url || item.cover_url) ? (
                        <img 
                          src={item.thumbnail_url || item.cover_url} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {item.type === 'course' ? (
                            <GraduationCap className="w-20 h-20 text-white/30" />
                          ) : (
                            <BookOpen className="w-20 h-20 text-white/30" />
                          )}
                        </div>
                      )}
                      <Badge className="absolute top-4 right-4 bg-amber-500 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                    <div className="p-6">
                      <Badge className="mb-2">
                        {item.type === 'course' ? 'Course' : 'Book'}
                      </Badge>
                      <h3 className="text-lg font-bold mb-2 line-clamp-2">{item.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                        {item.description || item.subtitle || item.topic}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{item.level}</span>
                        {item.total_enrollments > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {item.total_enrollments}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <Card className="glass-effect border-0 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="phd">PhD</SelectItem>
              </SelectContent>
            </Select>

            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="All Topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Content Type Tabs */}
        <Tabs value={contentType} onValueChange={setContentType} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="all">All ({filteredContent.length})</TabsTrigger>
            <TabsTrigger value="course">
              Courses ({filteredContent.filter(c => c.type === 'course').length})
            </TabsTrigger>
            <TabsTrigger value="book">
              Books ({filteredContent.filter(b => b.type === 'book').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content Grid */}
        {filteredContent.length === 0 ? (
          <Card className="glass-effect border-0 p-12 text-center">
            <Filter className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No content found</h3>
            <p className="text-slate-600 dark:text-slate-400">
              Try adjusting your search or filters
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredContent.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={createPageUrl(item.type === 'course' ? 'CourseView' : 'BookView', `?id=${item.id}`)}>
                  <Card className="glass-effect border-0 overflow-hidden hover:shadow-2xl transition-all duration-300 group h-full flex flex-col">
                    <div className="aspect-[3/4] bg-gradient-to-br from-purple-400 via-blue-500 to-cyan-500 relative">
                      {(item.thumbnail_url || item.cover_url) ? (
                        <img 
                          src={item.thumbnail_url || item.cover_url} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          {item.type === 'course' ? (
                            <GraduationCap className="w-16 h-16 text-white/30" />
                          ) : (
                            <BookOpen className="w-16 h-16 text-white/30" />
                          )}
                        </div>
                      )}
                      <Badge className="absolute top-4 left-4">
                        {item.level}
                      </Badge>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <Badge className="mb-2 w-fit">
                        {item.type === 'course' ? 'Course' : 'Book'}
                      </Badge>
                      <h3 className="text-lg font-bold mb-2 line-clamp-2">{item.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 flex-1">
                        {item.description || item.subtitle || item.topic}
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t">
                        <span>{item.topic}</span>
                        {item.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500" />
                            {item.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}