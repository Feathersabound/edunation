import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  GraduationCap, Plus, Search, Filter, Star, Users, 
  Clock, TrendingUp, Eye, Edit, Trash2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { motion } from "framer-motion";

export default function MyCourses() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterTier, setFilterTier] = useState("all");

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

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list('-created_date'),
    initialData: [],
  });

  const myCourses = courses.filter(c => c.created_by === user?.email);

  const filteredCourses = myCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === "all" || course.level === filterLevel;
    const matchesTier = filterTier === "all" || course.tier === filterTier;
    return matchesSearch && matchesLevel && matchesTier;
  });

  const levelColors = {
    beginner: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    advanced: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    phd: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
  };

  const tierColors = {
    free: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    paid: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    premium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-text">My Courses</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} created
            </p>
          </div>
          
          <Link to={createPageUrl("Generate")}>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg rounded-2xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Course
            </Button>
          </Link>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-effect border-0 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Filter by level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Filter by tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </motion.div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-effect border-0 p-6 animate-pulse">
                <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4" />
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              </Card>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <Card className="glass-effect border-0 p-12 max-w-2xl mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">
                No courses yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Start creating your first educational masterpiece with Ethan AI
              </p>
              <Link to={createPageUrl("Generate")}>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-2xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Course
                </Button>
              </Link>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-effect border-0 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 group cursor-pointer h-full flex flex-col">
                  <Link to={createPageUrl("CourseView", `?id=${course.id}`)}>
                    {/* Thumbnail */}
                    <div className="h-48 bg-gradient-to-br from-purple-400 via-blue-500 to-cyan-500 relative overflow-hidden">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <GraduationCap className="w-20 h-20 text-white/30" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className={`${
                          course.status === 'published' ? 'bg-green-500' :
                          course.status === 'generating' ? 'bg-blue-500' :
                          'bg-slate-500'
                        } text-white`}>
                          {course.status}
                        </Badge>
                      </div>

                      {/* Tier Badge */}
                      <div className="absolute top-4 right-4">
                        <Badge className={tierColors[course.tier]}>
                          {course.tier}
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <Badge className={levelColors[course.level]}>
                          {course.level}
                        </Badge>
                      </div>

                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
                        {course.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{course.total_enrollments || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span>{course.rating || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{course.content_structure?.length || 0} modules</span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="px-6 pb-6 flex gap-2">
                    <Link to={createPageUrl("CourseView", `?id=${course.id}`)} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}