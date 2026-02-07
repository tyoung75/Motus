import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image, mediaType } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType || 'image/jpeg',
                data: image,
              },
            },
            {
              type: 'text',
              text: `Analyze this food image and identify all food items visible. For each food item, provide:
1. Name of the food
2. Estimated portion size
3. Estimated calories
4. Estimated protein (in grams)
5. Estimated carbohydrates (in grams)
6. Estimated fat (in grams)

Also provide an overall confidence score (0-1) for your analysis.

IMPORTANT: Return your response as a valid JSON object with this exact structure:
{
  "foods": [
    {
      "name": "Food name",
      "portion": "portion description",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ],
  "totals": {
    "calories": total_calories,
    "protein": total_protein,
    "carbs": total_carbs,
    "fat": total_fat
  },
  "confidence": confidence_score_between_0_and_1,
  "suggestions": ["tip 1", "tip 2"]
}

Only respond with the JSON object, no other text.`,
            },
          ],
        },
      ],
    });

    // Parse the response
    const responseText = message.content[0].text;

    // Try to parse as JSON
    let analysis;
    try {
      // Extract JSON from the response (in case there's any surrounding text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      // Return a fallback with the raw response
      return res.status(200).json({
        foods: [
          { name: 'Food item (AI parsing error)', portion: 'Unknown', calories: 300, protein: 20, carbs: 30, fat: 10 },
        ],
        totals: { calories: 300, protein: 20, carbs: 30, fat: 10 },
        confidence: 0.5,
        suggestions: ['AI response could not be parsed. Please edit the items manually.'],
        rawResponse: responseText,
      });
    }

    return res.status(200).json(analysis);
  } catch (error) {
    console.error('Anthropic API error:', error);
    return res.status(500).json({
      error: 'Failed to analyze image',
      message: error.message,
    });
  }
}
