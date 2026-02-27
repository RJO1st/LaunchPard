// --- BULLETPROOF FISHER-YATES SHUFFLE ---
const shuffle = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// =============================================================
// COMPREHENSION BANK — From 11+ Question bank.docx (Section 1A)
// =============================================================
export const COMPREHENSION_BANK = [
  {
    id: "lost-puppy",
    title: "The Lost Puppy",
    difficulty: "Easy",
    text: `Sarah was walking home from school when she heard a soft whimpering sound coming from behind a hedge. She stopped and peered through the leaves. There, trembling and covered in mud, was a small golden puppy with big brown eyes. The puppy looked up at Sarah hopefully, its tail wagging slightly.

"Oh, you poor thing!" Sarah exclaimed. She noticed the puppy wasn't wearing a collar. She looked around, but there was no one in sight. The street was quiet except for the rustling of autumn leaves.

Sarah knew she couldn't leave the puppy alone. She gently picked it up, feeling its rapid heartbeat against her chest. The puppy snuggled into her arms, seeming to sense that it was now safe. Sarah decided to take the puppy home and ask her parents what to do.

When she arrived home, her mother was surprised but sympathetic. "We should check if anyone has reported a missing puppy," her mother suggested. They called the local animal shelter and checked online lost pet databases. The next day, they received a call from a worried family who had been searching everywhere for their puppy, Max. He had escaped through a gap in their garden fence.

When the family came to collect Max, the little boy who owned him had tears of joy in his eyes. "Thank you so much for finding him!" he said, hugging Max tightly. Sarah felt happy knowing she had helped reunite Max with his family, even though she would miss the little puppy.`,
    questions: [
      { q: "Where did Sarah find the puppy?", opts: ["In a park", "Behind a hedge", "In her garden", "At school"], a: 1, exp: "The text states she heard a whimpering sound 'coming from behind a hedge'." },
      { q: "How do we know the puppy was frightened?", opts: ["It was barking loudly", "It was trembling and whimpering", "It ran away from Sarah", "It bit Sarah's hand"], a: 1, exp: "The words 'trembling' and 'whimpering' are indicators of fear or distress." },
      { q: "What color was the puppy?", opts: ["Black", "Brown", "Golden", "White"], a: 2, exp: "The text describes it as 'a small golden puppy'." },
      { q: "Why couldn't Sarah find the puppy's owner immediately?", opts: ["It was dark outside", "The puppy had no collar", "There were too many people", "She was in a hurry"], a: 1, exp: "Collars typically have ID tags; without one, there was no contact information." },
      { q: "What does the phrase 'tears of joy' tell us about the boy?", opts: ["He was very sad", "He was extremely happy and relieved", "He was angry at Sarah", "He was surprised"], a: 1, exp: "Tears of joy indicate strong positive emotions — relief and happiness that Max was found safe." },
    ]
  },
  {
    id: "world-of-bees",
    title: "The Amazing World of Bees",
    difficulty: "Medium",
    text: `Bees are among the most important insects on our planet, yet many people don't fully appreciate their significance. These industrious creatures do far more than just produce honey; they are essential pollinators responsible for helping plants reproduce. Without bees, many of the fruits, vegetables, and nuts we enjoy would become scarce or even disappear entirely.

A typical honeybee colony consists of three types of bees: the queen, workers, and drones. The queen bee is the largest bee in the hive and her primary role is to lay eggs — up to 2,000 per day during peak season! Worker bees, which are all female, perform numerous tasks including foraging for nectar and pollen, building and maintaining the hive, caring for the young, and protecting the colony. Male bees, called drones, have one main purpose: to mate with a queen.

The process of pollination occurs when bees travel from flower to flower collecting nectar to make honey. As they move between plants, pollen grains stick to their fuzzy bodies and are transferred from one flower to another, enabling the plants to produce seeds and fruit. Scientists estimate that one-third of the food we eat depends on pollination, primarily by bees.

Unfortunately, bee populations have been declining dramatically in recent decades due to various factors including habitat loss, pesticide use, disease, and climate change. This phenomenon, known as Colony Collapse Disorder (CCD), poses a serious threat to global food security.`,
    questions: [
      { q: "What is the primary role of the queen bee?", opts: ["Collecting nectar", "Protecting the hive", "Laying eggs", "Building the hive"], a: 2, exp: "The text states the queen's primary role is to lay eggs, up to 2,000 a day." },
      { q: "How much of our food depends on pollination?", opts: ["One-quarter", "One-third", "One-half", "All of it"], a: 1, exp: "The text states 'one-third of the food we eat depends on pollination'." },
      { q: "What does the word 'industrious' mean?", opts: ["Dangerous", "Hard-working", "Colourful", "Rare"], a: 1, exp: "Industrious means diligent and hard-working — bees work constantly performing many tasks." },
      { q: "What is Colony Collapse Disorder?", opts: ["A type of honey disease", "The dramatic decline in bee populations", "A method of beekeeping", "A type of bee nest"], a: 1, exp: "CCD is the dramatic decline in bee populations due to habitat loss, pesticides, disease, and climate change." },
      { q: "Worker bees are all:", opts: ["Male", "Drones", "Female", "Queens"], a: 2, exp: "The text explicitly states 'Worker bees, which are all female'." },
    ]
  },
  {
    id: "secret-garden",
    title: "The Secret Garden (Extract)",
    difficulty: "Challenging",
    text: `Mary had liked to look at her mother from a distance and she had thought her very pretty, but as she knew very little of her she could scarcely have been expected to love her or to miss her very much when she was gone. She did not miss her at all, in fact, and as she was a self-absorbed child she gave her entire thought to herself, as she had always done. If she had been older she would no doubt have been very anxious at being left alone in the world, but she was very young, and as she had always been taken care of, she supposed she always would be.

What she thought was that she would like to know if she was going to nice people, who would be polite to her and give her her own way as her Ayah and the other native servants had done. She knew that she was not going to stay at the English clergyman's house where she was taken at first. She did not want to stay. The English clergyman was poor and he had five children nearly all the same age and they wore shabby clothes and were always quarrelling and snatching things from each other. Mary hated their untidy bungalow and was so disagreeable to them that after the first day or two nobody would play with her. By the second day they had given her a nickname.

"Mistress Mary, quite contrary," they sang at her. She didn't care, though. She was too proud to care what disagreeable brats called her, though she would have liked to slap them.`,
    questions: [
      { q: "What does 'self-absorbed' mean as used in the passage?", opts: ["Very clean", "Excessively focused on oneself", "Very shy", "Extremely tired"], a: 1, exp: "'Self-absorbed' means preoccupied with one's own interests and concerns." },
      { q: "Why did Mary get the nickname 'Mistress Mary, quite contrary'?", opts: ["She was very kind", "She was difficult and disagreeable", "She loved gardening", "She was very quiet"], a: 1, exp: "'Contrary' means opposing or going against others — it perfectly describes Mary's difficult behaviour." },
      { q: "What evidence shows Mary had been spoiled?", opts: ["She had many toys", "She expected people to give her her own way", "She had expensive clothes", "She had lots of friends"], a: 1, exp: "She expected people 'to give her her own way' as her Ayah and servants had done." },
      { q: "How does Mary actually feel about her nickname, based on her reaction?", opts: ["She is completely unaffected", "She is hurt but hides it behind pride", "She finds it funny", "She is pleased"], a: 1, exp: "Though she claims not to care, wanting to 'slap them' reveals she is hurt — pride masks her true feelings." },
    ]
  },
  {
    id: "industrial-revolution",
    title: "The Industrial Revolution",
    difficulty: "Challenging",
    text: `The Industrial Revolution, which began in Britain in the late 18th century, represents one of the most significant transformations in human history. This period saw a dramatic shift from agrarian, handcraft-based economies to ones dominated by industry and machine manufacturing. The consequences of this revolution extended far beyond the factory walls, fundamentally altering social structures, living conditions, and the very fabric of society.

The revolution was sparked by several key innovations. James Watt's improvements to the steam engine in 1776 provided a reliable source of power that could drive machinery in factories, mills, and eventually locomotives and ships. The textile industry was revolutionised by inventions such as the spinning jenny, water frame, and power loom, which dramatically increased production capacity.

However, the Industrial Revolution was a double-edged sword. While it created enormous wealth and propelled nations toward modernisation, it also brought significant social upheaval. Workers, including children as young as five, endured long hours in dangerous factory conditions for minimal wages. Rapid urbanisation led to overcrowded cities with inadequate sanitation, resulting in frequent outbreaks of disease.`,
    questions: [
      { q: "What does the phrase 'double-edged sword' mean in context?", opts: ["A type of weapon", "Something with both benefits and drawbacks", "A difficult decision", "An expensive tool"], a: 1, exp: "A double-edged sword means something with both positive and negative consequences." },
      { q: "When did James Watt improve the steam engine?", opts: ["1666", "1776", "1876", "1866"], a: 1, exp: "The text states 'James Watt's improvements to the steam engine in 1776'." },
      { q: "What is meant by 'agrarian, handcraft-based economies'?", opts: ["Economies based on trade", "Economies based on farming and hand-made goods", "Industrial economies", "Modern economies"], a: 1, exp: "Context clue: this is contrasted with 'industry and machine manufacturing'." },
      { q: "What word best describes the author's tone toward the Industrial Revolution?", opts: ["Wholly positive", "Wholly negative", "Balanced and analytical", "Confused"], a: 2, exp: "The author presents both 'enormous wealth' and 'significant social upheaval', showing a balanced view." },
    ]
  },
];

// =============================================================
// GRAMMAR BANK — From 11+ Question bank.docx (Section 1B)
// =============================================================
export const GRAMMAR_BANK = [
  // Parts of Speech
  { q: "Identify the part of speech: 'The __quick__ brown fox jumped.'", opts: ["Noun", "Verb", "Adjective", "Adverb"], a: 2, exp: "'Quick' describes the noun 'fox', making it an adjective.", subject: "english", topic: "grammar" },
  { q: "Identify the part of speech: 'She __ran__ to the store.'", opts: ["Noun", "Verb", "Adjective", "Preposition"], a: 1, exp: "'Ran' is an action word — a verb.", subject: "english", topic: "grammar" },
  { q: "Identify the part of speech: 'The cat sat __under__ the table.'", opts: ["Adjective", "Adverb", "Conjunction", "Preposition"], a: 3, exp: "'Under' shows the relationship/position between the cat and the table — a preposition.", subject: "english", topic: "grammar" },
  { q: "Identify the part of speech: 'I like tea __and__ coffee.'", opts: ["Preposition", "Conjunction", "Pronoun", "Adverb"], a: 1, exp: "'And' connects two words/ideas — it is a conjunction.", subject: "english", topic: "grammar" },
  { q: "What tense is used in: 'They were playing football when it rained.'?", opts: ["Present Simple", "Past Continuous", "Past Perfect", "Future Simple"], a: 1, exp: "Was/were + -ing describes an ongoing action in the past — Past Continuous.", subject: "english", topic: "grammar" },
  { q: "What tense is used in: 'I have visited London three times.'?", opts: ["Past Simple", "Present Continuous", "Present Perfect", "Past Perfect"], a: 2, exp: "Have/has + past participle for experience/action with current relevance — Present Perfect.", subject: "english", topic: "grammar" },
  { q: "Which sentence is COMPOUND?", opts: ["The cat sat on the mat.", "Although it rained, we went out.", "I went to the shop, but it was closed.", "When the bell rang, students rushed out."], a: 2, exp: "A compound sentence has two independent clauses joined by a conjunction (but, and, or).", subject: "english", topic: "grammar" },
  { q: "Which sentence is COMPLEX?", opts: ["The dog barked loudly.", "I like pizza and she likes pasta.", "She sings beautifully.", "Because he was tired, he went to bed."], a: 3, exp: "A complex sentence has one independent clause and one dependent clause (because he was tired).", subject: "english", topic: "grammar" },
  // Punctuation
  { q: "Which sentence is correctly punctuated?", opts: ["its a beautiful day today", "It's a beautiful day today.", "Its a beautiful Day today.", "it's A beautiful day today"], a: 1, exp: "Capital letter to start, apostrophe in 'it's' (it is), full stop at end.", subject: "english", topic: "punctuation" },
  { q: "Where does the apostrophe go? 'The childrens toys were scattered.'", opts: ["childrens'", "children's", "childrens", "childs'"], a: 1, exp: "'Children' is an irregular plural — the apostrophe goes before the 's': children's.", subject: "english", topic: "punctuation" },
  // Subject-Verb Agreement
  { q: "Choose the correct verb: 'Everyone ___ finished their work.'", opts: ["have", "has", "were", "are"], a: 1, exp: "'Everyone' is singular and takes a singular verb 'has'.", subject: "english", topic: "grammar" },
  { q: "Choose the correct verb: 'Neither of the boys ___ ready on time.'", opts: ["were", "are", "was", "have been"], a: 2, exp: "'Neither' is singular — it takes a singular verb 'was'.", subject: "english", topic: "grammar" },
  { q: "Choose the correct verb: 'Mathematics ___ my favourite subject.'", opts: ["are", "were", "is", "have been"], a: 2, exp: "'Mathematics' is treated as singular in British English.", subject: "english", topic: "grammar" },
];

// =============================================================
// VOCABULARY BANK — From 11+ Question bank.docx (Section 1C)
// =============================================================
export const VOCAB_BANK = [
  // Synonyms
  { q: "Choose the synonym for: ENORMOUS", opts: ["Tiny", "Huge", "Average", "Weak"], a: 1, exp: "Enormous means extremely large — synonym: huge.", subject: "english", topic: "vocabulary" },
  { q: "Choose the synonym for: CAUTIOUS", opts: ["Brave", "Noisy", "Careful", "Fast"], a: 2, exp: "Being cautious means taking great care — synonym: careful.", subject: "english", topic: "vocabulary" },
  { q: "Choose the synonym for: ANCIENT", opts: ["Modern", "New", "Old", "Fresh"], a: 2, exp: "Ancient means very old — synonym: old.", subject: "english", topic: "vocabulary" },
  { q: "Choose the synonym for: FLOURISH", opts: ["Die", "Thrive", "Wilt", "Decline"], a: 1, exp: "To flourish means to grow or develop in a healthy or vigorous way — synonym: thrive.", subject: "english", topic: "vocabulary" },
  { q: "Choose the synonym for: METICULOUS", opts: ["Careless", "Sloppy", "Careful", "Hasty"], a: 2, exp: "Meticulous means showing great attention to detail — synonym: careful.", subject: "english", topic: "vocabulary" },
  { q: "Choose the synonym for: JOVIAL", opts: ["Sad", "Cheerful", "Grumpy", "Angry"], a: 1, exp: "Jovial means cheerful and friendly — synonym: cheerful.", subject: "english", topic: "vocabulary" },
  { q: "Choose the synonym for: KEEN", opts: ["Uninterested", "Lazy", "Eager", "Bored"], a: 2, exp: "Keen means enthusiastic or eager — synonym: eager.", subject: "english", topic: "vocabulary" },
  { q: "Choose the synonym for: IMMENSE", opts: ["Tiny", "Small", "Vast", "Narrow"], a: 2, exp: "Immense means extremely large — synonym: vast.", subject: "english", topic: "vocabulary" },
  // Antonyms
  { q: "Choose the antonym for: OPTIMISTIC", opts: ["Hopeful", "Positive", "Pessimistic", "Confident"], a: 2, exp: "Pessimistic is the opposite of optimistic.", subject: "english", topic: "vocabulary" },
  { q: "Choose the antonym for: BENIGN", opts: ["Kind", "Gentle", "Harmful", "Mild"], a: 2, exp: "Benign means gentle/harmless; the antonym is harmful.", subject: "english", topic: "vocabulary" },
  { q: "Choose the antonym for: LIBERTY", opts: ["Freedom", "Independence", "Captivity", "Autonomy"], a: 2, exp: "Liberty means freedom; the antonym is captivity.", subject: "english", topic: "vocabulary" },
  { q: "Choose the antonym for: HUMBLE", opts: ["Modest", "Meek", "Arrogant", "Simple"], a: 2, exp: "Humble means modest; the antonym is arrogant.", subject: "english", topic: "vocabulary" },
  // Contextual / Word Completion
  { q: "Choose the best word: 'The scientist's discovery was ___ to understanding climate change.'", opts: ["irrelevant", "insignificant", "crucial", "minor"], a: 2, exp: "Crucial means essential/vitally important — fits the context of a significant discovery.", subject: "english", topic: "vocabulary" },
  { q: "Choose the best word: 'The athlete showed ___ determination in overcoming her injury.'", opts: ["little", "no", "unwavering", "weak"], a: 2, exp: "Unwavering means steady and firm — best describes strong determination.", subject: "english", topic: "vocabulary" },
  { q: "Choose the best word: 'The ancient manuscript was written in ___ handwriting.'", opts: ["legible", "clear", "indecipherable", "neat"], a: 2, exp: "Indecipherable means impossible to read — appropriate for ancient, difficult handwriting.", subject: "english", topic: "vocabulary" },
  { q: "Choose the best word: 'The negotiations reached a(n) ___, with neither side willing to compromise.'", opts: ["agreement", "resolution", "impasse", "settlement"], a: 2, exp: "An impasse is a deadlock — when neither side will budge.", subject: "english", topic: "vocabulary" },
  { q: "Choose the best word: 'The surgeon performed the operation with ___ precision.'", opts: ["careless", "sloppy", "meticulous", "rough"], a: 2, exp: "Meticulous means very careful and precise — ideal for surgical work.", subject: "english", topic: "vocabulary" },
  // Prefixes & Suffixes
  { q: "The prefix 'pre-' in PREHISTORIC means:", opts: ["after", "with", "before", "against"], a: 2, exp: "'Pre-' means before — prehistoric means before recorded history.", subject: "english", topic: "vocabulary" },
  { q: "The prefix 'anti-' in ANTISOCIAL means:", opts: ["for", "with", "against", "before"], a: 2, exp: "'Anti-' means against — antisocial means against social norms.", subject: "english", topic: "vocabulary" },
  { q: "The suffix '-less' in CARELESS means:", opts: ["full of", "without", "able to", "one who"], a: 1, exp: "'-less' means without — careless means without care.", subject: "english", topic: "vocabulary" },
  { q: "The suffix '-ness' in HAPPINESS means:", opts: ["full of", "without", "one who", "state/quality of"], a: 3, exp: "'-ness' indicates a state or quality — happiness is the state of being happy.", subject: "english", topic: "vocabulary" },
  // Figurative Language
  { q: "'Time flies' is an example of:", opts: ["Simile", "Metaphor", "Personification", "Alliteration"], a: 2, exp: "Time is given the human quality of flying — this is personification.", subject: "english", topic: "figurative-language" },
  { q: "'As brave as a lion' is an example of:", opts: ["Metaphor", "Simile", "Personification", "Hyperbole"], a: 1, exp: "A simile makes a comparison using 'as' or 'like'.", subject: "english", topic: "figurative-language" },
  { q: "'I've told you a million times' is an example of:", opts: ["Literal truth", "Understatement", "Hyperbole", "Simile"], a: 2, exp: "Hyperbole is deliberate exaggeration for effect.", subject: "english", topic: "figurative-language" },
  { q: "'The wind whispered through the trees' is an example of:", opts: ["Metaphor", "Simile", "Personification", "Alliteration"], a: 2, exp: "The wind is given the human ability to whisper — personification.", subject: "english", topic: "figurative-language" },
  { q: "'Peter Piper picked a peck of pickled peppers' is an example of:", opts: ["Metaphor", "Simile", "Alliteration", "Personification"], a: 2, exp: "Repetition of the initial 'p' consonant sound is alliteration.", subject: "english", topic: "figurative-language" },
  // Idioms
  { q: "What does 'Under the weather' mean?", opts: ["Outside in rain", "Feeling ill", "Happy", "Sheltered"], a: 1, exp: "'Under the weather' is an idiom meaning feeling unwell or ill.", subject: "english", topic: "vocabulary" },
  { q: "What does 'Barking up the wrong tree' mean?", opts: ["Dog behaviour", "Pursuing the wrong course", "Climbing trees", "Being correct"], a: 1, exp: "This idiom means pursuing a mistaken or misguided course of action.", subject: "english", topic: "vocabulary" },
  { q: "What does 'Spill the beans' mean?", opts: ["Make a mess", "Cook a meal", "Reveal a secret", "Eat quickly"], a: 2, exp: "'Spill the beans' means to reveal secret or confidential information.", subject: "english", topic: "vocabulary" },
  // Homophones
  { q: "Choose the correct homophone: 'The ship sailed across the ___ .'", opts: ["see", "sea", "si", "cea"], a: 1, exp: "'Sea' is the body of water; 'see' is the verb to perceive visually.", subject: "english", topic: "vocabulary" },
  { q: "Choose the correct word: '___ going to the cinema.'", opts: ["Their", "There", "They're", "Thier"], a: 2, exp: "'They're' = they are; 'Their' = belonging to them; 'There' = a place.", subject: "english", topic: "vocabulary" },
  { q: "Choose the correct word: 'She received a great ___ on her outfit.'", opts: ["complement", "compliment", "complemet", "complament"], a: 1, exp: "A 'compliment' is praise; a 'complement' is something that completes something else.", subject: "english", topic: "vocabulary" },
];

// =============================================================
// MATHS BANK — Static questions from 11+ Question bank.docx (Section 2)
// =============================================================
export const MATHS_BANK = [
  // Arithmetic
  { q: "Calculate: 4,567 + 3,892", opts: ["8,349", "8,459", "8,469", "8,559"], a: 1, exp: "4,567 + 3,892 = 8,459. Add units first: 7+2=9, tens: 6+9=15 (carry 1), hundreds: 5+8+1=14 (carry 1), thousands: 4+3+1=8.", subject: "maths", topic: "arithmetic" },
  { q: "Calculate: 12,345 − 6,789", opts: ["5,456", "5,556", "5,646", "6,456"], a: 1, exp: "12,345 − 6,789 = 5,556. Work through each column with borrowing.", subject: "maths", topic: "arithmetic" },
  { q: "Calculate: 45.67 − 23.89", opts: ["21.68", "21.78", "22.88", "21.88"], a: 1, exp: "45.67 − 23.89 = 21.78. Align decimal points then subtract.", subject: "maths", topic: "arithmetic" },
  { q: "Calculate: 1/2 + 1/4 + 1/8", opts: ["3/8", "5/8", "7/8", "6/8"], a: 2, exp: "Convert to eighths: 4/8 + 2/8 + 1/8 = 7/8.", subject: "maths", topic: "fractions" },
  { q: "Calculate: 5/6 − 1/3", opts: ["4/6", "3/6", "1/2", "2/3"], a: 2, exp: "Convert: 5/6 − 2/6 = 3/6 = 1/2.", subject: "maths", topic: "fractions" },
  { q: "Calculate: 2 1/3 + 1 2/3", opts: ["3", "3 1/3", "4", "4 1/3"], a: 2, exp: "2 + 1 + 1/3 + 2/3 = 3 + 3/3 = 3 + 1 = 4.", subject: "maths", topic: "fractions" },
  { q: "Calculate: 3/4 ÷ 1/2", opts: ["3/8", "1 1/4", "1 1/2", "6/4"], a: 2, exp: "Dividing by a fraction: 3/4 × 2/1 = 6/4 = 1 1/2.", subject: "maths", topic: "fractions" },
  { q: "Calculate: 2/3 × 3/4", opts: ["5/7", "6/7", "1/2", "2/4"], a: 2, exp: "(2×3)/(3×4) = 6/12 = 1/2. Simplify by cross-cancelling: 1/1 × 1/2 = 1/2.", subject: "maths", topic: "fractions" },
  { q: "Calculate: 234 × 56", opts: ["13,004", "13,104", "12,904", "13,204"], a: 1, exp: "234 × 56: 234×6=1,404; 234×50=11,700. Total: 13,104.", subject: "maths", topic: "arithmetic" },
  { q: "Calculate: 144 ÷ 0.12", opts: ["12", "120", "1,200", "1,020"], a: 2, exp: "144 ÷ 0.12 = 144 × (100/12) = 14,400/12 = 1,200.", subject: "maths", topic: "arithmetic" },
  { q: "Calculate: 6 ÷ 2/3", opts: ["4", "9", "3", "12"], a: 1, exp: "Dividing by 2/3 is the same as multiplying by 3/2: 6 × 3/2 = 18/2 = 9.", subject: "maths", topic: "fractions" },
  { q: "Calculate: 2 1/4 × 1 1/3", opts: ["2 1/3", "3", "2 3/4", "3 1/4"], a: 1, exp: "Convert: 9/4 × 4/3 = 36/12 = 3.", subject: "maths", topic: "fractions" },
  // Percentages & Ratios
  { q: "What is 15% of 240?", opts: ["24", "36", "30", "40"], a: 1, exp: "10% of 240 = 24; 5% = 12; 15% = 24 + 12 = 36.", subject: "maths", topic: "percentages" },
  { q: "Increase 80 by 25%", opts: ["95", "100", "105", "110"], a: 1, exp: "25% of 80 = 20; 80 + 20 = 100.", subject: "maths", topic: "percentages" },
  { q: "A bag has red and blue marbles in ratio 3:5. There are 24 marbles. How many are red?", opts: ["6", "9", "15", "12"], a: 1, exp: "3+5=8 parts. 24÷8=3 per part. Red = 3×3 = 9.", subject: "maths", topic: "ratio" },
  { q: "Write 0.375 as a fraction in its simplest form.", opts: ["3/8", "375/1000", "3/5", "37/100"], a: 0, exp: "0.375 = 375/1000. Divide by 125: 3/8.", subject: "maths", topic: "fractions" },
  // Geometry
  { q: "What is the area of a rectangle 12cm long and 7cm wide?", opts: ["38 cm²", "74 cm²", "84 cm²", "19 cm²"], a: 2, exp: "Area = length × width = 12 × 7 = 84 cm².", subject: "maths", topic: "geometry" },
  { q: "What is the perimeter of a square with sides of 9cm?", opts: ["18cm", "27cm", "36cm", "81cm"], a: 2, exp: "Perimeter = 4 × side = 4 × 9 = 36cm.", subject: "maths", topic: "geometry" },
  { q: "What is the volume of a cuboid 5cm × 4cm × 3cm?", opts: ["47 cm³", "60 cm³", "24 cm³", "120 cm³"], a: 1, exp: "Volume = length × width × height = 5 × 4 × 3 = 60 cm³.", subject: "maths", topic: "geometry" },
  { q: "A triangle has angles of 65° and 45°. What is the third angle?", opts: ["60°", "70°", "80°", "90°"], a: 1, exp: "Angles in a triangle sum to 180°. 180 − 65 − 45 = 70°.", subject: "maths", topic: "geometry" },
  { q: "What is the area of a triangle with base 10cm and height 6cm?", opts: ["60 cm²", "16 cm²", "30 cm²", "45 cm²"], a: 2, exp: "Area of triangle = ½ × base × height = ½ × 10 × 6 = 30 cm².", subject: "maths", topic: "geometry" },
  // Problem Solving
  { q: "A train travels at 80 km/h. How far does it travel in 2.5 hours?", opts: ["160km", "180km", "200km", "220km"], a: 2, exp: "Distance = speed × time = 80 × 2.5 = 200 km.", subject: "maths", topic: "problem-solving" },
  { q: "If 5 apples cost £2.10, how much do 8 apples cost?", opts: ["£3.24", "£3.36", "£3.60", "£2.80"], a: 1, exp: "1 apple = £2.10 ÷ 5 = £0.42. 8 × £0.42 = £3.36.", subject: "maths", topic: "problem-solving" },
  { q: "A shop sells a coat for £84 after a 30% discount. What was the original price?", opts: ["£112", "£114", "£120", "£108"], a: 2, exp: "£84 = 70% of original. Original = £84 ÷ 0.7 = £120.", subject: "maths", topic: "problem-solving" },
  { q: "Sarah reads 40 pages a day. How many days to finish a 280-page book?", opts: ["5", "6", "7", "8"], a: 2, exp: "280 ÷ 40 = 7 days.", subject: "maths", topic: "problem-solving" },
  { q: "What is the next prime number after 17?", opts: ["18", "19", "21", "23"], a: 1, exp: "18=2×9, not prime; 19 has no factors other than 1 and itself — it is prime.", subject: "maths", topic: "number" },
  { q: "What is the LCM (Lowest Common Multiple) of 4 and 6?", opts: ["24", "12", "8", "6"], a: 1, exp: "Multiples of 4: 4,8,12... Multiples of 6: 6,12... LCM = 12.", subject: "maths", topic: "number" },
  { q: "A car uses 8 litres of petrol per 100km. How many litres for 350km?", opts: ["24L", "28L", "32L", "35L"], a: 1, exp: "350 ÷ 100 × 8 = 3.5 × 8 = 28 litres.", subject: "maths", topic: "problem-solving" },
];

// =============================================================
// VERBAL REASONING BANK — From 11+ Question bank.docx (Section 3)
// =============================================================
export const VERBAL_BANK = [
  // Analogies
  { q: "Dog : Bark :: Cat : ___", opts: ["Fur", "Meow", "Pet", "Whiskers"], a: 1, exp: "Dog makes a bark; a cat makes a meow. (Sound an animal makes)", subject: "verbal", topic: "analogies" },
  { q: "Pen : Write :: Knife : ___", opts: ["Fork", "Spoon", "Cut", "Metal"], a: 2, exp: "A pen is used to write; a knife is used to cut. (Tool : action)", subject: "verbal", topic: "analogies" },
  { q: "Bird : Nest :: Bee : ___", opts: ["Honey", "Hive", "Flower", "Sting"], a: 1, exp: "A bird lives in a nest; a bee lives in a hive. (Animal : home)", subject: "verbal", topic: "analogies" },
  { q: "Author : Novel :: Composer : ___", opts: ["Music", "Symphony", "Orchestra", "Instrument"], a: 1, exp: "An author writes a novel; a composer writes a symphony. (Creator : creation)", subject: "verbal", topic: "analogies" },
  { q: "Acorn : Oak :: Seed : ___", opts: ["Plant", "Soil", "Water", "Root"], a: 0, exp: "An acorn grows into an oak; a seed grows into a plant. (Young : mature form)", subject: "verbal", topic: "analogies" },
  { q: "Lion : Pride :: Fish : ___", opts: ["Water", "School", "Ocean", "Fins"], a: 1, exp: "A group of lions is a pride; a group of fish is a school. (Animal : group name)", subject: "verbal", topic: "analogies" },
  { q: "Compass : Direction :: Scales : ___", opts: ["Fish", "Weight", "Balance", "Heavy"], a: 1, exp: "A compass measures direction; scales measure weight. (Instrument : measurement)", subject: "verbal", topic: "analogies" },
  { q: "Thermometer : Temperature :: Clock : ___", opts: ["Hour", "Time", "Hand", "Alarm"], a: 1, exp: "A thermometer measures temperature; a clock measures time.", subject: "verbal", topic: "analogies" },
  // Sequences
  { q: "What comes next? 2, 4, 8, 16, ___", opts: ["24", "32", "28", "30"], a: 1, exp: "Each term doubles (×2). 16 × 2 = 32.", subject: "verbal", topic: "sequences" },
  { q: "What comes next? 3, 6, 9, 12, ___", opts: ["13", "14", "15", "16"], a: 2, exp: "Counting in 3s. 12 + 3 = 15.", subject: "verbal", topic: "sequences" },
  { q: "What comes next? 1, 4, 9, 16, ___", opts: ["20", "23", "25", "24"], a: 2, exp: "Square numbers: 1², 2², 3², 4², 5² = 25.", subject: "verbal", topic: "sequences" },
  { q: "What comes next? 100, 91, 82, 73, ___", opts: ["60", "64", "63", "65"], a: 1, exp: "Subtracting 9 each time. 73 − 9 = 64.", subject: "verbal", topic: "sequences" },
  { q: "What comes next? 2, 3, 5, 8, 13, ___", opts: ["18", "20", "21", "22"], a: 2, exp: "Fibonacci sequence: each number is the sum of the two before it. 8 + 13 = 21.", subject: "verbal", topic: "sequences" },
  // Word relationships / odd one out
  { q: "Find the odd one out: Apple, Banana, Carrot, Orange", opts: ["Apple", "Banana", "Carrot", "Orange"], a: 2, exp: "Carrot is a vegetable; the others are fruits.", subject: "verbal", topic: "classification" },
  { q: "Find the odd one out: Lion, Tiger, Leopard, Dolphin", opts: ["Lion", "Tiger", "Leopard", "Dolphin"], a: 3, exp: "Dolphin is a marine mammal; the others are big cats.", subject: "verbal", topic: "classification" },
  { q: "Find the odd one out: Square, Circle, Triangle, Cube", opts: ["Square", "Circle", "Triangle", "Cube"], a: 3, exp: "Cube is a 3D shape; the others are 2D shapes.", subject: "verbal", topic: "classification" },
  { q: "Find the odd one out: January, March, June, July", opts: ["January", "March", "June", "July"], a: 2, exp: "June has 30 days; January, March and July have 31.", subject: "verbal", topic: "classification" },
  // Letter codes
  { q: "If A=1, B=2, C=3... what does the code 20-5-1-13 spell?", opts: ["TEAM", "TEAL", "TEEN", "TEST"], a: 0, exp: "T=20, E=5, A=1, M=13 → TEAM.", subject: "verbal", topic: "codes" },
  { q: "Complete the pair: CAT is to DOG as BLACK is to ___", opts: ["COLOUR", "WHITE", "DARK", "CAT"], a: 1, exp: "CAT and DOG are opposites in a common pairing; BLACK and WHITE are opposites.", subject: "verbal", topic: "analogies" },
];

// =============================================================
// MATHS ENGINE: YEAR-SPECIFIC DYNAMIC GENERATION
// =============================================================
export const generateLocalMaths = (year) => {
  let q, ans, exp, opts;

  // Pull a static question from MATHS_BANK occasionally (for variety & difficulty)
  if (Math.random() > 0.6 && MATHS_BANK.length > 0) {
    const item = MATHS_BANK[Math.floor(Math.random() * MATHS_BANK.length)];
    return { ...item };
  }

  if (year === 1) {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 5) + 1;
    ans = a + b;
    q = `If you have ${a} apples and get ${b} more, how many in total?`;
    exp = `We count on from ${a}: making ${ans}.`;
  } else if (year === 2) {
    const a = Math.floor(Math.random() * 20) + 5;
    const b = Math.floor(Math.random() * 10) + 1;
    ans = a + b;
    q = `What is ${a} + ${b}?`;
    exp = `${a} + ${b} = ${ans}.`;
  } else if (year <= 4) {
    const a = Math.floor(Math.random() * 50) + 10;
    const b = Math.floor(Math.random() * 40) + 5;
    ans = a + b;
    q = `Calculate: ${a} + ${b}`;
    exp = `Add the units first, then the tens. ${a} + ${b} = ${ans}.`;
  } else {
    const a = Math.floor(Math.random() * 12) + 2;
    const b = Math.floor(Math.random() * 12) + 2;
    ans = a * b;
    q = `What is ${a} × ${b}?`;
    exp = `${a} groups of ${b}. Times tables are vital for 11+ speed. Answer: ${ans}.`;
  }

  const wrong = [ans + 1, ans - 1, ans + 10].map(String);
  opts = shuffle([String(ans), ...wrong]);
  return { q, opts, a: opts.indexOf(String(ans)), exp, subject: 'maths', topic: 'arithmetic' };
};

// =============================================================
// ENGLISH ENGINE: DRAWS FROM ALL ENGLISH BANKS
// =============================================================
export const generateLocalEnglish = (year) => {
  // Year 1: phonics
  if (year === 1) {
    const words = ["Cat", "Dog", "Sun", "Hat", "Bat", "Cup", "Map", "Pen", "Sit", "Run"];
    const word = words[Math.floor(Math.random() * words.length)];
    const q = `What is the FIRST letter sound in "${word}"?`;
    const ans = word[0];
    const opts = shuffle([ans, "M", "P", "L"]);
    return { q, opts, a: opts.indexOf(ans), exp: `The word "${word}" starts with the '${ans}' sound.`, subject: 'english', topic: 'phonics' };
  }

  // Draw from one of three banks at random
  const bankChoice = Math.random();
  let pool;
  if (bankChoice < 0.5) {
    pool = VOCAB_BANK;
  } else if (bankChoice < 0.75) {
    pool = GRAMMAR_BANK;
  } else {
    pool = VERBAL_BANK.filter(q => q.subject === 'english');
  }

  if (pool.length > 0) {
    const item = pool[Math.floor(Math.random() * pool.length)];
    return { ...item };
  }

  // Fallback
  const item = VOCAB_BANK[Math.floor(Math.random() * VOCAB_BANK.length)];
  return { ...item };
};

// =============================================================
// VERBAL ENGINE: DRAWS FROM VERBAL BANK
// =============================================================
export const generateLocalVerbal = (year) => {
  if (VERBAL_BANK.length > 0 && Math.random() > 0.3) {
    const item = VERBAL_BANK[Math.floor(Math.random() * VERBAL_BANK.length)];
    return { ...item };
  }
  // Dynamic sequence fallback
  const start = Math.floor(Math.random() * 20) + 1;
  const step = Math.floor(Math.random() * 5) + 2;
  const seq = [start, start + step, start + (step * 2)];
  const ans = start + (step * 3);
  const opts = shuffle([String(ans), String(ans + 1), String(ans - step), String(ans + step + 1)]);
  return {
    q: `Next in sequence: ${seq.join(", ")}, ?`,
    opts,
    a: opts.indexOf(String(ans)),
    exp: `The sequence increases by ${step} each time. ${seq[2]} + ${step} = ${ans}.`,
    subject: 'verbal',
    topic: 'sequences'
  };
};

// =============================================================
// REPETITION-PROOF SESSION GENERATOR
// =============================================================
export const generateSessionQuestions = async (year, region, count, proficiency, subject, mistakes = [], previousQs = []) => {
  const allQuestions = [];
  let attempts = 0;

  // Reading Comprehension: serve a full passage for English sessions
  if (subject === 'english' && Math.random() > 0.65) {
    const passage = COMPREHENSION_BANK[Math.floor(Math.random() * COMPREHENSION_BANK.length)];
    return passage.questions.map(q => ({
      ...q,
      subject: 'english',
      topic: 'comprehension',
      passage: passage.text,
      title: passage.title,
      difficulty: passage.difficulty
    }));
  }

  while (allQuestions.length < count && attempts < 500) {
    let newQ;

    if (subject === 'maths') {
      newQ = generateLocalMaths(year);
    } else if (subject === 'english') {
      newQ = generateLocalEnglish(year);
    } else if (subject === 'verbal') {
      newQ = generateLocalVerbal(year);
    } else {
      newQ = generateLocalMaths(year); // Fallback
    }

    if (newQ && !previousQs.includes(newQ.q)) {
      allQuestions.push(newQ);
    }
    attempts++;
  }

  return allQuestions;
};

// =============================================================
// CLAUDE AI FETCH — Sage AI tutor
// =============================================================
export const fetchClaudeResponse = async (prompt, system) => {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system,
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    return data.content[0].text;
  } catch (err) {
    return "Sage says: That's a great effort! ⭐ Keep going!";
  }
};
