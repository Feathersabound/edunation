import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, Image as ImageIcon, Check, AlertCircle } from "lucide-react";

export default function EnhancedImageGenerator({ open, onClose, onImageGenerated, defaultPrompt = "", adultContent = false }) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [style, setStyle] = useState("photorealistic");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [mood, setMood] = useState("neutral");
  const [quality, setQuality] = useState("hd");
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);

  const styles = [
    { value: "photorealistic", label: "Photorealistic", description: "8K photo quality" },
    { value: "artistic", label: "Artistic", description: "Painterly style" },
    { value: "cartoon", label: "Cartoon", description: "Illustrated look" },
    { value: "watercolor", label: "Watercolor", description: "Soft painted" },
    { value: "sketch", label: "Sketch", description: "Hand-drawn" },
    { value: "cinematic", label: "Cinematic", description: "Film-like" },
    { value: "minimalist", label: "Minimalist", description: "Clean & simple" },
    { value: "vintage", label: "Vintage", description: "Retro aesthetic" },
    { value: "fantasy", label: "Fantasy", description: "Magical art" },
    { value: "scifi", label: "Sci-Fi", description: "Futuristic" }
  ];

  const moods = [
    { value: "bright", label: "Bright & Cheerful" },
    { value: "dark", label: "Dark & Moody" },
    { value: "calm", label: "Calm & Peaceful" },
    { value: "energetic", label: "Energetic" },
    { value: "romantic", label: "Romantic" },
    { value: "mysterious", label: "Mysterious" },
    { value: "professional", label: "Professional" },
    { value: "neutral", label: "Neutral" }
  ];

  const aspectRatios = [
    { value: "1:1", label: "Square (1:1)" },
    { value: "16:9", label: "Landscape (16:9)" },
    { value: "9:16", label: "Portrait (9:16)" },
    { value: "4:3", label: "Standard (4:3)" },
    { value: "3:2", label: "Photo (3:2)" }
  ];

  const qualities = [
    { value: "standard", label: "Standard" },
    { value: "hd", label: "HD Quality" },
    { value: "ultra", label: "Ultra HD" }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const response = await base44.functions.invoke('enhancedImageGeneration', {
        prompt,
        style,
        aspectRatio,
        mood,
        quality,
        adultContent
      });

      if (response.data.success) {
        setGeneratedImage(response.data.url);
      } else {
        throw new Error(response.data.error || 'Generation failed');
      }
    } catch (error) {
      console.error("Image generation error:", error);
      setError(error.message || "Failed to generate image");
    } finally {
      setGenerating(false);
    }
  };

  const handleUseImage = () => {
    if (generatedImage && onImageGenerated) {
      onImageGenerated(generatedImage);
      onClose();
    }
  };

  React.useEffect(() => {
    if (open) {
      setPrompt(defaultPrompt);
      setGeneratedImage(null);
      setError(null);
    }
  }, [open, defaultPrompt]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ImageIcon className="w-6 h-6 text-purple-600" />
            Enhanced Image Generator
            {adultContent && (
              <span className="text-sm bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 px-3 py-1 rounded-full">
                18+ Mode
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <Label className="text-base font-semibold">Image Prompt</Label>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="mt-2 h-12"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-semibold">Artistic Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger className="mt-2 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styles.map(s => (
                    <SelectItem key={s.value} value={s.value}>
                      <div>
                        <div className="font-medium">{s.label}</div>
                        <div className="text-xs text-slate-500">{s.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-semibold">Mood</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="mt-2 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {moods.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-base font-semibold">Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="mt-2 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatios.map(ar => (
                    <SelectItem key={ar.value} value={ar.value}>
                      {ar.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-base font-semibold">Quality</Label>
              <Select value={quality} onValueChange={setQuality}>
                <SelectTrigger className="mt-2 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {qualities.map(q => (
                    <SelectItem key={q.value} value={q.value}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white h-12"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Image...
              </>
            ) : (
              <>
                <ImageIcon className="w-5 h-5 mr-2" />
                Generate Image
              </>
            )}
          </Button>

          {error && (
            <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </Card>
          )}

          {generatedImage && (
            <div className="space-y-4">
              <Card className="p-4">
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full rounded-lg"
                />
              </Card>
              <Button
                onClick={handleUseImage}
                className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
              >
                <Check className="w-5 h-5 mr-2" />
                Use This Image
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}