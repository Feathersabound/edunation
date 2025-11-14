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

        const courses = await base44.asServiceRole.entities.Course.filter({ 
            created_by: user.email 
        });
        const books = await base44.asServiceRole.entities.Book.filter({ 
            created_by: user.email 
        });
        const progress = await base44.asServiceRole.entities.UserProgress.filter({ 
            user_email: user.email 
        });

        const allCourses = await base44.asServiceRole.entities.Course.list();
        const allBooks = await base44.asServiceRole.entities.Book.list();

        const userProfile = await base44.asServiceRole.entities.User.filter({ 
            email: user.email 
        });
        const profile = userProfile[0] || {};

        const prompt = `You are a personalized learning recommendation AI. Analyze this user's data and provide tailored recommendations.

User Profile:
- Email: ${user.email}
- Interests: ${profile.interests?.join(', ') || 'Not specified'}
- Learning Goals: ${profile.learning_goals || 'Not specified'}
- Expertise: ${profile.expertise?.join(', ') || 'Not specified'}
- Preferred Language: ${profile.preferred_language || 'en-US'}
- Show Adult Content: ${profile.show_adult_content || false}

Created Content:
- ${courses.length} courses (topics: ${courses.map(c => c.topic).join(', ')})
- ${books.length} books (topics: ${books.map(b => b.topic).join(', ')})

Progress:
- ${progress.length} courses in progress
- Average completion: ${progress.reduce((acc, p) => acc + (p.progress_percentage || 0), 0) / (progress.length || 1)}%

Available Content Library:
- ${allCourses.length} total courses
- ${allBooks.length} total books
- Topics covered: ${[...new Set([...allCourses.map(c => c.topic), ...allBooks.map(b => b.topic)])].join(', ')}

Based on this data, provide personalized recommendations. Consider:
1. User's stated interests and goals
2. Gaps in their knowledge based on what they've created vs. available topics
3. Natural progression from their current level
4. Complementary topics to what they already know
5. Filter out adult content if user preference is false

Return ONLY valid JSON with this structure:
{
    "insights": "Personalized analysis of user's learning journey (2-3 sentences)",
    "skill_gaps": ["skill 1", "skill 2", "skill 3"],
    "recommendations": [
        {
            "id": "course or book id from available content",
            "type": "course" or "book",
            "title": "title",
            "topic": "topic",
            "level": "level",
            "reason": "why this is recommended for this specific user",
            "relevance_score": 0-100,
            "trending": true/false
        }
    ]
}

Limit to 5 most relevant recommendations, sorted by relevance_score.`;

        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 4000,
            temperature: 0.7,
            messages: [{ role: "user", content: prompt }]
        });

        const responseText = message.content[0].text;
        let recommendations;

        try {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(responseText);
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            return Response.json({ 
                error: 'Failed to parse AI response',
                details: parseError.message
            }, { status: 500 });
        }

        const filteredRecommendations = recommendations.recommendations
            .filter(rec => {
                const content = rec.type === 'course' 
                    ? allCourses.find(c => c.id === rec.id)
                    : allBooks.find(b => b.id === rec.id);
                
                if (!content) return false;
                if (content.adult_content && !profile.show_adult_content) return false;
                return true;
            })
            .slice(0, 5);

        return Response.json({
            success: true,
            insights: recommendations.insights,
            skill_gaps: recommendations.skill_gaps,
            recommendations: filteredRecommendations
        });

    } catch (error) {
        console.error('Recommendations Error:', error);
        return Response.json({ 
            error: error.message || 'Unknown error',
            details: error.toString()
        }, { status: 500 });
    }
});