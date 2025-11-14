import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Loader2, Zap, Lightbulb, TrendingUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function GrokBrainstormModal({ 
  open, 
  onClose, 
  topic,
  contentType,
  level,
  onSelectIdea
}) {
  const [brainstorming, setBrainstorming] = useState(false);
  const [brainstormResults, setBrainstormResults] = useState(null);

  const handleBrainstorm = async () => {
    setBrainstorming(true);
    
    try {
      const response = await base44.functions.invoke('grokBrainstorm', {
        topic,
        contentType,
        level,
        includeRealTimeData: true
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Brainstorming failed');
      }

      setBrainstormResults(response.data.brainstorm);
    } catch (error) {
      console.error("Brainstorm error:", error);
      alert("Failed to brainstorm ideas. Please try again.");
    } finally {
      setBrainstorming(false);
    }
  };

  React.useEffect(() => {
    if (open && !brainstormResults && topic) {
      handleBrainstorm();
    }
  }, [open, topic]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-600" />
            Grok AI Creative Brainstorm
          </DialogTitle>
          <DialogDescription>
            Witty angles, real-time insights, and bold ideas from Grok AI
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {brainstorming ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
              <h3 className="text-xl font-bold mb-2">Grok AI Thinking...</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Fetching real-time insights and creative angles
              </p>
            </motion.div>
          ) : brainstormResults ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 py-4"
            >
              {/* Unique Angles */}
              {brainstormResults.unique_angles?.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    Unique Angles
                  </h3>
                  <div className="grid gap-3">
                    {brainstormResults.unique_angles.map((item, idx) => (
                      <Card 
                        key={idx}
                        className="p-4 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-amber-500"
                        onClick={() => {
                          if (onSelectIdea) {
                            onSelectIdea(item.angle);
                          }
                          onClose();
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            #{idx + 1}
                          </Badge>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{item.angle}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {item.why_it_works}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Witty Hooks */}
              {brainstormResults.witty_hooks?.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Witty Hooks & Taglines
                  </h3>
                  <div className="grid gap-2">
                    {brainstormResults.witty_hooks.map((hook, idx) => (
                      <Card 
                        key={idx}
                        className="p-3 hover:shadow-md transition-all cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-950"
                        onClick={() => {
                          if (onSelectIdea) {
                            onSelectIdea(hook);
                          }
                          onClose();
                        }}
                      >
                        <p className="text-sm font-medium italic">"{hook}"</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Creative Formats */}
              {brainstormResults.creative_formats?.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Creative Formats
                  </h3>
                  <div className="grid gap-3">
                    {brainstormResults.creative_formats.map((item, idx) => (
                      <Card key={idx} className="p-4 bg-blue-50 dark:bg-blue-950">
                        <h4 className="font-semibold mb-1 text-blue-700 dark:text-blue-300">
                          {item.format}
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {item.description}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Real-Time Context */}
              {brainstormResults.real_time_context && (
                <div>
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Real-Time Insights
                  </h3>
                  <Card className="p-4 bg-green-50 dark:bg-green-950">
                    {brainstormResults.real_time_context.trends?.length > 0 && (
                      <div className="mb-3">
                        <h4 className="font-semibold text-sm text-green-700 dark:text-green-300 mb-2">
                          Current Trends:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {brainstormResults.real_time_context.trends.map((trend, idx) => (
                            <Badge key={idx} className="bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200">
                              {trend}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {brainstormResults.real_time_context.cultural_references?.length > 0 && (
                      <div className="mb-3">
                        <h4 className="font-semibold text-sm text-green-700 dark:text-green-300 mb-2">
                          Cultural References:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {brainstormResults.real_time_context.cultural_references.map((ref, idx) => (
                            <Badge key={idx} variant="outline" className="border-green-500">
                              {ref}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {brainstormResults.real_time_context.current_discussions && (
                      <div>
                        <h4 className="font-semibold text-sm text-green-700 dark:text-green-300 mb-2">
                          Current Discussions:
                        </h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {brainstormResults.real_time_context.current_discussions}
                        </p>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* Raw Response Fallback */}
              {brainstormResults.raw_response && !brainstormResults.unique_angles?.length && (
                <div>
                  <h3 className="text-lg font-bold mb-3">Grok's Ideas</h3>
                  <Card className="p-4 bg-slate-50 dark:bg-slate-900">
                    <p className="text-sm whitespace-pre-wrap">{brainstormResults.raw_response}</p>
                  </Card>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}