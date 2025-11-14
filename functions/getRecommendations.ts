import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import Anthropic from 'npm:@anthropic-ai/sdk@0.32.1';

const anthropic = new Anthropic({
    apiKey: Deno.env.get("CLAUDE_API_KEY"),
});

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Gather user data
        const [courses, books, userProgress] = await Promise.all([
            base44.asServiceRole.entities.Course.filter({ created_by: user.email }),
            base44.asServiceRole.entities.Book.filter({ created_by: user.email }),
            base44.asServiceRole.entities.UserProgress.filter({ user_email: user.email })
        ]);

        // Analyze user patterns
        const userTopics = [...courses, ...books].map(c => c.topic);
        const userLevels = [...courses, ...books].map(c => c.level);
        const completedCourses = userProgress.filter(p => p.progress_percentage === 100);

        // Use Claude AI for intelligent recommendations
        const analysisPrompt = `Analyze this user's learning profile and recommend 5 new topics/courses:

Created Content:
- Topics: ${userTopics.join(', ')}
- Levels: ${userLevels.join(', ')}
- Total created: ${courses.length} courses, ${books.length} books

Learning Progress:
- Courses in progress: ${userProgress.length}
- Completed courses: ${completedCourses.length}

Provide recommendations that:
1. Build on existing interests
2. Introduce complementary skills
3. Progress to next difficulty level
4. Include trending/relevant topics
5. Mix theoretical and practical content

Return JSON:
{
    "recommendations": [
        {
            "title": "suggested title",
            "topic": "topic area",
            "reason": "why this fits the user",
            "level": "beginner/intermediate/advanced/phd",
            "type": "course or book",
            "trending": true/false
        }
    ],
    "learning_path_insights": "personalized insights about their learning journey",
    "skill_gaps": ["gap1", "gap2"]
}`;

        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4000,
            temperature: 0.8,
            messages: [{ role: "user", content: analysisPrompt }]
        });

        const responseText = message.content[0].text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            throw new Error('Failed to parse AI recommendations');
        }

        const recommendations = JSON.parse(jsonMatch[0]);

        return Response.json({
            success: true,
            recommendations: recommendations.recommendations || [],
            insights: recommendations.learning_path_insights || "",
            skill_gaps: recommendations.skill_gaps || [],
            user_stats: {
                created_courses: courses.length,
                created_books: books.length,
                in_progress: userProgress.length,
                completed: completedCourses.length
            }
        });

    } catch (error) {
        console.error('Recommendations error:', error);
        return Response.json({ 
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});