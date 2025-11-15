import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, Wand2 } from "lucide-react";
import { toast } from "sonner";

export default function BookCoverGenerator({ 
  open, 
  onClose, 
  onCoverGenerated,
  bookTitle,
  bookTopic
}) {
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState(`Book cover for "${bookTitle}" about ${bookTopic}`);
  const [style, setStyle] = useState("modern");
  const [colorScheme, setColorScheme] = useState("blue-purple");
  const [generatedCover, setGeneratedCover] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const styles = [
    { value: "modern", label: "Modern & Clean" },
    { value: "vintage", label: "Vintage Classic" },
    { value: "minimalist", label: "Minimalist" },
    { value: "artistic", label: "Artistic" },
    { value: "professional", label: "Professional" },
    { value: "academic", label: "Academic" }
  ];

  const colorSchemes = [
    { value: "blue-purple", label: "Blue & Purple" },
    { value: "warm", label: "Warm Sunset" },
    { value: "cool", label: "Cool Ocean" },
    { value: "earth", label: "Earth Tones" },
    { value: "vibrant", label: "Vibrant" },
    { value: "monochrome", label: "Monochrome" }
  ];

  React.useEffect(() => {
    if (open) {
      setPrompt(`Book cover for "${bookTitle}" about ${bookTopic}`);
      setGeneratedCover(null);
      setUploadedFile(null);
    }
  }, [open, bookTitle, bookTopic]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description");
      return;
    }

    setGenerating(true);
    try {
      const styleDescriptions = {
        modern: "modern, clean design with geometric shapes",
        vintage: "vintage, classic book cover with ornate details",
        minimalist: "minimalist, simple and elegant",
        artistic: "artistic, creative and expressive",
        professional: "professional, corporate and polished",
        academic: "academic, scholarly and intellectual"
      };

      const colorDescriptions = {
        "blue-purple": "blue and purple gradient colors",
        "warm": "warm sunset colors, oranges and reds",
        "cool": "cool ocean blues and teals",
        "earth": "earthy browns, greens and natural tones",
        "vibrant": "vibrant, bold and saturated colors",
        "monochrome": "monochrome, black and white"
      };

      const enhancedPrompt = `Professional book cover design: ${prompt}. Style: ${styleDescriptions[style]}. Colors: ${colorDescriptions[colorScheme]}. High quality, 3:4 aspect ratio, centered text area.`;

      const response = await base44.functions.invoke('enhancedImageGeneration', {
        prompt: enhancedPrompt,
        style: style,
        aspectRatio: "3:4",
        quality: "high"
      });

      if (response.data && response.data.success && response.data.imageUrl) {
        setGeneratedCover(response.data.imageUrl);
        toast.success("Cover generated successfully!");
      } else {
        throw new Error("Invalid response from image generator");
      }
    } catch (error) {
      console.error("Cover generation error:", error);
      toast.error("Failed to generate cover: " + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFile(file_url);
      setGeneratedCover(file_url);
      toast.success("Image uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleUseCover = () => {
    if (generatedCover && onCoverGenerated) {
      onCoverGenerated(generatedCover);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Generate Book Cover</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label>Book Description</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your book cover..."
                className="mt-2 min-h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {styles.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Color Scheme</Label>
                <Select value={colorScheme} onValueChange={setColorScheme}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorSchemes.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Cover
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">
                  Or upload your own
                </span>
              </div>
            </div>

            <label className="block">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors">
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Click to upload an image
                    </p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          <div className="space-y-4">
            <Label>Preview</Label>
            <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
              {generatedCover ? (
                <img 
                  src={generatedCover} 
                  alt="Book cover preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-8">
                  <Wand2 className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-slate-500 dark:text-slate-400">
                    Your cover will appear here
                  </p>
                </div>
              )}
            </div>

            {generatedCover && (
              <Button
                onClick={handleUseCover}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Use This Cover
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}