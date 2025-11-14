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

        const body = await req.json();
        console.log("Received request:", body);

        const { 
            contentType, 
            topic, 
            title, 
            level, 
            uniqueTwist, 
            targetLength, 
            audience,
            includeQuizzes,
            language = "en-US",
            adultContent = false,
            britishHumor = false
        } = body;

        if (!contentType || !topic) {
            return Response.json({ error: 'Missing required fields: contentType and topic' }, { status: 400 });
        }

        const languageName = language === "en-US" ? "US English" : 
                            language === "en-GB" ? "UK English" : language;

        const humorInstruction = britishHumor ? 
            "\n\nSTYLE: Use British humor - dry wit, dark humor, cheeky references to sexuality, and bodily function jokes where appropriate. Make it irreverent and witty." : "";

        const contentInstruction = adultContent ? 
            "\n\nCONTENT RATING: This is adult content (18+). You may include mature themes, explicit language, and adult humor." : 
            "\n\nCONTENT RATING: Keep content appropriate for general audiences.";

        // Build comprehensive prompt for Claude
        const systemPrompt = contentType === "course" 
            ? `You are an expert educational content creator. Create comprehensive, engaging course content in ${languageName}.${humorInstruction}${contentInstruction} Return ONLY valid JSON, no other text.`
            : `You are an expert author. Create compelling book content in ${languageName}.${humorInstruction}${contentInstruction} Return ONLY valid JSON, no other text.`;

        const userPrompt = contentType === "course"
            ? `Create a ${level}-level course on "${topic}" in ${languageName}.

Title: ${title || topic}
Unique angle: ${uniqueTwist || "engaging and practical"}
Audience: ${audience || "general learners"}
Length: ${targetLength === "short" ? "3-4 modules" : targetLength === "medium" ? "5-6 modules" : "8-10 modules"}

Return JSON:
{
    "title": "Course title",
    "description": "Course description (100-150 words)",
    "modules": [
        {
            "module_title": "Module name",
            "sections": [
                {
                    "title": "Section title",
                    "content": "Detailed markdown content (300-500 words)",
                    "key_points": ["point 1", "point 2", "point 3"]${includeQuizzes ? ',\n                    "quiz_questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": 0}]' : ''}
                }
            ]
        }
    ]
}`
            : `Write a ${level}-level book on "${topic}" in ${languageName}.

Title: ${title || topic}
Perspective: ${uniqueTwist || "fresh and engaging"}
Length: ${targetLength === "short" ? "6-8 chapters" : targetLength === "medium" ? "10-12 chapters" : "15-20 chapters"}

Return JSON:
{
    "title": "Book title",
    "subtitle": "Compelling subtitle",
    "chapters": [
        {
            "chapter_number": 1,
            "title": "Chapter title",
            "content": "Full chapter in markdown (1000-2000 words)",
            "key_takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"]
        }
    ]
}`;

        console.log("Calling Claude API...");

        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 16000,
            temperature: 0.7,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }]
        });

        console.log("Claude response received");

        const responseText = message.content[0].text;
        
        // Extract JSON from response
        let content;
        try {
            // Try to find JSON in the response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                content = JSON.parse(jsonMatch[0]);
            } else {
                content = JSON.parse(responseText);
            }
        } catch (parseError) {
            console.error("JSON parse error:", parseError);
            console.error("Response text:", responseText.substring(0, 500));
            return Response.json({ 
                error: 'Failed to parse AI response',
                details: parseError.message
            }, { status: 500 });
        }

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
            error: error.message || 'Unknown error',
            details: error.toString()
        }, { status: 500 });
    }
});