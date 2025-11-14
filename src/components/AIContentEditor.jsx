import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { 
  Sparkles, Loader2, Copy, Check, ArrowRight, Maximize2, 
  Minimize2, Type, Zap, BookOpen, Languages
} from "lucide-react";

export default function AIContentEditor({ open, onClose, initialContent = "", onApply }) {
  const [content, setContent] = useState(initialContent);
  const [result, setResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const actions = [
    { id: "summarize", label: "Summarize", icon: BookOpen, description: "Create a concise summary" },
    { id: "improve", label: "Improve", icon: Sparkles, description: "Enhance clarity and flow" },
    { id: "expand", label: "Expand", icon: Maximize2, description: "Add more detail" },
    { id: "simplify", label: "Simplify", icon: Minimize2, description: "Make easier to understand" },
    { id: "rewrite", label: "Rewrite", icon: Type, description: "Transform the content" },
    { id: "translate", label: "Translate", icon: Languages, description: "Translate to another language" }
  ];

  const handleAction = async (action) => {
    if (!content.trim()) {
      alert("Please enter some content first");
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      const response = await base44.functions.invoke('aiContentEditor', {
        content,
        action,
        instructions,
        contentType: "text"
      });

      if (response.data.success) {
        setResult(response.data.result);
      } else {
        alert("AI processing failed: " + (response.data.error || "Unknown error"));
      }
    } catch (error) {
      console.error("AI Editor error:", error);
      alert("Failed to process content: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = () => {
    const textToCopy = result?.content || result?.summary || "";
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyResult = () => {
    if (result && onApply) {
      const textToApply = result.content || result.summary || "";
      onApply(textToApply);
      onClose();
    }
  };

  React.useEffect(() => {
    if (open) {
      setContent(initialContent);
      setResult(null);
      setInstructions("");
    }
  }, [open, initialContent]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Content Editor
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold mb-2 block">Original Content</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste or type your content here..."
                className="min-h-[200px] font-mono text-sm"
              />
            </div>

            <div>
              <Label className="text-base font-semibold mb-2 block">Additional Instructions (Optional)</Label>
              <Textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="E.g., 'Use casual tone', 'Translate to Spanish', 'Focus on beginners'..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {actions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  onClick={() => handleAction(action.id)}
                  disabled={processing}
                  className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-purple-50 dark:hover:bg-purple-950"
                >
                  <action.icon className="w-5 h-5 text-purple-600" />
                  <div className="text-center">
                    <div className="font-semibold">{action.label}</div>
                    <div className="text-xs text-slate-500">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Result Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">AI Result</Label>
              {result && (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  {onApply && (
                    <Button
                      size="sm"
                      onClick={handleApplyResult}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Apply
                    </Button>
                  )}
                </div>
              )}
            </div>

            {processing ? (
              <Card className="p-12 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Processing with AI...</p>
              </Card>
            ) : result ? (
              <Card className="p-6 space-y-4">
                {result.summary && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Summary</h4>
                    <p className="text-slate-600 dark:text-slate-400">{result.summary}</p>
                  </div>
                )}

                {result.key_points && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Key Points</h4>
                    <ul className="space-y-2">
                      {result.key_points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Zap className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.main_takeaway && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-2">Main Takeaway</h4>
                    <p className="text-slate-600 dark:text-slate-400">{result.main_takeaway}</p>
                  </div>
                )}

                {result.content && (
                  <div>
                    <Textarea
                      value={result.content}
                      onChange={(e) => setResult({ ...result, content: e.target.value })}
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">
                  Select an action to process your content
                </p>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}