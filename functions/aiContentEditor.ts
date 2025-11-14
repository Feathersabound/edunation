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
            content,
            action,
            instructions,
            contentType = "text"
        } = await req.json();

        if (!content || !action) {
            return Response.json({ error: 'Content and action required' }, { status: 400 });
        }

        let systemPrompt = "";
        let userPrompt = "";

        switch(action) {
            case "summarize":
                systemPrompt = "You are an expert content summarizer. Create concise, insightful summaries.";
                userPrompt = `Summarize this ${contentType}:\n\n${content}\n\nProvide:\n1. Brief summary (2-3 sentences)\n2. Key points (3-5 bullet points)\n3. Main takeaway\n\nReturn JSON: {"summary": "...", "key_points": ["..."], "main_takeaway": "..."}`;
                break;

            case "improve":
                systemPrompt = "You are an expert editor. Improve clarity, flow, and engagement while maintaining the original meaning.";
                userPrompt = `Improve this ${contentType}:\n\n${content}\n\n${instructions ? `Focus on: ${instructions}` : 'Enhance clarity, engagement, and professionalism.'}\n\nReturn the improved version as plain text.`;
                break;

            case "expand":
                systemPrompt = "You are an expert content writer. Expand content with relevant details, examples, and insights.";
                userPrompt = `Expand this ${contentType}:\n\n${content}\n\n${instructions ? `Guidelines: ${instructions}` : 'Add depth, examples, and detailed explanations.'}\n\nReturn the expanded version as markdown.`;
                break;

            case "simplify":
                systemPrompt = "You are an expert at making complex content accessible. Simplify without losing essential information.";
                userPrompt = `Simplify this ${contentType} for easier understanding:\n\n${content}\n\n${instructions ? `Target audience: ${instructions}` : 'Make it clear and accessible.'}\n\nReturn the simplified version as markdown.`;
                break;

            case "rewrite":
                systemPrompt = "You are an expert content rewriter. Transform content while preserving core information.";
                userPrompt = `Rewrite this ${contentType}:\n\n${content}\n\n${instructions ? `Style: ${instructions}` : 'Make it fresh and engaging.'}\n\nReturn the rewritten version as markdown.`;
                break;

            case "translate":
                systemPrompt = "You are an expert translator. Provide accurate, natural translations.";
                userPrompt = `Translate this ${contentType}:\n\n${content}\n\nTarget language: ${instructions || 'Spanish'}\n\nReturn the translated version.`;
                break;

            default:
                return Response.json({ error: 'Invalid action' }, { status: 400 });
        }

        const message = await anthropic.messages.create({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 8000,
            temperature: 0.7,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }]
        });

        const responseText = message.content[0].text;

        // Try to parse as JSON for structured responses
        let result;
        if (action === "summarize") {
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                result = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: responseText };
            } catch {
                result = { summary: responseText };
            }
        } else {
            result = { content: responseText };
        }

        return Response.json({ 
            success: true, 
            result,
            action,
            usage: {
                input_tokens: message.usage.input_tokens,
                output_tokens: message.usage.output_tokens
            }
        });

    } catch (error) {
        console.error('AI Content Editor Error:', error);
        return Response.json({ 
            error: error.message || 'Unknown error',
            details: error.toString()
        }, { status: 500 });
    }
});