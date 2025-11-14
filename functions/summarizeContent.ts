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

        const { contentId, contentType, summaryType = "brief" } = await req.json();

        if (!contentId || !contentType) {
            return Response.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Fetch content
        let content;
        if (contentType === "book") {
            const books = await base44.entities.Book.filter({ id: contentId });
            content = books[0];
        } else {
            const courses = await base44.entities.Course.filter({ id: contentId });
            content = courses[0];
        }

        if (!content) {
            return Response.json({ error: 'Content not found' }, { status: 404 });
        }

        const summaryPrompt = contentType === "book"
            ? `Summarize this book:

Title: ${content.title}
Topic: ${content.topic}
Level: ${content.level}
Chapters: ${content.chapters?.length || 0}

Summary type: ${summaryType}

Provide:
1. ${summaryType === "brief" ? "2-3 sentence overview" : "Detailed multi-paragraph summary"}
2. Key learning outcomes (3-5 points)
3. Target audience
4. Estimated reading time

Return as JSON.`
            : `Summarize this course:

Title: ${content.title}
Topic: ${content.topic}
Modules: ${content.content_structure?.length || 0}

Summary type: ${summaryType}

Provide:
1. ${summaryType === "brief" ? "2-3 sentence overview" : "Detailed summary"}
2. Learning objectives (3-5 points)
3. Skills gained
4. Who should take this

Return as JSON.`;

        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 2000,
            temperature: 0.5,
            messages: [{ role: "user", content: summaryPrompt }]
        });

        const responseText = message.content[0].text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        
        let summary;
        if (jsonMatch) {
            summary = JSON.parse(jsonMatch[0]);
        } else {
            summary = { text: responseText };
        }

        return Response.json({
            success: true,
            summary
        });

    } catch (error) {
        console.error('Summarization error:', error);
        return Response.json({ 
            error: error.message
        }, { status: 500 });
    }
});