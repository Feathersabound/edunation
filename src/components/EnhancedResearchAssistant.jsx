import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, Loader2, ExternalLink, Sparkles, Copy, Check,
  Globe, TrendingUp, Brain, Zap
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function EnhancedResearchAssistant({ open, onClose, onInsertContent, initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const [researchDepth, setResearchDepth] = useState("standard");
  const [researching, setResearching] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [copied, setCopied] = useState(false);

  const handleResearch = async () => {
    if (!query.trim()) {
      alert("Please enter a research query");
      return;
    }

    setResearching(true);
    setResults(null);

    try {
      const response = await base44.functions.invoke('perplexityResearch', {
        query,
        researchDepth
      });

      if (response.data.success) {
        setResults(response.data);
        setActiveTab("summary");
      } else {
        alert("Research failed: " + (response.data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Research error:", error);
      alert("Research failed: " + error.message);
    } finally {
      setResearching(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = (content) => {
    if (onInsertContent) {
      onInsertContent(content);
    }
  };

  React.useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setResults(null);
    }
  }, [open, initialQuery]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Search className="w-6 h-6 text-cyan-600" />
            Enhanced Research Assistant
            <Badge className="ml-2 bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
              Powered by Perplexity
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-base font-semibold mb-2 block">Research Query</Label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to research? Be specific for better results..."
              className="min-h-[100px]"
            />
          </div>

          <div>
            <Label className="text-base font-semibold mb-2 block">Research Depth</Label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "quick", label: "Quick", description: "Fast overview", icon: Zap },
                { value: "standard", label: "Standard", description: "Balanced research", icon: Brain },
                { value: "deep", label: "Deep", description: "Comprehensive analysis", icon: TrendingUp }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setResearchDepth(option.value)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    researchDepth === option.value
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950"
                      : "border-slate-200 dark:border-slate-700 hover:border-cyan-300"
                  }`}
                >
                  <option.icon className="w-6 h-6 mx-auto mb-2 text-cyan-600" />
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleResearch}
            disabled={researching || !query.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-6"
          >
            {researching ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Researching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Start Research
              </>
            )}
          </Button>

          {results && (
            <Card className="p-6 mt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="content">Full Content</TabsTrigger>
                  <TabsTrigger value="sources">Sources</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-4 mt-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Research Summary</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(results.content)}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    <ReactMarkdown>{results.content?.substring(0, 500) + "..."}</ReactMarkdown>
                  </div>
                  <Button
                    onClick={() => handleInsert(results.content)}
                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Insert Full Content
                  </Button>
                </TabsContent>

                <TabsContent value="content" className="space-y-4 mt-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Full Research Content</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(results.content)}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleInsert(results.content)}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        Insert
                      </Button>
                    </div>
                  </div>
                  <div className="prose prose-slate dark:prose-invert max-w-none bg-slate-50 dark:bg-slate-900 rounded-lg p-6">
                    <ReactMarkdown>{results.content}</ReactMarkdown>
                  </div>
                </TabsContent>

                <TabsContent value="sources" className="space-y-4 mt-4">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Sources & Citations</h3>
                  {results.citations && results.citations.length > 0 ? (
                    <div className="space-y-3">
                      {results.citations.map((citation, idx) => (
                        <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-3">
                            <Globe className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                              <a
                                href={citation}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-2"
                              >
                                {citation}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 dark:text-slate-400">No sources available</p>
                  )}
                  
                  {results.model && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>Research Model: {results.model}</span>
                        {results.usage && <span>Tokens: {results.usage.total_tokens}</span>}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}