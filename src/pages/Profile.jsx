import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Award, BookOpen, GraduationCap, Save } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    bio: "",
    expertise: "",
    preferred_language: "en-US"
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setFormData({
          full_name: currentUser.full_name || "",
          bio: currentUser.bio || "",
          expertise: currentUser.expertise || "",
          preferred_language: currentUser.preferred_language || "en-US"
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
      toast.success("Profile updated successfully!");
      const updatedUser = await base44.auth.me();
      setUser(updatedUser);
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
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

  const initials = formData.full_name
    ?.split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">My Profile</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your account settings and preferences
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-effect border-0 p-8 mb-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
              <Avatar className="w-24 h-24 text-2xl">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {formData.full_name || "User"}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
                {user?.role && (
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    {user.role === "admin" ? "Administrator" : "Creator"}
                  </p>
                )}
              </div>
            </div>

            {/* Form */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="full_name" className="text-base font-semibold mb-2">
                  Full Name
                </Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="h-12 text-base"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <Label htmlFor="bio" className="text-base font-semibold mb-2">
                  Bio
                </Label>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="h-12 text-base"
                  placeholder="Tell us about yourself"
                />
              </div>

              <div>
                <Label htmlFor="expertise" className="text-base font-semibold mb-2">
                  Areas of Expertise
                </Label>
                <Input
                  id="expertise"
                  value={formData.expertise}
                  onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                  className="h-12 text-base"
                  placeholder="e.g., Physics, Marketing, History"
                />
              </div>

              <div>
                <Label htmlFor="preferred_language" className="text-base font-semibold mb-2">
                  Preferred Content Language
                </Label>
                <select
                  id="preferred_language"
                  value={formData.preferred_language}
                  onChange={(e) => setFormData({ ...formData, preferred_language: e.target.value })}
                  className="w-full h-12 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  <option value="en-US">🇺🇸 English (US)</option>
                  <option value="en-GB">🇬🇧 English (UK)</option>
                  <option value="es">🇪🇸 Spanish</option>
                  <option value="fr">🇫🇷 French</option>
                  <option value="de">🇩🇪 German</option>
                  <option value="zh">🇨🇳 Chinese</option>
                  <option value="ja">🇯🇵 Japanese</option>
                  <option value="ar">🇸🇦 Arabic</option>
                  <option value="hi">🇮🇳 Hindi</option>
                  <option value="pt">🇧🇷 Portuguese</option>
                </select>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  This will be the default language for your content generation
                </p>
              </div>

              <div className="flex justify-end pt-6">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-xl px-8"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}