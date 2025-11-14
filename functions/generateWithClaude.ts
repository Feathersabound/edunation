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

        const { 
            contentType, 
            topic, 
            title, 
            level, 
            uniqueTwist, 
            targetLength, 
            audience,
            includeQuizzes 
        } = await req.json();

        // Build comprehensive prompt for Claude
        const systemPrompt = contentType === "course" 
            ? `You are an expert educational content creator specializing in online courses. Create comprehensive, engaging, and well-structured course content that matches the specified difficulty level. Include clear learning objectives, detailed explanations, and practical examples.`
            : `You are an expert author and educational content writer. Create compelling, in-depth book content with well-researched information, engaging narrative, and clear structure. Maintain consistency in tone and depth throughout.`;

        const userPrompt = contentType === "course"
            ? `Create a comprehensive ${level}-level course on "${topic}".

Title: ${title || topic}
Unique angle: ${uniqueTwist || "engaging and practical approach"}
Target audience: ${audience || "general learners"}
Target length: ${targetLength === "short" ? "3-4 modules" : targetLength === "medium" ? "6-8 modules" : "10-15 modules"}

Requirements:
- Each module should have 3-5 detailed sections
- ${level === "phd" ? "Include research references, citations, and original insights suitable for doctoral-level study" : 
   level === "advanced" ? "Include technical depth, case studies, and advanced concepts" : 
   level === "intermediate" ? "Include practical examples, case studies, and real-world applications" : 
   "Use simple language, analogies, and step-by-step explanations"}
- Each section should be substantial (500-1000 words)
- Include key learning points for each section
${includeQuizzes ? "- Include 3-5 quiz questions per section with multiple choice options" : ""}
- Make it engaging and actionable

Respond with a JSON object with this structure:
{
    "title": "Course title",
    "description": "Comprehensive course description (150-200 words)",
    "modules": [
        {
            "module_title": "Module name",
            "sections": [
                {
                    "title": "Section title",
                    "content": "Detailed section content in markdown format",
                    "key_points": ["point 1", "point 2", "point 3"],
                    ${includeQuizzes ? '"quiz_questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": 0}]' : ''}
                }
            ]
        }
    ]
}`
            : `Write a comprehensive ${level}-level book on "${topic}".

Title: ${title || topic}
Unique perspective: ${uniqueTwist || "fresh and engaging"}
Target length: ${targetLength === "short" ? "8-12 chapters" : targetLength === "medium" ? "15-20 chapters" : "25-35 chapters"}

Requirements:
- Each chapter should be substantial (2000-4000 words)
- ${level === "phd" ? "Academic research style with citations, original arguments, and scholarly depth" : 
   level === "advanced" ? "Technical depth with expert-level insights and comprehensive analysis" : 
   level === "intermediate" ? "Balanced depth with practical examples and clear explanations" : 
   "Accessible language with clear explanations and engaging examples"}
- Include key takeaways for each chapter (5-8 points)
- Create a cohesive narrative that flows logically
- Add depth and detail appropriate for book-length content

Respond with a JSON object with this structure:
{
    "title": "Book title",
    "subtitle": "Compelling subtitle",
    "chapters": [
        {
            "chapter_number": 1,
            "title": "Chapter title",
            "content": "Full chapter content in markdown format (2000-4000 words)",
            "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4", "takeaway 5"]
        }
    ]
}`;

        // Use Claude 3.5 Sonnet for best long-form content generation
        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 16000, // Extended tokens for long-form content
            temperature: 0.7,
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: userPrompt
                }
            ]
        });

        // Extract and parse the response
        const responseText = message.content[0].text;
        
        // Try to extract JSON from the response
        let jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            // If no JSON found, try to parse the entire response
            try {
                const parsed = JSON.parse(responseText);
                return Response.json({ success: true, data: parsed });
            } catch {
                return Response.json({ 
                    error: 'Failed to parse response', 
                    rawResponse: responseText 
                }, { status: 500 });
            }
        }

        const content = JSON.parse(jsonMatch[0]);

        return Response.json({ 
            success: true, 
            data: content,
            usage: {
                input_tokens: message.usage.input_tokens,
                output_tokens: message.usage.output_tokens
            }
        });

    } catch (error) {
        console.error('Claude API Error:', error);
        return Response.json({ 
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});