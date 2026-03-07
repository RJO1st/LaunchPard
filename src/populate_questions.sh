#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  LAUNCHPARD — Question Bank Population v6                   ║
# ║                                                             ║
# ║  Changes from v5:                                           ║
# ║  • Skip by topic + difficulty_tier combo, not just topic    ║
# ║    count — fills specific tier gaps without over-generating ║
# ║  • TOPIC_POOLS aligned to TOPIC_SEQUENCES slugs from        ║
# ║    learningPathEngine.js so mastery engine lookups match    ║
# ║  • Tier-balanced generation: each batch explicitly requests ║
# ║    a mix of developing / expected / exceeding questions     ║
# ║  • TARGET_PER_TIER — min questions per topic × tier cell    ║
# ║  • existing_tier_count() — per topic+tier gap check         ║
# ║  • Topic slug normalisation on insert (spaces → underscores,║
# ║    lowercased) to prevent mastery engine mismatches         ║
# ║  • Added GENERATE_TIERS env var to target a single tier     ║
# ║    (e.g. GENERATE_TIERS=exceeding to top up hard questions) ║
# ║  • passage_id column set when passage embedded in batch     ║
# ║  • region defaults to curriculum-appropriate value          ║
# ╚══════════════════════════════════════════════════════════════╝
set -uo pipefail

# ─── CONFIG ───────────────────────────────────────────────────────────────────
OPENROUTER_API_KEY="${OPENROUTER_API_KEY:?Set OPENROUTER_API_KEY}"
SUPABASE_URL="${SUPABASE_URL:?Set SUPABASE_URL}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:?Set SUPABASE_SERVICE_KEY}"
SUPABASE_STORAGE_BUCKET="${SUPABASE_STORAGE_BUCKET:-question-images}"
MODEL="${MODEL:-openai/gpt-4o-mini}"
IMAGE_MODEL="${IMAGE_MODEL:-sourceful/riverflow-v2-fast}"
IMAGE_PROVIDER="${IMAGE_PROVIDER:-openrouter}"   # "disabled" skips all images

BATCH_SIZE=10
BATCHES_PER_YEAR=15
TARGET_PER_YEAR=150         # total questions per curriculum/subject/year
TARGET_PER_TOPIC=8          # min questions per topic (any tier) before declaring topic satisfied
TARGET_PER_TIER=3           # min questions per topic × difficulty_tier cell
SLEEP_BETWEEN=2
MAX_RETRIES=3
DEBUG_LOG="populate_v6_debug.txt"

# Only generate these tiers (space-separated). Leave blank for all three.
# Example: GENERATE_TIERS="exceeding" to top-up hard questions only.
GENERATE_TIERS="${GENERATE_TIERS:-developing expected exceeding}"

# ─── SUBJECTS WHERE IMAGES ARE NOT USEFUL ─────────────────────────────────────
NO_IMAGE_SUBJECTS="verbal nvr civic_education religious_studies crk islamic_studies"

# ─── DEFAULT REGION PER CURRICULUM ────────────────────────────────────────────
declare -A CURRICULUM_REGION
CURRICULUM_REGION[uk_national]="GB"
CURRICULUM_REGION[uk_11plus]="GB"
CURRICULUM_REGION[us_common_core]="US"
CURRICULUM_REGION[aus_acara]="AU"
CURRICULUM_REGION[ib_pyp]="GL"
CURRICULUM_REGION[ib_myp]="GL"
CURRICULUM_REGION[ng_primary]="NG"
CURRICULUM_REGION[ng_jss]="NG"
CURRICULUM_REGION[ng_sss]="NG"

# ─── CURRICULA ────────────────────────────────────────────────────────────────
# Format: "Full Name|spelling|min_year:max_year"
declare -A CURRICULA
CURRICULA[uk_national]="UK National Curriculum|british|1:6"
CURRICULA[uk_11plus]="UK 11+ Exam Preparation|british|3:6"
CURRICULA[us_common_core]="US Common Core Standards|american|1:6"
CURRICULA[aus_acara]="Australian Curriculum (ACARA)|australian|1:6"
CURRICULA[ib_pyp]="International Baccalaureate PYP|international|1:6"
CURRICULA[ib_myp]="International Baccalaureate MYP|international|7:11"
CURRICULA[ng_primary]="Nigerian Primary Curriculum|british|1:6"
CURRICULA[ng_jss]="Nigerian JSS Curriculum|british|7:9"
CURRICULA[ng_sss]="Nigerian SSS Curriculum|british|10:12"

# ─── SUBJECTS PER CURRICULUM ──────────────────────────────────────────────────
declare -A SUBJECTS
SUBJECTS[uk_national]="mathematics english verbal nvr science history geography computer_science"
SUBJECTS[uk_11plus]="mathematics english verbal nvr"
SUBJECTS[us_common_core]="mathematics english science social_studies"
SUBJECTS[aus_acara]="mathematics english science hass"
SUBJECTS[ib_pyp]="mathematics english science social_studies"
SUBJECTS[ib_myp]="mathematics english science individuals_and_societies computer_science"
SUBJECTS[ng_primary]="mathematics english basic_science social_studies"
SUBJECTS[ng_jss]="mathematics english basic_science basic_technology social_studies business_studies agricultural_science home_economics religious_studies"
SUBJECTS[ng_sss]="mathematics english physics chemistry biology geography history further_mathematics civic_education accounting ict agricultural_science"

# ─── SUBJECTS THAT NEED COMPREHENSION PASSAGES ────────────────────────────────
PASSAGE_SUBJECTS="english history geography social_studies hass individuals_and_societies civic_education economics government business_studies religious_studies"

# ─── TOPIC POOLS ALIGNED TO TOPIC_SEQUENCES SLUGS ────────────────────────────
# These slugs match learningPathEngine.js TOPIC_SEQUENCES exactly.
# The mastery engine keys scholar_topic_mastery on these values.
# DO NOT rename without also updating learningPathEngine.js.
declare -A TOPIC_POOLS

# mathematics — matches TOPIC_SEQUENCES.mathematics
TOPIC_POOLS[mathematics]="place_value|number_bonds|addition|subtraction|multiplication|division|fractions|decimals|percentages|ratio_and_proportion|algebra_basics|linear_equations|area_and_perimeter|angles_and_shapes|data_handling|probability|pythagoras_theorem|trigonometry|quadratic_equations|simultaneous_equations|circle_theorems|vectors|statistics|calculus"

# english — matches TOPIC_SEQUENCES.english
TOPIC_POOLS[english]="phonics|spelling|grammar|punctuation|vocabulary|sentence_structure|comprehension|inference|vocabulary_in_context|authors_purpose|text_types|creative_writing|literary_devices|critical_analysis|persuasive_writing|essay_writing|poetry_analysis|unseen_text"

# verbal reasoning (11+ style)
TOPIC_POOLS[verbal]="word_analogies|odd_one_out|letter_series|number_series|code_breaking|hidden_words|anagrams|word_connections|compound_words|word_completion|sentence_completion|antonyms|synonyms|classification"

# non-verbal reasoning
TOPIC_POOLS[nvr]="shape_rotation|pattern_completion|reflection|nets_of_shapes|odd_shape_out|sequences|matrices|spatial_reasoning|cube_views|shape_codes"

# science — matches TOPIC_SEQUENCES.science
TOPIC_POOLS[science]="living_organisms|plants_and_animals|food_chains|materials|states_of_matter|forces_basics|cells_and_tissues|human_body|electricity|light_and_sound|chemical_reactions|earth_and_space|genetics|evolution|atomic_structure|waves|forces_and_motion|thermodynamics|ecology"

TOPIC_POOLS[basic_science]="living_things|plants|human_body|simple_machines|environment|health_hygiene|water|food_and_nutrition|weather|soil|air|basic_chemistry|energy|safety"

# biology — matches TOPIC_SEQUENCES.biology
TOPIC_POOLS[biology]="cell_structure|plants|living_organisms|food_chains|human_body_systems|microorganisms|ecosystems|reproduction|genetics|evolution|homeostasis|dna_and_genetics"

# chemistry — matches TOPIC_SEQUENCES.chemistry
TOPIC_POOLS[chemistry]="states_of_matter|mixtures|elements_and_compounds|chemical_reactions|atomic_structure|periodic_table|acids_and_bases|mole_concept|organic_chemistry|rates_of_reaction|equilibrium"

# physics — matches TOPIC_SEQUENCES.physics
TOPIC_POOLS[physics]="forces|energy|light|sound|electricity|waves|motion|electromagnetism|nuclear_physics|quantum_physics|mechanics|thermodynamics"

TOPIC_POOLS[further_mathematics]="matrices|complex_numbers|calculus|vectors|series_and_sequences|proof|polar_coordinates|differential_equations|statistics|mechanics|numerical_methods"

# history — matches TOPIC_SEQUENCES.history
TOPIC_POOLS[history]="ancient_civilisations|local_history|empire_and_colonialism|world_war_1|world_war_2|cold_war|civil_rights|modern_history|causation_and_consequence"

# geography — matches TOPIC_SEQUENCES.geography
TOPIC_POOLS[geography]="maps_and_directions|weather_and_climate|local_area|physical_geography|human_geography|ecosystems|globalisation|development|environmental_issues|urbanisation"

TOPIC_POOLS[social_studies]="government_and_democracy|community|human_rights|world_cultures|economics_basics|environment|history_of_country|national_symbols|citizenship|traditions|law_and_order|global_issues"
TOPIC_POOLS[individuals_and_societies]="migration|culture_and_identity|government_structures|globalisation|economic_systems|conflict_and_peace|human_rights|environmental_issues|ancient_civilisations|power_and_authority"
TOPIC_POOLS[hass]="australian_history|indigenous_culture|geography_of_australia|civics|economics|world_history|sustainability|communities|identity"

TOPIC_POOLS[civic_education]="citizenship|national_values|rights_and_responsibilities|national_symbols|democracy|rule_of_law|conflict_resolution|gender_equality|community_development|human_trafficking|drug_abuse|corruption"
TOPIC_POOLS[basic_technology]="tools_and_materials|simple_machines|drawing_and_design|woodwork|metalwork|electronics_basics|safety|measurement|computer_basics|energy_sources"
TOPIC_POOLS[religious_studies]="creation_and_origins|prayer_and_worship|moral_values_and_ethics|prophets_and_holy_figures|sacred_texts|festivals_and_ceremonies|charity_and_service|family_values|world_religions_overview|faith_and_belief"
TOPIC_POOLS[agricultural_science]="soil_types_and_properties|crop_production|animal_husbandry|farm_tools_and_machinery|pest_and_disease_control|irrigation_and_drainage|fertilisers_and_manures|food_crops_and_cash_crops|poultry_farming|fish_farming|agricultural_marketing|land_clearing_and_preparation"
TOPIC_POOLS[home_economics]="nutrition_and_food_groups|meal_planning|cooking_methods|personal_hygiene|clothing_and_textiles|child_development|family_living|consumer_education|home_management|budgeting|food_preservation|sewing_and_fabric_care"

TOPIC_POOLS[economics]="supply_and_demand|market_structures|macroeconomics|inflation|unemployment|fiscal_policy|monetary_policy|international_trade|economic_development|business_cycles"
TOPIC_POOLS[government]="branches_of_government|constitution|electoral_systems|political_parties|human_rights|international_organisations|federalism|democracy|legislation|judiciary"
TOPIC_POOLS[business_studies]="business_types|marketing|human_resources|operations|finance|entrepreneurship|business_environment|stakeholders|communication|ethics"
TOPIC_POOLS[accounting]="bookkeeping|double_entry|trial_balance|income_statement|balance_sheet|cash_flow|depreciation|bank_reconciliation|partnership_accounts|company_accounts|ratio_analysis|source_documents"

# computer_science — matches TOPIC_SEQUENCES.computer_science (via default fallback)
TOPIC_POOLS[computer_science]="algorithms|programming_concepts|data_representation|networks|cybersecurity|hardware|software|databases|web_design|computational_thinking|binary_numbers|boolean_logic|sorting_algorithms|programming_variables|programming_loops"
TOPIC_POOLS[ict]="word_processing|spreadsheets|presentation_software|internet_safety|email_and_communication|databases|hardware_components|operating_systems|networking_basics|digital_citizenship"
TOPIC_POOLS[digital_technologies]="algorithms_and_programming|data_representation|networks_and_security|digital_systems|computational_thinking|cybersafety|databases_and_storage|visual_programming|web_technologies|robotics"

# ─── HELPERS ──────────────────────────────────────────────────────────────────

subject_wants_image() {
  local subject="$1"
  for s in $NO_IMAGE_SUBJECTS; do [[ "$s" == "$subject" ]] && return 1; done
  return 0
}

# Normalise topic slug: lowercase, spaces and hyphens → underscores
normalise_topic() {
  echo "${1,,}" | tr ' -' '_' | tr -cs 'a-z0-9_' '_' | sed 's/__*/_/g; s/^_//; s/_$//'
}

# Normalise AI-returned difficulty_tier to schema values: developing|expected|exceeding
normalise_tier() {
  case "${1,,}" in
    emerging|beginner|easy|foundation|basic|starter) echo "developing" ;;
    developing)                                       echo "developing" ;;
    secure|intermediate|medium|expected|core)         echo "expected"   ;;
    exceeding|mastery|advanced|hard|challenge)        echo "exceeding"  ;;
    *)                                                echo "developing" ;;
  esac
}

extract_json_array() {
  echo "$1" | python3 -c "
import sys, json, re
txt = sys.stdin.read()
for m in re.finditer(r'\[', txt):
    for end in range(len(txt), m.start(), -1):
        try:
            arr = json.loads(txt[m.start():end])
            if isinstance(arr, list): print(json.dumps(arr)); break
        except: pass
    else: continue
    break
" 2>/dev/null
}

generate_image() {
  local prompt="$1"
  [[ "${IMAGE_PROVIDER}" == "disabled" ]] && echo "" && return
  local response http_code body
  response=$(curl -s -w "\n%{http_code}" \
    "https://openrouter.ai/api/v1/chat/completions" \
    -H "Authorization: Bearer ${OPENROUTER_API_KEY}" \
    -H "Content-Type: application/json" \
    -H "HTTP-Referer: https://launchpard.com" \
    -H "X-Title: LaunchPard Question Generator v6" \
    -d "$(jq -n --arg model "$IMAGE_MODEL" --arg p "$prompt" \
         '{model:$model,messages:[{role:"user",content:$p}],modalities:["image"]}')")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  echo "img ${http_code}: ${prompt:0:50}" >> "${DEBUG_LOG}"
  [[ "$http_code" -ne 200 ]] && { echo "" ; return; }
  echo "$body" | jq -r '.choices[0].message.images[0].image_url.url // empty' 2>/dev/null
}

upload_image_to_supabase() {
  local data_url="$1" dest_path="$2"
  local tmp_file; tmp_file=$(mktemp /tmp/lp_XXXXXX) && mv "$tmp_file" "${tmp_file}.png" && tmp_file="${tmp_file}.png"
  echo "$data_url" | sed 's|^data:image/[^;]*;base64,||' | base64 -d > "$tmp_file" 2>/dev/null
  if [[ ! -s "$tmp_file" ]]; then rm -f "$tmp_file"; echo ""; return; fi
  local resp; resp=$(curl -s -w "\n%{http_code}" -X POST \
    "${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${dest_path}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: image/png" \
    --data-binary "@$tmp_file")
  local code; code=$(echo "$resp" | tail -n1)
  rm -f "$tmp_file"
  [[ "$code" -eq 200 ]] && echo "${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${dest_path}" || echo ""
}

# ─── GAP DETECTION ────────────────────────────────────────────────────────────

# Total count for curriculum/subject/year (any topic, any tier)
existing_count() {
  local curriculum="$1" subject="$2" year="$3"
  local resp
  resp=$(curl -s -D - \
    "${SUPABASE_URL}/rest/v1/question_bank?curriculum=eq.${curriculum}&subject=eq.${subject}&year_level=eq.${year}&select=id&limit=1" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Prefer: count=exact")
  echo "$resp" | grep -i "content-range:" | tr -d '\r' | sed 's|.*/||; s/[^0-9].*//'
}

# Count for a specific topic (any tier)
existing_topic_count() {
  local curriculum="$1" subject="$2" year="$3" topic="$4"
  local resp
  resp=$(curl -s -D - \
    "${SUPABASE_URL}/rest/v1/question_bank?curriculum=eq.${curriculum}&subject=eq.${subject}&year_level=eq.${year}&topic=eq.${topic}&select=id&limit=1" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Prefer: count=exact")
  echo "$resp" | grep -i "content-range:" | tr -d '\r' | sed 's|.*/||; s/[^0-9].*//'
}

# NEW: Count for a specific topic + difficulty_tier cell
# This is the key addition in v6 — lets us fill tier gaps without wasteful duplication
existing_tier_count() {
  local curriculum="$1" subject="$2" year="$3" topic="$4" tier="$5"
  local resp
  resp=$(curl -s -D - \
    "${SUPABASE_URL}/rest/v1/question_bank?curriculum=eq.${curriculum}&subject=eq.${subject}&year_level=eq.${year}&topic=eq.${topic}&difficulty_tier=eq.${tier}&select=id&limit=1" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Prefer: count=exact")
  echo "$resp" | grep -i "content-range:" | tr -d '\r' | sed 's|.*/||; s/[^0-9].*//'
}

# ─── INSERT TRACKER (survives subshell) ───────────────────────────────────────
BATCH_INSERT_FILE=$(mktemp)
echo "0" > "$BATCH_INSERT_FILE"

# ─── GENERATE ONE BATCH ───────────────────────────────────────────────────────
# $6 = target tier ("developing", "expected", "exceeding", or "mixed")
# $7 = topics to focus on (pipe-separated)
generate_questions() {
  local curriculum="$1" curriculum_name="$2" spelling="$3"
  local subject="$4" year="$5" target_tier="$6" focus_topics="$7" batch_num="$8"

  echo "  → Batch ${batch_num} [${target_tier}]: ${curriculum}/${subject}/Y${year}"

  local region="${CURRICULUM_REGION[$curriculum]:-GL}"

  local extra_instructions=""
  local q_type="mcq"
  if [[ " $PASSAGE_SUBJECTS " == *" $subject "* ]]; then
    extra_instructions="Include a 'passage' field (2-3 sentence reading stimulus) with each question."
    q_type="passage"
  fi

  # Build tier instruction for the prompt
  local tier_instruction
  if [[ "$target_tier" == "mixed" ]]; then
    tier_instruction="Mix difficulty_tier evenly: include roughly equal numbers of 'developing', 'expected', and 'exceeding' questions."
  else
    tier_instruction="ALL questions in this batch MUST have difficulty_tier = '${target_tier}'. Do not use any other tier value."
  fi

  # Resolve topic hint
  local topic_hint="varied topics appropriate for Year ${year} ${subject}"
  if [[ -n "$focus_topics" ]]; then
    # Replace pipes with commas for readability in the prompt
    topic_hint="${focus_topics//|/, } — do NOT repeat the same specific fact across questions"
  fi

  local SYSTEM_PROMPT="You are an expert, rigorously accurate educational content creator for ${curriculum_name}.
Use ${spelling} English spelling.
Create multiple-choice questions for Year ${year} students.

ACCURACY IS CRITICAL:
1. Write the question.
2. Work out the correct answer step by step.
3. Write the correct answer as one of 4 options.
4. Set correct_index to the 0-based position of the correct option.
5. DOUBLE-CHECK correct_index matches the right answer before outputting.
6. The explanation must confirm and justify the correct answer.

For maths: always compute before writing options.
NEVER default correct_index to 0 — derive it from the answer.

TIER RULE: ${tier_instruction}
Tier definitions:
  developing  = foundational knowledge, direct recall, simple single-step problems
  expected    = applies concepts, two-step problems, standard curriculum level
  exceeding   = higher-order thinking, multi-step, transfers knowledge to new contexts

Topics available (use EXACT slugs, lowercase_with_underscores): ${topic_hint}

Each question object must have:
- question_text (string)
- options (array of exactly 4 strings)
- correct_index (0-based integer, VERIFIED)
- explanation (string confirming the correct answer)
- topic (string — use the exact slug from the topic list above, e.g. 'fractions' not 'Fractions')
- difficulty_tier (MUST be exactly one of: developing, expected, exceeding)
- visual_hint (string describing a helpful image, or null)
${extra_instructions}

Generate EXACTLY ${BATCH_SIZE} questions on: ${topic_hint}
Return ONLY a JSON array. No markdown, no preamble."

  local USER_PROMPT="Generate ${BATCH_SIZE} ${target_tier} questions for ${subject}, Year ${year}, ${curriculum_name}. Focus: ${topic_hint}. Each question must cover a DISTINCT fact or concept."

  local content="" http_code=0
  for attempt in $(seq 1 $MAX_RETRIES); do
    local response response_body
    response=$(curl -s -w "\n%{http_code}" "https://openrouter.ai/api/v1/chat/completions" \
      -H "Authorization: Bearer ${OPENROUTER_API_KEY}" \
      -H "Content-Type: application/json" \
      -H "HTTP-Referer: https://launchpard.com" \
      -H "X-Title: LaunchPard Question Generator v6" \
      -d "$(jq -n \
        --arg model "$MODEL" --arg system "$SYSTEM_PROMPT" --arg user "$USER_PROMPT" \
        '{model:$model,max_tokens:4000,temperature:0.7,
          messages:[{role:"system",content:$system},{role:"user",content:$user}]}')")
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    if [[ "$http_code" -eq 200 ]]; then
      content=$(echo "$response_body" | jq -r '.choices[0].message.content // empty')
      [[ -n "$content" ]] && break
    fi
    echo "    ✗ Attempt $attempt HTTP $http_code, retrying in 5s…"
    sleep 5
  done

  [[ "$http_code" -ne 200 || -z "$content" ]] && { echo "    ✗ All retries exhausted"; return; }

  local questions_json
  questions_json=$(extract_json_array "$content")
  if [[ -z "$questions_json" ]]; then
    echo "    ✗ Could not extract JSON" >> "$DEBUG_LOG"
    echo "$content" >> "$DEBUG_LOG"
    return
  fi

  local count; count=$(echo "$questions_json" | jq 'length')
  [[ "$count" -eq 0 ]] && { echo "    ⚠️  Empty array"; return; }
  [[ "$count" -lt "$BATCH_SIZE" ]] && echo "    ⚠️  Expected ${BATCH_SIZE}, got ${count}"
  echo "    ✓ ${count} questions (tier: ${target_tier})"

  echo "$questions_json" | jq -c '.[]' | while IFS= read -r question; do
    local q_text q_opts q_idx q_exp q_topic_raw q_topic q_tier q_visual q_passage image_url=""

    q_text=$(echo "$question"    | jq -r '.question_text // empty')
    q_opts=$(echo "$question"    | jq -c '.options // empty')
    q_idx=$(echo "$question"     | jq -r '.correct_index // empty')
    q_exp=$(echo "$question"     | jq -r '.explanation // ""')
    q_topic_raw=$(echo "$question"| jq -r '.topic // "general"')
    q_tier=$(normalise_tier "$(echo "$question" | jq -r '.difficulty_tier // "developing"')")
    q_visual=$(echo "$question"  | jq -r '.visual_hint // empty')
    q_passage=$(echo "$question" | jq -r '.passage // empty')

    # Normalise topic slug to match TOPIC_SEQUENCES keys
    q_topic=$(normalise_topic "$q_topic_raw")

    # Validate
    [[ -z "$q_text" || -z "$q_opts" || "$q_opts" == "[]" ]] && {
      echo "Malformed: $question" >> "$DEBUG_LOG"; continue
    }
    [[ -z "$q_idx" || "$q_idx" == "null" ]] && q_idx=0
    [[ ! "$q_idx" =~ ^[0-9]+$ ]] && q_idx=0
    local opts_len; opts_len=$(echo "$q_opts" | jq 'length')
    [[ "$q_idx" -ge "$opts_len" ]] && { echo "    ✗ correct_index out of range, skipping"; continue; }

    # Image generation — only for visual subjects with a hint
    if [[ "${IMAGE_PROVIDER}" != "disabled" ]] \
       && [[ -n "$q_visual" && "$q_visual" != "null" ]] \
       && subject_wants_image "$subject"; then
      local safe_subj safe_topic uid dest_path gen_url
      safe_subj=$(echo "$subject"  | tr '/' '_')
      safe_topic=$(echo "$q_topic" | tr ' /_' '-')
      uid="$(date +%s)-${RANDOM}${RANDOM}"
      dest_path="${safe_subj}/${year}/${safe_topic}-${uid}.png"
      gen_url=$(generate_image "$q_visual")
      if [[ -n "$gen_url" ]]; then
        image_url=$(upload_image_to_supabase "$gen_url" "$dest_path")
      fi
    fi

    # question_type: "passage" when a passage is included, else "mcq"
    local final_q_type="$q_type"
    if [[ -n "$q_passage" && "$q_passage" != "null" ]]; then
      final_q_type="passage"
    fi

    # Build question_data JSONB
    local q_data
    if [[ -n "$q_passage" && "$q_passage" != "null" ]]; then
      q_data=$(jq -n \
        --arg q "$q_text" --argjson opts "$q_opts" --argjson a "$q_idx" \
        --arg exp "$q_exp" --arg topic "$q_topic" \
        --arg vh "$q_visual" --arg passage "$q_passage" \
        '{q:$q,opts:$opts,a:$a,exp:$exp,topic:$topic,
          visual_hint:(if $vh=="" or $vh=="null" then null else $vh end),
          passage:$passage}')
    else
      q_data=$(jq -n \
        --arg q "$q_text" --argjson opts "$q_opts" --argjson a "$q_idx" \
        --arg exp "$q_exp" --arg topic "$q_topic" \
        --arg vh "$q_visual" \
        '{q:$q,opts:$opts,a:$a,exp:$exp,topic:$topic,
          visual_hint:(if $vh=="" or $vh=="null" then null else $vh end)}')
    fi

    # Insert — region now set from curriculum map
    local result
    result=$(curl -s -o /dev/null -w "%{http_code}" \
      "${SUPABASE_URL}/rest/v1/question_bank" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=minimal" \
      -d "$(jq -n \
        --arg subject "$subject" \
        --argjson year "$year" \
        --arg topic "$q_topic" \
        --arg question_text "$q_text" \
        --argjson options "$q_opts" \
        --argjson correct_index "$q_idx" \
        --arg explanation "$q_exp" \
        --arg curriculum "$curriculum" \
        --argjson grade "$year" \
        --arg region "$region" \
        --arg difficulty_tier "$q_tier" \
        --arg source "ai" \
        --arg question_type "$final_q_type" \
        --arg answer_type "choice" \
        --argjson question_data "$q_data" \
        --arg image_url "$image_url" \
        '{subject:$subject,year_level:$year,topic:$topic,
          question_text:$question_text,options:$options,
          correct_index:$correct_index,explanation:$explanation,
          curriculum:$curriculum,grade:$grade,region:$region,
          difficulty_tier:$difficulty_tier,source:$source,
          question_type:$question_type,answer_type:$answer_type,
          question_data:$question_data,
          image_url:(if $image_url=="" then null else $image_url end)}')")

    if [[ "$result" == "201" ]]; then
      echo -n "."
      local prev; prev=$(cat "$BATCH_INSERT_FILE" 2>/dev/null || echo 0)
      echo $(( prev + 1 )) > "$BATCH_INSERT_FILE"
    else
      echo -n "✗(${result})"
    fi
  done
  echo ""
}

# ─── MAIN LOOP ────────────────────────────────────────────────────────────────
main() {
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  LaunchPard Question Bank Population v6                    ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  echo "Model         : ${MODEL}"
  echo "Image model   : ${IMAGE_MODEL} (provider: ${IMAGE_PROVIDER})"
  echo "Batch size    : ${BATCH_SIZE} × up to ${BATCHES_PER_YEAR} batches/year"
  echo "Target/year   : ${TARGET_PER_YEAR} total | ${TARGET_PER_TOPIC} per topic | ${TARGET_PER_TIER} per topic×tier"
  echo "Active tiers  : ${GENERATE_TIERS}"
  echo "Debug log     : ${DEBUG_LOG}"
  echo ""

  for curriculum in "${!CURRICULA[@]}"; do
    IFS='|' read -r curriculum_name spelling year_range <<< "${CURRICULA[$curriculum]}"
    IFS=':' read -r min_year max_year <<< "$year_range"

    echo ""
    echo "━━━ ${curriculum_name} (${curriculum}) ━━━"

    for subject in ${SUBJECTS[$curriculum]}; do
      for ((year=min_year; year<=max_year; year++)); do

        # ── Step 1: Quick total-count check ─────────────────────────────────
        local local_total
        local_total=$(existing_count "$curriculum" "$subject" "$year")
        local_total="${local_total:-0}"

        # If no topic pool, fall back to simple total-count gate
        if [[ -z "${TOPIC_POOLS[$subject]+x}" ]]; then
          if [[ "$local_total" -ge "$TARGET_PER_YEAR" ]]; then
            echo "  ⏭  ${curriculum}/${subject}/Y${year} — ${local_total} questions (no topic pool, target met)"
            continue
          fi
          local remaining batches_needed
          remaining=$(( TARGET_PER_YEAR - local_total ))
          batches_needed=$(( (remaining + BATCH_SIZE - 1) / BATCH_SIZE ))
          [[ $batches_needed -gt $BATCHES_PER_YEAR ]] && batches_needed=$BATCHES_PER_YEAR
          echo "  ℹ  ${curriculum}/${subject}/Y${year}: ${local_total} existing → ${batches_needed} batch(es) (no pool)"
          for ((batch=1; batch<=batches_needed; batch++)); do
            generate_questions "$curriculum" "$curriculum_name" "$spelling" "$subject" "$year" "mixed" "" "$batch"
            sleep "$SLEEP_BETWEEN"
          done
          continue
        fi

        # ── Step 2: Per-topic × per-tier gap analysis ────────────────────────
        IFS="|" read -ra pool_topics <<< "${TOPIC_POOLS[$subject]}"

        local -a gap_cells=()
        local -a gap_topics_for_display=()

        for t in "${pool_topics[@]}"; do
          local topic_total tc
          topic_total=$(existing_topic_count "$curriculum" "$subject" "$year" "$t")
          topic_total="${topic_total:-0}"

          if [[ "$topic_total" -ge "$TARGET_PER_TOPIC" ]]; then
            # Topic has enough questions overall — check tier balance anyway
            for tier in $GENERATE_TIERS; do
              tc=$(existing_tier_count "$curriculum" "$subject" "$year" "$t" "$tier")
              tc="${tc:-0}"
              if [[ "$tc" -lt "$TARGET_PER_TIER" ]]; then
                gap_cells+=("${t}::${tier}")
              fi
            done
          else
            # Topic is thin overall — add all requested tiers
            for tier in $GENERATE_TIERS; do
              tc=$(existing_tier_count "$curriculum" "$subject" "$year" "$t" "$tier")
              tc="${tc:-0}"
              if [[ "$tc" -lt "$TARGET_PER_TIER" ]]; then
                gap_cells+=("${t}::${tier}")
                gap_topics_for_display+=("$t")
              fi
            done
          fi
        done

        if [[ ${#gap_cells[@]} -eq 0 ]]; then
          echo "  ✅  ${curriculum}/${subject}/Y${year} — all topic×tier cells at or above target"
          continue
        fi

        echo "  ℹ  ${curriculum}/${subject}/Y${year}: ${local_total} total, ${#gap_cells[@]} topic×tier gaps"

        # ── Step 3: Group gap cells by tier and generate targeted batches ────
        for tier in $GENERATE_TIERS; do
          local -a tier_topics=()
          local cell cell_topic cell_tier
          for cell in "${gap_cells[@]}"; do
            IFS="::" read -r cell_topic cell_tier <<< "$cell"
            [[ "$cell_tier" == "$tier" ]] && tier_topics+=("$cell_topic")
          done

          [[ ${#tier_topics[@]} -eq 0 ]] && continue

          local unique_topics
          unique_topics=$(printf '%s\n' "${tier_topics[@]}" | sort -u | tr '\n' '|' | sed 's/|$//')

          local topic_count batches_needed
          topic_count=${#tier_topics[@]}
          batches_needed=$(( (topic_count * TARGET_PER_TIER + BATCH_SIZE - 1) / BATCH_SIZE ))
          [[ $batches_needed -gt $BATCHES_PER_YEAR ]] && batches_needed=$BATCHES_PER_YEAR
          [[ $batches_needed -lt 1 ]] && batches_needed=1

          echo "    [${tier}] ${topic_count} topic(s) need top-up → ${batches_needed} batch(es)"
          echo "    Topics: ${unique_topics//|/, }"

          for ((batch=1; batch<=batches_needed; batch++)); do
            IFS="|" read -ra tier_topic_arr <<< "$unique_topics"
            local pool_size=${#tier_topic_arr[@]}
            local start=$(( (batch - 1) * 3 % pool_size ))
            local -a batch_topics=()
            for ((ti=start; ti<start+3 && ti<pool_size; ti++)); do
              batch_topics+=("${tier_topic_arr[$ti]}")
            done
            local focus; focus=$(IFS="|"; echo "${batch_topics[*]}")

            generate_questions "$curriculum" "$curriculum_name" "$spelling" \
              "$subject" "$year" "$tier" "$focus" "$batch"
            sleep "$SLEEP_BETWEEN"
          done
        done

        unset gap_cells gap_topics_for_display

      done
    done
  done

  local TOTAL_INSERTED
  TOTAL_INSERTED=$(cat "$BATCH_INSERT_FILE" 2>/dev/null || echo 0)
  rm -f "$BATCH_INSERT_FILE"

  echo ""
  echo "═══════════════════════════════════════════════════════════════"
  echo "  Done!"
  echo "  Questions inserted : ${TOTAL_INSERTED}"
  echo "═══════════════════════════════════════════════════════════════"
  echo ""
  echo "NEXT STEPS:"
  echo "  1. Verify topic×tier distribution:"
  echo "     SELECT curriculum, subject, year_level, topic, difficulty_tier, COUNT(*)"
  echo "     FROM question_bank WHERE source='ai'"
  echo "     GROUP BY 1,2,3,4,5 ORDER BY 1,2,3,4,5;"
  echo ""
  echo "  2. Check for schema violations:"
  echo "     SELECT id FROM question_bank"
  echo "     WHERE correct_index >= jsonb_array_length(options)"
  echo "        OR difficulty_tier NOT IN ('developing','expected','exceeding');"
  echo ""
  echo "  3. Check topic slug alignment:"
  echo "     SELECT DISTINCT topic FROM question_bank"
  echo "     WHERE topic NOT IN ("
  echo "       /* paste your TOPIC_SEQUENCES slugs here */"
  echo "     ) AND source='ai';"
  echo ""
  echo "  4. Run backfill_v3.sh BACKFILL_MODE=topic_slugs to normalise"
  echo "     any legacy topic values that don't match TOPIC_SEQUENCES."
}

main