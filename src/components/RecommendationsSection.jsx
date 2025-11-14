import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, ArrowRight, Lightbulb, Target } from "lucide-react";
import { motion } from "framer-motion";

export default function RecommendationsSection() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getRecommendations');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="glass-effect border-0 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!data?.success) {
    return null;
  }

  return (
    <Card className="glass-effect border-0 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">
              AI Recommendations
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Personalized for your learning journey
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {/* Learning Insights */}
      {data.insights && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Your Learning Path
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {data.insights}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Skill Gaps */}
      {data.skill_gaps?.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                Skills to Explore
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.skill_gaps.map((gap, idx) => (
                  <Badge key={idx} className="bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                    {gap}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-3">
        {data.recommendations?.slice(0, 5).map((rec, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Link to={createPageUrl("Generate")}>
              <Card className="p-4 hover:shadow-lg transition-all border-2 hover:border-purple-300 cursor-pointer group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={rec.type === "course" ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300" : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"}>
                        {rec.type}
                      </Badge>
                      <Badge variant="outline">{rec.level}</Badge>
                      {rec.trending && (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Trending
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {rec.title}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {rec.topic}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 italic">
                      💡 {rec.reason}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}