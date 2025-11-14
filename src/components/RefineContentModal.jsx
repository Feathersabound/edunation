import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Loader2, Sparkles, Brain, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RefineContentModal({ 
  open, 
  onClose, 
  contentId, 
  contentType,
  onSuccess 
}) {
  const [refining, setRefining] = useState(false);
  const [refinementGoals, setRefinementGoals] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("maintain");
  const [iterations, setIterations] = useState(3);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState("");
  const [changesLog, setChangesLog] = useState([]);

  const handleRefine = async () => {
    setRefining(true);
    setProgress(10);
    setCurrentStage("Initializing AI refinement system...");
    setChangesLog([]);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProgress(30);
      setCurrentStage("Claude AI analyzing content structure...");
      await new Promise(resolve => setTimeout(resolve, 1500));

      setProgress(50);
      setCurrentStage(`Running ${iterations} refinement iterations...`);

      const response = await base44.functions.invoke('refineContent', {
        contentId,
        contentType,
        refinementGoals: refinementGoals || undefined,
        targetAudience: targetAudience || undefined,
        tone: tone !== "maintain" ? tone : undefined,
        iterations
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Refinement failed');
      }

      setProgress(90);
      setCurrentStage("Agent AI performing final quality checks...");
      setChangesLog(response.data.changes_log || []);
      await new Promise(resolve => setTimeout(resolve, 1500));

      setProgress(100);
      setCurrentStage("Refinement complete! 🎉");
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error("Refinement error:", error);
      setCurrentStage("Error occurred. Please try again.");
      await new Promise(resolve => setTimeout(resolve, 2000));
      setRefining(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            AI Content Refinement
          </DialogTitle>
          <DialogDescription>
            Enhance your {contentType} with multi-stage AI refinement powered by Claude and specialized agents
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!refining ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 py-4"
            >
              <div>
                <Label className="text-base font-semibold mb-2">
                  Refinement Goals (Optional)
                </Label>
                <Textarea
                  placeholder="e.g., 'Improve clarity and add more examples' or 'Make it more engaging for teenagers'"
                  value={refinementGoals}
                  onChange={(e) => setRefinementGoals(e.target.value)}
                  className="min-h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-semibold mb-2">
                    Target Audience
                  </Label>
                  <Select value={targetAudience} onValueChange={setTargetAudience}>
                    <SelectTrigger>
                      <SelectValue placeholder="Keep current" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep">Keep Current Audience</SelectItem>
                      <SelectItem value="children">Children (Ages 6-12)</SelectItem>
                      <SelectItem value="teenagers">Teenagers (Ages 13-17)</SelectItem>
                      <SelectItem value="young-adults">Young Adults</SelectItem>
                      <SelectItem value="professionals">Professionals</SelectItem>
                      <SelectItem value="academics">Academic Scholars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-2">
                    Tone Adjustment
                  </Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="maintain">Maintain Current Tone</SelectItem>
                      <SelectItem value="formal">Formal & Academic</SelectItem>
                      <SelectItem value="casual">Casual & Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="humorous">Humorous & Engaging</SelectItem>
                      <SelectItem value="inspirational">Inspirational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-2">
                  Refinement Iterations (3-5 recommended)
                </Label>
                <div className="flex gap-2">
                  {[3, 4, 5].map((num) => (
                    <button
                      key={num}
                      onClick={() => setIterations(num)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                        iterations === num
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                          : "border-slate-200 dark:border-slate-700 hover:border-purple-300"
                      }`}
                    >
                      <div className="font-bold">{num} Rounds</div>
                      <div className="text-xs text-slate-500">
                        {num === 3 ? "Balanced" : num === 4 ? "Thorough" : "Maximum"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Refinement Process
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Round 1: Grammar, spelling, and structure fixes</li>
                  <li>• Round 2: Tone consistency and audience adaptation</li>
                  <li>• Round 3+: Creative enhancements and final polish</li>
                </ul>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="refining"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
                
                <h3 className="text-xl font-bold mb-2">{currentStage}</h3>
                
                <div className="max-w-md mx-auto mb-4">
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 mt-2">{progress}% Complete</p>
                </div>
              </div>

              {changesLog.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {changesLog.map((log, idx) => (
                    <div 
                      key={idx}
                      className="bg-green-50 dark:bg-green-950 rounded-lg p-3 flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-sm text-green-900 dark:text-green-100">
                          Iteration {log.iteration} Complete
                        </div>
                        <div className="text-xs text-green-700 dark:text-green-300">
                          {log.summary}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!refining && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleRefine}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Start Refinement
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}