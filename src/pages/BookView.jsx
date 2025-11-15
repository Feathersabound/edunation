import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  BookOpen, ChevronLeft, ChevronRight, Download, 
  Share2, ArrowLeft, FileText, Bookmark, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ReactMarkdown from "react-markdown";
import RefineContentModal from "../components/RefineContentModal";

export default function BookView() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');

  const [currentChapter, setCurrentChapter] = useState(0);
  const [user, setUser] = useState(null);
  const [showRefineModal, setShowRefineModal] = useState(false);

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

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      if (!bookId) return null;
      const allBooks = await base44.entities.Book.list();
      return allBooks.find(b => b.id === bookId);
    },
    enabled: !!bookId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading book...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-effect border-0 p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Book not found</h2>
          <Button onClick={() => navigate(createPageUrl("MyBooks"))}>
            Back to Books
          </Button>
        </Card>
      </div>
    );
  }

  const chapter = book.chapters?.[currentChapter];
  const progress = ((currentChapter + 1) / (book.chapters?.length || 1)) * 100;

  const levelColors = {
    beginner: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    intermediate: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    advanced: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    phd: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-40 glass-effect border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(createPageUrl("MyBooks"))}
                className="rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {book.title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Chapter {currentChapter + 1} of {book.chapters?.length || 0}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={levelColors[book.level]}>
                {book.level}
              </Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-xl"
                onClick={() => setShowRefineModal(true)}
              >
                <Sparkles className="w-5 h-5 text-purple-600" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Bookmark className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentChapter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-effect border-0 p-8 md:p-12 mb-8">
              {chapter ? (
                <div>
                  {/* Chapter Header */}
                  <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-sm font-semibold">
                        Chapter {chapter.chapter_number}
                      </div>
                      {book.chapters?.length > 0 && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          {Math.ceil((chapter.content?.length || 0) / 1000)} min read
                        </span>
                      )}
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                      {chapter.title}
                    </h1>
                  </div>

                  {/* Chapter Content */}
                  <div className="prose prose-lg prose-slate dark:prose-invert max-w-none mb-8">
                    <ReactMarkdown>{chapter.content}</ReactMarkdown>
                  </div>

                  {/* Chapter Images */}
                  {chapter.images && chapter.images.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      {chapter.images.map((img, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden shadow-lg">
                          <img 
                            src={img} 
                            alt={`Chapter illustration ${idx + 1}`}
                            className="w-full h-64 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Key Takeaways */}
                  {chapter.key_takeaways && chapter.key_takeaways.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-2xl p-8 mb-8">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                          Key Takeaways
                        </h3>
                      </div>
                      <ul className="space-y-3">
                        {chapter.key_takeaways.map((takeaway, idx) => (
                          <li 
                            key={idx}
                            className="flex items-start gap-3 text-slate-700 dark:text-slate-300"
                          >
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-white text-xs font-bold">{idx + 1}</span>
                            </div>
                            <span className="flex-1">{takeaway}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">
                    No content available for this chapter
                  </p>
                </div>
              )}
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mb-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentChapter(currentChapter - 1)}
                disabled={currentChapter === 0}
                className="rounded-2xl"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous Chapter
              </Button>

              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {currentChapter + 1} / {book.chapters?.length || 0}
                </p>
              </div>

              <Button
                size="lg"
                onClick={() => setCurrentChapter(currentChapter + 1)}
                disabled={currentChapter >= (book.chapters?.length || 0) - 1}
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-2xl"
              >
                Next Chapter
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Chapter Navigation Grid */}
            <Card className="glass-effect border-0 p-6">
              <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-200">
                All Chapters
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {book.chapters?.map((ch, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentChapter(idx)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      idx === currentChapter
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg scale-105'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1 opacity-80">
                      Chapter {ch.chapter_number}
                    </div>
                    <div className="text-sm font-bold line-clamp-2">
                      {ch.title}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-2xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
        >
          <Download className="w-6 h-6" />
        </Button>
      </div>

      {/* Refine Modal */}
      <RefineContentModal
        open={showRefineModal}
        onClose={() => setShowRefineModal(false)}
        contentId={bookId}
        contentType="book"
        onSuccess={() => {
          queryClient.invalidateQueries(['book', bookId]);
        }}
      />
    </div>
  );
}