#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║  LAUNCHPARD — Question Bank Population (Claude Haiku)       ║
# ║  Generates ~500 questions per subject/year, including       ║
# ║  comprehension passages and AI-generated images.            ║
# ╚══════════════════════════════════════════════════════════════╝
#
# USAGE:
#   export OPENROUTER_API_KEY="sk-or-v1-..."
#   export SUPABASE_URL="https://xxxxx.supabase.co"
#   export SUPABASE_SERVICE_KEY="eyJ..."
#   export SUPABASE_STORAGE_BUCKET="question-images"   # optional
#   chmod +x populate_questions.sh
#   ./populate_questions.sh

set -uo pipefail  # Note: -e removed so individual batch failures don't kill the whole run

# ─── CONFIG ───────────────────────────────────────────────────────────────────
OPENROUTER_API_KEY="${OPENROUTER_API_KEY:?Set OPENROUTER_API_KEY}"
SUPABASE_URL="${SUPABASE_URL:?Set SUPABASE_URL}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:?Set SUPABASE_SERVICE_KEY}"
SUPABASE_STORAGE_BUCKET="${SUPABASE_STORAGE_BUCKET:-question-images}"
MODEL="openai/gpt-4o-mini"          # ✅ reliable for structured output
# fal.ai model slug
# Together AI model (fallback option)
BATCH_SIZE=10
BATCHES_PER_YEAR=15
SLEEP_BETWEEN=2
MAX_RETRIES=3
GENERATE_IMAGES=true
DEBUG_LOG="debug_log.txt"

# ─── CURRICULA ────────────────────────────────────────────────────────────────
declare -A CURRICULA
CURRICULA[uk_national]="UK National Curriculum|british|1:6"
CURRICULA[uk_11plus]="UK 11+ Exam Preparation|british|3:6"
CURRICULA[us_common_core]="US Common Core Standards|american|1:6"
CURRICULA[aus_acara]="Australian Curriculum (ACARA)|australian|1:6"
CURRICULA[ib_pyp]="International Baccalaureate PYP|international|1:6"
CURRICULA[ng_primary]="Nigerian Primary Curriculum|nigerian|1:6"
CURRICULA[ng_jss]="Nigerian JSS Curriculum|nigerian|7:9"
CURRICULA[ng_sss]="Nigerian SSS Curriculum|nigerian|10:12"

# ─── SUBJECTS PER CURRICULUM ─────────────────────────────────────────────────
declare -A SUBJECTS
SUBJECTS[uk_national]="maths english verbal nvr science history geography"
SUBJECTS[uk_11plus]="maths english verbal nvr"
SUBJECTS[us_common_core]="maths english science social_studies"
SUBJECTS[aus_acara]="maths english science hass"
SUBJECTS[ib_pyp]="maths english science social_studies"
SUBJECTS[ng_primary]="maths english basic_science social_studies"
SUBJECTS[ng_jss]="maths english basic_science basic_technology social_studies business_studies"
SUBJECTS[ng_sss]="maths english physics chemistry biology geography history further_mathematics civic_education"

# ─── SUBJECTS THAT SHOULD INCLUDE COMPREHENSION PASSAGES ──────────────────────
PASSAGE_SUBJECTS="english history geography social_studies hass civic_education economics government business_studies"

# ─── TOPIC POOLS PER SUBJECT (rotated per batch to prevent repetition) ────────
declare -A TOPIC_POOLS
TOPIC_POOLS[maths]="addition|subtraction|multiplication|division|fractions|decimals|percentages|ratio|algebra|geometry|area|perimeter|volume|angles|statistics|probability|number_patterns|place_value|rounding|negative_numbers|time|money|coordinates|symmetry"
TOPIC_POOLS[english]="inference|vocabulary|grammar_nouns|grammar_verbs|grammar_adjectives|punctuation|sentence_structure|reading_comprehension|figurative_language|poetry|narrative_writing|persuasive_writing|spelling|synonyms|antonyms|clauses|tense|active_passive|speech_marks|paragraphing"
TOPIC_POOLS[verbal]="word_analogies|odd_one_out|letter_series|number_series|code_breaking|hidden_words|anagrams|word_connections|compound_words|word_completion|sentence_completion|antonyms|synonyms|classification"
TOPIC_POOLS[nvr]="shape_rotation|pattern_completion|reflection|nets_of_shapes|odd_shape_out|sequences|matrices|spatial_reasoning|cube_views|shape_codes"
TOPIC_POOLS[science]="plants|animals|food_chains|habitats|materials|forces|electricity|light|sound|earth_and_space|human_body|health|water_cycle|rocks_and_soils|changing_states|magnets"
TOPIC_POOLS[basic_science]="living_things|plants_and_animals|human_body|simple_machines|environment|health_hygiene|water|food_and_nutrition|weather|soil|air|basic_chemistry|energy|safety"
TOPIC_POOLS[history]="ancient_civilisations|medieval_britain|tudors|world_wars|victorian_era|civil_rights|empire_and_colonialism|revolutions|ancient_egypt|ancient_greece|cold_war|industrial_revolution|prehistoric_britain|slavery|modern_history"
TOPIC_POOLS[geography]="map_skills|rivers|mountains|climate_zones|weather_and_climate|population|settlements|uk_regions|world_continents|natural_disasters|rainforests|oceans|biomes|sustainability|trade|migration"
TOPIC_POOLS[social_studies]="government_and_democracy|community|human_rights|world_cultures|economics_basics|environment|history_of_country|national_symbols|citizenship|traditions|law_and_order|global_issues"
TOPIC_POOLS[hass]="australian_history|indigenous_culture|geography_of_australia|civics|economics|world_history|sustainability|communities|identity"
TOPIC_POOLS[physics]="mechanics|forces_and_motion|energy_types|waves|electricity|magnetism|light_and_optics|thermodynamics|nuclear|pressure|momentum|gravitation|circular_motion|simple_harmonic_motion"
TOPIC_POOLS[chemistry]="atomic_structure|periodic_table|bonding|reactions|acids_and_bases|mole_concept|organic_chemistry|electrolysis|industrial_chemistry|gases|solutions|oxidation_reduction|chemical_equilibrium"
TOPIC_POOLS[biology]="cell_biology|genetics|evolution|ecology|human_physiology|plant_biology|reproduction|homeostasis|immune_system|nutrition|respiration|photosynthesis|nervous_system|endocrine_system"
TOPIC_POOLS[further_mathematics]="matrices|complex_numbers|calculus|vectors|series_and_sequences|proof|polar_coordinates|differential_equations|statistics|mechanics|numerical_methods"
TOPIC_POOLS[economics]="supply_and_demand|market_structures|macroeconomics|inflation|unemployment|fiscal_policy|monetary_policy|international_trade|economic_development|business_cycles"
TOPIC_POOLS[government]="branches_of_government|constitution|electoral_systems|political_parties|human_rights|international_organisations|federalism|democracy|legislation|judiciary"
TOPIC_POOLS[commerce]="business_formation|trade|banking|insurance|advertising|consumer_rights|warehousing|transportation|entrepreneurship|profit_and_loss"
TOPIC_POOLS[financial_accounting]="bookkeeping|trial_balance|income_statement|balance_sheet|cash_flow|depreciation|accounts_receivable|payroll|ratio_analysis|auditing"
TOPIC_POOLS[business_studies]="business_types|marketing|human_resources|operations|finance|entrepreneurship|business_environment|stakeholders|communication|ethics"
TOPIC_POOLS[basic_technology]="tools_and_materials|simple_machines|drawing_and_design|woodwork|metalwork|electronics_basics|safety|measurement|computer_basics|energy_sources"
TOPIC_POOLS[civic_education]="citizenship|national_values|rights_and_responsibilities|national_symbols|democracy|rule_of_law|conflict_resolution|gender_equality|community_development|human_trafficking"
TOPIC_POOLS[computing]="algorithms|programming_concepts|data_representation|networks|cybersafety|hardware|software|databases|web_design|computational_thinking"

# ─── FUNCTION: Extract JSON array from messy AI response ──────────────────────
extract_json_array() {
  local input="$1"
  # Remove markdown fences
  local cleaned=$(echo "$input" | sed -E 's/^```json//g; s/^```//g; s/```$//g; s/^[[:space:]]*//; s/[[:space:]]*$//')
  # Try direct parse
  if echo "$cleaned" | jq -e '. | type == "array"' >/dev/null 2>&1; then
    echo "$cleaned"
    return 0
  fi
  # Fallback: grep for array
  local extracted=$(echo "$cleaned" | grep -o '\[.*\]' | tr -d '\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  if [ -n "$extracted" ] && echo "$extracted" | jq empty 2>/dev/null; then
    echo "$extracted"
    return 0
  fi
  return 1
}

# ─── FUNCTION: Generate an image from a prompt ────────────────────────────────
# Supports: fal.ai (default) | Together AI | disabled

# ─── IMAGE GENERATION via OpenRouter chat completions ────────────────────────
# Uses modalities:["image"] — no separate API key needed, same OPENROUTER_API_KEY
# Model options (set IMAGE_MODEL env var):
#   google/gemini-2.5-flash-image-preview  — good quality, cheapest (~$0.002/img)
#   black-forest-labs/flux.2-pro           — highest quality, more expensive
IMAGE_MODEL="${IMAGE_MODEL:-google/gemini-2.5-flash-image-preview}"

generate_image() {
  local prompt="$1"
  local http_code body response

  response=$(curl -s -w "\n%{http_code}" \
    "https://openrouter.ai/api/v1/chat/completions" \
    -H "Authorization: Bearer ${OPENROUTER_API_KEY}" \
    -H "Content-Type: application/json" \
    -H "HTTP-Referer: https://launchpard.com" \
    -H "X-Title: LaunchPard Image Generator" \
    -d "$(jq -n \
      --arg model "$IMAGE_MODEL" \
      --arg prompt "$prompt" \
      '{
        model: $model,
        messages: [{ role: "user", content: $prompt }],
        modalities: ["image"]
      }')")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  echo "img $http_code: ${prompt:0:50}" >> "${DEBUG_LOG:-/dev/null}"

  if [[ "$http_code" -ne 200 ]]; then
    echo "    ⚠️  Image generation HTTP $http_code" >&2
    echo ""; return
  fi

  # Response content is an array — find the image_url entry
  local data_url
  data_url=$(echo "$body" | jq -r '
    .choices[0].message.content
    | if type == "array" then
        .[] | select(.type == "image_url") | .image_url.url
      else
        empty
      end
  ' 2>/dev/null | head -1)

  if [[ -z "$data_url" ]]; then
    echo "    ⚠️  No image in response" >&2
    echo ""; return
  fi

  echo "$data_url"
}

upload_image_to_supabase() {
  local data_url="$1" dest_path="$2"
  local tmp_file; tmp_file=$(mktemp --suffix=.png)

  # Strip data:image/png;base64, prefix and decode
  echo "$data_url" | sed 's|^data:image/[^;]*;base64,||' | base64 -d > "$tmp_file" 2>/dev/null

  if [[ ! -s "$tmp_file" ]]; then
    echo "    ⚠️  base64 decode failed" >&2
    rm -f "$tmp_file"; echo ""; return
  fi

  local resp; resp=$(curl -s -w "\n%{http_code}" -X POST \
    "${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${dest_path}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: image/png" \
    --data-binary "@$tmp_file")

  local code; code=$(echo "$resp" | tail -n1)
  rm -f "$tmp_file"

  if [[ "$code" -eq 200 ]]; then
    echo "${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${dest_path}"
  else
    echo "    ⚠️  Storage upload HTTP $code" >&2
    echo ""
  fi
}


# ─── GENERATE FUNCTION (with retries and image generation) ────────────────────
generate_questions() {
  local curriculum="$1"
  local curriculum_name="$2"
  local spelling="$3"
  local subject="$4"
  local year="$5"
  local batch_num="$6"

  echo "  → Generating batch ${batch_num}/${BATCHES_PER_YEAR}: ${curriculum} / ${subject} / Year ${year}"

  local extra_instructions=""
  if [[ " $PASSAGE_SUBJECTS " == *" $subject "* ]]; then
    extra_instructions="Include a 'passage' field (short reading passage) with each question."
  fi

  # Compute topic_hint: rotate through topic pool so each batch covers different areas
  local topic_hint="varied topics appropriate for Year ${year} ${subject}"
  if [[ -n "${TOPIC_POOLS[$subject]+x}" ]]; then
    IFS="|" read -ra all_topics <<< "${TOPIC_POOLS[$subject]}"
    local pool_size=${#all_topics[@]}
    local start_idx=$(( (batch_num - 1) % pool_size ))
    local end_idx=$(( start_idx + 3 ))
    local batch_topics=()
    for ((ti=start_idx; ti<end_idx && ti<pool_size; ti++)); do
      batch_topics+=("${all_topics[$ti]}")
    done
    topic_hint=$(IFS=", "; echo "${batch_topics[*]}")
    topic_hint="${topic_hint} — do NOT repeat questions about the same specific fact"
  fi

  local SYSTEM_PROMPT="You are an expert, rigorously accurate educational content creator for ${curriculum_name}.
Use ${spelling} English spelling.
Create multiple-choice questions for Year ${year} students.

ACCURACY IS CRITICAL — FOLLOW THIS EXACTLY:
1. Write the question.
2. Work out the correct answer independently, step by step.
3. Write the correct answer as one of the 4 options.
4. Set correct_index to the 0-based position of that answer in the options array.
5. DOUBLE-CHECK: re-read your question, re-derive the answer, and confirm correct_index points to the right option.
6. The explanation MUST state and justify the correct answer — never contradict it.

For maths: always compute the result before writing options.
For science/facts: only include answers you are certain are true.
NEVER set correct_index=0 by default — derive it from the answer.

Each question object must have these exact fields:
- question_text (string)
- options (array of exactly 4 strings, ONE of which is definitively correct)
- correct_index (integer, 0-based index of the VERIFIED correct option)
- explanation (string that CONFIRMS and JUSTIFIES the correct answer)
- topic (string, e.g., 'subtraction')
- difficulty_tier (one of: emerging, developing, secure, mastery)
- visual_hint (string describing a helpful educational image, or null)
${extra_instructions}

You must generate EXACTLY ${BATCH_SIZE} questions on VARIED topics: ${topic_hint}
Return ONLY a JSON array. No markdown, no preamble, no explanation outside the JSON."

  local USER_PROMPT="Generate ${BATCH_SIZE} questions for ${subject}, Year ${year}, ${curriculum_name}. Focus on: ${topic_hint}. Each question must be on a DISTINCT fact or concept. Verify every correct_index before outputting."

  # Call OpenRouter with retries
  local response response_body content="" http_code=0
  for attempt in $(seq 1 $MAX_RETRIES); do
    response=$(curl -s -w "\n%{http_code}" "https://openrouter.ai/api/v1/chat/completions" \
      -H "Authorization: Bearer ${OPENROUTER_API_KEY}" \
      -H "Content-Type: application/json" \
      -H "HTTP-Referer: https://launchpard.com" \
      -H "X-Title: LaunchPard Question Generator" \
      -d "$(jq -n \
        --arg model "$MODEL" \
        --arg system "$SYSTEM_PROMPT" \
        --arg user "$USER_PROMPT" \
        '{
          model: $model,
          max_tokens: 4000,
          temperature: 0.7,
          messages: [
            { role: "system", content: $system },
            { role: "user", content: $user }
          ]
        }'
      )")

    http_code=$(echo "$response" | tail -n1)
    local response_body
    response_body=$(echo "$response" | sed '$d')

    if [[ "$http_code" -eq 200 ]] && [[ -n "$response_body" ]]; then
      # Extract the actual message content from the OpenRouter envelope
      content=$(echo "$response_body" | jq -r '.choices[0].message.content // empty')
      if [ -n "$content" ]; then
        break
      else
        echo "    ✗ Attempt $attempt: HTTP 200 but no message content. Retrying in 5s..."
        sleep 5
      fi
    else
      echo "    ✗ Attempt $attempt failed (HTTP $http_code). Retrying in 5s..."
      sleep 5
    fi
  done

  if [[ "$http_code" -ne 200 ]] || [[ -z "$content" ]]; then
    echo "    ✗ All retries exhausted, skipping"
    return
  fi

  # Extract JSON array
  local questions_json
  questions_json=$(extract_json_array "$content")
  if [ -z "$questions_json" ]; then
    echo "    ✗ Could not extract JSON. Full response saved to $DEBUG_LOG"
    echo "--- Response ---" >> "$DEBUG_LOG"
    echo "$content" >> "$DEBUG_LOG"
    echo "----------------" >> "$DEBUG_LOG"
    return
  fi

  # Validate count
  local count
  count=$(echo "$questions_json" | jq 'length')
  if [ "$count" -eq 0 ]; then
    echo "    ⚠️ Empty array, skipping"
    return
  fi

  if [ "$count" -lt "$BATCH_SIZE" ]; then
    echo "    ⚠️ Expected ${BATCH_SIZE}, got ${count}. Using anyway."
    echo "Low count response saved to $DEBUG_LOG"
    echo "--- Low count (${count}) for ${curriculum}/${subject}/Y${year} ---" >> "$DEBUG_LOG"
    echo "$content" >> "$DEBUG_LOG"
    echo "----------------------------------------" >> "$DEBUG_LOG"
  fi
  echo "    ✓ Got ${count} questions"

  # Process each question
  echo "$questions_json" | jq -c '.[]' | while IFS= read -r question; do
    local q_text q_opts q_idx q_exp q_topic q_tier q_visual q_passage image_url

    q_text=$(echo "$question" | jq -r '.question_text // empty')
    q_opts=$(echo "$question" | jq -c '.options // empty')
    q_idx=$(echo "$question" | jq -r '.correct_index // empty')
    q_exp=$(echo "$question" | jq -r '.explanation // ""')
    q_topic=$(echo "$question" | jq -r '.topic // "general"')
    q_tier=$(echo "$question" | jq -r '.difficulty_tier // "developing"')
    q_visual=$(echo "$question" | jq -r '.visual_hint // empty')
    q_passage=$(echo "$question" | jq -r '.passage // empty')

    # Validate essentials
    if [ -z "$q_text" ] || [ -z "$q_opts" ] || [ "$q_opts" = "[]" ]; then
      echo "    ⚠️ Skipping question: missing text or options"
      # Log the malformed question
      echo "Malformed question: $question" >> "$DEBUG_LOG"
      continue
    fi

    # Ensure correct_index is a number
    if [ -z "$q_idx" ] || [ "$q_idx" = "null" ]; then
      echo "    ⚠️ Missing correct_index, defaulting to 0"
      q_idx=0
    fi
    if ! [[ "$q_idx" =~ ^[0-9]+$ ]]; then
      echo "    ⚠️ Invalid correct_index '$q_idx', defaulting to 0"
      q_idx=0
    fi

    local opts_length=$(echo "$q_opts" | jq 'length')
    if [ "$q_idx" -lt 0 ] || [ "$q_idx" -ge "$opts_length" ]; then
      echo "    ✗ correct_index ${q_idx} out of range (0-$((opts_length-1))), skipping"
      continue
    fi

    # Generate image if visual_hint exists and feature enabled
    image_url=""
    if [[ "$GENERATE_IMAGES" == "true" ]] && [ -n "$q_visual" ] && [ "$q_visual" != "null" ]; then
      echo "    🖼️ Generating image for: $q_visual"
      local timestamp=$(date +%s)
      local safe_subject=$(echo "$subject" | tr '/' '_')
      local safe_topic=$(echo "$q_topic" | tr ' ' '_' | tr '/' '_')
      local uid="${timestamp}-${RANDOM}${RANDOM}"  # unique even within same second
      local dest_path="${safe_subject}/${year}/${safe_topic}-${uid}.png"

      local gen_url=$(generate_image "$q_visual")
      if [ -n "$gen_url" ]; then
        image_url=$(upload_image_to_supabase "$gen_url" "$dest_path")
        if [ -n "$image_url" ]; then
          echo "    ✅ Image uploaded: $image_url"
        else
          echo "    ⚠️ Image upload failed"
        fi
      else
        echo "    ⚠️ Image generation failed"
      fi
    fi

    # Build question_data JSON (include passage if present)
    local q_data
    if [ -n "$q_passage" ] && [ "$q_passage" != "null" ]; then
      q_data=$(jq -n \
        --arg q "$q_text" \
        --argjson opts "$q_opts" \
        --argjson a "$q_idx" \
        --arg exp "$q_exp" \
        --arg topic "$q_topic" \
        --arg visual_hint "$q_visual" \
        --arg passage "$q_passage" \
        '{q: $q, opts: $opts, a: $a, exp: $exp, topic: $topic, visual_hint: (if $visual_hint == "" or $visual_hint == "null" then null else $visual_hint end), passage: $passage}')
    else
      q_data=$(jq -n \
        --arg q "$q_text" \
        --argjson opts "$q_opts" \
        --argjson a "$q_idx" \
        --arg exp "$q_exp" \
        --arg topic "$q_topic" \
        --arg visual_hint "$q_visual" \
        '{q: $q, opts: $opts, a: $a, exp: $exp, topic: $topic, visual_hint: (if $visual_hint == "" or $visual_hint == "null" then null else $visual_hint end)}')
    fi

    # Insert via Supabase REST API
    local insert_result
    insert_result=$(curl -s -o /dev/null -w "%{http_code}" \
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
        --arg region "GL" \
        --arg difficulty_tier "$q_tier" \
        --arg source "ai" \
        --argjson question_data "$q_data" \
        --arg image_url "$image_url" \
        '{
          subject: $subject,
          year_level: $year,
          topic: $topic,
          question_text: $question_text,
          options: $options,
          correct_index: $correct_index,
          explanation: $explanation,
          curriculum: $curriculum,
          grade: $grade,
          region: $region,
          difficulty_tier: $difficulty_tier,
          source: $source,
          question_data: $question_data,
          question_type: "mcq",
          answer_type: "choice",
          image_url: (if $image_url == "" then null else $image_url end)
        }'
      )")

    if [ "$insert_result" = "201" ]; then
      echo -n "."
    else
      echo -n "✗(${insert_result})"
    fi
  done
  echo "" # newline after dots
}

# ─── MAIN LOOP ────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  LaunchPard Question Bank Population (Claude Haiku)        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Model: ${MODEL}"
echo "Image Provider: ${IMAGE_PROVIDER:-fal} (enabled: ${GENERATE_IMAGES})"
echo "Batch size: ${BATCH_SIZE} × ${BATCHES_PER_YEAR} batches = $((BATCH_SIZE * BATCHES_PER_YEAR)) per subject/year"
echo "Debug log: $DEBUG_LOG"
echo ""

TOTAL_GENERATED=0

for curriculum in "${!CURRICULA[@]}"; do
  IFS='|' read -r curriculum_name spelling year_range <<< "${CURRICULA[$curriculum]}"
  IFS=':' read -r min_year max_year <<< "$year_range"

  echo ""
  echo "━━━ ${curriculum_name} (${curriculum}) ━━━"

  subjects="${SUBJECTS[$curriculum]}"

  for subject in $subjects; do
    for ((year=min_year; year<=max_year; year++)); do
      for ((batch=1; batch<=BATCHES_PER_YEAR; batch++)); do
        generate_questions "$curriculum" "$curriculum_name" "$spelling" "$subject" "$year" "$batch"
        TOTAL_GENERATED=$((TOTAL_GENERATED + BATCH_SIZE))
        sleep "$SLEEP_BETWEEN"
      done
    done
  done
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Done! Approximately ${TOTAL_GENERATED} questions generated."
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "NEXT STEPS:"
echo "  1. Verify a sample in Supabase dashboard:"
echo "     SELECT question_text, options, correct_index, image_url"
echo "     FROM question_bank WHERE source = 'ai'"
echo "     ORDER BY created_at DESC LIMIT 20;"
echo ""
echo "  2. Run validation query to find broken questions:"
echo "     SELECT id, question_text, correct_index, jsonb_array_length(options)"
echo "     FROM question_bank"
echo "     WHERE correct_index >= jsonb_array_length(options)"
echo "        OR correct_index < 0"
echo "        OR options IS NULL"
echo "        OR jsonb_array_length(options) < 2;"