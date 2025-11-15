
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Plus, Trash2, Save, ArrowLeft, Wand2, GripVertical, Image as ImageIcon, 
  Loader2, Download, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import EnhancedImageGenerator from "../components/EnhancedImageGenerator";
import BookCoverGenerator from "../components/BookCoverGenerator";

export default function BookAuthor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get('id');
  
  const [book, setBook] = useState({
    title: "",
    subtitle: "",
    topic: "",
    level: "beginner",
    adult_content: false,
    cover_url: "", // Added cover_url to state
    chapters: []
  });
  const [saving, setSaving] = useState(false);
  const [enhancingChapter, setEnhancingChapter] = useState(null);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [showCoverGenerator, setShowCoverGenerator] = useState(false); // Added showCoverGenerator state
  const [currentChapterForImage, setCurrentChapterForImage] = useState(null);
  const [exporting, setExporting] = useState(false);

  const { data: existingBook, isLoading } = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      if (!bookId) return null;
      const allBooks = await base44.entities.Book.list();
      return allBooks.find(b => b.id === bookId);
    },
    enabled: !!bookId,
  });

  useEffect(() => {
    if (existingBook) {
      setBook({
        title: existingBook.title || "",
        subtitle: existingBook.subtitle || "",
        topic: existingBook.topic || "",
        level: existingBook.level || "beginner",
        adult_content: existingBook.adult_content || false,
        cover_url: existingBook.cover_url || "", // Set cover_url from existing book
        chapters: existingBook.chapters || []
      });
    }
  }, [existingBook]);

  const addChapter = () => {
    setBook(prev => ({
      ...prev,
      chapters: [...(prev.chapters || []), {
        chapter_number: (prev.chapters?.length || 0) + 1,
        title: `Chapter ${(prev.chapters?.length || 0) + 1}`,
        content: "",
        key_takeaways: [],
        images: []
      }]
    }));
  };

  const updateChapter = (index, field, value) => {
    const newChapters = [...(book.chapters || [])];
    newChapters[index][field] = value;
    setBook(prev => ({ ...prev, chapters: newChapters }));
  };

  const deleteChapter = (index) => {
    const newChapters = (book.chapters || []).filter((_, i) => i !== index);
    newChapters.forEach((ch, i) => ch.chapter_number = i + 1);
    setBook(prev => ({ ...prev, chapters: newChapters }));
  };

  const enhanceChapter = async (index) => {
    setEnhancingChapter(index);
    try {
      const chapter = book.chapters[index];
      
      const response = await base44.functions.invoke('generateWithClaude', {
        contentType: "book",
        topic: book.topic,
        title: chapter.title,
        level: book.level,
        uniqueTwist: chapter.content || "Expand this chapter with detailed, engaging content",
        targetLength: "medium",
        adultContent: book.adult_content,
        britishHumor: false
      });

      if (response.data && response.data.success && response.data.data.chapters) {
        const enhancedChapter = response.data.data.chapters[0];
        updateChapter(index, "content", enhancedChapter.content);
        updateChapter(index, "key_takeaways", enhancedChapter.key_takeaways || []);
        toast.success("Chapter enhanced successfully!");
      } else {
        throw new Error("Invalid AI response");
      }
    } catch (error) {
      console.error("AI enhancement error:", error);
      toast.error("Failed to enhance with AI: " + error.message);
    } finally {
      setEnhancingChapter(null);
    }
  };

  const openImageGenerator = (chapterIndex) => {
    const chapter = book.chapters[chapterIndex];
    setCurrentChapterForImage({
      index: chapterIndex,
      prompt: `${chapter.title}. ${book.topic}. ${book.level} level book illustration.`
    });
    setShowImageGenerator(true);
  };

  const handleImageGenerated = (imageUrl) => {
    if (currentChapterForImage !== null) {
      const chapter = book.chapters[currentChapterForImage.index];
      const currentImages = chapter.images || [];
      updateChapter(currentChapterForImage.index, "images", [...currentImages, imageUrl]);
    }
  };

  const removeChapterImage = (chapterIndex, imageIndex) => {
    const chapter = book.chapters[chapterIndex];
    const newImages = (chapter.images || []).filter((_, idx) => idx !== imageIndex);
    updateChapter(chapterIndex, "images", newImages);
  };

  const handleSave = async () => {
    if (!book.title || !book.topic) {
      toast.error("Please fill in title and topic");
      return;
    }

    setSaving(true);
    try {
      const user = await base44.auth.me();
      
      const bookData = {
        title: book.title,
        subtitle: book.subtitle || "",
        topic: book.topic,
        level: book.level,
        adult_content: book.adult_content,
        cover_url: book.cover_url || "", // Added cover_url to bookData
        chapters: book.chapters || [],
        author_name: user?.full_name || "Anonymous",
        status: (book.chapters || []).length > 0 ? "completed" : "draft", // Updated status logic
        word_count: (book.chapters || []).reduce((sum, ch) => sum + (ch.content?.length || 0), 0),
        estimated_pages: Math.ceil(((book.chapters || []).reduce((sum, ch) => sum + (ch.content?.length || 0), 0)) / 2000)
      };

      let savedBook;
      if (bookId) {
        await base44.entities.Book.update(bookId, bookData);
        savedBook = { id: bookId, ...bookData };
        toast.success("Book updated successfully!");
      } else {
        savedBook = await base44.entities.Book.create(bookData);
        toast.success("Book created successfully!");
        navigate(`${createPageUrl("BookAuthor")}?id=${savedBook.id}`, { replace: true });
      }
      
      queryClient.invalidateQueries(['book', bookId || savedBook.id]);
      queryClient.invalidateQueries(['books']);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save book: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async (format) => {
    if (!bookId) {
      toast.error("Please save the book first");
      return;
    }

    setExporting(true);
    try {
      const response = await base44.functions.invoke('exportBookPDF', {
        bookId,
        format
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.title}_${format}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export PDF: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl("MyBooks"))}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Book Author</h1>
              <p className="text-slate-600 dark:text-slate-400">
                {bookId ? "Edit your book" : "Create a new book"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {bookId && (
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  onClick={() => handleExportPDF('standard')}
                  disabled={exporting}
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleExportPDF('kdp')}
                  disabled={exporting}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  KDP
                </Button>
              </div>
            )}
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Book"}
            </Button>
          </div>
        </div>

        <Card className="glass-effect border-0 p-8 mb-6">
          <div className="mb-6">
            <Label>Book Cover</Label>
            <div className="mt-2 flex gap-4">
              {book.cover_url && (
                <img 
                  src={book.cover_url} 
                  alt="Book cover"
                  className="w-32 h-40 object-cover rounded-lg"
                />
              )}
              <Button
                variant="outline"
                onClick={() => setShowCoverGenerator(true)}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {book.cover_url ? "Change Cover" : "Generate Cover"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label>Book Title *</Label>
              <Input
                value={book.title}
                onChange={(e) => setBook(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter book title"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input
                value={book.subtitle}
                onChange={(e) => setBook(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Book subtitle"
                className="mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label>Topic *</Label>
              <Input
                value={book.topic}
                onChange={(e) => setBook(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="Main subject"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Level</Label>
              <Select value={book.level} onValueChange={(val) => setBook(prev => ({ ...prev, level: val }))}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-2 mt-8">
                <input
                  type="checkbox"
                  checked={book.adult_content}
                  onChange={(e) => setBook(prev => ({ ...prev, adult_content: e.target.checked }))}
                  className="w-4 h-4"
                />
                Adult Content (18+)
              </Label>
            </div>
          </div>
        </Card>

        <div className="space-y-4 mb-6">
          {(book.chapters || []).map((chapter, index) => (
            <Card key={index} className="glass-effect border-0 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">Chapter {chapter.chapter_number}</span>
                  <Input
                    value={chapter.title}
                    onChange={(e) => updateChapter(index, "title", e.target.value)}
                    className="font-semibold"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => enhanceChapter(index)}
                    disabled={enhancingChapter === index}
                  >
                    {enhancingChapter === index ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-1" />
                    )}
                    AI Enhance
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openImageGenerator(index)}
                  >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    Image
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteChapter(index)}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {chapter.images && chapter.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {chapter.images.map((img, imgIdx) => (
                    <div key={imgIdx} className="relative group">
                      <img 
                        src={img} 
                        alt={`Chapter ${chapter.chapter_number} illustration`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeChapterImage(index, imgIdx)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                value={chapter.content}
                onChange={(e) => updateChapter(index, "content", e.target.value)}
                placeholder="Chapter content (supports markdown)"
                className="min-h-48 mb-3"
              />

              {chapter.key_takeaways && chapter.key_takeaways.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 mt-3">
                  <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-300 mb-2">
                    Key Takeaways:
                  </h4>
                  <ul className="space-y-1">
                    {chapter.key_takeaways.map((takeaway, idx) => (
                      <li key={idx} className="text-sm text-slate-600 dark:text-slate-400">
                        • {takeaway}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>

        <Button
          onClick={addChapter}
          variant="outline"
          className="w-full border-dashed border-2"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Chapter
        </Button>
      </div>

      <EnhancedImageGenerator
        open={showImageGenerator}
        onClose={() => {
          setShowImageGenerator(false);
          setCurrentChapterForImage(null);
        }}
        onImageGenerated={handleImageGenerated}
        defaultPrompt={currentChapterForImage?.prompt || ""}
        adultContent={book.adult_content}
      />

      <BookCoverGenerator
        open={showCoverGenerator}
        onClose={() => setShowCoverGenerator(false)}
        onCoverGenerated={(url) => setBook(prev => ({ ...prev, cover_url: url }))}
        bookTitle={book.title}
        bookTopic={book.topic}
      />
    </div>
  );
}
