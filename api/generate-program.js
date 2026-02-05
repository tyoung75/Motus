// Vercel Serverless Function for Claude API Program Generation
import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured');
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { profile, macros, bmr, tdee } = req.body;

    const anthropic = new Anthropic({ apiKey });

    const systemPrompt = `You are an expert fitness coach and exercise scientist specializing in periodized training programs. You create personalized, science-backed programs with proper periodization, progressive overload, and recovery protocols.

You must return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "name": "string - creative program name",
  "description": "string - brief description",
  "mesocycleWeeks": 4,
  "currentWeek": 1,
  "currentPhase": "Base",
  "phases": ["Base", "Build", "Peak", "Deload"],
  "weeklySchedule": [
    {
      "day": 1,
      "dayName": "Monday",
      "name": "string - e.g., Upper Push or AM: Running / PM: Strength",
      "isRestDay": false,
      "isDeload": false,
      "sessions": [
        {
          "time": "AM" or "PM" or "ANY",
          "type": "endurance" or "strength" or "hiit" or "recovery",
          "focus": "string - e.g., Easy Run, Upper Push, HIIT",
          "duration": number in minutes,
          "exercises": [
            {
              "name": "string",
              "sets": number,
              "reps": "string - e.g., 8-10, 5x5, 30 sec, 3 miles",
              "rpe": number 6-10,
              "rest": "string - e.g., 90s, 2-3 min",
              "notes": "string - coaching cues",
              "progression": "string - how to progress this exercise"
            }
          ]
        }
      ]
    }
  ],
  "progressionRules": {
    "strengthIncrease": "Add 2.5lbs per week when all reps completed at target RPE",
    "volumeIncrease": "Add 1 set per exercise every 2 weeks during Build phase",
    "deloadProtocol": "Week 4: Reduce volume by 50%, maintain intensity at RPE 6-7",
    "enduranceProgression": "Increase weekly mileage by 10% during Build phase"
  },
  "vacationWeeks": [array of week numbers that are rest/deload due to vacations]
}

Key Principles to Apply:
1. AUTO-PERIODIZATION: Structure as Base (foundation) → Build (progressive overload) → Peak (intensity) → Deload (recovery)
2. PROGRESSIVE OVERLOAD: For strength - add 2.5lbs/week; For endurance - increase volume 10%/week
3. DELOAD WEEKS: Every 4th week OR aligned with scheduled vacations
4. HYBRID TRAINING: If enabled, AM sessions for primary goal, PM for secondary with adequate recovery
5. DOUBLE DAYS: Only if user allows, with proper session spacing and recovery
6. VACATION HANDLING: Mark vacation weeks as deload/rest, show trip names`;

    // Build the user prompt with all the new details
    // Support both daysPerWeek and desiredTrainingDays
    const trainingDays = profile.daysPerWeek || profile.desiredTrainingDays || 4;

    let userPrompt = `Create a comprehensive ${trainingDays}-day per week training program.

ATHLETE PROFILE:
- Name: ${profile.name}
- Age: ${profile.age}
- Weight: ${profile.weight} ${profile.weightUnit}
- Experience: ${profile.experienceLevel || profile.trainingHistory || 'intermediate'}
- Session Duration: ${profile.sessionDuration || 60} minutes
- Equipment: ${profile.equipment === 'full' ? 'Full gym access' : profile.equipment === 'home' ? 'Home gym' : 'Minimal/bodyweight'}

PRIMARY GOAL: ${profile.programType} - ${profile.programSubtype}
`;

    // Add goal-specific details
    // Endurance - running/marathon
    if (profile.programType === 'endurance' && (profile.programSubtype === 'marathon' || profile.programSubtype === 'running')) {
      userPrompt += `
RACE DETAILS:
- Distance: ${profile.raceDistance || 'Half Marathon'}
- Race Date: ${profile.raceDate || 'Not specified'}
- Target Time: ${profile.targetFinishHours ? `${profile.targetFinishHours}:${profile.targetFinishMinutes || '00'}:${profile.targetFinishSeconds || '00'}` : 'Not specified'}
- Current Weekly Mileage: ${profile.currentWeeklyMileage || 0} miles
- Longest Recent Run: ${profile.longestRecentRun || 0} miles
`;
    }

    // Strength programs (powerlifting, olympic, strongman)
    if (profile.programType === 'strength') {
      // Extract strength goals from the strengthGoals array
      const goals = profile.strengthGoals || [];
      const squat = goals.find(g => g.id === 'squat') || {};
      const bench = goals.find(g => g.id === 'bench') || {};
      const deadlift = goals.find(g => g.id === 'deadlift') || {};
      const ohp = goals.find(g => g.id === 'ohp') || {};

      userPrompt += `
STRENGTH GOALS:
- Goal Date: ${profile.strengthGoalDate || 'Not specified'}
- Squat: ${squat.current || '?'} → ${squat.target || '?'} lbs
- Bench: ${bench.current || '?'} → ${bench.target || '?'} lbs
- Deadlift: ${deadlift.current || '?'} → ${deadlift.target || '?'} lbs
- OHP: ${ohp.current || '?'} → ${ohp.target || '?'} lbs
`;
    }

    // Aesthetic programs (hypertrophy, lean-muscle, recomp)
    if (profile.programType === 'aesthetic') {
      userPrompt += `
AESTHETIC GOALS:
- Current Body Fat: ${profile.currentBodyFat || '?'}%
- Target Body Fat: ${profile.targetBodyFat || '?'}%
- Goal Date: ${profile.aestheticGoalDate || 'Not specified'}
`;
    }

    if (profile.programType === 'fatloss') {
      userPrompt += `
FAT LOSS GOALS:
- Current Weight: ${profile.weight} ${profile.weightUnit}
- Target Weight: ${profile.targetWeight} ${profile.weightUnit}
- Weekly Loss Rate: ${profile.weeklyWeightChange} lbs/week
`;
    }

    // Add hybrid training info
    if (profile.enableHybrid && profile.secondaryProgramType) {
      userPrompt += `
HYBRID TRAINING ENABLED:
- Secondary Goal: ${profile.secondaryProgramType} - ${profile.secondarySubtype}
- Double Days Allowed: ${profile.allowDoubleDays ? 'YES - Create AM/PM splits' : 'NO - Alternate days'}
${profile.allowDoubleDays ? '- AM sessions: Primary goal focus\n- PM sessions: Secondary goal focus' : ''}
`;
    }

    // Add vacations
    if (profile.vacations && profile.vacations.length > 0) {
      userPrompt += `
SCHEDULED TIME OFF (align deloads with these):
${profile.vacations.map((v, i) => `- ${v.name || `Trip ${i + 1}`}: ${v.startDate} to ${v.endDate}`).join('\n')}
`;
    }

    userPrompt += `
NUTRITION CONTEXT:
- Daily Calorie Target: ${macros?.calories || tdee} kcal
- Protein Target: ${macros?.protein || 150}g
- Nutrition Goal: ${profile.nutritionGoal}

Generate a complete 4-week mesocycle with:
1. Proper periodization phases
2. Progressive overload built into each week
3. Deload in week 4 (or aligned with vacations)
4. RPE-based intensity prescriptions
5. Clear progression rules for each exercise type`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    // Extract the text content
    const responseText = message.content[0].text;

    // Parse JSON from response
    let program;
    try {
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : responseText;
      program = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse Claude response:', parseError);
      console.log('Raw response:', responseText);
      throw new Error('Invalid program format from AI');
    }

    // Add metadata (support both field naming conventions)
    program.primaryGoal = profile.programType;
    program.primarySubtype = profile.programSubtype;
    program.secondaryGoal = profile.secondaryProgramType || null;
    program.secondarySubtype = profile.secondarySubtype || null;
    program.isHybrid = profile.enableHybrid || false;
    program.allowDoubleDays = profile.allowDoubleDays || false;
    program.daysPerWeek = profile.daysPerWeek || profile.desiredTrainingDays || 4;
    program.vacations = profile.vacations || [];
    program.generatedAt = new Date().toISOString();

    return res.status(200).json(program);
  } catch (error) {
    console.error('Program generation error:', error);
    return res.status(500).json({
      error: 'Failed to generate program',
      message: error.message,
    });
  }
}
