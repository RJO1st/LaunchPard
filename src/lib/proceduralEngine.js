// --- BULLETPROOF FISHER-YATES SHUFFLE ---
const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// --- YEAR-SPECIFIC CURRICULUM GUIDES ---
// This ensures that neither local nor AI generators output advanced content for young students.
export const CURRICULUM = {
  1: { 
    maths: "Addition/subtraction to 20, number bonds, counting to 100, basic 2D/3D shapes. NO multiplication or division. NO volume/area.", 
    english: "Phonics, first letters, basic CVC words (cat, dog, sun), simple punctuation (capital letters, full stops).", 
    verbal: "Simple opposites (hot/cold), matching rhyming words.", 
    nvr: "Repeating simple shapes and colors (ABAB patterns)." 
  },
  2: { 
    maths: "Addition/subtraction to 100, introduction to 2x, 5x, 10x tables, basic fractions (1/2, 1/4), telling time to 15 mins.", 
    english: "Nouns, verbs, adjectives, basic sentence structures.", 
    verbal: "Synonyms, simple compound words (sun + flower).", 
    nvr: "Simple rotations, odd one out." 
  },
  3: { 
    maths: "Times tables up to 8x, 3-digit addition/subtraction, equivalent fractions, money word problems.", 
    english: "Prefixes, suffixes, reading comprehension inference, conjunctions.", 
    verbal: "Analogies, simple letter-number codes.", 
    nvr: "Mirror images, sequential transformations." 
  },
  4: { 
    maths: "Times tables up to 12x, 4-digit addition/subtraction, area/perimeter of rectangles, basic decimals.", 
    english: "Complex sentences, advanced vocabulary, pronouns, fronted adverbials.", 
    verbal: "Number sequences, letter shifts (A->C).", 
    nvr: "Complex spatial reasoning, 2D to 3D mapping." 
  },
  5: { 
    maths: "11+ Standard: Fractions/decimals/percentages, multi-step problems, algebra basics, volume.", 
    english: "11+ Standard: Advanced grammar, spelling rules, nuanced comprehension.", 
    verbal: "11+ Standard: All 21 GL question types (anagrams, logic puzzles).", 
    nvr: "11+ Standard: 3D nets, matrices, spatial logic." 
  },
  6: { 
    maths: "Full 11+ Mock Standard: Advanced reasoning, geometry, probability, ratio.", 
    english: "Full 11+ Mock Standard: Punctuation rules, complex classical texts.", 
    verbal: "Full 11+ Mock Standard.", 
    nvr: "Full 11+ Mock Standard." 
  }
};

// --- COMPREHENSION BANK ---
export const COMPREHENSION_BANK = [
  {
    id: "lost-puppy",
    title: "The Lost Puppy",
    difficulty: "Easy",
    year_range: [1, 2, 3],
    text: "Sarah was walking home from school when she heard a soft whimpering sound coming from behind a hedge. She stopped and peered through the leaves. There, trembling and covered in mud, was a small golden puppy with big brown eyes. The puppy looked up at Sarah hopefully, its tail wagging slightly. Sarah noticed the puppy wasn’t wearing a collar. She gently picked it up, feeling its rapid heartbeat against her chest. The puppy snuggled into her arms, seeming to sense that it was now safe.",
    questions: [
      { q: "Where did Sarah find the puppy?", opts: ["In a park", "Behind a hedge", "In her garden", "At school"], a: 1, exp: "The text states she heard a whimpering sound 'coming from behind a hedge'." },
      { q: "How do we know the puppy was frightened?", opts: ["It was barking", "It was trembling", "It ran away", "It bit Sarah"], a: 1, exp: "Indicators of fear like 'trembling' and 'whimpering' are mentioned in the text." },
      { q: "What color was the puppy?", opts: ["Black", "Brown", "Golden", "White"], a: 2, exp: "The text describes it as a 'small golden puppy'." }
    ]
  },
  {
    id: "world-of-bees",
    title: "The Amazing World of Bees",
    difficulty: "Medium",
    year_range: [4, 5, 6],
    text: "Bees are essential pollinators responsible for helping plants reproduce. A typical honeybee colony consists of three types of bees: the queen, workers, and drones. The queen bee is the largest bee in the hive and her primary role is to lay eggs—up to 2,000 per day! Worker bees perform numerous tasks including foraging for nectar and pollen. Scientists estimate that one-third of the food we eat depends on pollination, primarily by bees.",
    questions: [
      { q: "What is the primary role of the queen bee?", opts: ["Collecting nectar", "Protecting the hive", "Laying eggs", "Mating"], a: 2, exp: "The text states the queen's primary role is to lay eggs, up to 2000 a day." },
      { q: "How much of our food depends on pollination?", opts: ["One-quarter", "One-third", "One-half", "All of it"], a: 1, exp: "The text states 'one-third of the food we eat depends on pollination'." }
    ]
  }
];

// --- MATHS ENGINE: STRICT YEAR-GATING ---
export const generateLocalMaths = (year) => {
  let q, ans, exp, opts;
  const op = Math.random();
  
  if (year === 1) {
    // ONLY addition and subtraction up to 20
    if (op < 0.5) {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      ans = a + b;
      q = `What is ${a} + ${b}?`;
      exp = `Count on from ${a}: add ${b} more to make ${ans}.`;
    } else {
      const a = Math.floor(Math.random() * 10) + 10; // 10 to 19
      const b = Math.floor(Math.random() * 9) + 1;
      ans = a - b;
      q = `What is ${a} - ${b}?`;
      exp = `Count backwards ${b} steps from ${a} to get ${ans}.`;
    }
  } else if (year === 2) {
    // Up to 100, plus 2x, 5x, 10x tables
    if (op < 0.5) {
      const a = Math.floor(Math.random() * 50) + 10;
      const b = Math.floor(Math.random() * 40) + 5;
      ans = a + b;
      q = `Calculate: ${a} + ${b}`;
      exp = `Add the tens and the units together to get ${ans}.`;
    } else {
      const tables = [2, 5, 10];
      const a = tables[Math.floor(Math.random() * tables.length)];
      const b = Math.floor(Math.random() * 10) + 1;
      ans = a * b;
      q = `What is ${a} × ${b}?`;
      exp = `${b} groups of ${a} makes ${ans}.`;
    }
  } else if (year >= 5) {
    // 11+ Standard Multi-step
    const a = Math.floor(Math.random() * 12) + 2;
    const b = Math.floor(Math.random() * 12) + 2;
    ans = a * b;
    q = `What is ${a} × ${b}?`;
    exp = `${a} groups of ${b} equals ${ans}. Knowledge of times tables is vital for 11+ speed.`;
  } else {
    // Years 3 & 4
    const a = Math.floor(Math.random() * 50) + 10;
    const b = Math.floor(Math.random() * 40) + 5;
    ans = a + b;
    q = `Calculate: ${a} + ${b}`;
    exp = `Add the units first, then the tens. ${a} + ${b} = ${ans}.`;
  }

  const wrong = [ans + 1, ans - 1, ans + 10].map(String);
  opts = shuffle([String(ans), ...wrong]);
  return { q, opts, a: opts.indexOf(String(ans)), exp, subject: 'maths' };
};

// --- ENGLISH ENGINE: STRICT YEAR-GATING ---
export const generateLocalEnglish = (year) => {
  if (year === 1) {
    const words = ["Cat", "Dog", "Sun", "Hat", "Bat", "Cup", "Pen"];
    const word = words[Math.floor(Math.random() * words.length)];
    const q = `What is the FIRST letter sound in the word "${word}"?`;
    const ans = word[0];
    const opts = shuffle([ans, "M", "P", "L"]);
    return { q, opts, a: opts.indexOf(ans), exp: `The word "${word}" starts with the '${ans}' sound.`, subject: 'english' };
  } else if (year === 2) {
    const pairs = [["Happy", "Sad"], ["Big", "Small"], ["Hot", "Cold"]];
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const q = `What is the OPPOSITE of ${pair[0]}?`;
    const ans = pair[1];
    const opts = shuffle([ans, "Red", "Fast", "Green"]);
    return { q, opts, a: opts.indexOf(ans), exp: `${pair[0]} and ${pair[1]} are opposites.`, subject: 'english' };
  }
  
  // Year 3-6 Vocabulary
  const vocab = [
    { w: "ENORMOUS", a: "Huge", o: ["Tiny", "Small", "Weak"], ex: "Enormous means extremely large." },
    { w: "CAUTIOUS", a: "Careful", o: ["Brave", "Noisy", "Fast"], ex: "Being cautious means taking great care." }
  ];
  const item = vocab[Math.floor(Math.random() * vocab.length)];
  const opts = shuffle([item.a, ...item.o]);
  return { q: `Choose the synonym for: ${item.w}`, opts, a: opts.indexOf(item.a), exp: item.ex, subject: 'english' };
};

export const generateLocalVerbal = (year) => {
  if (year <= 2) {
    const rhyming = [
      { w: "Cat", a: "Hat", o: ["Dog", "Sun", "Car"] },
      { w: "Tree", a: "Bee", o: ["Leaf", "Wood", "Grass"] }
    ];
    const item = rhyming[Math.floor(Math.random() * rhyming.length)];
    const opts = shuffle([item.a, ...item.o]);
    return { q: `Which word rhymes with "${item.w}"?`, opts, a: opts.indexOf(item.a), exp: `Words rhyme when they have the same ending sound. ${item.w} and ${item.a} rhyme.`, subject: 'verbal' };
  }
  
  // Year 3-6 Logic Sequences
  const start = Math.floor(Math.random() * 20) + 1;
  const step = Math.floor(Math.random() * 5) + 2;
  const seq = [start, start+step, start+(step*2)];
  const ans = start+(step*3);
  const opts = shuffle([String(ans), String(ans+1), String(ans-2), String(ans+step)]);
  return { q: `Find the next number in sequence: ${seq.join(", ")}, ?`, opts, a: opts.indexOf(String(ans)), exp: `The rule is to add ${step} each time.`, subject: 'verbal' };
};

export const generateLocalNVR = (year) => {
  const shapes = ["🔴", "🟦", "🔺", "⭐", "🔶", "🟩"];
  if (year <= 2) {
    const s1 = shapes[Math.floor(Math.random() * shapes.length)];
    let s2 = shapes[Math.floor(Math.random() * shapes.length)];
    while(s2 === s1) s2 = shapes[Math.floor(Math.random() * shapes.length)];
    
    const ans = s1;
    const wrong = shapes.filter(s => s !== s1 && s !== s2).slice(0, 3);
    const opts = shuffle([ans, ...wrong]);
    return { q: `What comes next in the pattern? ${s1} ${s2} ${s1} ${s2} ?`, opts, a: opts.indexOf(ans), exp: "This is an ABAB pattern. It repeats the first two shapes.", subject: 'nvr' };
  }

  // Year 3-6 Odd one out
  const s1 = shapes[Math.floor(Math.random() * shapes.length)];
  let s2 = shapes[Math.floor(Math.random() * shapes.length)];
  while(s2 === s1) s2 = shapes[Math.floor(Math.random() * shapes.length)];
  
  const ans = s2;
  const wrong = shapes.filter(s => s !== s2 && s !== s1).slice(0, 3);
  const opts = shuffle([ans, ...wrong]);
  return { q: `Which shape does not belong? ${s1} ${s1} ${s2} ${s1} ${s1}`, opts, a: opts.indexOf(ans), exp: `All the shapes are ${s1} except for the odd one out, ${s2}.`, subject: 'nvr' };
};

export const generateAIQuestions = async ({ year, region, subject, count, proficiency, previousQuestions, guide }) => {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, region, subject, count, proficiency, previousQuestions, guide })
    });
    if (!response.ok) throw new Error("Generation failed");
    const data = await response.json();
    
    if (!data || !Array.isArray(data.questions)) {
      throw new Error("Malformed AI response format");
    }

    return data.questions.map(q => ({...q, subject}));
  } catch (e) {
    console.error("AI Generation failed, falling back to local procedural bank.");
    return []; 
  }
};

// --- REPETITION-PROOF SESSION GENERATOR ---
export const generateSessionQuestions = async (year, region, count, proficiency, subject, mistakes = [], previousQs = []) => {
  const allQuestions = [];
  let attempts = 0;
  
  const currentGuide = CURRICULUM[year] ? CURRICULUM[year][subject] : "UK 11+ Exam Standard";

  // Reading Comprehension Injector
  if (subject === 'english' && Math.random() > 0.6) {
    const suitablePassages = COMPREHENSION_BANK.filter(p => p.year_range.includes(parseInt(year)));
    if (suitablePassages.length > 0) {
      const passage = suitablePassages[Math.floor(Math.random() * suitablePassages.length)];
      return passage.questions.map(q => ({ ...q, subject: 'english', passage: passage.text, title: passage.title }));
    }
  }

  // Calculate split (20% AI, 80% Local)
  const aiCount = Math.floor(count * 0.20); 
  const localCount = count - aiCount;

  // 1. Ask AI (Passing the strict year guide!)
  if (aiCount > 0) {
    const aiQs = await generateAIQuestions({ year, region, subject, count: aiCount, proficiency, previousQuestions: previousQs, guide: currentGuide });
    allQuestions.push(...aiQs);
  }

  // 2. Fill remainder with Local Generators
  while (allQuestions.length < count && attempts < 500) {
    let newQ;
    if (subject === 'maths') newQ = generateLocalMaths(year);
    else if (subject === 'english') newQ = generateLocalEnglish(year);
    else if (subject === 'verbal') newQ = generateLocalVerbal(year);
    else if (subject === 'nvr') newQ = generateLocalNVR(year);
    else newQ = generateLocalMaths(year); // Fallback mock filler

    // Prevent repetition from previous quests
    if (!previousQs.includes(newQ.q) && !allQuestions.find(existing => existing.q === newQ.q)) {
      allQuestions.push(newQ);
    }
    attempts++;
  }

  return allQuestions.sort(() => Math.random() - 0.5).slice(0, count);
};

export const fetchClaudeResponse = async (prompt, system) => {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 300, system, messages: [{ role: "user", content: prompt }] })
    });
    const data = await response.json();
    return data.content[0].text;
  } catch (err) {
    return "Sage says: That's a great effort! ⭐ Keep going!";
  }
};
