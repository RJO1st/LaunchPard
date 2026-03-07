/**
 * learningPathEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * LaunchPard — Personalised Learning Path Engine
 *
 * Responsibilities:
 *   1. Generate diagnostic quiz questions (topic sampler, 2 questions per topic)
 *   2. Score diagnostic results → identify weak/strong areas
 *   3. Generate ordered topic sequence tailored to the scholar
 *   4. Advance the path as mastery improves
 *   5. Determine "next milestone" to show in UI and parent report
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { scoreDiagnostic, masteryToTier, MASTERY_THRESHOLDS } from './masteryEngine.js';

// ─── CURRICULUM TOPIC SEQUENCES ───────────────────────────────────────────────
// Defines the canonical order topics should be covered per subject.
// The learning path engine uses this as its backbone, then reorders based on
// the scholar's diagnostic scores (weakest first within each difficulty band).

export const TOPIC_SEQUENCES = {

  mathematics: {
    foundation: [
      'place_value', 'number_bonds', 'addition', 'subtraction',
      'multiplication', 'division', 'fractions', 'decimals',
    ],
    intermediate: [
      'percentages', 'ratio_and_proportion', 'algebra_basics',
      'linear_equations', 'area_and_perimeter', 'angles_and_shapes',
      'data_handling', 'probability',
    ],
    advanced: [
      'pythagoras_theorem', 'trigonometry', 'quadratic_equations',
      'simultaneous_equations', 'circle_theorems', 'vectors',
      'statistics', 'calculus',
    ],
  },

  english: {
    foundation: [
      'phonics', 'spelling', 'grammar', 'punctuation',
      'vocabulary', 'sentence_structure',
    ],
    intermediate: [
      'comprehension', 'inference', 'vocabulary_in_context',
      'authors_purpose', 'text_types', 'creative_writing',
    ],
    advanced: [
      'literary_devices', 'critical_analysis', 'persuasive_writing',
      'essay_writing', 'poetry_analysis', 'unseen_text',
    ],
  },

  science: {
    foundation: [
      'living_organisms', 'plants_and_animals', 'food_chains',
      'materials', 'states_of_matter', 'forces_basics',
    ],
    intermediate: [
      'cells_and_tissues', 'human_body', 'electricity', 'light_and_sound',
      'chemical_reactions', 'earth_and_space',
    ],
    advanced: [
      'genetics', 'evolution', 'atomic_structure', 'waves',
      'forces_and_motion', 'thermodynamics', 'ecology',
    ],
  },

  biology: {
    foundation: ['cell_structure', 'plants', 'living_organisms', 'food_chains'],
    intermediate: ['human_body_systems', 'microorganisms', 'ecosystems', 'reproduction'],
    advanced: ['genetics', 'evolution', 'homeostasis', 'dna_and_genetics'],
  },

  chemistry: {
    foundation: ['states_of_matter', 'mixtures', 'elements_and_compounds'],
    intermediate: ['chemical_reactions', 'atomic_structure', 'periodic_table', 'acids_and_bases'],
    advanced: ['mole_concept', 'organic_chemistry', 'rates_of_reaction', 'equilibrium'],
  },

  physics: {
    foundation: ['forces', 'energy', 'light', 'sound'],
    intermediate: ['electricity', 'waves', 'motion', 'electromagnetism'],
    advanced: ['nuclear_physics', 'quantum_physics', 'mechanics', 'thermodynamics'],
  },

  history: {
    foundation: ['ancient_civilisations', 'local_history'],
    intermediate: ['empire_and_colonialism', 'world_war_1', 'world_war_2'],
    advanced: ['cold_war', 'civil_rights', 'modern_history', 'causation_and_consequence'],
  },

  geography: {
    foundation: ['maps_and_directions', 'weather_and_climate', 'local_area'],
    intermediate: ['physical_geography', 'human_geography', 'ecosystems'],
    advanced: ['globalisation', 'development', 'environmental_issues', 'urbanisation'],
  },

  // Default fallback
  default: {
    foundation: ['introduction', 'core_concepts', 'basic_skills'],
    intermediate: ['application', 'problem_solving'],
    advanced: ['analysis', 'evaluation'],
  },
};

// ─── MILESTONE LABELS ─────────────────────────────────────────────────────────
const MILESTONES = {
  first_correct:   { label: 'First correct answer!',         emoji: '🎯', storyPoints: 5  },
  topic_started:   { label: 'Started a new topic',           emoji: '🚀', storyPoints: 10 },
  topic_halfway:   { label: '50% mastery reached',           emoji: '📈', storyPoints: 20 },
  topic_mastered:  { label: 'Topic mastered!',               emoji: '⭐', storyPoints: 50 },
  subject_halfway: { label: 'Halfway through subject path',  emoji: '🌟', storyPoints: 75 },
  path_complete:   { label: 'Learning path complete!',       emoji: '🏆', storyPoints: 200 },
};

// ─── DIAGNOSTIC QUESTION SAMPLER ──────────────────────────────────────────────
/**
 * Given the question bank for a subject, select diagnostic questions:
 * 2 questions per topic, distributed across difficulty tiers.
 * Used to assess the scholar's starting level before generating a path.
 *
 * @param {array}  questionBank  - array of question_bank rows
 * @param {string} subject
 * @param {string} curriculum
 * @param {number} yearLevel
 * @returns {array}              - selected questions for the diagnostic
 */
export function selectDiagnosticQuestions(questionBank, subject, curriculum, yearLevel) {
  const sequence = TOPIC_SEQUENCES[subject] ?? TOPIC_SEQUENCES.default;
  const allTopics = [
    ...sequence.foundation,
    ...sequence.intermediate,
    ...sequence.advanced,
  ];

  const selected = [];
  const shuffled = [...questionBank].sort(() => Math.random() - 0.5);

  for (const topic of allTopics) {
    // Try to get one developing + one expected/exceeding question per topic
    const developing = shuffled.find(q =>
      q.topic?.includes(topic) && q.difficulty_tier === 'developing' &&
      !selected.find(s => s.id === q.id)
    );
    const expected = shuffled.find(q =>
      q.topic?.includes(topic) && q.difficulty_tier === 'expected' &&
      !selected.find(s => s.id === q.id)
    );

    if (developing) selected.push({ ...developing, _diagnostic_topic: topic });
    if (expected)   selected.push({ ...expected,   _diagnostic_topic: topic });

    // Limit to ~20 diagnostic questions total
    if (selected.length >= 20) break;
  }

  return selected;
}

// ─── GENERATE LEARNING PATH ───────────────────────────────────────────────────
/**
 * Given diagnostic scores and existing mastery, generate an ordered topic path.
 *
 * Logic:
 *   1. Split topics into tiers: struggling (< 0.55), developing (0.55-0.79), mastered (≥ 0.80)
 *   2. Start with struggling topics from foundation → intermediate → advanced
 *   3. Interleave developing topics for reinforcement
 *   4. Skip mastered topics (add to SR review queue instead)
 *   5. Return ordered array with estimated session counts
 *
 * @param {string} curriculum
 * @param {string} subject
 * @param {number} yearLevel
 * @param {object} diagnosticScores  - { topic: score 0-1 } from diagnostic
 * @param {array}  masteryRecords    - existing scholar_topic_mastery rows
 * @returns {array}                  - ordered topic path items
 */
export function generateLearningPath(curriculum, subject, yearLevel, diagnosticScores = {}, masteryRecords = []) {
  const sequence = TOPIC_SEQUENCES[subject] ?? TOPIC_SEQUENCES.default;
  const masteryMap = {};
  for (const r of masteryRecords) {
    masteryMap[r.topic] = r.mastery_score;
  }

  // Merge diagnostic scores with existing mastery (mastery wins if higher)
  const scores = { ...diagnosticScores };
  for (const [topic, score] of Object.entries(masteryMap)) {
    scores[topic] = Math.max(scores[topic] ?? 0, score);
  }

  const categorise = (topic) => {
    const score = scores[topic] ?? 0;
    if (score >= MASTERY_THRESHOLDS.mastered)    return 'mastered';
    if (score >= MASTERY_THRESHOLDS.developing)  return 'developing';
    return 'struggling';
  };

  const ordered = [];

  // Foundation first — struggling topics only
  for (const topic of sequence.foundation) {
    if (categorise(topic) === 'struggling') {
      ordered.push(buildPathItem(topic, subject, curriculum, yearLevel, scores[topic] ?? 0, 'foundation'));
    }
  }

  // Foundation — developing (reinforcement)
  for (const topic of sequence.foundation) {
    if (categorise(topic) === 'developing') {
      ordered.push(buildPathItem(topic, subject, curriculum, yearLevel, scores[topic] ?? 0, 'foundation'));
    }
  }

  // Intermediate — struggling
  for (const topic of sequence.intermediate) {
    if (categorise(topic) === 'struggling') {
      ordered.push(buildPathItem(topic, subject, curriculum, yearLevel, scores[topic] ?? 0, 'intermediate'));
    }
  }

  // Intermediate — developing
  for (const topic of sequence.intermediate) {
    if (categorise(topic) === 'developing') {
      ordered.push(buildPathItem(topic, subject, curriculum, yearLevel, scores[topic] ?? 0, 'intermediate'));
    }
  }

  // Advanced — struggling
  for (const topic of sequence.advanced ?? []) {
    if (categorise(topic) === 'struggling') {
      ordered.push(buildPathItem(topic, subject, curriculum, yearLevel, scores[topic] ?? 0, 'advanced'));
    }
  }

  // Advanced — developing
  for (const topic of sequence.advanced ?? []) {
    if (categorise(topic) === 'developing') {
      ordered.push(buildPathItem(topic, subject, curriculum, yearLevel, scores[topic] ?? 0, 'advanced'));
    }
  }

  // If path is empty (scholar has mastered everything), add advanced topics for enrichment
  if (ordered.length === 0) {
    for (const topic of sequence.advanced ?? sequence.intermediate) {
      ordered.push(buildPathItem(topic, subject, curriculum, yearLevel, scores[topic] ?? 0.8, 'enrichment'));
    }
  }

  return ordered;
}

function buildPathItem(topic, subject, curriculum, yearLevel, currentScore, band) {
  const sessionsNeeded = currentScore >= 0.55 ? 2 : currentScore >= 0.30 ? 4 : 6;
  const displayName = topic.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return {
    topic,
    display_name:       displayName,
    subject,
    curriculum,
    year_level:         yearLevel,
    current_mastery:    currentScore,
    target_mastery:     0.80,
    estimated_sessions: sessionsNeeded,
    difficulty_band:    band,
    tier:               masteryToTier(currentScore),
    status:             currentScore >= 0.80 ? 'mastered' : currentScore > 0 ? 'in_progress' : 'not_started',
  };
}

// ─── ADVANCE PATH ─────────────────────────────────────────────────────────────
/**
 * Given updated mastery records, advance the learning path:
 * mark completed topics, update current_topic, compute completion %.
 *
 * @param {object} savedPath      - scholar_learning_path DB row
 * @param {array}  masteryRecords - updated mastery rows
 * @returns {object}              - updated path fields to upsert
 */
export function advanceLearningPath(savedPath, masteryRecords) {
  const masteryMap = {};
  for (const r of masteryRecords) { masteryMap[r.topic] = r.mastery_score; }

  const topicOrder = savedPath.topic_order ?? [];

  // Update mastery and status on each item
  const updated = topicOrder.map(item => ({
    ...item,
    current_mastery: masteryMap[item.topic] ?? item.current_mastery,
    status: (masteryMap[item.topic] ?? 0) >= 0.80 ? 'mastered'
          : (masteryMap[item.topic] ?? 0) > 0     ? 'in_progress'
          : 'not_started',
  }));

  // Current topic = first non-mastered
  const currentItem  = updated.find(i => i.status !== 'mastered');
  const currentTopic = currentItem?.topic ?? updated[updated.length - 1]?.topic ?? null;
  const currentIdx   = updated.findIndex(i => i.topic === currentTopic);

  const mastered     = updated.filter(i => i.status === 'mastered').length;
  const completionPct = updated.length > 0 ? Math.round((mastered / updated.length) * 100) : 0;

  // Determine next milestone
  let nextMilestone = null;
  if (currentItem) {
    const topicMastery = masteryMap[currentItem.topic] ?? 0;
    if (topicMastery < 0.55) {
      nextMilestone = `Build foundations in ${currentItem.display_name}`;
    } else {
      nextMilestone = `Master ${currentItem.display_name}`;
    }
  } else {
    nextMilestone = 'All topics mastered! Explore advanced challenges.';
  }

  return {
    topic_order:    updated,
    current_topic:  currentTopic,
    current_index:  currentIdx,
    completion_pct: completionPct,
    next_milestone: nextMilestone,
    updated_at:     new Date().toISOString(),
  };
}

// ─── MILESTONE CHECK ──────────────────────────────────────────────────────────
/**
 * Check if any milestones have been reached after an answer.
 * Returns array of achieved milestones (for notification + story points).
 *
 * @param {object} prevMastery  - mastery record before the answer
 * @param {object} newMastery   - mastery record after the answer
 * @returns {array}             - achieved milestone objects
 */
export function checkMilestones(prevMastery, newMastery) {
  const achieved = [];
  const prev = prevMastery?.mastery_score ?? 0;
  const next = newMastery?.mastery_score  ?? 0;

  if (prev === 0 && next > 0) {
    achieved.push(MILESTONES.first_correct);
  }
  if (prev < 0.5 && next >= 0.5) {
    achieved.push(MILESTONES.topic_halfway);
  }
  if (prev < MASTERY_THRESHOLDS.mastered && next >= MASTERY_THRESHOLDS.mastered) {
    achieved.push(MILESTONES.topic_mastered);
  }

  return achieved;
}

// ─── EXAM READINESS ESTIMATE ──────────────────────────────────────────────────
/**
 * Estimate overall exam readiness from mastery records.
 * Returns a score 0-100 and a descriptive label.
 *
 * @param {array} masteryRecords - scholar_topic_mastery rows for the subject
 * @param {string} subject
 * @returns {object}             - { score, label, topicsNeeded, colour }
 */
export function estimateExamReadiness(masteryRecords, subject) {
  if (!masteryRecords?.length) return { score: 0, label: 'Not started', topicsNeeded: [], colour: '#ef4444' };

  const sequence = TOPIC_SEQUENCES[subject] ?? TOPIC_SEQUENCES.default;
  const allTopics = [...sequence.foundation, ...sequence.intermediate, ...sequence.advanced ?? []];

  const masteryMap = {};
  for (const r of masteryRecords) { masteryMap[r.topic] = r.mastery_score; }

  let totalWeight = 0;
  let weightedScore = 0;
  const weights = { foundation: 1.5, intermediate: 1.0, advanced: 0.8 };

  for (const topic of sequence.foundation ?? []) {
    const w = weights.foundation;
    totalWeight    += w;
    weightedScore  += (masteryMap[topic] ?? 0) * w;
  }
  for (const topic of sequence.intermediate ?? []) {
    const w = weights.intermediate;
    totalWeight    += w;
    weightedScore  += (masteryMap[topic] ?? 0) * w;
  }
  for (const topic of sequence.advanced ?? []) {
    const w = weights.advanced;
    totalWeight    += w;
    weightedScore  += (masteryMap[topic] ?? 0) * w;
  }

  const score = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;

  const topicsNeeded = allTopics
    .filter(t => (masteryMap[t] ?? 0) < 0.55)
    .map(t => t.replace(/_/g, ' '));

  const label  = score >= 80 ? 'Exam Ready' : score >= 60 ? 'On Track' : score >= 40 ? 'Developing' : 'Needs Focus';
  const colour = score >= 80 ? '#22c55e'    : score >= 60 ? '#f59e0b'   : '#ef4444';

  return { score, label, topicsNeeded, colour };
}
