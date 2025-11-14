import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Sparkles, BookOpen, GraduationCap, ArrowRight, Wand2,
  Loader2, CheckCircle2, Image as ImageIcon, Zap, Brain, Lightbulb, Globe, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GrokBrainstormModal from "../components/GrokBrainstormModal";
import ResearchAssistant from "../components/ResearchAssistant";

export default function Generate() {
  const navigate = useNavigate();
  const [contentType, setContentType] = useState("course");
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState("");
  const [showGrokModal, setShowGrokModal] = useState(false);
  const [showResearchModal, setShowResearchModal] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    level: "beginner",
    tier: "free",
    price: 0,
    uniqueTwist: "",
    includeVisuals: true,
    includeQuizzes: true,
    targetLength: "medium",
    audience: "",
    language: "en-US"
  });

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const shouldUseClaude = () => {
    return contentType === "book" || 
           formData.targetLength === "long" || 
           formData.level === "advanced" || 
           formData.level === "phd";
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenerationProgress(10);
    setGenerationStage("Initializing AI System...");

    try {
      const user = await base44.auth.me();
      
      setGenerationProgress(30);
      setGenerationStage("Generating content structure...");

      let aiResponse;
      
      const languageName = formData.language === "en-US" ? "US English" : 
                          formData.language === "en-GB" ? "UK English" : formData.language;

      const contentPrompt = contentType === "course" 
        ? `Create a comprehensive ${formData.level}-level course on "${formData.topic}" in ${languageName}.

${formData.title ? `Title: ${formData.title}` : ''}
${formData.uniqueTwist ? `Unique angle: ${formData.uniqueTwist}` : ''}
${formData.audience ? `Target audience: ${formData.audience}` : ''}

Requirements:
- Create ${formData.targetLength === "short" ? "3-4" : formData.targetLength === "long" ? "8-10" : "5-6"} modules
- Each module should have 2-3 sections
- Each section should have detailed content (at least 300 words)
- Include key learning points for each section
${formData.includeQuizzes ? '- Add 3 quiz questions per section with 4 options each' : ''}
- Make it ${formData.level === "phd" ? "research-intensive" : formData.level === "advanced" ? "technically deep" : "clear and easy to understand"}`
        : `Write a ${formData.level}-level book on "${formData.topic}" in ${languageName}.

${formData.title ? `Title: ${formData.title}` : ''}
${formData.uniqueTwist ? `Unique perspective: ${formData.uniqueTwist}` : ''}

Requirements:
- Create ${formData.targetLength === "short" ? "6-8" : formData.targetLength === "long" ? "15-20" : "10-12"} chapters
- Each chapter should be detailed (at least 800 words)
- Include key takeaways for each chapter (4-6 points)`;

      const courseSchema = {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          modules: {
            type: "array",
            items: {
              type: "object",
              properties: {
                module_title: { type: "string" },
                sections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      content: { type: "string" },
                      key_points: { 
                        type: "array",
                        items: { type: "string" }
                      },
                      ...(formData.includeQuizzes && {
                        quiz_questions: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              question: { type: "string" },
                              options: { type: "array", items: { type: "string" } },
                              correct_answer: { type: "number" }
                            }
                          }
                        }
                      })
                    }
                  }
                }
              }
            }
          }
        }
      };

      const bookSchema = {
        type: "object",
        properties: {
          title: { type: "string" },
          subtitle: { type: "string" },
          chapters: {
            type: "array",
            items: {
              type: "object",
              properties: {
                chapter_number: { type: "number" },
                title: { type: "string" },
                content: { type: "string" },
                key_takeaways: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          }
        }
      };

      setGenerationProgress(50);
      
      aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: contentPrompt,
        response_json_schema: contentType === "course" ? courseSchema : bookSchema,
        add_context_from_internet: true
      });

      if (!aiResponse || (contentType === "course" && !aiResponse.modules) || (contentType === "book" && !aiResponse.chapters)) {
        throw new Error("Invalid AI response structure");
      }

      setGenerationProgress(70);
      setGenerationStage("Generating cover image...");

      let thumbnailUrl = null;
      if (formData.includeVisuals) {
        try {
          const imageResult = await base44.integrations.Core.GenerateImage({
            prompt: `Professional educational ${contentType} cover for "${formData.topic}". Modern, clean design with purple and blue gradients. High quality.`
          });
          thumbnailUrl = imageResult.url;
        } catch (imgError) {
          console.error("Image generation failed:", imgError);
        }
      }

      setGenerationProgress(85);
      setGenerationStage("Saving content...");

      if (contentType === "course") {
        const course = await base44.entities.Course.create({
          title: aiResponse.title || formData.title || formData.topic,
          description: aiResponse.description || `A ${formData.level}-level course on ${formData.topic}`,
          topic: formData.topic,
          level: formData.level,
          tier: formData.tier,
          unique_twist: formData.uniqueTwist || "",
          thumbnail_url: thumbnailUrl,
          content_structure: aiResponse.modules,
          status: "published",
          engagement_features: {
            has_quizzes: formData.includeQuizzes,
            has_visuals: !!thumbnailUrl,
            has_interactive: true
          }
        });

        setGenerationProgress(100);
        setGenerationStage("Complete! 🎉");
        
        setTimeout(() => {
          navigate(createPageUrl("CourseView", `?id=${course.id}`));
        }, 1000);
      } else {
        const book = await base44.entities.Book.create({
          title: aiResponse.title || formData.title || formData.topic,
          subtitle: aiResponse.subtitle || `A guide to ${formData.topic}`,
          author_name: user?.full_name || "Anonymous",
          topic: formData.topic,
          level: formData.level,
          unique_twist: formData.uniqueTwist || "",
          cover_url: thumbnailUrl,
          chapters: aiResponse.chapters,
          status: "completed"
        });

        setGenerationProgress(100);
        setGenerationStage("Complete! 🎉");
        
        setTimeout(() => {
          navigate(createPageUrl("BookView", `?id=${book.id}`));
        }, 1000);
      }

    } catch (error) {
      console.error("Generation error:", error);
      setGenerationStage(`Error: ${error.message || "Something went wrong"}`);
      setTimeout(() => {
        setGenerating(false);
        setGenerationProgress(0);
      }, 4000);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950 dark:to-blue-950 mb-6">
            <Wand2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Perplexity + Grok + Claude Multi-AI Studio
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Create Educational</span>
            <br />
            <span className="text-slate-800 dark:text-slate-200">Content in Minutes</span>
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Research-verified with Perplexity + Creative with Grok + Refined by Claude
          </p>

          {shouldUseClaude() && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-950 dark:to-purple-950">
              <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
                Advanced AI mode available
              </span>
            </div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {!generating ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="glass-effect border-0 p-8">
                <Tabs value={contentType} onValueChange={setContentType}>
                  <TabsList className="grid w-full grid-cols-2 h-auto p-1">
                    <TabsTrigger 
                      value="course" 
                      className="flex items-center gap-2 py-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                    >
                      <GraduationCap className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-semibold">Course</div>
                        <div className="text-xs opacity-80">Modules & sections</div>
                      </div>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="book"
                      className="flex items-center gap-2 py-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
                    >
                      <BookOpen className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-semibold">Book</div>
                        <div className="text-xs opacity-80">Chapters & content</div>
                      </div>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="space-y-6 mt-8">
                  <div>
                    <Label htmlFor="topic" className="text-base font-semibold mb-2">
                      Topic *
                    </Label>
                    <Input
                      id="topic"
                      placeholder="e.g., Quantum Physics, Modern Marketing, Renaissance History"
                      value={formData.topic}
                      onChange={(e) => updateFormData("topic", e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="title" className="text-base font-semibold mb-2">
                      Custom Title (Optional)
                    </Label>
                    <Input
                      id="title"
                      placeholder="Leave blank for AI to generate"
                      value={formData.title}
                      onChange={(e) => updateFormData("title", e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="level" className="text-base font-semibold mb-2">
                        Content Level
                      </Label>
                      <Select value={formData.level} onValueChange={(val) => updateFormData("level", val)}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner - Simple & Fun</SelectItem>
                          <SelectItem value="intermediate">Intermediate - Case Studies</SelectItem>
                          <SelectItem value="advanced">Advanced - Research & Insights</SelectItem>
                          <SelectItem value="phd">PhD - Original Research</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="language" className="text-base font-semibold mb-2 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Language
                      </Label>
                      <Select value={formData.language} onValueChange={(val) => updateFormData("language", val)}>
                        <SelectTrigger className="h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
                          <SelectItem value="en-GB">🇬🇧 English (UK)</SelectItem>
                          <SelectItem value="es">🇪🇸 Spanish</SelectItem>
                          <SelectItem value="fr">🇫🇷 French</SelectItem>
                          <SelectItem value="de">🇩🇪 German</SelectItem>
                          <SelectItem value="zh">🇨🇳 Chinese</SelectItem>
                          <SelectItem value="ja">🇯🇵 Japanese</SelectItem>
                          <SelectItem value="ar">🇸🇦 Arabic</SelectItem>
                          <SelectItem value="hi">🇮🇳 Hindi</SelectItem>
                          <SelectItem value="pt">🇧🇷 Portuguese</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="twist" className="text-base font-semibold">
                        Unique Twist / Creative Angle
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowResearchModal(true)}
                          disabled={!formData.topic}
                          className="gap-2"
                        >
                          <Search className="w-4 h-4" />
                          Research
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowGrokModal(true)}
                          disabled={!formData.topic}
                          className="gap-2"
                        >
                          <Lightbulb className="w-4 h-4" />
                          Brainstorm
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      id="twist"
                      placeholder="e.g., 'Explain quantum physics using cooking metaphors'"
                      value={formData.uniqueTwist}
                      onChange={(e) => updateFormData("uniqueTwist", e.target.value)}
                      className="min-h-24 text-base"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-2">
                      Target Length
                    </Label>
                    <div className="grid grid-cols-3 gap-4">
                      {["short", "medium", "long"].map((length) => (
                        <button
                          key={length}
                          onClick={() => updateFormData("targetLength", length)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.targetLength === length
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-950"
                              : "border-slate-200 dark:border-slate-700 hover:border-purple-300"
                          }`}
                        >
                          <div className="font-semibold capitalize">{length}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {length === "short" ? "3-5 sections" : length === "medium" ? "5-10 sections" : "10+ sections"}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">
                      Engagement Features
                    </Label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={formData.includeVisuals}
                          onChange={(e) => updateFormData("includeVisuals", e.target.checked)}
                          className="w-5 h-5"
                        />
                        <ImageIcon className="w-5 h-5 text-purple-500" />
                        <div className="flex-1">
                          <div className="font-semibold">Auto-generate Visuals</div>
                          <div className="text-sm text-slate-500">AI-created cover image</div>
                        </div>
                      </label>
                      
                      {contentType === "course" && (
                        <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 cursor-pointer transition-all">
                          <input
                            type="checkbox"
                            checked={formData.includeQuizzes}
                            onChange={(e) => updateFormData("includeQuizzes", e.target.checked)}
                            className="w-5 h-5"
                          />
                          <Zap className="w-5 h-5 text-amber-500" />
                          <div className="flex-1">
                            <div className="font-semibold">Include Quizzes</div>
                            <div className="text-sm text-slate-500">Interactive assessments</div>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <Button
                    size="lg"
                    onClick={handleGenerate}
                    disabled={!formData.topic}
                    className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-xl rounded-2xl px-8 py-6 text-lg font-semibold group"
                  >
                    <Sparkles className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    Generate with AI
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="glass-effect border-0 p-12 text-center">
                <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center glow-effect">
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                </div>
                
                <h2 className="text-3xl font-bold mb-4 text-slate-800 dark:text-slate-200">
                  {generationStage}
                </h2>
                
                <div className="max-w-md mx-auto mb-8">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-600"
                      initial={{ width: 0 }}
                      animate={{ width: `${generationProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    {generationProgress}% Complete
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <GrokBrainstormModal
        open={showGrokModal}
        onClose={() => setShowGrokModal(false)}
        topic={formData.topic}
        contentType={contentType}
        level={formData.level}
        onSelectIdea={(idea) => updateFormData("uniqueTwist", idea)}
      />

      <ResearchAssistant
        open={showResearchModal}
        onClose={() => setShowResearchModal(false)}
        onInsertContent={(content) => updateFormData("uniqueTwist", formData.uniqueTwist + "\n\n" + content)}
      />
    </div>
  );
}