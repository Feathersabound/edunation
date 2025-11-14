import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User, Save, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    expertise: [],
    preferred_language: "en-US",
    show_adult_content: false
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setFormData({
          full_name: currentUser.full_name || "",
          bio: currentUser.bio || "",
          expertise: currentUser.expertise || [],
          preferred_language: currentUser.preferred_language || "en-US",
          show_adult_content: currentUser.show_adult_content || false
        });
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe(formData);
      toast.success("Profile updated successfully");
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="glass-effect border-0 p-8 mb-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user?.full_name}</h1>
              <p className="text-slate-600 dark:text-slate-400">{user?.email}</p>
              <Badge className="mt-2">{user?.role}</Badge>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                className="mt-2 min-h-24"
              />
            </div>

            <div>
              <Label htmlFor="expertise">Expertise (comma-separated)</Label>
              <Input
                id="expertise"
                value={formData.expertise.join(", ")}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  expertise: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                }))}
                placeholder="e.g., Programming, Design, Marketing"
                className="mt-2"
              />
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-5 h-5 text-red-500" />
                <Label className="text-lg font-semibold">Content Preferences</Label>
              </div>
              
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-red-200 dark:border-red-800 hover:border-red-400 cursor-pointer transition-all bg-red-50/50 dark:bg-red-950/20">
                <input
                  type="checkbox"
                  checked={formData.show_adult_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, show_adult_content: e.target.checked }))}
                  className="w-5 h-5"
                />
                <span className="text-2xl">🔞</span>
                <div className="flex-1">
                  <div className="font-semibold text-red-700 dark:text-red-400">Show Adult Content (18+)</div>
                  <div className="text-sm text-red-600 dark:text-red-500">
                    Display content with mature themes and language in your library
                  </div>
                </div>
              </label>
            </div>

            <div className="flex justify-end pt-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}