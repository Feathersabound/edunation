import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            prompt,
            style = "photorealistic",
            aspectRatio = "1:1",
            mood = "neutral",
            adultContent = false,
            quality = "standard"
        } = await req.json();

        if (!prompt) {
            return Response.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Build enhanced prompt based on parameters
        let enhancedPrompt = prompt;

        // Style modifiers
        const styleModifiers = {
            photorealistic: "hyperrealistic, 8K resolution, professional photography, studio lighting",
            artistic: "artistic interpretation, painterly style, vibrant colors, expressive",
            cartoon: "cartoon style, illustrated, colorful, playful, animated look",
            watercolor: "watercolor painting, soft edges, flowing colors, artistic, hand-painted",
            sketch: "pencil sketch, hand-drawn, artistic linework, black and white",
            cinematic: "cinematic lighting, dramatic composition, film-like, atmospheric",
            minimalist: "minimalist design, clean lines, simple composition, modern",
            vintage: "vintage style, retro aesthetic, aged look, nostalgic",
            fantasy: "fantasy art, magical, ethereal, dreamlike, enchanted",
            scifi: "science fiction, futuristic, high-tech, cyberpunk aesthetic"
        };

        // Mood modifiers
        const moodModifiers = {
            bright: "bright, cheerful, uplifting, positive energy",
            dark: "dark, moody, dramatic shadows, mysterious",
            calm: "calm, peaceful, serene, tranquil atmosphere",
            energetic: "energetic, dynamic, vibrant, exciting",
            romantic: "romantic, intimate, warm lighting, soft focus",
            mysterious: "mysterious, enigmatic, intriguing, shadowy",
            professional: "professional, clean, polished, corporate"
        };

        // Quality modifiers
        const qualityModifiers = {
            standard: "high quality",
            hd: "HD quality, sharp details, professional",
            ultra: "ultra HD, 8K resolution, extreme detail, masterpiece quality"
        };

        // Adult content handling
        if (adultContent) {
            enhancedPrompt = `Artistic adult content: ${enhancedPrompt}. Sensual, mature, tasteful photography. Professional lighting, artistic composition. NSFW, 18+`;
        }

        // Combine all modifiers
        const styleModifier = styleModifiers[style] || styleModifiers.photorealistic;
        const moodModifier = moodModifiers[mood] || "";
        const qualityModifier = qualityModifiers[quality] || qualityModifiers.standard;

        enhancedPrompt = `${enhancedPrompt}. ${styleModifier}. ${moodModifier}. ${qualityModifier}. ${aspectRatio} aspect ratio`;

        console.log("Enhanced prompt:", enhancedPrompt);

        // Generate image using Core integration
        const imageResult = await base44.integrations.Core.GenerateImage({
            prompt: enhancedPrompt
        });

        if (!imageResult?.url) {
            throw new Error("Image generation failed - no URL returned");
        }

        return Response.json({
            success: true,
            url: imageResult.url,
            prompt: enhancedPrompt,
            parameters: {
                style,
                aspectRatio,
                mood,
                quality,
                adultContent
            }
        });

    } catch (error) {
        console.error('Enhanced Image Generation Error:', error);
        return Response.json({
            error: error.message || 'Image generation failed',
            details: error.toString()
        }, { status: 500 });
    }
});