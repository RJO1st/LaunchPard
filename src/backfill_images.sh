#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  LaunchPard — Image & Column Backfill Script v3                            ║
# ║                                                                            ║
# ║  Changes from v2:                                                          ║
# ║  • New mode: topic_slugs — normalises question_bank.topic values to        ║
# ║    match TOPIC_SEQUENCES slugs from learningPathEngine.js. Mismatched      ║
# ║    slugs break the mastery engine (BKT lookup = zero match).               ║
# ║  • New mode: mastery_columns — backfills missing difficulty_tier on        ║
# ║    session_answers and fills NULL region on question_bank rows using        ║
# ║    the curriculum→region map from populate_questions_v6.                   ║
# ║  • columns mode extended: now also patches NULL region on question_bank     ║
# ║    and NULL grade (mirrors year_level).                                    ║
# ║  • columns mode normalisation expanded: covers all alias tiers from v6     ║
# ║    (starter, challenge, core, etc.)                                        ║
# ║  • DRY_RUN now prints a summary table instead of just "d" chars            ║
# ║  • Idempotent: all modes safe to re-run — skips already-correct rows       ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
set -uo pipefail

# ─── CONFIG ───────────────────────────────────────────────────────────────────
SUPABASE_URL="${SUPABASE_URL:?Set SUPABASE_URL}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:?Set SUPABASE_SERVICE_KEY}"
SUPABASE_STORAGE_BUCKET="${SUPABASE_STORAGE_BUCKET:-question-images}"
OPENROUTER_API_KEY="${OPENROUTER_API_KEY:?Set OPENROUTER_API_KEY}"

IMAGE_MODEL="${IMAGE_MODEL:-sourceful/riverflow-v2-fast}"
IMAGE_PROVIDER="${IMAGE_PROVIDER:-openrouter}"  # "disabled" skips all images

PAGE_SIZE=100
SLEEP_BETWEEN=1
MAX_ERRORS=20
DRY_RUN="${DRY_RUN:-false}"
DEBUG_LOG="backfill_debug.txt"

# Space-separated list of modes to run.
# Valid: questions passages anchors columns topic_slugs mastery_columns
BACKFILL_MODE="${BACKFILL_MODE:-questions}"

# ─── OPTIONAL FILTERS (apply to image modes) ──────────────────────────────────
FILTER_CURRICULUM="${FILTER_CURRICULUM:-}"
FILTER_SUBJECT="${FILTER_SUBJECT:-}"
FILTER_YEAR="${FILTER_YEAR:-}"
FILTER_SOURCE="${FILTER_SOURCE:-}"

# ─── SUBJECTS WHERE IMAGES ARE NOT USEFUL ─────────────────────────────────────
NO_IMAGE_SUBJECTS="verbal nvr civic_education religious_studies crk islamic_studies"

# ─── CURRICULUM → REGION MAP (mirrors populate_questions_v6) ─────────────────
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

# ─── CANONICAL TOPIC SLUG MAP ─────────────────────────────────────────────────
# Keys  = legacy / freeform values AI may have generated before v6
# Values = canonical slug matching TOPIC_SEQUENCES in learningPathEngine.js
#
# Add rows here whenever you discover new mismatches via the verification query:
#   SELECT DISTINCT topic FROM question_bank WHERE source='ai' ORDER BY topic;
#
declare -A TOPIC_SLUG_MAP

# mathematics
TOPIC_SLUG_MAP[place value]="place_value"
TOPIC_SLUG_MAP[placevalue]="place_value"
TOPIC_SLUG_MAP[number bonds]="number_bonds"
TOPIC_SLUG_MAP[numberbonds]="number_bonds"
TOPIC_SLUG_MAP[Fractions]="fractions"
TOPIC_SLUG_MAP[Decimals]="decimals"
TOPIC_SLUG_MAP[Percentages]="percentages"
TOPIC_SLUG_MAP[ratio and proportion]="ratio_and_proportion"
TOPIC_SLUG_MAP[ratio]="ratio_and_proportion"
TOPIC_SLUG_MAP[algebra basics]="algebra_basics"
TOPIC_SLUG_MAP[algebra]="algebra_basics"
TOPIC_SLUG_MAP[linear equations]="linear_equations"
TOPIC_SLUG_MAP[area and perimeter]="area_and_perimeter"
TOPIC_SLUG_MAP[area]="area_and_perimeter"
TOPIC_SLUG_MAP[perimeter]="area_and_perimeter"
TOPIC_SLUG_MAP[angles and shapes]="angles_and_shapes"
TOPIC_SLUG_MAP[angles]="angles_and_shapes"
TOPIC_SLUG_MAP[shapes]="angles_and_shapes"
TOPIC_SLUG_MAP[data handling]="data_handling"
TOPIC_SLUG_MAP[data]="data_handling"
TOPIC_SLUG_MAP[statistics]="statistics"
TOPIC_SLUG_MAP[pythagoras theorem]="pythagoras_theorem"
TOPIC_SLUG_MAP[pythagoras_theorem]="pythagoras_theorem"
TOPIC_SLUG_MAP[quadratic equations]="quadratic_equations"
TOPIC_SLUG_MAP[simultaneous equations]="simultaneous_equations"
TOPIC_SLUG_MAP[circle theorems]="circle_theorems"
TOPIC_SLUG_MAP[number_patterns]="place_value"
TOPIC_SLUG_MAP[negative_numbers]="place_value"
TOPIC_SLUG_MAP[rounding]="place_value"
TOPIC_SLUG_MAP[time]="data_handling"
TOPIC_SLUG_MAP[money]="data_handling"
TOPIC_SLUG_MAP[coordinates]="angles_and_shapes"
TOPIC_SLUG_MAP[symmetry]="angles_and_shapes"
TOPIC_SLUG_MAP[indices]="algebra_basics"
TOPIC_SLUG_MAP[sequences]="algebra_basics"
TOPIC_SLUG_MAP[volume]="area_and_perimeter"

# english
TOPIC_SLUG_MAP[grammar nouns]="grammar"
TOPIC_SLUG_MAP[grammar verbs]="grammar"
TOPIC_SLUG_MAP[grammar adjectives]="grammar"
TOPIC_SLUG_MAP[grammar_nouns]="grammar"
TOPIC_SLUG_MAP[grammar_verbs]="grammar"
TOPIC_SLUG_MAP[grammar_adjectives]="grammar"
TOPIC_SLUG_MAP[reading comprehension]="comprehension"
TOPIC_SLUG_MAP[reading_comprehension]="comprehension"
TOPIC_SLUG_MAP[figurative language]="literary_devices"
TOPIC_SLUG_MAP[figurative_language]="literary_devices"
TOPIC_SLUG_MAP[narrative writing]="creative_writing"
TOPIC_SLUG_MAP[narrative_writing]="creative_writing"
TOPIC_SLUG_MAP[persuasive writing]="persuasive_writing"
TOPIC_SLUG_MAP[speech marks]="punctuation"
TOPIC_SLUG_MAP[speech_marks]="punctuation"
TOPIC_SLUG_MAP[tense]="grammar"
TOPIC_SLUG_MAP[active passive]="grammar"
TOPIC_SLUG_MAP[active_passive]="grammar"
TOPIC_SLUG_MAP[clauses]="sentence_structure"
TOPIC_SLUG_MAP[conjunctions]="sentence_structure"
TOPIC_SLUG_MAP[prepositions]="grammar"
TOPIC_SLUG_MAP[paragraphing]="essay_writing"
TOPIC_SLUG_MAP[antonyms]="vocabulary"
TOPIC_SLUG_MAP[synonyms]="vocabulary"

# science
TOPIC_SLUG_MAP[plants]="plants_and_animals"
TOPIC_SLUG_MAP[animals]="plants_and_animals"
TOPIC_SLUG_MAP[plants and animals]="plants_and_animals"
TOPIC_SLUG_MAP[habitats]="living_organisms"
TOPIC_SLUG_MAP[food chains]="food_chains"
TOPIC_SLUG_MAP[materials]="materials"
TOPIC_SLUG_MAP[changing states]="states_of_matter"
TOPIC_SLUG_MAP[changing_states]="states_of_matter"
TOPIC_SLUG_MAP[forces]="forces_basics"
TOPIC_SLUG_MAP[electricity]="electricity"
TOPIC_SLUG_MAP[light]="light_and_sound"
TOPIC_SLUG_MAP[sound]="light_and_sound"
TOPIC_SLUG_MAP[light and sound]="light_and_sound"
TOPIC_SLUG_MAP[earth and space]="earth_and_space"
TOPIC_SLUG_MAP[human body]="human_body"
TOPIC_SLUG_MAP[magnets]="forces_basics"
TOPIC_SLUG_MAP[rocks and soils]="materials"
TOPIC_SLUG_MAP[rocks_and_soils]="materials"
TOPIC_SLUG_MAP[water cycle]="earth_and_space"
TOPIC_SLUG_MAP[water_cycle]="earth_and_space"
TOPIC_SLUG_MAP[health]="human_body"

# history
TOPIC_SLUG_MAP[ancient civilisations]="ancient_civilisations"
TOPIC_SLUG_MAP[medieval britain]="local_history"
TOPIC_SLUG_MAP[medieval_britain]="local_history"
TOPIC_SLUG_MAP[tudors]="local_history"
TOPIC_SLUG_MAP[victorian era]="local_history"
TOPIC_SLUG_MAP[victorian_era]="local_history"
TOPIC_SLUG_MAP[world wars]="world_war_2"
TOPIC_SLUG_MAP[world war 1]="world_war_1"
TOPIC_SLUG_MAP[world war 2]="world_war_2"
TOPIC_SLUG_MAP[world_war_2]="world_war_2"
TOPIC_SLUG_MAP[cold war]="cold_war"
TOPIC_SLUG_MAP[civil rights]="civil_rights"
TOPIC_SLUG_MAP[civil_rights]="civil_rights"
TOPIC_SLUG_MAP[industrial revolution]="empire_and_colonialism"
TOPIC_SLUG_MAP[industrial_revolution]="empire_and_colonialism"
TOPIC_SLUG_MAP[prehistoric britain]="local_history"
TOPIC_SLUG_MAP[prehistoric_britain]="local_history"
TOPIC_SLUG_MAP[slavery]="civil_rights"
TOPIC_SLUG_MAP[modern_history]="modern_history"
TOPIC_SLUG_MAP[ancient egypt]="ancient_civilisations"
TOPIC_SLUG_MAP[ancient_egypt]="ancient_civilisations"
TOPIC_SLUG_MAP[ancient greece]="ancient_civilisations"
TOPIC_SLUG_MAP[ancient_greece]="ancient_civilisations"
TOPIC_SLUG_MAP[empire and colonialism]="empire_and_colonialism"
TOPIC_SLUG_MAP[revolutions]="empire_and_colonialism"

# geography
TOPIC_SLUG_MAP[map skills]="maps_and_directions"
TOPIC_SLUG_MAP[map_skills]="maps_and_directions"
TOPIC_SLUG_MAP[rivers]="physical_geography"
TOPIC_SLUG_MAP[mountains]="physical_geography"
TOPIC_SLUG_MAP[climate zones]="weather_and_climate"
TOPIC_SLUG_MAP[climate_zones]="weather_and_climate"
TOPIC_SLUG_MAP[weather and climate]="weather_and_climate"
TOPIC_SLUG_MAP[population]="human_geography"
TOPIC_SLUG_MAP[settlements]="human_geography"
TOPIC_SLUG_MAP[uk regions]="local_area"
TOPIC_SLUG_MAP[uk_regions]="local_area"
TOPIC_SLUG_MAP[world continents]="local_area"
TOPIC_SLUG_MAP[world_continents]="local_area"
TOPIC_SLUG_MAP[natural disasters]="physical_geography"
TOPIC_SLUG_MAP[natural_disasters]="physical_geography"
TOPIC_SLUG_MAP[rainforests]="ecosystems"
TOPIC_SLUG_MAP[oceans]="physical_geography"
TOPIC_SLUG_MAP[biomes]="ecosystems"
TOPIC_SLUG_MAP[sustainability]="environmental_issues"
TOPIC_SLUG_MAP[trade]="globalisation"
TOPIC_SLUG_MAP[migration]="human_geography"

# ─── SHARED HELPERS ───────────────────────────────────────────────────────────

subject_wants_image() {
  local subject="$1"
  for s in $NO_IMAGE_SUBJECTS; do
    [[ "$s" == "$subject" ]] && return 1
  done
  return 0
}

normalise_tier() {
  case "${1,,}" in
    emerging|beginner|easy|starter|basic|foundation) echo "developing" ;;
    developing)                                       echo "developing" ;;
    expected|secure|intermediate|medium|core)         echo "expected"   ;;
    exceeding|mastery|advanced|hard|challenge)        echo "exceeding"  ;;
    *)                                                echo "developing" ;;
  esac
}

normalise_topic_slug() {
  local raw="$1"
  # 1. Check explicit map
  if [[ -n "${TOPIC_SLUG_MAP[$raw]+x}" ]]; then
    echo "${TOPIC_SLUG_MAP[$raw]}"; return
  fi
  # 2. Try lowercase + underscore normalisation
  local normalised
  normalised=$(echo "${raw,,}" | tr ' -' '_' | tr -cs 'a-z0-9_' '_' | sed 's/__*/_/g; s/^_//; s/_$//')
  if [[ -n "${TOPIC_SLUG_MAP[$normalised]+x}" ]]; then
    echo "${TOPIC_SLUG_MAP[$normalised]}"; return
  fi
  # 3. Return normalised form even if not in map
  echo "$normalised"
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
    -H "X-Title: LaunchPard Backfill v3" \
    -d "$(jq -n \
      --arg model "$IMAGE_MODEL" \
      --arg prompt "$prompt" \
      '{ model: $model, messages: [{ role: "user", content: $prompt }], modalities: ["image"] }')")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  echo "img ${http_code}: ${prompt:0:50}" >> "${DEBUG_LOG}"
  if [[ "$http_code" -ne 200 ]]; then
    echo "    ⚠️  Image HTTP ${http_code}: $(echo "$body" | jq -r '.error.message // "unknown"' 2>/dev/null)" >&2
    echo ""; return
  fi
  local data_url
  data_url=$(echo "$body" | jq -r '.choices[0].message.images[0].image_url.url // empty' 2>/dev/null)
  [[ -z "$data_url" ]] && { echo "    ⚠️  No image in response" >&2; echo ""; return; }
  echo "$data_url"
}

upload_image() {
  local data_url="$1" dest_path="$2"
  local tmp_file; tmp_file=$(mktemp /tmp/lp_XXXXXX) && mv "$tmp_file" "${tmp_file}.png" && tmp_file="${tmp_file}.png"
  echo "$data_url" | sed 's|^data:image/[^;]*;base64,||' | base64 -d > "$tmp_file" 2>/dev/null
  if [[ ! -s "$tmp_file" ]]; then
    echo "    ⚠️  base64 decode failed" >&2; rm -f "$tmp_file"; echo ""; return
  fi
  local resp code
  resp=$(curl -s -w "\n%{http_code}" -X POST \
    "${SUPABASE_URL}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/${dest_path}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: image/png" \
    --data-binary "@$tmp_file")
  code=$(echo "$resp" | tail -n1)
  rm -f "$tmp_file"
  if [[ "$code" -eq 200 ]]; then
    echo "${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${dest_path}"
  else
    echo "    ⚠️  Storage upload HTTP ${code}" >&2; echo ""
  fi
}

patch_row() {
  local table="$1" row_id="$2" payload="$3"
  [[ "${DRY_RUN}" == "true" ]] && echo "204" && return
  curl -s -o /dev/null -w "%{http_code}" -X PATCH \
    "${SUPABASE_URL}/rest/v1/${table}?id=eq.${row_id}" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "$payload"
}

count_rows() {
  local table="$1" filter="$2"
  local resp
  resp=$(curl -s -D - \
    "${SUPABASE_URL}/rest/v1/${table}?${filter}&select=id&limit=1" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Prefer: count=exact")
  echo "$resp" | grep -i "content-range:" | tr -d '\r' | sed 's|.*/||; s/[^0-9].*//'
}

# ═══════════════════════════════════════════════════════════════════════════════
# MODE 1: QUESTION_BANK IMAGE BACKFILL (unchanged from v2)
# ═══════════════════════════════════════════════════════════════════════════════
run_questions_mode() {
  echo ""
  echo "━━━ MODE: questions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  local filter="image_url=is.null&question_data=not.is.null"
  [[ -n "$FILTER_CURRICULUM" ]] && filter="${filter}&curriculum=eq.${FILTER_CURRICULUM}"
  [[ -n "$FILTER_SUBJECT"    ]] && filter="${filter}&subject=eq.${FILTER_SUBJECT}"
  [[ -n "$FILTER_YEAR"       ]] && filter="${filter}&year_level=eq.${FILTER_YEAR}"
  [[ -n "$FILTER_SOURCE"     ]] && filter="${filter}&source=eq.${FILTER_SOURCE}"

  local total; total=$(count_rows "question_bank" "$filter")
  echo "  Target: ${total:-?} rows (image_url NULL, question_data present)"
  [[ "${DRY_RUN}" == "true" ]] && echo "  DRY RUN — no writes." && return

  local offset=0 processed=0 skipped=0 errors=0 consecutive_errors=0

  while true; do
    local range_end=$(( offset + PAGE_SIZE - 1 ))
    local page
    page=$(curl -s \
      "${SUPABASE_URL}/rest/v1/question_bank?${filter}&select=id,question_data,subject,year_level,curriculum&order=id.asc" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Range: ${offset}-${range_end}" \
      -H "Range-Unit: items")

    local row_count
    row_count=$(echo "$page" | jq 'if type=="array" then length else 0 end' 2>/dev/null || echo 0)
    [[ "$row_count" -eq 0 ]] && break

    for i in $(seq 0 $((row_count - 1))); do
      local row_id subject year visual_hint
      row_id=$(echo "$page"     | jq -r ".[$i].id")
      subject=$(echo "$page"    | jq -r ".[$i].subject")
      year=$(echo "$page"       | jq -r ".[$i].year_level")
      visual_hint=$(echo "$page"| jq -r ".[$i].question_data.visual_hint // empty")

      if [[ -z "$visual_hint" || "$visual_hint" == "null" ]]; then
        (( skipped++ )); continue
      fi
      if ! subject_wants_image "$subject"; then
        (( skipped++ )); continue
      fi

      echo -n "  [$(( processed + skipped + 1 ))/${total:-?}] ${subject} Y${year}: ${visual_hint:0:55}… "

      local gen_url
      gen_url=$(generate_image "$visual_hint")
      if [[ -z "$gen_url" ]]; then
        echo "⚠️  gen failed"
        (( errors++ )); (( consecutive_errors++ ))
        [[ $consecutive_errors -ge $MAX_ERRORS ]] && echo "Too many errors — aborting mode." && return
        sleep "$SLEEP_BETWEEN"; continue
      fi
      consecutive_errors=0

      local dest_path="backfill/${subject}/${year}/${row_id}_${RANDOM}.png"
      local stored_url
      stored_url=$(upload_image "$gen_url" "$dest_path")
      if [[ -z "$stored_url" ]]; then
        echo "⚠️  upload failed"; (( errors++ )); sleep "$SLEEP_BETWEEN"; continue
      fi

      local code
      code=$(patch_row "question_bank" "$row_id" "{\"image_url\": \"${stored_url}\"}")
      if [[ "$code" == "204" ]]; then
        echo "✅"; (( processed++ ))
      else
        echo "⚠️  PATCH HTTP ${code}"; (( errors++ ))
      fi
      sleep "$SLEEP_BETWEEN"
    done

    offset=$(( offset + PAGE_SIZE ))
    [[ "$row_count" -lt "$PAGE_SIZE" ]] && break
  done

  echo ""
  echo "  Questions — Processed: ${processed}  Skipped: ${skipped}  Errors: ${errors}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# MODE 2: PASSAGES IMAGE BACKFILL (unchanged from v2)
# ═══════════════════════════════════════════════════════════════════════════════
run_passages_mode() {
  echo ""
  echo "━━━ MODE: passages ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  local filter="image_url=is.null"
  [[ -n "$FILTER_CURRICULUM" ]] && filter="${filter}&curriculum=eq.${FILTER_CURRICULUM}"
  [[ -n "$FILTER_SUBJECT"    ]] && filter="${filter}&subject=eq.${FILTER_SUBJECT}"
  [[ -n "$FILTER_YEAR"       ]] && filter="${filter}&year_level=eq.${FILTER_YEAR}"

  local total; total=$(count_rows "passages" "$filter")
  echo "  Target: ${total:-?} passages with no image_url"
  [[ "${DRY_RUN}" == "true" ]] && echo "  DRY RUN — no writes." && return

  local offset=0 processed=0 skipped=0 errors=0 consecutive_errors=0

  while true; do
    local range_end=$(( offset + PAGE_SIZE - 1 ))
    local page
    page=$(curl -s \
      "${SUPABASE_URL}/rest/v1/passages?${filter}&select=id,title,subject,year_level,curriculum,body&order=id.asc" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Range: ${offset}-${range_end}" \
      -H "Range-Unit: items")

    local row_count
    row_count=$(echo "$page" | jq 'if type=="array" then length else 0 end' 2>/dev/null || echo 0)
    [[ "$row_count" -eq 0 ]] && break

    for i in $(seq 0 $((row_count - 1))); do
      local row_id title subject year body_snippet
      row_id=$(echo "$page"      | jq -r ".[$i].id")
      title=$(echo "$page"       | jq -r ".[$i].title")
      subject=$(echo "$page"     | jq -r ".[$i].subject")
      year=$(echo "$page"        | jq -r ".[$i].year_level")
      body_snippet=$(echo "$page"| jq -r ".[$i].body // \"\"" | head -c 120)

      if ! subject_wants_image "$subject"; then
        (( skipped++ )); continue
      fi

      local img_prompt="Educational illustration for a reading passage titled '${title}'. ${body_snippet:+Context: ${body_snippet:0:80}}. Clean, child-friendly illustration style, white background, Year ${year} level."
      echo -n "  [$(( processed + skipped + 1 ))/${total:-?}] ${subject} Y${year}: '${title:0:45}'… "

      local gen_url
      gen_url=$(generate_image "$img_prompt")
      if [[ -z "$gen_url" ]]; then
        echo "⚠️  gen failed"; (( errors++ )); (( consecutive_errors++ ))
        [[ $consecutive_errors -ge $MAX_ERRORS ]] && echo "Too many errors — aborting mode." && return
        sleep "$SLEEP_BETWEEN"; continue
      fi
      consecutive_errors=0

      local dest_path="passages/${subject}/${year}/${row_id}_${RANDOM}.png"
      local stored_url
      stored_url=$(upload_image "$gen_url" "$dest_path")
      if [[ -z "$stored_url" ]]; then
        echo "⚠️  upload failed"; (( errors++ )); sleep "$SLEEP_BETWEEN"; continue
      fi

      local code
      code=$(patch_row "passages" "$row_id" "{\"image_url\": \"${stored_url}\"}")
      if [[ "$code" == "204" ]]; then
        echo "✅"; (( processed++ ))
      else
        echo "⚠️  PATCH HTTP ${code}"; (( errors++ ))
      fi
      sleep "$SLEEP_BETWEEN"
    done

    offset=$(( offset + PAGE_SIZE ))
    [[ "$row_count" -lt "$PAGE_SIZE" ]] && break
  done

  echo ""
  echo "  Passages — Processed: ${processed}  Skipped: ${skipped}  Errors: ${errors}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# MODE 3: CONTEXT_ANCHORS IMAGE BACKFILL (unchanged from v2)
# ═══════════════════════════════════════════════════════════════════════════════
run_anchors_mode() {
  echo ""
  echo "━━━ MODE: anchors ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  local filter="image_url=is.null"
  [[ -n "$FILTER_CURRICULUM" ]] && filter="${filter}&curriculum=eq.${FILTER_CURRICULUM}"
  [[ -n "$FILTER_SUBJECT"    ]] && filter="${filter}&subject=eq.${FILTER_SUBJECT}"
  [[ -n "$FILTER_YEAR"       ]] && filter="${filter}&year_level=eq.${FILTER_YEAR}"

  local total; total=$(count_rows "context_anchors" "$filter")
  echo "  Target: ${total:-?} context anchors with no image_url"
  [[ "${DRY_RUN}" == "true" ]] && echo "  DRY RUN — no writes." && return

  local offset=0 processed=0 skipped=0 errors=0 consecutive_errors=0

  while true; do
    local range_end=$(( offset + PAGE_SIZE - 1 ))
    local page
    page=$(curl -s \
      "${SUPABASE_URL}/rest/v1/context_anchors?${filter}&select=id,title,description,topic,subject,year_level,curriculum,data_table&order=id.asc" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Range: ${offset}-${range_end}" \
      -H "Range-Unit: items")

    local row_count
    row_count=$(echo "$page" | jq 'if type=="array" then length else 0 end' 2>/dev/null || echo 0)
    [[ "$row_count" -eq 0 ]] && break

    for i in $(seq 0 $((row_count - 1))); do
      local row_id title desc topic subject year data_table
      row_id=$(echo "$page"    | jq -r ".[$i].id")
      title=$(echo "$page"     | jq -r ".[$i].title")
      desc=$(echo "$page"      | jq -r ".[$i].description // \"\"")
      topic=$(echo "$page"     | jq -r ".[$i].topic")
      subject=$(echo "$page"   | jq -r ".[$i].subject")
      year=$(echo "$page"      | jq -r ".[$i].year_level")
      data_table=$(echo "$page"| jq -r ".[$i].data_table")

      if [[ "$data_table" != "null" && -n "$data_table" ]]; then
        echo "  ⏭  Anchor '${title:0:40}': has data_table, skipping"
        (( skipped++ )); continue
      fi
      if ! subject_wants_image "$subject"; then
        (( skipped++ )); continue
      fi

      local img_prompt="Clear educational diagram for the topic '${title}' (${topic//_/ }). ${desc:0:100}. Labelled diagram, clean illustration style, white background, suitable for Year ${year} students."
      echo -n "  [$(( processed + skipped + 1 ))/${total:-?}] ${subject} Y${year}: '${title:0:45}'… "

      local gen_url
      gen_url=$(generate_image "$img_prompt")
      if [[ -z "$gen_url" ]]; then
        echo "⚠️  gen failed"; (( errors++ )); (( consecutive_errors++ ))
        [[ $consecutive_errors -ge $MAX_ERRORS ]] && echo "Too many errors — aborting mode." && return
        sleep "$SLEEP_BETWEEN"; continue
      fi
      consecutive_errors=0

      local dest_path="anchors/${subject}/${year}/${row_id}_${RANDOM}.png"
      local stored_url
      stored_url=$(upload_image "$gen_url" "$dest_path")
      if [[ -z "$stored_url" ]]; then
        echo "⚠️  upload failed"; (( errors++ )); sleep "$SLEEP_BETWEEN"; continue
      fi

      local code
      code=$(patch_row "context_anchors" "$row_id" "{\"image_url\": \"${stored_url}\"}")
      if [[ "$code" == "204" ]]; then
        echo "✅"; (( processed++ ))
      else
        echo "⚠️  PATCH HTTP ${code}"; (( errors++ ))
      fi
      sleep "$SLEEP_BETWEEN"
    done

    offset=$(( offset + PAGE_SIZE ))
    [[ "$row_count" -lt "$PAGE_SIZE" ]] && break
  done

  echo ""
  echo "  Anchors — Processed: ${processed}  Skipped: ${skipped}  Errors: ${errors}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# MODE 4: COLUMN BACKFILL (extended from v2)
# Fills: difficulty_tier, question_type, answer_type, region, grade on question_bank
# ═══════════════════════════════════════════════════════════════════════════════
run_columns_mode() {
  echo ""
  echo "━━━ MODE: columns ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Backfills: difficulty_tier, question_type, answer_type, region, grade"

  # ── 4a: Rows with NULL difficulty_tier ──────────────────────────────────
  local filter_tier="difficulty_tier=is.null"
  [[ -n "$FILTER_CURRICULUM" ]] && filter_tier="${filter_tier}&curriculum=eq.${FILTER_CURRICULUM}"
  [[ -n "$FILTER_SUBJECT"    ]] && filter_tier="${filter_tier}&subject=eq.${FILTER_SUBJECT}"
  [[ -n "$FILTER_SOURCE"     ]] && filter_tier="${filter_tier}&source=eq.${FILTER_SOURCE}"

  local total_tier; total_tier=$(count_rows "question_bank" "$filter_tier")
  echo "  Rows missing difficulty_tier: ${total_tier:-?}"

  local offset=0 fixed_tier=0

  while true; do
    local range_end=$(( offset + PAGE_SIZE - 1 ))
    local page
    page=$(curl -s \
      "${SUPABASE_URL}/rest/v1/question_bank?${filter_tier}&select=id,question_data&order=id.asc" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Range: ${offset}-${range_end}" \
      -H "Range-Unit: items")

    local row_count
    row_count=$(echo "$page" | jq 'if type=="array" then length else 0 end' 2>/dev/null || echo 0)
    [[ "$row_count" -eq 0 ]] && break

    for i in $(seq 0 $((row_count - 1))); do
      local row_id raw_tier tier
      row_id=$(echo "$page"  | jq -r ".[$i].id")
      raw_tier=$(echo "$page"| jq -r ".[$i].question_data.difficulty_tier // \"developing\"")
      tier=$(normalise_tier "$raw_tier")

      [[ "${DRY_RUN}" == "true" ]] && echo -n "d" && continue

      local code
      code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
        "${SUPABASE_URL}/rest/v1/question_bank?id=eq.${row_id}" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=minimal" \
        -d "{\"difficulty_tier\": \"${tier}\"}")
      [[ "$code" == "204" ]] && echo -n "." && (( fixed_tier++ )) || echo -n "✗(${code})"
    done

    offset=$(( offset + PAGE_SIZE ))
    [[ "$row_count" -lt "$PAGE_SIZE" ]] && break
  done
  echo ""
  echo "  difficulty_tier — Fixed: ${fixed_tier}"

  # ── 4b: Normalise non-schema tier values (expanded alias list) ───────────
  echo "  Normalising non-schema tier aliases…"
  for bad_tier in "emerging" "secure" "mastery" "beginner" "intermediate" "advanced" "easy" "medium" "hard" "starter" "challenge" "core" "foundation" "basic"; do
    local good_tier; good_tier=$(normalise_tier "$bad_tier")
    [[ "$bad_tier" == "$good_tier" ]] && continue
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
      "${SUPABASE_URL}/rest/v1/question_bank?difficulty_tier=eq.${bad_tier}" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=minimal" \
      -d "{\"difficulty_tier\": \"${good_tier}\"}")
    [[ "$code" == "204" ]] && echo "    ✓ ${bad_tier} → ${good_tier}" || echo "    ⚠️  ${bad_tier} HTTP ${code}"
  done

  # ── 4c: Rows with NULL question_type ────────────────────────────────────
  local filter_qt="question_type=is.null"
  [[ -n "$FILTER_CURRICULUM" ]] && filter_qt="${filter_qt}&curriculum=eq.${FILTER_CURRICULUM}"
  [[ -n "$FILTER_SOURCE"     ]] && filter_qt="${filter_qt}&source=eq.${FILTER_SOURCE}"

  local total_qt; total_qt=$(count_rows "question_bank" "$filter_qt")
  echo "  Rows missing question_type: ${total_qt:-?}"

  offset=0; local fixed_qt=0

  while true; do
    local range_end=$(( offset + PAGE_SIZE - 1 ))
    local page
    page=$(curl -s \
      "${SUPABASE_URL}/rest/v1/question_bank?${filter_qt}&select=id,passage_id&order=id.asc" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Range: ${offset}-${range_end}" \
      -H "Range-Unit: items")

    local row_count
    row_count=$(echo "$page" | jq 'if type=="array" then length else 0 end' 2>/dev/null || echo 0)
    [[ "$row_count" -eq 0 ]] && break

    for i in $(seq 0 $((row_count - 1))); do
      local row_id passage_id q_type
      row_id=$(echo "$page"    | jq -r ".[$i].id")
      passage_id=$(echo "$page"| jq -r ".[$i].passage_id // empty")
      q_type="mcq"
      [[ -n "$passage_id" && "$passage_id" != "null" ]] && q_type="passage"

      [[ "${DRY_RUN}" == "true" ]] && echo -n "d" && continue

      local code
      code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
        "${SUPABASE_URL}/rest/v1/question_bank?id=eq.${row_id}" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=minimal" \
        -d "{\"question_type\": \"${q_type}\", \"answer_type\": \"choice\"}")
      [[ "$code" == "204" ]] && echo -n "." && (( fixed_qt++ )) || echo -n "✗(${code})"
    done

    offset=$(( offset + PAGE_SIZE ))
    [[ "$row_count" -lt "$PAGE_SIZE" ]] && break
  done
  echo ""
  echo "  question_type / answer_type — Fixed: ${fixed_qt}"

  # ── 4d: NEW — Rows with NULL region: set from curriculum map ────────────
  local filter_region="region=is.null"
  [[ -n "$FILTER_CURRICULUM" ]] && filter_region="${filter_region}&curriculum=eq.${FILTER_CURRICULUM}"

  local total_region; total_region=$(count_rows "question_bank" "$filter_region")
  echo "  Rows missing region: ${total_region:-?}"

  offset=0; local fixed_region=0

  while true; do
    local range_end=$(( offset + PAGE_SIZE - 1 ))
    local page
    page=$(curl -s \
      "${SUPABASE_URL}/rest/v1/question_bank?${filter_region}&select=id,curriculum&order=id.asc" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Range: ${offset}-${range_end}" \
      -H "Range-Unit: items")

    local row_count
    row_count=$(echo "$page" | jq 'if type=="array" then length else 0 end' 2>/dev/null || echo 0)
    [[ "$row_count" -eq 0 ]] && break

    for i in $(seq 0 $((row_count - 1))); do
      local row_id curriculum region
      row_id=$(echo "$page"    | jq -r ".[$i].id")
      curriculum=$(echo "$page"| jq -r ".[$i].curriculum")
      region="${CURRICULUM_REGION[$curriculum]:-GL}"

      [[ "${DRY_RUN}" == "true" ]] && echo -n "d" && continue

      local code
      code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
        "${SUPABASE_URL}/rest/v1/question_bank?id=eq.${row_id}" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=minimal" \
        -d "{\"region\": \"${region}\"}")
      [[ "$code" == "204" ]] && echo -n "." && (( fixed_region++ )) || echo -n "✗(${code})"
    done

    offset=$(( offset + PAGE_SIZE ))
    [[ "$row_count" -lt "$PAGE_SIZE" ]] && break
  done
  echo ""
  echo "  region — Fixed: ${fixed_region}"

  # ── 4e: NEW — Rows with NULL grade: mirror from year_level ──────────────
  local filter_grade="grade=is.null"
  local total_grade; total_grade=$(count_rows "question_bank" "$filter_grade")
  echo "  Rows missing grade: ${total_grade:-?}"

  offset=0; local fixed_grade=0

  while true; do
    local range_end=$(( offset + PAGE_SIZE - 1 ))
    local page
    page=$(curl -s \
      "${SUPABASE_URL}/rest/v1/question_bank?${filter_grade}&select=id,year_level&order=id.asc" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Range: ${offset}-${range_end}" \
      -H "Range-Unit: items")

    local row_count
    row_count=$(echo "$page" | jq 'if type=="array" then length else 0 end' 2>/dev/null || echo 0)
    [[ "$row_count" -eq 0 ]] && break

    for i in $(seq 0 $((row_count - 1))); do
      local row_id year_level
      row_id=$(echo "$page"    | jq -r ".[$i].id")
      year_level=$(echo "$page"| jq -r ".[$i].year_level")

      [[ -z "$year_level" || "$year_level" == "null" ]] && continue
      [[ "${DRY_RUN}" == "true" ]] && echo -n "d" && continue

      local code
      code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
        "${SUPABASE_URL}/rest/v1/question_bank?id=eq.${row_id}" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=minimal" \
        -d "{\"grade\": ${year_level}}")
      [[ "$code" == "204" ]] && echo -n "." && (( fixed_grade++ )) || echo -n "✗(${code})"
    done

    offset=$(( offset + PAGE_SIZE ))
    [[ "$row_count" -lt "$PAGE_SIZE" ]] && break
  done
  echo ""
  echo "  grade — Fixed: ${fixed_grade}"
}

# ═══════════════════════════════════════════════════════════════════════════════
# MODE 5: NEW — TOPIC SLUG NORMALISATION
# Aligns question_bank.topic values to TOPIC_SEQUENCES slugs from
# learningPathEngine.js. Mismatched slugs cause BKT lookups to silently return
# zero — scholars never get SR reviews for those topics.
#
# Safe: reads current topic, maps via TOPIC_SLUG_MAP, patches only if different.
# ═══════════════════════════════════════════════════════════════════════════════
run_topic_slugs_mode() {
  echo ""
  echo "━━━ MODE: topic_slugs ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Normalises topic column values to match TOPIC_SEQUENCES slugs"
  echo "  (lowercase_with_underscores, aliased via TOPIC_SLUG_MAP)"
  echo ""

  local filter="select=id,topic,subject"
  [[ -n "$FILTER_CURRICULUM" ]] && filter="${filter}&curriculum=eq.${FILTER_CURRICULUM}"
  [[ -n "$FILTER_SUBJECT"    ]] && filter="${filter}&subject=eq.${FILTER_SUBJECT}"
  [[ -n "$FILTER_SOURCE"     ]] && filter="${filter}&source=eq.${FILTER_SOURCE}"

  local total; total=$(count_rows "question_bank" "$(echo "$filter" | sed 's/select=[^&]*&//')")
  echo "  Scanning: ${total:-?} rows"
  [[ "${DRY_RUN}" == "true" ]] && echo "  DRY RUN — will print changes, no writes."

  local offset=0 fixed=0 skipped=0 dry_changes=0
  declare -A dry_summary  # topic_raw -> canonical

  while true; do
    local range_end=$(( offset + PAGE_SIZE - 1 ))
    local page
    page=$(curl -s \
      "${SUPABASE_URL}/rest/v1/question_bank?${filter}&order=id.asc" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Range: ${offset}-${range_end}" \
      -H "Range-Unit: items")

    local row_count
    row_count=$(echo "$page" | jq 'if type=="array" then length else 0 end' 2>/dev/null || echo 0)
    [[ "$row_count" -eq 0 ]] && break

    for i in $(seq 0 $((row_count - 1))); do
      local row_id raw_topic canonical
      row_id=$(echo "$page"    | jq -r ".[$i].id")
      raw_topic=$(echo "$page" | jq -r ".[$i].topic // empty")

      [[ -z "$raw_topic" ]] && (( skipped++ )); continue

      canonical=$(normalise_topic_slug "$raw_topic")

      # Skip if already canonical
      if [[ "$canonical" == "$raw_topic" ]]; then
        (( skipped++ )); continue
      fi

      if [[ "${DRY_RUN}" == "true" ]]; then
        dry_summary["$raw_topic"]="$canonical"
        (( dry_changes++ ))
        continue
      fi

      local code
      code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
        "${SUPABASE_URL}/rest/v1/question_bank?id=eq.${row_id}" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=minimal" \
        -d "$(jq -n --arg t "$canonical" '{topic: $t}')")
      [[ "$code" == "204" ]] && echo -n "." && (( fixed++ )) || echo -n "✗(${code})"
    done

    offset=$(( offset + PAGE_SIZE ))
    [[ "$row_count" -lt "$PAGE_SIZE" ]] && break
  done

  echo ""

  if [[ "${DRY_RUN}" == "true" ]]; then
    echo "  DRY RUN — ${dry_changes} rows would be updated:"
    for raw in "${!dry_summary[@]}"; do
      echo "    '${raw}' → '${dry_summary[$raw]}'"
    done
  else
    echo "  topic_slugs — Fixed: ${fixed}  Already canonical: ${skipped}"
  fi

  echo ""
  echo "  TIP: To find any remaining unrecognised topics after this run:"
  echo "    SELECT DISTINCT topic, COUNT(*) FROM question_bank"
  echo "    WHERE topic NOT LIKE '%\_%' OR topic ~ '[A-Z ]'"
  echo "    GROUP BY topic ORDER BY topic;"
}

# ═══════════════════════════════════════════════════════════════════════════════
# MODE 6: NEW — MASTERY COLUMNS BACKFILL
# Fills in missing metadata on session_answers and scholar_topic_mastery
# that the mastery engine needs for accurate analytics.
#
# Sub-modes:
#  6a. session_answers rows with NULL difficulty_tier — infer from question_bank
#  6b. session_answers rows with NULL year_level — pull from question_bank
#  6c. scholar_topic_mastery rows with NULL current_tier — derive from mastery_score
# ═══════════════════════════════════════════════════════════════════════════════
run_mastery_columns_mode() {
  echo ""
  echo "━━━ MODE: mastery_columns ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  Backfills metadata on session_answers and scholar_topic_mastery"

  # ── 6a: session_answers with NULL difficulty_tier ────────────────────────
  echo ""
  echo "  [6a] session_answers: filling NULL difficulty_tier from question_bank…"

  local filter_sa="difficulty_tier=is.null&question_id=not.is.null"
  local total_sa; total_sa=$(count_rows "session_answers" "$filter_sa")
  echo "  Rows to fix: ${total_sa:-?}"

  local offset=0 fixed_sa=0

  while true; do
    local range_end=$(( offset + PAGE_SIZE - 1 ))
    local page
    page=$(curl -s \
      "${SUPABASE_URL}/rest/v1/session_answers?${filter_sa}&select=id,question_id&order=id.asc" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Range: ${offset}-${range_end}" \
      -H "Range-Unit: items")

    local row_count
    row_count=$(echo "$page" | jq 'if type=="array" then length else 0 end' 2>/dev/null || echo 0)
    [[ "$row_count" -eq 0 ]] && break

    for i in $(seq 0 $((row_count - 1))); do
      local sa_id q_id q_tier_raw q_tier
      sa_id=$(echo "$page" | jq -r ".[$i].id")
      q_id=$(echo "$page"  | jq -r ".[$i].question_id")

      # Look up the question's difficulty_tier from question_bank
      q_tier_raw=$(curl -s \
        "${SUPABASE_URL}/rest/v1/question_bank?id=eq.${q_id}&select=difficulty_tier&limit=1" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        | jq -r '.[0].difficulty_tier // "developing"')
      q_tier=$(normalise_tier "$q_tier_raw")

      [[ "${DRY_RUN}" == "true" ]] && echo -n "d" && continue

      local code
      code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
        "${SUPABASE_URL}/rest/v1/session_answers?id=eq.${sa_id}" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=minimal" \
        -d "{\"difficulty_tier\": \"${q_tier}\"}")
      [[ "$code" == "204" ]] && echo -n "." && (( fixed_sa++ )) || echo -n "✗(${code})"
    done

    offset=$(( offset + PAGE_SIZE ))
    [[ "$row_count" -lt "$PAGE_SIZE" ]] && break
  done
  echo ""
  echo "  session_answers difficulty_tier — Fixed: ${fixed_sa}"

  # ── 6b: session_answers with NULL year_level — pull from question_bank ───
  echo ""
  echo "  [6b] session_answers: filling NULL year_level from question_bank…"

  local filter_sa_yr="year_level=is.null&question_id=not.is.null"
  local total_sa_yr; total_sa_yr=$(count_rows "session_answers" "$filter_sa_yr")
  echo "  Rows to fix: ${total_sa_yr:-?}"

  offset=0; local fixed_sa_yr=0

  while true; do
    local range_end=$(( offset + PAGE_SIZE - 1 ))
    local page
    page=$(curl -s \
      "${SUPABASE_URL}/rest/v1/session_answers?${filter_sa_yr}&select=id,question_id&order=id.asc" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Range: ${offset}-${range_end}" \
      -H "Range-Unit: items")

    local row_count
    row_count=$(echo "$page" | jq 'if type=="array" then length else 0 end' 2>/dev/null || echo 0)
    [[ "$row_count" -eq 0 ]] && break

    for i in $(seq 0 $((row_count - 1))); do
      local sa_id q_id q_year
      sa_id=$(echo "$page" | jq -r ".[$i].id")
      q_id=$(echo "$page"  | jq -r ".[$i].question_id")

      q_year=$(curl -s \
        "${SUPABASE_URL}/rest/v1/question_bank?id=eq.${q_id}&select=year_level&limit=1" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        | jq -r '.[0].year_level // empty')

      [[ -z "$q_year" || "$q_year" == "null" ]] && continue
      [[ "${DRY_RUN}" == "true" ]] && echo -n "d" && continue

      local code
      code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
        "${SUPABASE_URL}/rest/v1/session_answers?id=eq.${sa_id}" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=minimal" \
        -d "{\"year_level\": ${q_year}}")
      [[ "$code" == "204" ]] && echo -n "." && (( fixed_sa_yr++ )) || echo -n "✗(${code})"
    done

    offset=$(( offset + PAGE_SIZE ))
    [[ "$row_count" -lt "$PAGE_SIZE" ]] && break
  done
  echo ""
  echo "  session_answers year_level — Fixed: ${fixed_sa_yr}"

  # ── 6c: scholar_topic_mastery with NULL current_tier ────────────────────
  echo ""
  echo "  [6c] scholar_topic_mastery: deriving NULL current_tier from mastery_score…"
  echo "  Thresholds: ≥0.80 → exceeding | ≥0.55 → expected | <0.55 → developing"

  # Use a direct multi-row PATCH via filter rather than row-by-row
  # (Supabase allows PATCH with a WHERE filter to update many rows at once)
  if [[ "${DRY_RUN}" == "true" ]]; then
    echo "  DRY RUN — would patch three tier bands."
  else
    local code

    # exceeding: mastery_score >= 0.80
    code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
      "${SUPABASE_URL}/rest/v1/scholar_topic_mastery?current_tier=is.null&mastery_score=gte.0.80" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=minimal" \
      -d '{"current_tier": "exceeding"}')
    [[ "$code" == "204" ]] && echo "    ✓ mastery ≥ 0.80 → exceeding" || echo "    ⚠️  HTTP ${code}"

    # expected: mastery_score >= 0.55 AND < 0.80
    code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
      "${SUPABASE_URL}/rest/v1/scholar_topic_mastery?current_tier=is.null&mastery_score=gte.0.55&mastery_score=lt.0.80" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=minimal" \
      -d '{"current_tier": "expected"}')
    [[ "$code" == "204" ]] && echo "    ✓ 0.55 ≤ mastery < 0.80 → expected" || echo "    ⚠️  HTTP ${code}"

    # developing: mastery_score < 0.55
    code=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH \
      "${SUPABASE_URL}/rest/v1/scholar_topic_mastery?current_tier=is.null&mastery_score=lt.0.55" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=minimal" \
      -d '{"current_tier": "developing"}')
    [[ "$code" == "204" ]] && echo "    ✓ mastery < 0.55 → developing" || echo "    ⚠️  HTTP ${code}"
  fi

  echo ""
  echo "  mastery_columns complete."
}

# ─── MAIN ─────────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════════════════════╗"
echo "║  LaunchPard — Image & Column Backfill v3                               ║"
echo "╚══════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Modes       : ${BACKFILL_MODE}"
echo "Image model : ${IMAGE_MODEL} (${IMAGE_PROVIDER})"
echo "Dry run     : ${DRY_RUN}"
[[ -n "$FILTER_CURRICULUM" ]] && echo "Filter      : curriculum=${FILTER_CURRICULUM}"
[[ -n "$FILTER_SUBJECT"    ]] && echo "Filter      : subject=${FILTER_SUBJECT}"
[[ -n "$FILTER_YEAR"       ]] && echo "Filter      : year=${FILTER_YEAR}"
[[ -n "$FILTER_SOURCE"     ]] && echo "Filter      : source=${FILTER_SOURCE}"
echo ""
echo "Valid modes : questions | passages | anchors | columns | topic_slugs | mastery_columns"
echo ""

for mode in $BACKFILL_MODE; do
  case "$mode" in
    questions)      run_questions_mode      ;;
    passages)       run_passages_mode       ;;
    anchors)        run_anchors_mode        ;;
    columns)        run_columns_mode        ;;
    topic_slugs)    run_topic_slugs_mode    ;;
    mastery_columns) run_mastery_columns_mode ;;
    *) echo "⚠️  Unknown mode: ${mode}" ;;
  esac
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════════"
echo "  All selected modes complete."
echo "  Debug log: ${DEBUG_LOG}"
echo "═══════════════════════════════════════════════════════════════════════════"
echo ""
echo "VERIFICATION QUERIES:"
echo ""
echo "  -- Topic slug health check"
echo "  SELECT DISTINCT topic FROM question_bank"
echo "  WHERE (topic ~ '[A-Z ]' OR topic LIKE '% %')"
echo "    AND source='ai' ORDER BY topic;"
echo ""
echo "  -- Tier distribution per topic"
echo "  SELECT subject, year_level, topic, difficulty_tier, COUNT(*) AS n"
echo "  FROM question_bank WHERE source='ai'"
echo "  GROUP BY 1,2,3,4 ORDER BY 1,2,3,4;"
echo ""
echo "  -- session_answers metadata completeness"
echo "  SELECT COUNT(*) FILTER (WHERE difficulty_tier IS NULL) AS missing_tier,"
echo "         COUNT(*) FILTER (WHERE year_level IS NULL)     AS missing_year,"
echo "         COUNT(*) FROM session_answers;"
echo ""
echo "  -- scholar_topic_mastery tier completeness"
echo "  SELECT COUNT(*) FILTER (WHERE current_tier IS NULL) AS missing_tier,"
echo "         COUNT(*) FROM scholar_topic_mastery;"