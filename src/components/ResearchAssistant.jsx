import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, ExternalLink, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ResearchAssistant({ open, onClose, onInsertContent }) {
  const [query, setQuery] = useState("");
  const [researching, setResearching] = useState(false);
  const [result, setResult] = useState(null);

  const handleResearch = async () => {
    if (!query.trim()) return;

    setResearching(true);
    try {
      const response = await base44.functions.invoke('perplexityResearch', {
        query: query,
        researchDepth: "deep",
        includeCitations: true
      });

      if (response.data.success) {
        setResult(response.data);
      }
    } catch (error) {
      console.error("Research failed:", error);
    } finally {
      setResearching(false);
    }
  };

  const handleInsert = () => {
    if (result?.content && onInsertContent) {
      onInsertContent(result.content);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Search className="w-5 h-5 text-white" />
            </div>
            Perplexity Research Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Textarea
              placeholder="Ask a research question... (e.g., 'What are the latest developments in quantum computing?' or 'Explain the impact of AI on education')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-h-24"
            />
          </div>

          <Button
            onClick={handleResearch}
            disabled={researching || !query.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
          >
            {researching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Researching with Perplexity...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Research
              </>
            )}
          </Button>

          {result && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
                  Verified Research
                </Badge>
                {onInsertContent && (
                  <Button onClick={handleInsert} variant="outline" size="sm">
                    Insert into Content
                  </Button>
                )}
              </div>

              <div className="prose prose-slate dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-900 rounded-xl p-6">
                <ReactMarkdown>{result.content}</ReactMarkdown>
              </div>

              {result.citations && result.citations.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      Sources ({result.citations.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {result.citations.map((citation, idx) => (
                      <a
                        key={idx}
                        href={citation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {citation}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}