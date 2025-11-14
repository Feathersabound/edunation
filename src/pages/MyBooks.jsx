import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  BookOpen, Plus, Search, FileText, Eye, Download 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function MyBooks() {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const { data: books = [], isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: () => base44.entities.Book.list('-created_date'),
    initialData: [],
  });

  const myBooks = books.filter(b => b.created_by === user?.email);

  const filteredBooks = myBooks.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const levelColors = {
    beginner: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    advanced: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    phd: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
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
              <span className="gradient-text">My Books</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              {filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''} written
            </p>
          </div>
          
          <Link to={createPageUrl("Generate")}>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg rounded-2xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Write New Book
            </Button>
          </Link>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-effect border-0 p-6 mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </Card>
        </motion.div>

        {/* Books Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-effect border-0 p-6 animate-pulse">
                <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4" />
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
              </Card>
            ))}
          </div>
        ) : filteredBooks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <Card className="glass-effect border-0 p-12 max-w-2xl mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">
                No books yet
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8">
                Write your first book with the power of Ethan AI
              </p>
              <Link to={createPageUrl("Generate")}>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-2xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Write Your First Book
                </Button>
              </Link>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book, index) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass-effect border-0 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105 group cursor-pointer h-full flex flex-col">
                  <Link to={createPageUrl("BookView", `?id=${book.id}`)}>
                    {/* Cover */}
                    <div className="aspect-[3/4] bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 relative overflow-hidden">
                      {book.cover_url ? (
                        <img 
                          src={book.cover_url} 
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center p-6">
                          <div className="text-center">
                            <BookOpen className="w-16 h-16 text-white/30 mx-auto mb-4" />
                            <h4 className="text-white font-bold text-lg line-clamp-3">
                              {book.title}
                            </h4>
                          </div>
                        </div>
                      )}
                      
                      {/* Status */}
                      <div className="absolute top-4 left-4">
                        <Badge className={`${
                          book.status === 'published' ? 'bg-green-500' :
                          book.status === 'completed' ? 'bg-blue-500' :
                          book.status === 'generating' ? 'bg-amber-500' :
                          'bg-slate-500'
                        } text-white`}>
                          {book.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex-1 flex flex-col">
                      <Badge className={`${levelColors[book.level]} mb-3 w-fit`}>
                        {book.level}
                      </Badge>

                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {book.title}
                      </h3>
                      
                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 flex-1">
                        {book.subtitle || book.topic}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>{book.chapters?.length || 0} chapters</span>
                        </div>
                        <span>{book.estimated_pages || 0} pages</span>
                      </div>
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="px-4 pb-4 flex gap-2">
                    <Link to={createPageUrl("BookView", `?id=${book.id}`)} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
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