// ═══════════════════════════════════════════════════════════════════════════
// OPENROUTER AI VALIDATOR
// File: src/lib/aiValidator.js
// Validates student explanations using OpenRouter API
// ═══════════════════════════════════════════════════════════════════════════

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model selection based on cost/quality needs
const MODELS = {
  premium: 'anthropic/claude-3.5-sonnet',   // Best quality: $3/$15 per 1M tokens
  balanced: 'openai/gpt-4o-mini',           // Good balance: $0.15/$0.6 per 1M tokens
  budget: 'google/gemini-flash-1.5',        // Fastest/cheapest: $0.075/$0.3 per 1M tokens
};

// Estimated costs per validation
const ESTIMATED_COSTS = {
  premium: 0.0045,  // ~$0.0045 per validation
  balanced: 0.0002, // ~$0.0002 per validation
  budget: 0.0001,   // ~$0.0001 per validation
};

/**
 * Main validation function
 * @param {string} explanation - Student's explanation text
 * @param {string} question - The question being answered
 * @param {string} studentAnswer - Student's numerical answer
 * @param {string} correctAnswer - Correct numerical answer
 * @returns {Promise<Object>} Validation results
 */
export async function validateExplanation(explanation, question, studentAnswer, correctAnswer) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  // Check minimum length
  if (explanation.length < 50) {
    return {
      understanding_score: 0,
      likely_ai_generated: false,
      confidence: 1.0,
      feedback: 'Explanation too short. Please provide more detail (minimum 50 characters).',
      red_flags: ['too_short'],
      strengths: [],
      model_used: 'none',
      validation_cost: 0
    };
  }

  const prompt = `
You are validating a physics student's explanation for academic integrity and understanding.

QUESTION: ${question}
CORRECT ANSWER: ${correctAnswer}
STUDENT'S ANSWER: ${studentAnswer}
STUDENT'S EXPLANATION:
"${explanation}"

ANALYZE THE EXPLANATION FOR:

1. **Understanding (0-100)**:
   - Does it show real comprehension of the concept?
   - Are the steps logical and correct?
   - Does it explain WHY, not just HOW?

2. **AI Detection**:
   Signs of AI-generated text:
   - Overly formal/academic language
   - Perfect grammar with no errors
   - Excessive technical terminology
   - Impersonal tone (no "I", "my", etc.)
   - Too polished/complete
   
   Signs of authentic student work:
   - Casual/conversational language
   - Minor errors/typos (normal for students)
   - Personal voice ("I calculated", "Then I...")
   - Incomplete or rough edges
   - Simple explanations

3. **Quality Assessment**:
   - Red flags (what's problematic)
   - Strengths (what's good)
   - Constructive feedback

RESPOND ONLY WITH THIS EXACT JSON FORMAT (no markdown, no extra text):
{
  "understanding_score": <0-100>,
  "likely_ai_generated": <true or false>,
  "confidence": <0.0-1.0>,
  "feedback": "<brief constructive feedback in 1-2 sentences>",
  "red_flags": ["flag1", "flag2"] or [],
  "strengths": ["strength1", "strength2"] or []
}

EXAMPLES:

AI-Generated (BAD):
"The normal force can be calculated by resolving the gravitational force into components perpendicular and parallel to the inclined plane. Utilizing trigonometric principles, we ascertain that N = mg cos(θ), where m represents mass, g denotes gravitational acceleration, and θ signifies the angle of inclination."
→ likely_ai_generated: true, understanding_score: 30

Student-Written (GOOD):
"I broke down the weight force into two parts - one pushing into the ramp and one pulling down the ramp. The normal force pushes back perpendicular to the ramp so I used N = mg cos 35 to get my answer."
→ likely_ai_generated: false, understanding_score: 80
`;

  try {
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://launchpard.com',
        'X-Title': 'LaunchPard Quiz Validator'
      },
      body: JSON.stringify({
        model: MODELS.balanced, // Use balanced by default
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON response (strip any markdown if present)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }
    
    const result = JSON.parse(jsonMatch[0]);
    
    // Add metadata
    result.model_used = MODELS.balanced;
    result.validation_cost = ESTIMATED_COSTS.balanced;
    
    // Validate result structure
    if (typeof result.understanding_score !== 'number' || 
        typeof result.likely_ai_generated !== 'boolean') {
      throw new Error('Invalid response structure from AI');
    }
    
    return result;
    
  } catch (error) {
    console.error('AI Validation Error:', error);
    
    // Return safe fallback
    return {
      understanding_score: 50, // Neutral score
      likely_ai_generated: false,
      confidence: 0,
      feedback: 'Unable to validate explanation. Please try again.',
      red_flags: ['validation_error'],
      strengths: [],
      model_used: 'error',
      validation_cost: 0,
      error: error.message
    };
  }
}

/**
 * Batch validation for multiple explanations
 * @param {Array<Object>} submissions - Array of {explanation, question, studentAnswer, correctAnswer}
 * @returns {Promise<Array<Object>>} Array of validation results
 */
export async function batchValidate(submissions) {
  const results = [];
  
  for (const submission of submissions) {
    const result = await validateExplanation(
      submission.explanation,
      submission.question,
      submission.studentAnswer,
      submission.correctAnswer
    );
    
    results.push({
      ...submission,
      validation: result
    });
    
    // Rate limiting: wait 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

/**
 * Get cost estimate for validations
 * @param {number} count - Number of validations
 * @param {string} model - Model tier ('budget', 'balanced', 'premium')
 * @returns {Object} Cost breakdown
 */
export function estimateCost(count, model = 'balanced') {
  const costPerValidation = ESTIMATED_COSTS[model] || ESTIMATED_COSTS.balanced;
  
  return {
    validations: count,
    model: MODELS[model],
    cost_per_validation: costPerValidation,
    total_cost: count * costPerValidation,
    monthly_cost_1000_scholars: 10000 * costPerValidation, // 10 validations per scholar
  };
}

/**
 * Test the validator with sample data
 */
export async function testValidator() {
  console.log('🧪 Testing AI Validator...\n');
  
  // Test 1: Good student explanation
  const test1 = await validateExplanation(
    "I broke the weight into components. The normal force is perpendicular to the ramp so I used N = mg cos 35 degrees to calculate it.",
    "A 12kg block on a 35° incline. Calculate normal force.",
    "96.31",
    "96.31"
  );
  
  console.log('Test 1 - Good Student Work:');
  console.log('Score:', test1.understanding_score);
  console.log('AI-Generated?', test1.likely_ai_generated);
  console.log('Feedback:', test1.feedback);
  console.log('');
  
  // Test 2: AI-generated explanation
  const test2 = await validateExplanation(
    "The normal force can be calculated by resolving the gravitational force into components perpendicular and parallel to the inclined plane. Utilizing trigonometric principles, we ascertain that N = mg cos(θ), where m represents mass.",
    "A 12kg block on a 35° incline. Calculate normal force.",
    "96.31",
    "96.31"
  );
  
  console.log('Test 2 - AI-Generated Text:');
  console.log('Score:', test2.understanding_score);
  console.log('AI-Generated?', test2.likely_ai_generated);
  console.log('Feedback:', test2.feedback);
  console.log('');
  
  // Test 3: Too short
  const test3 = await validateExplanation(
    "I used the formula",
    "A 12kg block on a 35° incline. Calculate normal force.",
    "96.31",
    "96.31"
  );
  
  console.log('Test 3 - Too Short:');
  console.log('Score:', test3.understanding_score);
  console.log('Feedback:', test3.feedback);
  console.log('');
  
  // Cost estimate
  const cost = estimateCost(1000, 'balanced');
  console.log('💰 Cost Estimate (1000 scholars, 10 validations each):');
  console.log('Monthly cost:', `$${cost.monthly_cost_1000_scholars.toFixed(2)}`);
}

// Export default
export default {
  validateExplanation,
  batchValidate,
  estimateCost,
  testValidator,
  MODELS
};