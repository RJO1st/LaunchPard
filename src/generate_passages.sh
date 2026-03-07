#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  LaunchPard — Passage Generator v2 (New Knowledge Base)                    ║
# ║  Covers subjects/curricula with ZERO existing passages:                    ║
# ║    history (us, australian, nigerian, ib)                                  ║
# ║    geography (us, australian, nigerian, ib)                                ║
# ║    social_studies (us, nigerian, waec, ib)                                 ║
# ║    civic_education (nigerian_jss/sss, waec)                                ║
# ║    science (uk_national, us, australian, ib)                               ║
# ║    english (nigerian_sss)                                                  ║
# ║    verbal_reasoning (uk_11plus)                                            ║
# ║    literature (waec, nigerian, ib)                                         ║
# ║    religious_studies (nigerian, waec)                                      ║
# ║    business_studies / economics (passage-style)                            ║
# ║                                                                             ║
# ║  Passage dedup: passages table has no unique key, so this script checks    ║
# ║  for existing (curriculum, subject, year_level, title) before inserting.  ║
# ║  Safe to run alongside generate_anchors.sh and generate_passages.sh.       ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
set -uo pipefail

# ─── CONFIG ───────────────────────────────────────────────────────────────────
SUPABASE_URL="${SUPABASE_URL:?Set SUPABASE_URL}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:?Set SUPABASE_SERVICE_KEY}"
OPENROUTER_API_KEY="${OPENROUTER_API_KEY:?Set OPENROUTER_API_KEY}"
SUPABASE_STORAGE_BUCKET="${SUPABASE_STORAGE_BUCKET:-question-images}"
IMAGE_PROVIDER="${IMAGE_PROVIDER:-}"       # set to "disabled" to skip images

MODEL="openai/gpt-4o-mini"
IMAGE_MODEL="${IMAGE_MODEL:-sourceful/riverflow-v2-fast}"
QUESTIONS_PER_PASSAGE=6
SLEEP_BETWEEN=2
MAX_RETRIES=3
DEBUG_LOG="passages_v2_debug.txt"

# ─── PASSAGE TARGETS ─────────────────────────────────────────────────────────
# Format: "curriculum|subject|year_min|year_max|passages_per_year"
# All entries below have ZERO existing passages in DB.

PASSAGE_TARGETS=(

  # ── English — nigerian_sss (missing entirely) ─────────────────────────────
  "nigerian_sss|english|10|12|2"

  # ── Verbal Reasoning — uk_11plus (missing entirely, key exam skill) ───────
  "uk_11plus|verbal_reasoning|4|6|3"

  # ── Literature passages (close reading, extract-based questions) ──────────
  "waec|literature|10|12|2"
  "nigerian_jss|literature|7|9|2"
  "nigerian_sss|literature|10|12|2"
  "ib_myp|literature|7|10|2"
  "uk_national|literature|7|11|1"
  "us_common_core|literature|6|10|1"

  # ── History — all missing curricula ──────────────────────────────────────
  "us_common_core|history|4|11|1"
  "australian|history|5|10|1"
  "nigerian_jss|history|7|9|1"
  "nigerian_sss|history|10|12|1"
  "ib_pyp|history|4|6|1"
  "ib_myp|history|7|10|1"

  # ── Geography — all missing curricula ────────────────────────────────────
  "us_common_core|geography|5|10|1"
  "australian|geography|5|10|1"
  "nigerian_jss|geography|7|9|1"
  "nigerian_sss|geography|10|12|1"
  "ib_pyp|geography|4|6|1"
  "ib_myp|geography|7|10|1"

  # ── Social Studies / Individuals & Societies ─────────────────────────────
  "us_common_core|social_studies|3|8|2"
  "nigerian_primary|social_studies|3|6|2"
  "nigerian_jss|social_studies|7|9|1"
  "waec|social_studies|10|12|1"
  "ib_pyp|social_studies|3|6|2"
  "ib_myp|individuals_and_societies|7|10|1"

  # ── Civic Education ───────────────────────────────────────────────────────
  "nigerian_jss|civic_education|7|9|2"
  "nigerian_sss|civic_education|10|12|2"
  "waec|civic_education|10|12|1"

  # ── Science (cross-curricular / passage-based) ────────────────────────────
  "uk_national|science|3|6|1"
  "us_common_core|science|3|8|1"
  "australian|science|3|8|1"
  "ib_pyp|science|3|6|1"
  "nigerian_primary|basic_science|3|6|1"

  # ── Religious Studies ─────────────────────────────────────────────────────
  "nigerian_jss|religious_studies|7|9|2"
  "nigerian_sss|religious_studies|10|12|1"
  "waec|crk|10|12|1"
  "waec|islamic_studies|10|12|1"
  "uk_national|religious_studies|7|11|1"

  # ── Business Studies / Economics (scenario-based passages) ───────────────
  "uk_national|business_studies|10|12|1"
  "waec|business_studies|10|12|1"
  "nigerian_sss|business_studies|10|12|1"
  "uk_national|economics|10|12|1"
  "us_common_core|economics|10|12|1"
  "waec|economics|10|12|1"

)

# ─── CURRICULUM METADATA ─────────────────────────────────────────────────────
declare -A CURRICULUM_NAMES
CURRICULUM_NAMES[uk_11plus]="UK 11+ (GL/CEM)"
CURRICULUM_NAMES[uk_national]="UK National Curriculum"
CURRICULUM_NAMES[us_common_core]="US Common Core"
CURRICULUM_NAMES[australian]="Australian ACARA"
CURRICULUM_NAMES[nigerian_primary]="Nigerian Primary"
CURRICULUM_NAMES[nigerian_jss]="Nigerian JSS"
CURRICULUM_NAMES[nigerian_sss]="Nigerian SSS"
CURRICULUM_NAMES[waec]="WAEC/NECO SSS"
CURRICULUM_NAMES[ib_pyp]="IB PYP"
CURRICULUM_NAMES[ib_myp]="IB MYP"

declare -A SPELLING
SPELLING[uk_11plus]="British"
SPELLING[uk_national]="British"
SPELLING[us_common_core]="American"
SPELLING[australian]="Australian"
SPELLING[nigerian_primary]="British"
SPELLING[nigerian_jss]="British"
SPELLING[nigerian_sss]="British"
SPELLING[waec]="British"
SPELLING[ib_pyp]="British"
SPELLING[ib_myp]="British"

# ─── PASSAGE TOPIC POOLS ──────────────────────────────────────────────────────
# Topics are rotated using (year * passages_per_year + pass_index) % topic_count
# New pools added for every new subject. Existing pools (english, history,
# geography, hass, social_studies, civic_education) preserved exactly from v1
# but extended with curriculum-appropriate topics.
declare -A PASSAGE_TOPICS

# English — general (already in v1 but extended here for nigerian_sss)
PASSAGE_TOPICS[english]="space_exploration|rainforest_animals|ancient_egypt|the_ocean|robots_and_ai|mountain_climbing|the_human_brain|volcanoes|the_arctic|coral_reefs|migration|extreme_weather|bees_and_pollination|the_history_of_chocolate|bioluminescence|the_silk_road|renewable_energy|deep_sea_creatures|the_olympics|urban_farming|the_internet_and_society|plastic_pollution|the_human_genome|self_driving_cars|the_history_of_medicine|space_tourism|deforestation|ocean_acidification|the_mystery_of_dreams|artificial_intelligence"

# Verbal Reasoning (UK 11+ specific: word puzzles, analogies, logic via text)
PASSAGE_TOPICS[verbal_reasoning]="word_families_and_analogies|codes_and_ciphers|logical_deduction|synonym_and_antonym_puzzles|letter_sequences|classification_and_odd_one_out|compound_words_and_word_parts|hidden_words|completing_sentences|word_connections"

# Literature (extract-based: short story, poem intro, novel excerpt contexts)
PASSAGE_TOPICS[literature]="adventure_stories|mystery_and_detective_fiction|science_fiction|historical_fiction|traditional_folktales_and_fables|poetry_nature_and_seasons|friendship_and_belonging|overcoming_challenges|identity_and_culture|war_and_peace_in_literature|fantasy_worlds|conflict_and_resolution|growing_up_and_change|social_justice_in_fiction|the_power_of_storytelling"

# History — US-focused
PASSAGE_TOPICS[us_history]="the_american_revolution|the_constitutional_convention|westward_expansion_and_manifest_destiny|the_civil_war|reconstruction_and_its_aftermath|industrialisation_and_the_gilded_age|world_war_1_and_us_involvement|the_great_depression|world_war_2_and_the_pacific|the_civil_rights_movement|the_cold_war_and_korea|vietnam_war|the_space_race|immigration_and_the_american_dream|the_women_suffrage_movement"

# History — Australian-focused
PASSAGE_TOPICS[aus_history]="first_peoples_and_dreaming_stories|european_exploration_and_contact|convict_settlement_and_the_first_fleet|the_gold_rush|federation_and_australias_constitution|world_war_1_anzac_legend|the_great_depression_in_australia|world_war_2_and_the_pacific|post_war_immigration|the_stolen_generations|land_rights_and_reconciliation|environmental_history|australian_democracy_development|the_1967_referendum|modern_australia_and_globalisation"

# History — Nigerian/African-focused
PASSAGE_TOPICS[nigerian_history]="ancient_benin_kingdom|the_yoruba_empire_and_oyo|the_sokoto_caliphate|trans_atlantic_slave_trade|the_berlin_conference_and_colonisation|indirect_rule_in_nigeria|the_nationalist_movement|nigerian_independence_1960|the_biafran_war|military_rule_in_nigeria|return_to_democracy|pre_colonial_igbo_society|the_hausa_fulani_jihad|colonial_economy_and_cash_crops|women_in_nigerian_history"

# History — IB/global-focused
PASSAGE_TOPICS[history]="the_roman_empire|world_war_1|the_industrial_revolution|ancient_greece|the_slave_trade|the_british_empire|the_cold_war|the_french_revolution|medieval_castles|the_tudors|the_vikings|the_renaissance|the_civil_rights_movement|ancient_egypt|the_ottoman_empire|the_mongol_empire|colonialism_in_africa|the_russian_revolution|the_holocaust|decolonisation_in_africa"

# Geography — US-focused
PASSAGE_TOPICS[us_geography]="the_great_plains|the_mississippi_river|national_parks_and_conservation|tornadoes_and_hurricane_zones|the_rocky_mountains|urbanisation_in_american_cities|the_pacific_coast|immigration_and_changing_demographics|climate_regions_of_north_america|water_scarcity_in_the_west|the_great_lakes|appalachian_mountains_and_mining|agricultural_regions|coastal_erosion|the_everglades"

# Geography — Australian-focused
PASSAGE_TOPICS[aus_geography]="the_great_barrier_reef|the_outback_and_arid_zones|the_murray_darling_basin|bushfires_and_drought|tropical_northern_australia|urbanisation_in_sydney_and_melbourne|the_great_dividing_range|coastal_management|indigenous_land_and_country|water_scarcity_and_the_millennium_drought|the_snowy_mountains|mining_and_resources|sustainable_cities|coral_bleaching|climate_change_in_australia"

# Geography — Nigerian/African-focused
PASSAGE_TOPICS[nigerian_geography]="the_niger_delta|savanna_and_rainforest_zones|lake_chad_and_desertification|population_growth_in_lagos|river_benue_and_river_niger|the_sahel_region|oil_production_and_environmental_impact|agricultural_zones_of_nigeria|deforestation_in_west_africa|climate_change_in_the_sahel|urbanisation_in_abuja|coastal_erosion_in_lagos|tropical_monsoon_climate|mineral_resources_in_nigeria|trading_patterns_in_west_africa"

# Geography — general/IB
PASSAGE_TOPICS[geography]="the_amazon_rainforest|climate_change|earthquakes_and_tsunamis|the_water_cycle|urbanisation|the_sahara_desert|migration_and_refugees|renewable_energy|deforestation|the_great_barrier_reef|population_growth|trade_routes|extreme_weather_events|the_arctic_and_antarctic|volcanic_eruptions|coastal_management|food_security|biodiversity_hotspots|the_himalayan_ecosystem|glaciers_and_ice_caps"

# Social Studies — US-focused
PASSAGE_TOPICS[us_social_studies]="the_three_branches_of_us_government|the_bill_of_rights|federalism_and_states|the_electoral_system|immigration_and_citizenship|native_american_history|the_civil_rights_movement|the_media_and_democracy|economic_systems_capitalism_and_socialism|globalisation_and_trade|environmental_policy|human_rights_in_the_us|the_supreme_court|community_and_local_government|us_foreign_policy"

# Social Studies — Nigerian primary/JSS (age 8-14)
PASSAGE_TOPICS[nigerian_social_studies]="the_nigerian_family|community_helpers|our_environment|cultural_festivals_in_nigeria|the_three_tiers_of_government|transport_and_communication|food_and_farming|water_and_sanitation|traditional_and_modern_medicine|history_of_my_community|natural_resources_of_nigeria|national_unity_and_diversity|traffic_safety|disaster_preparedness|environmental_conservation"

# Social Studies — general/IB
PASSAGE_TOPICS[social_studies]="democracy_and_government|human_rights|global_trade|environmental_challenges|cultural_diversity|migration|community_responsibility|world_religions|the_united_nations|economic_inequality|digital_citizenship|conflict_and_peacebuilding|sustainable_development_goals|gender_equality|child_rights_and_the_uncrc"

# Individuals and Societies (IB MYP)
PASSAGE_TOPICS[individuals_and_societies]="globalisation_and_its_effects|migration_and_cultural_identity|the_impact_of_colonialism|human_rights_and_justice|environmental_sustainability|economic_development_and_inequality|digital_society_and_privacy|conflict_prevention_and_diplomacy|cultural_heritage_and_identity|global_health_challenges"

# Civic Education — Nigerian focus
PASSAGE_TOPICS[civic_education]="citizenship_rights_and_responsibilities|national_identity_and_symbols|democracy_in_action|community_service_and_volunteering|human_trafficking_awareness|drug_abuse_prevention|gender_equality_and_womens_rights|conflict_resolution_and_peace|rule_of_law_and_justice|patriotism_and_national_values|corruption_and_its_effects|environmental_responsibility|childrens_rights|electoral_process_in_nigeria|the_role_of_civil_society"

# Science — general cross-curricular (passage introduces concept, questions follow)
PASSAGE_TOPICS[science]="the_human_digestive_system|plants_and_photosynthesis|the_water_cycle|forces_and_gravity|electricity_and_magnetism|the_solar_system_and_space|life_cycles_of_animals|microorganisms_and_disease|states_of_matter|ecosystems_and_food_chains|light_and_shadows|sound_and_waves|the_rock_cycle|adaptation_and_survival|climate_change_and_the_environment|the_atom|chemical_reactions_in_everyday_life|the_human_skeleton|biodiversity_and_habitats|renewable_and_nonrenewable_energy"

# Basic Science (Nigerian primary/JSS)
PASSAGE_TOPICS[basic_science]="living_and_nonliving_things|plants_and_their_uses|animals_and_their_habitats|the_human_body|water_and_its_importance|soil_and_farming|weather_and_climate|simple_machines|electricity_in_everyday_life|rocks_and_minerals|food_and_nutrition|keeping_healthy|air_and_wind|reproduction_in_plants|conservation_of_the_environment"

# Religious Studies
PASSAGE_TOPICS[religious_studies]="the_origins_of_islam|the_life_of_jesus_christ|the_five_pillars_of_islam|the_ten_commandments|the_holy_quran_and_bible|prayer_and_worship_across_religions|religious_festivals_eid_and_christmas|the_life_of_prophet_muhammad|parables_of_jesus|moral_values_in_religion|tolerance_and_interfaith_dialogue|creation_stories|sacrifice_and_service|religious_pilgrimage|religion_and_science"

# CRK (Christian Religious Knowledge — WAEC)
PASSAGE_TOPICS[crk]="the_call_of_abraham|moses_and_the_exodus|the_psalms_and_proverbs|the_life_of_king_david|the_prophets_of_israel|the_nativity_and_birth_of_jesus|the_sermon_on_the_mount|miracles_of_jesus|the_last_supper_and_crucifixion|the_resurrection_and_ascension|the_early_church_acts_of_apostles|paul_and_the_epistles|faith_hope_and_charity|the_judgement_and_salvation|christian_living_and_service"

# Islamic Studies (WAEC)
PASSAGE_TOPICS[islamic_studies]="the_life_of_prophet_muhammad|the_five_pillars_of_islam|the_holy_quran_and_revelation|the_hijra_and_early_muslim_community|the_caliphate_and_early_islam|salah_and_daily_prayer|zakat_and_caring_for_others|the_hajj_pilgrimage|islamic_ethics_and_conduct|ramadan_and_fasting|the_expansion_of_islam|women_in_islam|islamic_law_and_shariah|science_and_knowledge_in_islam|islam_in_west_africa"

# Literature (general/ib/waec)
PASSAGE_TOPICS[literature]="adventure_stories|mystery_and_detective_fiction|science_fiction|historical_fiction|traditional_folktales_and_fables|poetry_nature_and_seasons|friendship_and_belonging|overcoming_challenges|identity_and_culture|war_and_peace_in_literature|fantasy_worlds|conflict_and_resolution|growing_up_and_change|social_justice_in_fiction|the_power_of_storytelling"

# Business Studies (scenario-based passages)
PASSAGE_TOPICS[business_studies]="starting_a_small_business|the_marketing_mix|business_ownership_types|supply_chain_management|customer_service_excellence|digital_marketing|reading_a_profit_and_loss_account|recruitment_and_selection|business_ethics|entrepreneurs_and_innovation|cash_flow_and_finance|branding_and_positioning|globalisation_and_multinational_companies|sustainability_in_business|e_commerce_and_the_digital_economy"

# Economics (scenario/case study passages)
PASSAGE_TOPICS[economics]="supply_and_demand_in_action|inflation_and_the_cost_of_living|unemployment_causes_and_effects|international_trade_and_globalisation|the_role_of_central_banks|economic_growth_and_development|income_inequality|environmental_economics|taxation_and_public_spending|the_informal_economy|microfinance_and_poverty_reduction|the_economics_of_education|commodity_markets|foreign_direct_investment|economic_planning_vs_free_markets"

# HASS (already in v1, kept here for reference — not re-added to PASSAGE_TARGETS)
PASSAGE_TOPICS[hass]="indigenous_australian_culture|federation_of_australia|gold_rush|the_environment|australian_democracy|migration_to_australia|the_great_barrier_reef|drought_and_bushfire|sustainable_living|cultural_diversity"

# ─── TOPIC SELECTOR ──────────────────────────────────────────────────────────
# Some curricula need curriculum-specific topic pools.
# This function returns the right pool key given curriculum and subject.
get_topic_pool_key() {
  local curriculum="$1" subject="$2"
  case "${curriculum}|${subject}" in
    us_common_core|history)          echo "us_history" ;;
    australian|history)              echo "aus_history" ;;
    nigerian_jss|history|nigerian_sss|history|waec|history) echo "nigerian_history" ;;
    us_common_core|geography)        echo "us_geography" ;;
    australian|geography)            echo "aus_geography" ;;
    nigerian_jss|geography|nigerian_sss|geography) echo "nigerian_geography" ;;
    us_common_core|social_studies)   echo "us_social_studies" ;;
    nigerian_primary|social_studies|nigerian_jss|social_studies) echo "nigerian_social_studies" ;;
    ib_myp|individuals_and_societies) echo "individuals_and_societies" ;;
    nigerian_primary|basic_science|nigerian_jss|basic_science) echo "basic_science" ;;
    waec|crk)                        echo "crk" ;;
    waec|islamic_studies)            echo "islamic_studies" ;;
    *)                               echo "$subject" ;;
  esac
}

# ─── SHARED FUNCTIONS ─────────────────────────────────────────────────────────
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

  local data_url
  data_url=$(echo "$body" | jq -r '.choices[0].message.images[0].image_url.url // empty' 2>/dev/null)
  if [[ -z "$data_url" ]]; then
    echo "    ⚠️  No image in response" >&2
    echo ""; return
  fi
  echo "$data_url"
}

upload_image_to_supabase() {
  local data_url="$1" dest_path="$2"
  local tmp_file
  tmp_file=$(mktemp /tmp/launchpard_XXXXXX) && mv "$tmp_file" "${tmp_file}.png" && tmp_file="${tmp_file}.png"

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

call_openrouter() {
  local system_prompt="$1" user_prompt="$2"
  local response body http_code content=""
  for attempt in $(seq 1 $MAX_RETRIES); do
    response=$(curl -s -w "\n%{http_code}" "https://openrouter.ai/api/v1/chat/completions" \
      -H "Authorization: Bearer ${OPENROUTER_API_KEY}" \
      -H "Content-Type: application/json" \
      -H "HTTP-Referer: https://launchpard.com" \
      -H "X-Title: LaunchPard Passage Generator v2" \
      -d "$(jq -n \
        --arg model "$MODEL" \
        --arg sys "$system_prompt" \
        --arg usr "$user_prompt" \
        '{model:$model,max_tokens:2000,temperature:0.7,messages:[{role:"system",content:$sys},{role:"user",content:$usr}]}')")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    if [[ "$http_code" -eq 200 ]]; then
      content=$(echo "$body" | jq -r '.choices[0].message.content // empty')
      [[ -n "$content" ]] && break
    fi
    echo "    ✗ Attempt $attempt failed (HTTP $http_code), retrying…" >&2
    sleep 5
  done
  echo "$content"
}

extract_json_object() {
  echo "$1" | python3 -c "
import sys, json, re
txt = sys.stdin.read()
for m in re.finditer(r'\{', txt):
    for end in range(len(txt), m.start(), -1):
        try:
            obj = json.loads(txt[m.start():end])
            print(json.dumps(obj)); break
        except: pass
    else: continue
    break
" 2>/dev/null
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

# ─── GENERATE ONE PASSAGE + QUESTIONS (with duplicate check) ─────────────────
generate_passage_set() {
  local curriculum="$1" subject="$2" year="$3" topic="$4"
  local curriculum_name="${CURRICULUM_NAMES[$curriculum]:-$curriculum}"
  local spelling="${SPELLING[$curriculum]:-British}"
  local topic_display="${topic//_/ }"

  echo "  → Passage: ${curriculum} / ${subject} / Y${year} / ${topic_display}"

  # ── DUPLICATE CHECK (by curriculum + subject + year + topic slug in title) ─
  # Passages don't have a unique key, so we check if a passage with a similar
  # title already exists for this curriculum/subject/year to avoid re-generating.
  local title_slug; title_slug=$(echo "$topic_display" | tr '[:upper:]' '[:lower:]' | sed 's/ /%20/g')
  local check_resp
  check_resp=$(curl -s \
    "${SUPABASE_URL}/rest/v1/passages?select=id&curriculum=eq.${curriculum}&subject=eq.${subject}&year_level=eq.${year}&title=ilike.*${title_slug}*" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}")
  if [[ $(echo "$check_resp" | jq 'length') -gt 0 ]]; then
    echo "    ⏭️  Passage already exists for this topic, skipping"
    return 0
  fi

  # ── STEP 1: Generate passage ──────────────────────────────────────────────
  # Verbal reasoning passages need special instructions
  local passage_type_instruction
  if [[ "$subject" == "verbal_reasoning" ]]; then
    passage_type_instruction="Write a SHORT verbal reasoning question-set stimulus for Year ${year} students on the theme: ${topic_display}.
This should be a short paragraph (80-120 words) followed by 2-3 warm-up sentence examples that a child would read.
The passage is a stimulus, not a full article."
  elif [[ "$subject" == "literature" ]]; then
    passage_type_instruction="Write a literary EXTRACT (fiction or poetry) suitable for Year ${year} students on the theme: ${topic_display}.
The extract should be 150-200 words, high quality, and suitable for comprehension questions.
Include vivid language, character, setting or emotion that students can analyse."
  else
    passage_type_instruction="Write a reading passage for Year ${year} students on the topic: ${topic_display}.
The passage must be:
- 180-250 words long
- Age-appropriate, engaging, and informative
- Structured with a clear opening, body, and conclusion
- Free of bias, culturally sensitive, and factually accurate"
  fi

  local passage_system="You are an expert educational writer for ${curriculum_name}.
Use ${spelling} English spelling.
${passage_type_instruction}

Respond ONLY with a JSON object containing:
  { \"title\": \"...\", \"body\": \"...\" }
No markdown, no preamble."

  local passage_raw passage_json
  passage_raw=$(call_openrouter "$passage_system" "Write a Year ${year} ${subject} passage about: ${topic_display}")
  passage_json=$(extract_json_object "$passage_raw")

  if [[ -z "$passage_json" ]]; then
    echo "    ✗ Failed to generate passage" >&2; return 1
  fi

  local passage_title passage_body word_count
  passage_title=$(echo "$passage_json" | jq -r '.title // "Untitled"')
  passage_body=$(echo "$passage_json"  | jq -r '.body  // ""')
  word_count=$(echo "$passage_body" | wc -w)

  echo "    ✓ Passage: \"${passage_title}\" (${word_count} words)"

  # ── STEP 2: Generate comprehension/analysis questions ────────────────────
  local q_instruction
  if [[ "$subject" == "literature" ]]; then
    q_instruction="Vary question types: language analysis, inference, character/setting, author's technique, vocabulary in context, personal response."
  elif [[ "$subject" == "verbal_reasoning" ]]; then
    q_instruction="Focus on: word meaning, logical deduction from the passage, synonyms, analogies, completing patterns."
  else
    q_instruction="Vary question types: literal recall, inference, vocabulary-in-context, author's purpose."
  fi

  local q_system="You are an expert educational assessor for ${curriculum_name}.
Use ${spelling} English spelling.
You will be given a reading passage. Write exactly ${QUESTIONS_PER_PASSAGE} comprehension questions for Year ${year} students.

ACCURACY IS CRITICAL:
1. Base ALL questions directly on the passage text.
2. The correct answer MUST be derivable from the passage — do not introduce outside facts.
3. Derive the correct answer, write it as one option, set correct_index to its 0-based position, double-check it.
4. ${q_instruction}

Return ONLY a JSON array of objects, each with:
  { \"question_text\": \"...\", \"options\": [\"A\",\"B\",\"C\",\"D\"], \"correct_index\": 0, \"explanation\": \"...\", \"topic\": \"comprehension\" }"

  local q_raw q_array
  q_raw=$(call_openrouter "$q_system" "Passage title: ${passage_title}

${passage_body}

Write ${QUESTIONS_PER_PASSAGE} comprehension questions based ONLY on this passage.")
  q_array=$(extract_json_array "$q_raw")

  if [[ -z "$q_array" ]]; then
    echo "    ✗ Failed to generate questions" >&2; return 1
  fi

  local q_count; q_count=$(echo "$q_array" | jq 'length')
  echo "    ✓ ${q_count} questions generated"

  # ── STEP 3: Generate illustration ────────────────────────────────────────
  local passage_image_url=""
  if [[ "${IMAGE_PROVIDER:-}" != "disabled" ]]; then
    local img_prompt="An educational illustration for a reading passage about ${topic_display}, suitable for Year ${year} students. Clean, colourful, informative style."
    local gen_url; gen_url=$(generate_image "$img_prompt")
    if [[ -n "$gen_url" ]]; then
      local dest="passages/${curriculum}/${subject}/${year}_${topic}_${RANDOM}.png"
      passage_image_url=$(upload_image_to_supabase "$gen_url" "$dest")
      [[ -n "$passage_image_url" ]] && echo "    ✓ Passage image uploaded" || echo "    ⚠️  Image upload failed"
    fi
  fi

  # ── STEP 4: Insert passage ────────────────────────────────────────────────
  local passage_insert
  passage_insert=$(jq -n \
    --arg title "$passage_title" \
    --arg body "$passage_body" \
    --arg curriculum "$curriculum" \
    --arg subject "$subject" \
    --argjson year "$year" \
    --argjson word_count "$word_count" \
    --arg image_url "$passage_image_url" \
    '{title:$title,body:$body,curriculum:$curriculum,subject:$subject,year_level:$year,
      word_count:$word_count,source:"ai",
      image_url:(if $image_url=="" then null else $image_url end)}')

  local insert_resp
  insert_resp=$(curl -s \
    "${SUPABASE_URL}/rest/v1/passages" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$passage_insert")

  local passage_id
  passage_id=$(echo "$insert_resp" | jq -r '.[0].id // empty')
  if [[ -z "$passage_id" ]]; then
    echo "    ✗ Failed to insert passage (response: ${insert_resp:0:120})" >&2; return 1
  fi
  echo "    ✓ Passage inserted: ${passage_id}"

  # ── STEP 5: Insert questions linked to passage_id ─────────────────────────
  local inserted=0
  for i in $(seq 0 $((q_count - 1))); do
    local q; q=$(echo "$q_array" | jq ".[$i]")
    local q_text opts cidx exp q_topic
    q_text=$(echo "$q"   | jq -r '.question_text // empty')
    opts=$(echo "$q"     | jq -c '.options // []')
    cidx=$(echo "$q"     | jq -r '.correct_index // 0')
    exp=$(echo "$q"      | jq -r '.explanation // ""')
    q_topic=$(echo "$q"  | jq -r '.topic // "comprehension"')

    [[ -z "$q_text" ]] && continue

    local opts_len; opts_len=$(echo "$opts" | jq 'length')
    if ! [[ "$cidx" =~ ^[0-9]+$ ]] || [[ "$cidx" -ge "$opts_len" ]]; then cidx=0; fi

    local q_data; q_data=$(jq -n \
      --arg q "$q_text" --argjson opts "$opts" --argjson a "$cidx" \
      --arg exp "$exp" --arg topic "$q_topic" \
      '{q:$q,opts:$opts,a:$a,exp:$exp,topic:$topic}')

    local position=$((i + 1))
    local row; row=$(jq -n \
      --arg passage_id "$passage_id" \
      --arg subject "$subject" \
      --argjson year "$year" \
      --arg topic "$q_topic" \
      --arg q_text "$q_text" \
      --argjson opts "$opts" \
      --argjson cidx "$cidx" \
      --arg exp "$exp" \
      --arg curriculum "$curriculum" \
      --argjson position "$position" \
      --argjson q_data "$q_data" \
      '{passage_id:$passage_id,subject:$subject,year_level:$year,topic:$topic,
        question_text:$q_text,options:$opts,correct_index:$cidx,explanation:$exp,
        curriculum:$curriculum,group_position:$position,question_data:$q_data,
        source:"ai",question_type:"mcq",answer_type:"choice",difficulty_tier:"developing"}')

    local code; code=$(curl -s -o /dev/null -w "%{http_code}" \
      "${SUPABASE_URL}/rest/v1/question_bank" \
      -H "apikey: ${SUPABASE_SERVICE_KEY}" \
      -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
      -H "Content-Type: application/json" \
      -H "Prefer: return=minimal" \
      -d "$row")

    [[ "$code" == "201" ]] && { echo -n "."; ((inserted++)); } || echo -n "✗(${code})"
  done
  echo ""
  echo "    ✓ ${inserted}/${q_count} questions inserted with passage_id=${passage_id}"
  sleep "$SLEEP_BETWEEN"
}

# ─── MAIN ─────────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  LaunchPard Passage Generator v2 (New Knowledge Base)      ║"
echo "║  Adds: history, geography, social studies, civic ed,       ║"
echo "║  science, literature, religious studies, business, econ,   ║"
echo "║  verbal reasoning, nigerian_sss english                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

total_passages=0
total_questions=0

for target in "${PASSAGE_TARGETS[@]}"; do
  IFS='|' read -r curriculum subject year_min year_max passages_per_year <<< "$target"
  local_curriculum_name="${CURRICULUM_NAMES[$curriculum]:-$curriculum}"

  echo ""
  echo "━━━ ${local_curriculum_name} / ${subject} (Y${year_min}–Y${year_max}, ${passages_per_year}/year) ━━━"

  # Select the right topic pool for this curriculum+subject combo
  pool_key=$(get_topic_pool_key "$curriculum" "$subject")
  pool="${PASSAGE_TOPICS[$pool_key]:-general}"

  IFS='|' read -ra topics <<< "$pool"
  topic_count=${#topics[@]}

  for ((year=year_min; year<=year_max; year++)); do
    for ((p=0; p<passages_per_year; p++)); do
      topic="${topics[$(( (year * passages_per_year + p) % topic_count ))]}"
      if generate_passage_set "$curriculum" "$subject" "$year" "$topic"; then
        ((total_passages++)) || true
        total_questions=$((total_questions + QUESTIONS_PER_PASSAGE))
      fi
    done
  done
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Passages generated : ${total_passages}"
echo "  Questions inserted : ${total_questions}"
echo "═══════════════════════════════════════════════════════════════"