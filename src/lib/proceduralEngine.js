// --- BULLETPROOF FISHER-YATES SHUFFLE ---
const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const generateLocalMaths = (year) => {
  const op = Math.random();
  let q, ans, exp;
  const maxNum = year * 25; 
  if (op < 0.25) {
    const a = Math.floor(Math.random() * maxNum) + (year * 5);
    const b = Math.floor(Math.random() * maxNum) + 1;
    ans = a + b;
    q = `Calculate: ${a} + ${b}`;
    exp = `Add the units, then the tens. ${a} + ${b} = ${ans}.`;
  } else if (op < 0.5) {
    const a = Math.floor(Math.random() * maxNum) + 30;
    const b = Math.floor(Math.random() * a) + 1;
    ans = a - b;
    q = `Calculate: ${a} - ${b}`;
    exp = `Subtract ${b} from ${a} to get ${ans}.`;
  } else if (op < 0.75) {
    const a = Math.floor(Math.random() * (year + 8)) + 2;
    const b = Math.floor(Math.random() * 12) + 2;
    ans = a * b;
    q = `What is ${a} × ${b}?`;
    exp = `${a} groups of ${b} equals ${ans}.`;
  } else {
    const b = Math.floor(Math.random() * (year + 6)) + 2;
    const ansTemp = Math.floor(Math.random() * 12) + 2;
    const a = b * ansTemp;
    ans = ansTemp;
    q = `Divide ${a} by ${b}`;
    exp = `Since ${b} × ${ans} = ${a}, ${a} ÷ ${b} = ${ans}.`;
  }
  const wrong1 = ans + Math.floor(Math.random() * 5) + 1;
  const wrong2 = ans - (Math.floor(Math.random() * 3) + 1);
  const wrong3 = ans + 10;
  const opts = shuffle([String(ans), String(wrong1), String(wrong2), String(wrong3)]);
  return { q, opts, a: opts.indexOf(String(ans)), exp, subject: 'maths' };
};

// --- ROBUST ENGLISH ENGINE ---
const NOUNS = ["lion", "castle", "knight", "ocean", "wizard", "dragon", "village", "shadow", "island", "monster"];
const ADJS = ["fierce", "ancient", "mysterious", "gleaming", "silent", "massive", "swift", "clever", "magical", "golden"];
const VERBS = ["roared", "crumbled", "fought", "crashed", "stood", "whispered", "glowed", "vanished", "soared", "marched"];
const ADVERBS = ["loudly", "gracefully", "slowly", "bravely", "violently", "firmly", "quietly", "suddenly", "quickly", "softly"];

export const generateLocalEnglish = (year) => {
  const type = Math.random();
  let q, ans, exp, wrong;
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const adj = ADJS[Math.floor(Math.random() * ADJS.length)];
  const v = VERBS[Math.floor(Math.random() * VERBS.length)];
  const adv = ADVERBS[Math.floor(Math.random() * ADVERBS.length)];
  const sentence = `The ${adj} ${n} ${v} ${adv}.`;

  if (type < 0.25) {
    q = `Identify the ADJECTIVE in this sentence: "${sentence}"`;
    ans = adj;
    wrong = [n, v, adv];
    exp = `An adjective describes a noun. "${adj}" describes the ${n}.`;
  } else if (type < 0.5) {
    q = `Identify the NOUN in this sentence: "${sentence}"`;
    ans = n;
    wrong = [adj, v, adv];
    exp = `A noun is a person, place, or thing. "${n}" is the thing here.`;
  } else if (type < 0.75) {
    q = `Identify the VERB in this sentence: "${sentence}"`;
    ans = v;
    wrong = [adj, n, adv];
    exp = `A verb is a doing or action word. "${v}" is the action.`;
  } else {
    q = `Identify the ADVERB in this sentence: "${sentence}"`;
    ans = adv;
    wrong = [adj, n, v];
    exp = `An adverb describes how a verb is done. It tells us how the ${n} ${v}.`;
  }
  const opts = shuffle([ans, ...wrong]);
  return { q, opts, a: opts.indexOf(ans), exp, subject: 'english' };
};

// --- UPDATED VERBAL REASONING (TRULY WORD BASED) ---
export const generateLocalVerbal = (year) => {
  const type = Math.random();
  let q, ans, exp, wrong;
  if (type < 0.33) {
    const analogies = [
      { p1: ["Up", "Down"], w: "Left", a: "Right", ex: "Up/Down are opposites, so Left's opposite is Right." },
      { p1: ["Hand", "Glove"], w: "Foot", a: "Sock", ex: "A glove goes on a hand; a sock goes on a foot." },
      { p1: ["Bark", "Dog"], w: "Meow", a: "Cat", ex: "Dogs bark and cats meow." }
    ];
    const item = analogies[Math.floor(Math.random() * analogies.length)];
    q = `${item.p1[0]} is to ${item.p1[1]} as ${item.w} is to... ?`;
    ans = item.a;
    wrong = ["Sky", "Home", "Tree", "Water"].filter(w => w !== ans).slice(0, 3);
    exp = item.ex;
  } else if (type < 0.66) {
    const compounds = [
      { start: "Sun", end: "flower", ex: "Sun + Flower = Sunflower." },
      { start: "Rain", end: "bow", ex: "Rain + Bow = Rainbow." },
      { start: "Book", end: "shelf", ex: "Book + Shelf = Bookshelf." }
    ];
    const item = compounds[Math.floor(Math.random() * compounds.length)];
    q = `Which word completes the compound word: ${item.start} + [ ? ]`;
    ans = item.end;
    wrong = ["light", "drop", "case", "land"].filter(w => w !== ans).slice(0, 3);
    exp = item.ex;
  } else {
    const sets = [
      { set: ["Pencil", "Pen", "Crayon", "Hammer"], a: "Hammer", ex: "Hammer is a tool; others are for writing." },
      { set: ["Car", "Bus", "Bicycle", "House"], a: "House", ex: "House is a building; others are transport." }
    ];
    const item = sets[Math.floor(Math.random() * sets.length)];
    q = `Which of these words is the ODD ONE OUT?`;
    ans = item.a;
    wrong = item.set.filter(w => w !== ans);
    exp = item.ex;
  }
  const opts = shuffle([String(ans), ...wrong.map(String)]);
  return { q, opts, a: opts.indexOf(String(ans)), exp, subject: 'verbal' };
};

// --- ROBUST NON-VERBAL ENGINE ---
export const generateLocalNVR = (year) => {
  const shapes = ["🔴", "🟦", "🔺", "⭐", "🔶", "🟩", "🟪", "🔷", "💠", "⚪"];
  const type = Math.random();
  let q, ans, exp, wrong;
  if (type < 0.5) {
    const s1 = shapes[Math.floor(Math.random() * shapes.length)];
    const s2 = shapes[(shapes.indexOf(s1) + 1) % shapes.length];
    q = `What comes next in the visual sequence? ${s1} ${s2} ${s1} ${s2} ${s1} ?`;
    ans = s2;
    wrong = shapes.filter(s => s !== s1 && s !== s2).slice(0, 3);
    exp = "The pattern alternates between two shapes.";
  } else {
    const s1 = shapes[Math.floor(Math.random() * shapes.length)];
    const s2 = shapes[(shapes.indexOf(s1) + 2) % shapes.length];
    q = `Which shape is the odd one out? ${s1} ${s1} ${s2} ${s1}`;
    ans = s2;
    wrong = shapes.filter(s => s !== s2 && s !== s1).slice(0, 3);
    exp = `All shapes are ${s1} except for ${s2}.`;
  }
  const opts = shuffle([ans, ...wrong]);
  return { q, opts, a: opts.indexOf(ans), exp, subject: 'nvr' };
};

export const generateAIQuestions = async ({ year, region, subject, count, proficiency, previousQuestions }) => {
  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year, region, subject, count, proficiency, previousQuestions })
    });
    if (!response.ok) throw new Error("Generation failed");
    const data = await response.json();
    return data.questions.map(q => ({...q, subject}));
  } catch (e) {
    console.error("AI Generation failed, falling back to local bank.");
    return []; 
  }
};

export const generateSessionQuestions = async (year, region, count, proficiency, subject, mistakes = [], previousQs = []) => {
  const targetCount = subject === "mock" ? 60 : count;
  const mix = subject === "mock" 
    ? [ { s: "maths", n: Math.ceil(targetCount * 0.35) }, { s: "english", n: Math.ceil(targetCount * 0.35) }, { s: "verbal", n: Math.floor(targetCount * 0.15) }, { s: "nvr", n: Math.floor(targetCount * 0.15) } ]
    : [ { s: subject, n: targetCount } ];

  const allQuestions = [];
  for (const { s, n } of mix) {
    const aiCount = Math.floor(n * 0.20); 
    const localCount = n - aiCount;
    if (aiCount > 0) {
      const aiQs = await generateAIQuestions({ year, region, subject: s, count: aiCount, proficiency, previousQuestions: previousQs });
      allQuestions.push(...aiQs);
    }
    const neededLocals = n - (allQuestions.filter(q => q.subject === s).length);
    for (let i = 0; i < neededLocals; i++) {
      if (s === "maths") allQuestions.push(generateLocalMaths(year));
      else if (s === "english") allQuestions.push(generateLocalEnglish(year));
      else if (s === "verbal") allQuestions.push(generateLocalVerbal(year));
      else if (s === "nvr") allQuestions.push(generateLocalNVR(year));
    }
  }
  return shuffle(allQuestions).slice(0, targetCount);
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
    return "Sage says: Great effort! Explaining your logic is how you become a scholar. ⭐";
  }
};