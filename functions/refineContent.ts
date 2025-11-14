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
            contentId,
            contentType, // "book" or "course"
            refinementGoals,
            targetAudience,
            tone,
            iterations = 3
        } = await req.json();

        if (!contentId || !contentType) {
            return Response.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Fetch the content
        let content;
        if (contentType === "book") {
            const books = await base44.asServiceRole.entities.Book.filter({ id: contentId });
            content = books[0];
        } else {
            const courses = await base44.asServiceRole.entities.Course.filter({ id: contentId });
            content = courses[0];
        }

        if (!content) {
            return Response.json({ error: 'Content not found' }, { status: 404 });
        }

        const changesLog = [];
        let refinedContent = content;

        // Multi-iteration refinement with Claude
        for (let i = 0; i < iterations; i++) {
            const iterationNumber = i + 1;

            const systemPrompt = `You are an expert educational content editor and refinement specialist. You're working on iteration ${iterationNumber} of ${iterations} to perfect this ${contentType}.

Your goals for this iteration:
${refinementGoals ? `- ${refinementGoals}` : '- Improve overall quality, clarity, and engagement'}
${targetAudience ? `- Target audience: ${targetAudience}` : ''}
${tone ? `- Tone: ${tone}` : ''}

Focus areas:
${iterationNumber === 1 ? '- Grammar, spelling, and basic corrections\n- Structural improvements and flow' : ''}
${iterationNumber === 2 ? '- Tone consistency and audience adaptation\n- Factual accuracy and depth enhancement' : ''}
${iterationNumber >= 3 ? '- Creative enhancements and memorable elements\n- Final polish and perfection' : ''}

Return a JSON object with the refined content in the exact same structure as the input, plus a "changes_summary" field explaining what you improved.`;

            let userPrompt;
            if (contentType === "book") {
                userPrompt = `Refine this book:

Title: ${refinedContent.title}
Subtitle: ${refinedContent.subtitle || ''}
Level: ${refinedContent.level}
Topic: ${refinedContent.topic}

Chapters: ${JSON.stringify(refinedContent.chapters, null, 2)}

Return JSON with:
{
    "title": "refined title",
    "subtitle": "refined subtitle",
    "chapters": [refined chapters array],
    "changes_summary": "explanation of improvements made"
}`;
            } else {
                userPrompt = `Refine this course:

Title: ${refinedContent.title}
Description: ${refinedContent.description}
Level: ${refinedContent.level}
Topic: ${refinedContent.topic}

Modules: ${JSON.stringify(refinedContent.content_structure, null, 2)}

Return JSON with:
{
    "title": "refined title",
    "description": "refined description",
    "content_structure": [refined modules array],
    "changes_summary": "explanation of improvements made"
}`;
            }

            const message = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 16000,
                temperature: 0.7,
                system: systemPrompt,
                messages: [
                    {
                        role: "user",
                        content: userPrompt
                    }
                ]
            });

            const responseText = message.content[0].text;
            
            let jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Failed to parse Claude response');
            }

            const refinementResult = JSON.parse(jsonMatch[0]);
            
            // Update refinedContent with results
            if (contentType === "book") {
                refinedContent = {
                    ...refinedContent,
                    title: refinementResult.title || refinedContent.title,
                    subtitle: refinementResult.subtitle || refinedContent.subtitle,
                    chapters: refinementResult.chapters || refinedContent.chapters
                };
            } else {
                refinedContent = {
                    ...refinedContent,
                    title: refinementResult.title || refinedContent.title,
                    description: refinementResult.description || refinedContent.description,
                    content_structure: refinementResult.content_structure || refinedContent.content_structure
                };
            }

            changesLog.push({
                iteration: iterationNumber,
                summary: refinementResult.changes_summary,
                timestamp: new Date().toISOString()
            });
        }

        // Update the entity with refined content
        if (contentType === "book") {
            await base44.asServiceRole.entities.Book.update(contentId, {
                title: refinedContent.title,
                subtitle: refinedContent.subtitle,
                chapters: refinedContent.chapters
            });
        } else {
            await base44.asServiceRole.entities.Course.update(contentId, {
                title: refinedContent.title,
                description: refinedContent.description,
                content_structure: refinedContent.content_structure
            });
        }

        return Response.json({ 
            success: true,
            message: `Content refined through ${iterations} iterations`,
            changes_log: changesLog,
            refined_content: refinedContent
        });

    } catch (error) {
        console.error('Content refinement error:', error);
        return Response.json({ 
            error: error.message,
            details: error.toString()
        }, { status: 500 });
    }
});