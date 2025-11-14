import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Plus, Trash2, Save, ArrowLeft, Sparkles, GripVertical,
  ChevronDown, ChevronUp, Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CourseAuthor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  
  const [course, setCourse] = useState({
    title: "",
    description: "",
    topic: "",
    level: "beginner",
    tier: "free",
    adult_content: false,
    content_structure: []
  });
  const [expandedModule, setExpandedModule] = useState(0);
  const [saving, setSaving] = useState(false);

  const { data: existingCourse, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const courses = await base44.entities.Course.filter({ id: courseId });
      return courses[0];
    },
    enabled: !!courseId,
  });

  useEffect(() => {
    if (existingCourse) {
      setCourse(existingCourse);
    }
  }, [existingCourse]);

  const addModule = () => {
    setCourse(prev => ({
      ...prev,
      content_structure: [...prev.content_structure, {
        module_title: "New Module",
        sections: [{ title: "New Section", content: "", key_points: [] }]
      }]
    }));
  };

  const addSection = (moduleIndex) => {
    const newStructure = [...course.content_structure];
    newStructure[moduleIndex].sections.push({
      title: "New Section",
      content: "",
      key_points: []
    });
    setCourse(prev => ({ ...prev, content_structure: newStructure }));
  };

  const updateModule = (moduleIndex, field, value) => {
    const newStructure = [...course.content_structure];
    newStructure[moduleIndex][field] = value;
    setCourse(prev => ({ ...prev, content_structure: newStructure }));
  };

  const updateSection = (moduleIndex, sectionIndex, field, value) => {
    const newStructure = [...course.content_structure];
    newStructure[moduleIndex].sections[sectionIndex][field] = value;
    setCourse(prev => ({ ...prev, content_structure: newStructure }));
  };

  const deleteModule = (moduleIndex) => {
    const newStructure = course.content_structure.filter((_, i) => i !== moduleIndex);
    setCourse(prev => ({ ...prev, content_structure: newStructure }));
  };

  const deleteSection = (moduleIndex, sectionIndex) => {
    const newStructure = [...course.content_structure];
    newStructure[moduleIndex].sections = newStructure[moduleIndex].sections.filter((_, i) => i !== sectionIndex);
    setCourse(prev => ({ ...prev, content_structure: newStructure }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (courseId) {
        await base44.entities.Course.update(courseId, course);
      } else {
        const newCourse = await base44.entities.Course.create({
          ...course,
          status: "published"
        });
        navigate(`${createPageUrl("CourseAuthor")}?id=${newCourse.id}`);
      }
      queryClient.invalidateQueries(['course', courseId]);
      queryClient.invalidateQueries(['courses']);
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  const enhanceWithAI = async (moduleIndex, sectionIndex) => {
    try {
      const section = course.content_structure[moduleIndex].sections[sectionIndex];
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Enhance this course section with more detailed content, examples, and learning points:

Title: ${section.title}
Current Content: ${section.content || "No content yet"}
Course Level: ${course.level}
Topic: ${course.topic}

Return a JSON object with enhanced content and key points.`,
        response_json_schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            key_points: { type: "array", items: { type: "string" } }
          }
        }
      });

      updateSection(moduleIndex, sectionIndex, "content", result.content);
      updateSection(moduleIndex, sectionIndex, "key_points", result.key_points);
    } catch (error) {
      console.error("AI enhancement error:", error);
      alert("Failed to enhance with AI");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl("MyCourses"))}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Course Author</h1>
              <p className="text-slate-600 dark:text-slate-400">
                {courseId ? "Edit your course" : "Create a new course"}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Course"}
          </Button>
        </div>

        <Card className="glass-effect border-0 p-8 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <Label>Course Title *</Label>
              <Input
                value={course.title}
                onChange={(e) => setCourse(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter course title"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Topic *</Label>
              <Input
                value={course.topic}
                onChange={(e) => setCourse(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="Main subject"
                className="mt-2"
              />
            </div>
          </div>

          <div className="mb-6">
            <Label>Description</Label>
            <Textarea
              value={course.description}
              onChange={(e) => setCourse(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Course description"
              className="mt-2 min-h-24"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label>Level</Label>
              <Select value={course.level} onValueChange={(val) => setCourse(prev => ({ ...prev, level: val }))}>
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
              <Label>Tier</Label>
              <Select value={course.tier} onValueChange={(val) => setCourse(prev => ({ ...prev, tier: val }))}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={course.adult_content}
                  onChange={(e) => setCourse(prev => ({ ...prev, adult_content: e.target.checked }))}
                  className="w-4 h-4"
                />
                Adult Content
              </Label>
            </div>
          </div>
        </Card>

        <div className="space-y-4 mb-6">
          {course.content_structure.map((module, moduleIndex) => (
            <Card key={moduleIndex} className="glass-effect border-0 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="w-5 h-5 text-slate-400" />
                  <Input
                    value={module.module_title}
                    onChange={(e) => updateModule(moduleIndex, "module_title", e.target.value)}
                    className="font-semibold text-lg"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedModule(expandedModule === moduleIndex ? -1 : moduleIndex)}
                  >
                    {expandedModule === moduleIndex ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteModule(moduleIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {expandedModule === moduleIndex && (
                <div className="space-y-4 pl-8 border-l-2 border-purple-200 dark:border-purple-800">
                  {module.sections.map((section, sectionIndex) => (
                    <Card key={sectionIndex} className="p-4 bg-slate-50 dark:bg-slate-900">
                      <div className="flex items-center justify-between mb-3">
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(moduleIndex, sectionIndex, "title", e.target.value)}
                          className="font-medium"
                        />
                        <div className="flex items-center gap-2 ml-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => enhanceWithAI(moduleIndex, sectionIndex)}
                          >
                            <Wand2 className="w-4 h-4 mr-1" />
                            AI
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteSection(moduleIndex, sectionIndex)}
                            className="text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={section.content}
                        onChange={(e) => updateSection(moduleIndex, sectionIndex, "content", e.target.value)}
                        placeholder="Section content (supports markdown)"
                        className="min-h-32 mb-3"
                      />
                    </Card>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => addSection(moduleIndex)}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>

        <Button
          onClick={addModule}
          variant="outline"
          className="w-full border-dashed border-2"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Module
        </Button>
      </div>
    </div>
  );
}