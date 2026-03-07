// ═══════════════════════════════════════════════════════════════════
// LAUNCHPARD — COMPREHENSIVE CURRICULUM DEFINITIONS
// Deploy to: src/app/lib/curricula.js
// ═══════════════════════════════════════════════════════════════════

export const CURRICULA = {
  // ────────────────────────────────────────────────────────────────
  // UNITED KINGDOM
  // ────────────────────────────────────────────────────────────────
  uk_national: {
    country: "🇬🇧",
    name: "UK National",
    description: "National Curriculum for England",
    gradeLabel: "Year",
    grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    spelling: "british",
    stages: {
      "Key Stage 1": [1, 2],
      "Key Stage 2": [3, 4, 5, 6],
      "Key Stage 3": [7, 8, 9],
    },
  },
  uk_11plus: {
    country: "🇬🇧",
    name: "UK 11+",
    description: "Grammar School Entry Exam",
    gradeLabel: "Year",
    grades: [3, 4, 5, 6],
    spelling: "british",
    examAge: 11,
  },

  // ────────────────────────────────────────────────────────────────
  // UNITED STATES
  // ────────────────────────────────────────────────────────────────
  us_common_core: {
    country: "🇺🇸",
    name: "US Common Core",
    description: "Common Core State Standards",
    gradeLabel: "Grade",
    grades: [1, 2, 3, 4, 5, 6, 7, 8],
    spelling: "american",
    stages: {
      "Elementary": [1, 2, 3, 4, 5],
      "Middle School": [6, 7, 8],
    },
  },

  // ────────────────────────────────────────────────────────────────
  // AUSTRALIA
  // ────────────────────────────────────────────────────────────────
  aus_acara: {
    country: "🇦🇺",
    name: "Australian",
    description: "Australian Curriculum (ACARA)",
    gradeLabel: "Year",
    grades: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    spelling: "australian",
    stages: {
      "Foundation": [1, 2],
      "Primary": [3, 4, 5, 6],
      "Junior Secondary": [7, 8, 9],
    },
  },

  // ────────────────────────────────────────────────────────────────
  // INTERNATIONAL BACCALAUREATE
  // ────────────────────────────────────────────────────────────────
  ib_pyp: {
    country: "🌍",
    name: "IB PYP",
    description: "Primary Years Programme",
    gradeLabel: "Year",
    grades: [1, 2, 3, 4, 5, 6],
    spelling: "british",
    ageRange: "3–12 years",
  },
  ib_myp: {
    country: "🌍",
    name: "IB MYP",
    description: "Middle Years Programme",
    gradeLabel: "Year",
    grades: [1, 2, 3, 4, 5],
    spelling: "british",
    ageRange: "11–16 years",
  },

  // ────────────────────────────────────────────────────────────────
  // NIGERIA
  // ────────────────────────────────────────────────────────────────
  ng_primary: {
    country: "🇳🇬",
    name: "Nigerian Primary",
    description: "Primary Education (Basic 1–6)",
    gradeLabel: "Primary",
    grades: [1, 2, 3, 4, 5, 6],
    spelling: "british",
    currency: "₦",
    alternateLabels: ["Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6"],
  },
  ng_jss: {
    country: "🇳🇬",
    name: "Nigerian JSS",
    description: "Junior Secondary School (Basic 7–9)",
    gradeLabel: "JSS",
    grades: [1, 2, 3],
    spelling: "british",
    currency: "₦",
    alternateLabel: "Basic",
    alternateOffset: 6, // JSS 1 = Basic 7
  },
  ng_sss: {
    country: "🇳🇬",
    name: "Nigerian SSS",
    description: "Senior Secondary School (SS 1–3)",
    gradeLabel: "SS",
    grades: [1, 2, 3],
    spelling: "british",
    currency: "₦",
  },
};

// ═══════════════════════════════════════════════════════════════════
// SUBJECTS BY CURRICULUM
// Aligned with populate_questions.sh SUBJECTS map
// ═══════════════════════════════════════════════════════════════════
export const SUBJECTS_BY_CURRICULUM = {
  uk_national:    ["maths", "english", "verbal", "nvr", "science", "history", "geography"],
  uk_11plus:      ["maths", "english", "verbal", "nvr"],
  us_common_core: ["maths", "english", "science", "social_studies"],
  aus_acara:      ["maths", "english", "science", "hass"],
  ib_pyp:         ["maths", "english", "science", "social_studies"],
  ib_myp:         ["maths", "english", "science", "humanities"],
  ng_primary:     ["maths", "english", "basic_science", "social_studies"],
  ng_jss:         ["maths", "english", "basic_science", "basic_technology", "social_studies", "business_studies"],
  ng_sss:         ["maths", "english", "physics", "chemistry", "biology", "geography", "history",
                   "further_mathematics", "economics", "government", "commerce", "financial_accounting",
                   "civic_education"],
};

// ═══════════════════════════════════════════════════════════════════
// SUBJECT METADATA
// ═══════════════════════════════════════════════════════════════════
export const SUBJECT_META = {
  maths:                { emoji: "🔢", label: "Maths",                color: "blue"    },
  english:              { emoji: "📖", label: "English",              color: "purple"  },
  science:              { emoji: "🔬", label: "Science",              color: "green"   },
  verbal:               { emoji: "🧩", label: "Verbal Reasoning",     color: "indigo"  },
  nvr:                  { emoji: "🔷", label: "Non-Verbal Reasoning", color: "cyan"    },
  history:              { emoji: "📜", label: "History",              color: "amber"   },
  geography:            { emoji: "🌍", label: "Geography",            color: "teal"    },
  social_studies:       { emoji: "🏛️",  label: "Social Studies",      color: "amber"   },
  hass:                 { emoji: "🌐", label: "HASS",                 color: "teal"    },
  humanities:           { emoji: "📚", label: "Humanities",           color: "rose"    },
  computing:            { emoji: "💻", label: "Computing",            color: "slate"   },
  basic_science:        { emoji: "🧫", label: "Basic Science",        color: "lime"    },
  basic_technology:     { emoji: "🔧", label: "Basic Technology",     color: "orange"  },
  business_studies:     { emoji: "💼", label: "Business Studies",     color: "sky"     },
  physics:              { emoji: "⚛️",  label: "Physics",              color: "blue"    },
  chemistry:            { emoji: "🧪", label: "Chemistry",            color: "emerald" },
  biology:              { emoji: "🧬", label: "Biology",              color: "lime"    },
  further_mathematics:  { emoji: "∑",   label: "Further Maths",        color: "violet"  },
  economics:            { emoji: "📊", label: "Economics",            color: "yellow"  },
  government:           { emoji: "🏛️",  label: "Government",           color: "slate"   },
  commerce:             { emoji: "🛒", label: "Commerce",             color: "orange"  },
  financial_accounting: { emoji: "📒", label: "Financial Accounting", color: "green"   },
  civic_education:      { emoji: "🗳️",  label: "Civic Education",      color: "blue"    },
};

// ═══════════════════════════════════════════════════════════════════
// CURRICULUM GROUPINGS (for UI Organisation)
// ═══════════════════════════════════════════════════════════════════
export const CURRICULUM_GROUPS = {
  "United Kingdom": ["uk_national", "uk_11plus"],
  "United States":  ["us_common_core"],
  "Australia":      ["aus_acara"],
  "International":  ["ib_pyp", "ib_myp"],
  "Nigeria":        ["ng_primary", "ng_jss", "ng_sss"],
};

// ═══════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/** Returns the display label for a grade within a curriculum. */
export function getGradeLabel(curriculum, grade) {
  const curr = CURRICULA[curriculum];
  if (!curr) return `Grade ${grade}`;
  if (curr.alternateLabels?.[grade - 1]) return curr.alternateLabels[grade - 1];
  if (curr.alternateLabel && curr.alternateOffset) {
    return `${curr.alternateLabel} ${grade + curr.alternateOffset}`;
  }
  return `${curr.gradeLabel} ${grade}`;
}

/** Returns all curriculum keys for a given country group name. */
export function getCurriculumsByCountry(country) {
  return (CURRICULUM_GROUPS[country] || []);
}

/** Returns the subject list for a curriculum key. */
export function getSubjectsForCurriculum(curriculum) {
  return SUBJECTS_BY_CURRICULUM[curriculum] || [];
}

/** Returns the full curriculum config object or null. */
export function getCurriculumInfo(curriculum) {
  return CURRICULA[curriculum] || null;
}

/** Returns subject metadata (emoji, label, color) for a subject key. */
export function getSubjectMeta(subject) {
  return SUBJECT_META[subject] || { emoji: "📝", label: subject, color: "slate" };
}

/** Returns all grade × subject combinations for a curriculum — useful for batch generation. */
export function getAllCurriculumCombinations(curriculum) {
  const curr  = CURRICULA[curriculum];
  const subjs = SUBJECTS_BY_CURRICULUM[curriculum] || [];
  if (!curr) return [];
  return curr.grades.flatMap(grade => subjs.map(subject => ({ curriculum, grade, subject })));
}