#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  LaunchPard — Context Anchor Generator v2 (New Knowledge Base)             ║
# ║  Covers subjects with ZERO existing anchors:                               ║
# ║    mathematics, computer_science/ict, accounting, agricultural_science,    ║
# ║    home_economics, history, civic_education, social_studies,               ║
# ║    religious_studies, statistics                                            ║
# ║  Also fills curriculum gaps: uk_11plus, nigerian_sss, ib_pyp/myp full,    ║
# ║    us_common_core science, deeper biology/physics/chemistry/geography.     ║
# ║                                                                             ║
# ║  Duplicate-safe: skips any anchor already in context_anchors.             ║
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
QUESTIONS_PER_ANCHOR=5
SLEEP_BETWEEN=2
MAX_RETRIES=3
DEBUG_LOG="anchors_v2_debug.txt"

# ─── ANCHOR TARGETS ──────────────────────────────────────────────────────────
# Format: "curriculum|subject|year|topic|has_formulas"
# Every entry below is a subject/curriculum combo with ZERO existing coverage.
# The duplicate check in generate_anchor_set() will skip anything already in DB.

ANCHOR_TARGETS=(

  # ══════════════════════════════════════════════════════════════════
  # MATHEMATICS — biggest gap, zero anchors across all curricula
  # ══════════════════════════════════════════════════════════════════

  # UK 11+ Mathematics (entire curriculum missing)
  "uk_11plus|mathematics|4|place_value_and_ordering|true"
  "uk_11plus|mathematics|4|addition_and_subtraction_methods|true"
  "uk_11plus|mathematics|5|fractions_and_mixed_numbers|true"
  "uk_11plus|mathematics|5|area_perimeter_and_volume|true"
  "uk_11plus|mathematics|5|angles_and_2d_shapes|false"
  "uk_11plus|mathematics|6|ratio_and_proportion|true"
  "uk_11plus|mathematics|6|algebra_and_sequences|true"
  "uk_11plus|mathematics|6|data_handling_and_averages|true"
  "uk_11plus|mathematics|6|speed_distance_time|true"
  "uk_11plus|mathematics|6|probability|true"

  # UK National — Mathematics (all years, no anchors exist)
  "uk_national|mathematics|5|place_value_decimals_rounding|true"
  "uk_national|mathematics|6|fractions_decimals_percentages|true"
  "uk_national|mathematics|7|ratio_and_proportion|true"
  "uk_national|mathematics|7|introduction_to_algebra|true"
  "uk_national|mathematics|8|linear_equations_and_graphs|true"
  "uk_national|mathematics|8|area_perimeter_and_volume|true"
  "uk_national|mathematics|9|pythagoras_theorem|true"
  "uk_national|mathematics|9|simultaneous_equations|true"
  "uk_national|mathematics|10|quadratic_equations|true"
  "uk_national|mathematics|10|circle_theorems|true"
  "uk_national|mathematics|11|probability_and_statistics|true"
  "uk_national|mathematics|11|vectors|true"
  "uk_national|mathematics|12|differentiation|true"
  "uk_national|mathematics|12|integration|true"

  # WAEC Mathematics
  "waec|mathematics|10|indices_and_logarithms|true"
  "waec|mathematics|10|set_theory_and_venn_diagrams|true"
  "waec|mathematics|11|linear_and_quadratic_equations|true"
  "waec|mathematics|11|mensuration_and_surface_area|true"
  "waec|mathematics|12|coordinate_geometry|true"
  "waec|mathematics|12|statistics_mean_median_mode|true"
  "waec|mathematics|12|probability|true"
  "waec|mathematics|12|vectors_and_transformation|true"

  # US Common Core — Mathematics
  "us_common_core|mathematics|3|multiplication_and_division|true"
  "us_common_core|mathematics|4|fractions_on_a_number_line|true"
  "us_common_core|mathematics|5|order_of_operations_and_decimals|true"
  "us_common_core|mathematics|6|ratios_and_proportional_reasoning|true"
  "us_common_core|mathematics|7|integers_and_rational_numbers|true"
  "us_common_core|mathematics|8|linear_functions_and_slope|true"
  "us_common_core|mathematics|9|systems_of_equations|true"
  "us_common_core|mathematics|10|quadratic_functions|true"
  "us_common_core|mathematics|11|trigonometric_functions|true"
  "us_common_core|mathematics|12|limits_and_derivatives|true"

  # Australian — Mathematics
  "australian|mathematics|4|multiplication_and_division|true"
  "australian|mathematics|5|fractions_and_decimals|true"
  "australian|mathematics|6|percentages_and_ratio|true"
  "australian|mathematics|7|integers_and_introduction_to_algebra|true"
  "australian|mathematics|8|linear_equations|true"
  "australian|mathematics|9|pythagoras_and_trigonometry|true"
  "australian|mathematics|10|quadratic_functions|true"
  "australian|mathematics|11|calculus_introduction|true"

  # IB PYP — Mathematics
  "ib_pyp|mathematics|3|number_patterns_and_place_value|true"
  "ib_pyp|mathematics|4|fractions_and_operations|true"
  "ib_pyp|mathematics|5|measurement_units_and_data|true"
  "ib_pyp|mathematics|6|ratio_proportion_and_geometry|true"

  # IB MYP — Mathematics (zero maths anchors)
  "ib_myp|mathematics|7|algebraic_expressions_and_equations|true"
  "ib_myp|mathematics|8|geometry_and_transformations|true"
  "ib_myp|mathematics|9|trigonometry_and_pythagoras|true"
  "ib_myp|mathematics|10|probability_and_statistics|true"
  "ib_myp|mathematics|11|functions_and_graphs|true"

  # Nigerian Primary — Mathematics
  "nigerian_primary|mathematics|3|addition_subtraction_and_place_value|true"
  "nigerian_primary|mathematics|4|multiplication_tables_and_division|true"
  "nigerian_primary|mathematics|5|fractions_and_decimals|true"
  "nigerian_primary|mathematics|6|ratio_percentages_and_simple_interest|true"

  # Nigerian JSS — Mathematics
  "nigerian_jss|mathematics|7|whole_numbers_directed_numbers_and_fractions|true"
  "nigerian_jss|mathematics|8|algebraic_expressions_and_simple_equations|true"
  "nigerian_jss|mathematics|9|plane_geometry_and_mensuration|true"

  # Nigerian SSS — Mathematics
  "nigerian_sss|mathematics|10|quadratic_equations_and_inequalities|true"
  "nigerian_sss|mathematics|11|trigonometry_and_circle_geometry|true"
  "nigerian_sss|mathematics|12|calculus_and_statistics|true"

  # ══════════════════════════════════════════════════════════════════
  # COMPUTER SCIENCE / ICT — zero anchors across all curricula
  # ══════════════════════════════════════════════════════════════════

  "uk_national|computer_science|7|binary_numbers_and_data_representation|true"
  "uk_national|computer_science|8|algorithms_and_flowcharts|false"
  "uk_national|computer_science|9|programming_variables_loops_functions|false"
  "uk_national|computer_science|10|networks_internet_and_protocols|false"
  "uk_national|computer_science|11|databases_and_sql|false"
  "uk_national|computer_science|12|computational_thinking_and_complexity|true"
  "waec|computer_science|10|computer_hardware_and_software|false"
  "waec|computer_science|11|programming_fundamentals|false"
  "waec|computer_science|12|data_structures_and_algorithms|true"
  "nigerian_jss|ict|7|introduction_to_computers_and_peripherals|false"
  "nigerian_jss|ict|8|word_processing_and_spreadsheets|false"
  "nigerian_jss|ict|9|internet_safety_and_email|false"
  "nigerian_sss|ict|10|networking_and_cybersecurity|false"
  "nigerian_sss|ict|11|database_management_systems|false"
  "nigerian_sss|ict|12|programming_in_python_or_basic|false"
  "us_common_core|computer_science|6|coding_sequences_and_algorithms|false"
  "us_common_core|computer_science|8|data_representation_and_privacy|true"
  "us_common_core|computer_science|11|artificial_intelligence_and_machine_learning|false"
  "australian|digital_technologies|5|algorithms_and_visual_programming|false"
  "australian|digital_technologies|8|data_representation_and_databases|true"
  "australian|digital_technologies|10|programming_and_cybersecurity|false"
  "ib_myp|computer_science|8|system_fundamentals|false"
  "ib_myp|computer_science|10|networks_and_communication|false"

  # ══════════════════════════════════════════════════════════════════
  # ACCOUNTING — zero anchors across all curricula
  # ══════════════════════════════════════════════════════════════════

  "waec|accounting|10|double_entry_and_ledger_accounts|true"
  "waec|accounting|11|trial_balance_and_final_accounts|true"
  "waec|accounting|12|partnership_accounts_and_analysis|true"
  "nigerian_sss|accounting|10|source_documents_and_books_of_original_entry|false"
  "nigerian_sss|accounting|11|bank_reconciliation_statement|true"
  "nigerian_sss|accounting|12|company_accounts_and_share_capital|true"
  "uk_national|accounting|12|financial_ratio_analysis|true"
  "ib_myp|accounting|10|income_statement_and_balance_sheet|true"
  "us_common_core|accounting|11|accounting_equation_and_journals|true"
  "australian|accounting|11|recording_financial_transactions|true"

  # ══════════════════════════════════════════════════════════════════
  # AGRICULTURAL SCIENCE — zero anchors across all curricula
  # ══════════════════════════════════════════════════════════════════

  "waec|agricultural_science|10|soil_types_composition_and_properties|false"
  "waec|agricultural_science|10|crop_production_and_husbandry|false"
  "waec|agricultural_science|11|animal_husbandry_and_livestock_management|false"
  "waec|agricultural_science|11|farm_machinery_and_implements|false"
  "waec|agricultural_science|12|pest_disease_control_and_storage|false"
  "waec|agricultural_science|12|agricultural_marketing_and_cooperatives|false"
  "nigerian_jss|agricultural_science|7|introduction_to_farming_and_land_clearing|false"
  "nigerian_jss|agricultural_science|8|food_crops_and_cash_crops|false"
  "nigerian_jss|agricultural_science|9|poultry_and_fish_farming|false"
  "nigerian_sss|agricultural_science|10|soil_science_and_fertilisers|false"
  "nigerian_sss|agricultural_science|11|crop_improvement_and_genetics|false"
  "nigerian_sss|agricultural_science|12|agricultural_economics_and_finance|true"

  # ══════════════════════════════════════════════════════════════════
  # HOME ECONOMICS — zero anchors across all curricula
  # ══════════════════════════════════════════════════════════════════

  "waec|home_economics|10|food_nutrients_macros_and_micros|false"
  "waec|home_economics|10|clothing_textiles_and_fibres|false"
  "waec|home_economics|11|meal_planning_and_budgeting|false"
  "waec|home_economics|12|consumer_education_and_family_finance|false"
  "nigerian_jss|home_economics|7|personal_hygiene_grooming_and_health|false"
  "nigerian_jss|home_economics|8|basic_cooking_methods_and_nutrition|false"
  "nigerian_jss|home_economics|9|clothing_care_and_simple_sewing|false"
  "nigerian_sss|home_economics|10|family_living_and_child_development|false"
  "nigerian_sss|home_economics|11|interior_decoration_and_home_management|false"
  "uk_national|food_technology|8|nutrition_and_balanced_diet|false"
  "uk_national|food_technology|9|food_science_preservation_and_processing|false"

  # ══════════════════════════════════════════════════════════════════
  # HISTORY — zero anchors, diagram/timeline style
  # ══════════════════════════════════════════════════════════════════

  "uk_national|history|7|the_norman_conquest_1066|false"
  "uk_national|history|8|causes_of_the_british_empire|false"
  "uk_national|history|9|causes_and_consequences_of_world_war_2|false"
  "uk_national|history|10|causes_of_world_war_1|false"
  "uk_national|history|11|the_cold_war|false"
  "waec|history|10|pre_colonial_african_kingdoms|false"
  "waec|history|11|colonialism_and_the_scramble_for_africa|false"
  "waec|history|12|nigerian_independence_and_early_government|false"
  "us_common_core|history|5|american_revolution_causes_and_events|false"
  "us_common_core|history|8|civil_war_causes_and_reconstruction|false"
  "us_common_core|history|11|the_cold_war_and_korean_war|false"
  "us_common_core|history|12|civil_rights_movement|false"
  "australian|history|6|first_fleet_colonisation_and_convicts|false"
  "australian|history|9|world_war_1_anzac_and_gallipoli|false"
  "australian|history|10|world_war_2_pacific_theatre|false"
  "ib_myp|history|8|the_industrial_revolution|false"
  "ib_myp|history|10|20th_century_world_conflicts|false"
  "nigerian_sss|history|10|pre_colonial_nigerian_kingdoms|false"
  "nigerian_sss|history|11|colonialism_and_resistance_in_nigeria|false"
  "nigerian_sss|history|12|nigerian_independence_and_republic|false"
  "nigerian_jss|history|7|ancient_civilisations_of_africa|false"
  "nigerian_jss|history|8|trans_atlantic_slave_trade|false"

  # ══════════════════════════════════════════════════════════════════
  # CIVIC EDUCATION / SOCIAL STUDIES — zero anchors
  # ══════════════════════════════════════════════════════════════════

  "nigerian_jss|civic_education|7|citizenship_rights_and_responsibilities|false"
  "nigerian_jss|civic_education|8|democracy_rule_of_law_and_human_rights|false"
  "nigerian_jss|civic_education|9|national_consciousness_and_patriotism|false"
  "nigerian_sss|civic_education|10|drug_abuse_trafficking_and_prevention|false"
  "nigerian_sss|civic_education|11|human_trafficking_and_gender_equality|false"
  "nigerian_sss|civic_education|12|corruption_and_anticorruption_agencies|false"
  "waec|social_studies|10|family_life_culture_and_values|false"
  "waec|social_studies|11|social_problems_and_community_development|false"
  "us_common_core|social_studies|5|three_branches_of_us_government|false"
  "us_common_core|social_studies|8|bill_of_rights_and_amendments|false"
  "us_common_core|social_studies|10|global_citizenship_and_human_rights|false"
  "ib_pyp|social_studies|4|communities_sharing_and_responsibility|false"
  "ib_pyp|social_studies|5|government_and_global_issues|false"
  "ib_myp|individuals_and_societies|8|migration_and_cultural_identity|false"
  "ib_myp|individuals_and_societies|10|globalisation_and_its_effects|false"

  # ══════════════════════════════════════════════════════════════════
  # RELIGIOUS STUDIES — zero anchors
  # ══════════════════════════════════════════════════════════════════

  "nigerian_jss|religious_studies|7|origins_of_christianity_and_islam|false"
  "nigerian_jss|religious_studies|8|moral_values_and_religious_ethics|false"
  "nigerian_sss|religious_studies|10|world_religions_comparison|false"
  "nigerian_sss|religious_studies|11|religion_and_society_in_nigeria|false"
  "waec|crk|10|old_testament_themes|false"
  "waec|crk|11|new_testament_and_the_early_church|false"
  "waec|islamic_studies|10|pillars_of_islam_and_quran|false"
  "waec|islamic_studies|11|islamic_history_and_caliphate|false"
  "uk_national|religious_studies|7|world_religions_beliefs_and_practices|false"
  "uk_national|religious_studies|9|ethics_philosophy_and_religion|false"

  # ══════════════════════════════════════════════════════════════════
  # STATISTICS — standalone beyond maths (deeper treatment)
  # ══════════════════════════════════════════════════════════════════

  "uk_national|statistics|12|hypothesis_testing_and_significance|true"
  "uk_national|statistics|12|normal_distribution_and_z_scores|true"
  "waec|statistics|12|regression_and_correlation|true"
  "us_common_core|statistics|11|sampling_distributions_and_inference|true"
  "ib_myp|statistics|11|probability_distributions_and_expected_value|true"
  "australian|mathematics|12|continuous_random_variables|true"

  # ══════════════════════════════════════════════════════════════════
  # FURTHER MATHS — additional topics not yet covered
  # ══════════════════════════════════════════════════════════════════

  "uk_national|further_mathematics|12|proof_by_induction|true"
  "uk_national|further_mathematics|12|differential_equations|true"
  "uk_national|further_mathematics|12|hyperbolic_functions|true"
  "waec|further_mathematics|12|permutations_and_combinations|true"
  "waec|further_mathematics|12|vectors_3d_and_dot_product|true"
  "ib_myp|further_mathematics|9|trigonometric_identities|true"
  "ib_myp|further_mathematics|10|complex_numbers|true"

  # ══════════════════════════════════════════════════════════════════
  # NIGERIAN SSS — STEM (currently only 7 anchors, mostly economics/govt)
  # ══════════════════════════════════════════════════════════════════

  "nigerian_sss|biology|10|cell_division_mitosis_and_meiosis|false"
  "nigerian_sss|biology|11|genetics_and_variation|false"
  "nigerian_sss|biology|12|ecology_and_environmental_conservation|false"
  "nigerian_sss|physics|10|linear_motion_and_equations_of_motion|true"
  "nigerian_sss|physics|11|waves_sound_and_light|true"
  "nigerian_sss|physics|12|electromagnetic_induction_and_transformers|true"
  "nigerian_sss|chemistry|10|atomic_structure_and_periodic_table|false"
  "nigerian_sss|chemistry|11|chemical_equilibrium_and_le_chatelier|true"
  "nigerian_sss|chemistry|12|electrochemistry_and_electrolysis|true"

  # ══════════════════════════════════════════════════════════════════
  # US COMMON CORE — SCIENCE (currently only 2 anchors)
  # ══════════════════════════════════════════════════════════════════

  "us_common_core|science|3|life_cycles_of_plants_and_animals|false"
  "us_common_core|science|4|energy_forms_heat_light_sound|true"
  "us_common_core|science|5|ecosystems_food_webs_and_energy_flow|false"
  "us_common_core|science|8|forces_newtons_laws_and_motion|true"
  "us_common_core|science|9|chemical_reactions_and_conservation_of_mass|true"
  "us_common_core|science|10|genetics_heredity_and_natural_selection|false"
  "us_common_core|science|11|ecology_biomes_and_climate_change|false"

  # ══════════════════════════════════════════════════════════════════
  # IB PYP — broader coverage (currently only 2 anchors)
  # ══════════════════════════════════════════════════════════════════

  "ib_pyp|science|3|living_things_and_habitats|false"
  "ib_pyp|science|6|light_shadow_and_the_eye|true"
  "ib_pyp|mathematics|3|counting_place_value_and_patterns|true"
  "ib_pyp|mathematics|4|fractions_and_simple_geometry|true"
  "ib_pyp|mathematics|5|data_handling_and_probability|true"
  "ib_pyp|mathematics|6|ratio_proportion_and_measurement|true"

  # ══════════════════════════════════════════════════════════════════
  # IB MYP — currently only 2 anchors (further_maths); broader fill
  # ══════════════════════════════════════════════════════════════════

  "ib_myp|biology|7|cell_structure_and_transport|false"
  "ib_myp|biology|9|genetics_and_biotechnology|false"
  "ib_myp|physics|8|pressure_density_and_floating|true"
  "ib_myp|physics|10|electromagnetism|true"
  "ib_myp|chemistry|9|acids_bases_and_salts|true"
  "ib_myp|chemistry|10|organic_chemistry_introduction|false"
  "ib_myp|geography|8|population_distribution_and_resources|false"
  "ib_myp|geography|10|global_interactions_and_trade|false"
  "ib_myp|economics|9|market_structures|true"
  "ib_myp|economics|11|international_trade_and_exchange_rates|true"

  # ══════════════════════════════════════════════════════════════════
  # UK NATIONAL — deeper biology/physics/chemistry/geography fill
  # ══════════════════════════════════════════════════════════════════

  "uk_national|biology|7|cells_tissues_organs_and_systems|false"
  "uk_national|biology|8|microorganisms_and_infectious_disease|false"
  "uk_national|biology|11|homeostasis_blood_glucose_and_kidneys|false"
  "uk_national|biology|12|dna_replication_and_protein_synthesis|false"
  "uk_national|physics|7|energy_stores_and_transfers|true"
  "uk_national|physics|8|light_reflection_and_refraction|true"
  "uk_national|physics|11|radioactivity_and_nuclear_decay|false"
  "uk_national|physics|12|nuclear_fission_and_fusion|true"
  "uk_national|chemistry|7|mixtures_solutions_and_separation|false"
  "uk_national|chemistry|8|chemical_and_physical_changes|true"
  "uk_national|chemistry|11|rates_of_reaction|true"
  "uk_national|chemistry|12|dynamic_equilibrium|true"
  "uk_national|geography|6|rivers_flooding_and_management|false"
  "uk_national|geography|10|globalisation_and_development|false"
  "uk_national|geography|11|urban_issues_and_sustainability|false"

  # ══════════════════════════════════════════════════════════════════
  # WAEC — broader biology/chemistry/physics/geography fill
  # ══════════════════════════════════════════════════════════════════

  "waec|biology|10|nutrition_in_plants_photosynthesis|false"
  "waec|biology|12|reproduction_in_flowering_plants|false"
  "waec|physics|10|heat_temperature_and_thermal_expansion|true"
  "waec|physics|11|current_electricity_and_ohms_law|true"
  "waec|chemistry|10|states_of_matter_and_kinetic_theory|false"
  "waec|geography|11|population_growth_and_demographic_transition|false"
  "waec|geography|12|economic_activities_and_development|false"
  "waec|economics|12|national_income_and_gdp|true"

  # ══════════════════════════════════════════════════════════════════
  # AUSTRALIAN — fill history/geography/biology/physics/chemistry
  # ══════════════════════════════════════════════════════════════════

  "australian|history|6|first_peoples_and_colonisation|false"
  "australian|history|9|world_war_1_anzac_and_home_front|false"
  "australian|history|10|world_war_2_and_the_cold_war|false"
  "australian|geography|6|water_in_the_world_and_water_cycle|false"
  "australian|geography|10|changing_nations_and_urbanisation|false"
  "australian|biology|9|body_systems_coordination_and_hormones|false"
  "australian|biology|11|genetics_inheritance_and_evolution|false"
  "australian|physics|10|motion_forces_and_energy|true"
  "australian|physics|12|quantum_and_nuclear_physics_introduction|true"
  "australian|chemistry|10|bonding_structure_and_properties|false"
  "australian|chemistry|11|stoichiometry_and_reactions|true"

)

# ─── CURRICULUM METADATA ─────────────────────────────────────────────────────
declare -A CURRICULUM_NAMES
CURRICULUM_NAMES[uk_national]="UK National Curriculum"
CURRICULUM_NAMES[uk_11plus]="UK 11+"
CURRICULUM_NAMES[us_common_core]="US Common Core"
CURRICULUM_NAMES[australian]="Australian ACARA"
CURRICULUM_NAMES[nigerian_primary]="Nigerian Primary"
CURRICULUM_NAMES[nigerian_jss]="Nigerian JSS"
CURRICULUM_NAMES[nigerian_sss]="Nigerian SSS"
CURRICULUM_NAMES[waec]="WAEC/NECO"
CURRICULUM_NAMES[ib_pyp]="IB PYP"
CURRICULUM_NAMES[ib_myp]="IB MYP"

declare -A SPELLING
SPELLING[uk_national]="British"
SPELLING[uk_11plus]="British"
SPELLING[us_common_core]="American"
SPELLING[australian]="Australian"
SPELLING[nigerian_primary]="British"
SPELLING[nigerian_jss]="British"
SPELLING[nigerian_sss]="British"
SPELLING[waec]="British"
SPELLING[ib_pyp]="British"
SPELLING[ib_myp]="British"

# ─── IMAGE GENERATION ─────────────────────────────────────────────────────────
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
  local system_prompt="$1" user_prompt="$2" max_tokens="${3:-2000}"
  local response body http_code content=""
  for attempt in $(seq 1 $MAX_RETRIES); do
    response=$(curl -s -w "\n%{http_code}" "https://openrouter.ai/api/v1/chat/completions" \
      -H "Authorization: Bearer ${OPENROUTER_API_KEY}" \
      -H "Content-Type: application/json" \
      -H "HTTP-Referer: https://launchpard.com" \
      -H "X-Title: LaunchPard Anchor Generator v2" \
      -d "$(jq -n \
        --arg model "$MODEL" --arg sys "$system_prompt" --arg usr "$user_prompt" --argjson mt "$max_tokens" \
        '{model:$model,max_tokens:$mt,temperature:0.5,messages:[{role:"system",content:$sys},{role:"user",content:$usr}]}')")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    if [[ "$http_code" -eq 200 ]]; then
      content=$(echo "$body" | jq -r '.choices[0].message.content // empty')
      [[ -n "$content" ]] && break
    fi
    echo "    ✗ Attempt $attempt HTTP $http_code, retrying…" >&2
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

# ─── GENERATE ONE ANCHOR + QUESTIONS (with duplicate check) ──────────────────
generate_anchor_set() {
  local curriculum="$1" subject="$2" year="$3" topic="$4" has_formulas="$5"
  local curriculum_name="${CURRICULUM_NAMES[$curriculum]:-$curriculum}"
  local spelling="${SPELLING[$curriculum]:-British}"
  local topic_display="${topic//_/ }"

  echo "  → Anchor: ${curriculum} / ${subject} / Y${year} / ${topic_display}"

  # ── DUPLICATE CHECK ──────────────────────────────────────────────────────
  local check_response
  check_response=$(curl -s \
    "${SUPABASE_URL}/rest/v1/context_anchors?select=id&curriculum=eq.${curriculum}&subject=eq.${subject}&year_level=eq.${year}&topic=eq.${topic}" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}")
  if [[ $(echo "$check_response" | jq 'length') -gt 0 ]]; then
    echo "    ⏭️  Anchor already exists, skipping"
    return 0
  fi

  # ── STEP 1: Generate anchor metadata ─────────────────────────────────────
  local formula_instruction
  [[ "$has_formulas" == "true" ]] \
    && formula_instruction='- "latex_formulas": array of 2-4 key LaTeX formula strings (e.g. ["F = ma", "v = u + at"]) — use LaTeX syntax without dollar signs' \
    || formula_instruction='- "latex_formulas": null'

  local anchor_system="You are an expert educational content designer for ${curriculum_name}.
Use ${spelling} English spelling.
Generate metadata for a context anchor panel on the topic: ${topic_display}, for Year ${year} students.

Return ONLY a JSON object with these fields:
  {
    \"title\": \"concise topic title (max 6 words)\",
    \"description\": \"1-2 sentence context for students — what they should notice\",
    ${formula_instruction},
    \"image_prompt\": \"detailed prompt for generating a clear educational diagram of ${topic_display}, labelled, clean illustration style, white background, suitable for Year ${year}\",
    \"data_table\": null
  }
For data-heavy topics (statistics, economics, accounting) you may set data_table to:
  { \"headers\": [\"Col1\",\"Col2\",...], \"rows\": [[\"v1\",\"v2\",...], ...] }
  and set image_prompt to null."

  local anchor_raw anchor_json
  anchor_raw=$(call_openrouter "$anchor_system" "Generate anchor metadata for: ${topic_display}, Year ${year}, ${curriculum_name}" 1000)
  anchor_json=$(extract_json_object "$anchor_raw")

  if [[ -z "$anchor_json" ]]; then
    echo "    ✗ Failed to generate anchor metadata" >&2; return 1
  fi

  local anchor_title anchor_desc formulas_json img_prompt data_table_json
  anchor_title=$(echo "$anchor_json"    | jq -r '.title // "'"$topic_display"'"')
  anchor_desc=$(echo "$anchor_json"     | jq -r '.description // ""')
  formulas_json=$(echo "$anchor_json"   | jq -c '.latex_formulas // null')
  img_prompt=$(echo "$anchor_json"      | jq -r '.image_prompt // empty')
  data_table_json=$(echo "$anchor_json" | jq -c '.data_table // null')

  echo "    ✓ Anchor: \"${anchor_title}\""
  [[ "$formulas_json" != "null" ]] && echo "    ✓ Formulas: $(echo "$formulas_json" | jq 'length') LaTeX entries"

  # ── STEP 2: Generate diagram image ───────────────────────────────────────
  local anchor_image_url=""
  if [[ -n "$img_prompt" && "$img_prompt" != "null" && "${IMAGE_PROVIDER:-}" != "disabled" ]]; then
    local gen_url; gen_url=$(generate_image "$img_prompt")
    if [[ -n "$gen_url" ]]; then
      local dest="anchors/${curriculum}/${subject}/${year}_${topic}_${RANDOM}.png"
      anchor_image_url=$(upload_image_to_supabase "$gen_url" "$dest")
      [[ -n "$anchor_image_url" ]] && echo "    ✓ Anchor image uploaded" || echo "    ⚠️  Image upload failed"
    fi
  fi

  # ── STEP 3: Generate questions referencing the anchor ────────────────────
  local q_system="You are an expert assessor for ${curriculum_name}.
Use ${spelling} English spelling.
You will be given a context anchor (title + description + formulas) for the topic: ${topic_display}.
Write exactly ${QUESTIONS_PER_ANCHOR} multiple-choice questions for Year ${year} students that:
  - Directly reference or apply the anchor content
  - Require students to USE the diagram/formulas/data shown in the anchor
  - Progress from straightforward recall (Q1-2) to application (Q3-4) to analysis (Q5)

ACCURACY IS CRITICAL:
1. Work out the correct answer, write it as an option, set correct_index to its 0-based index.
2. Double-check correct_index matches the right option before outputting.
3. The explanation must confirm and justify the correct answer.

Return ONLY a JSON array of:
  { \"question_text\": \"...\", \"options\": [\"A\",\"B\",\"C\",\"D\"], \"correct_index\": 0, \"explanation\": \"...\", \"topic\": \"${topic}\" }"

  local q_user="Anchor title: ${anchor_title}
Description: ${anchor_desc}
Formulas: ${formulas_json}

Write ${QUESTIONS_PER_ANCHOR} questions that require students to use this anchor to answer."

  local q_raw q_array
  q_raw=$(call_openrouter "$q_system" "$q_user" 2000)
  q_array=$(extract_json_array "$q_raw")

  if [[ -z "$q_array" ]]; then
    echo "    ✗ Failed to generate questions" >&2; return 1
  fi

  local q_count; q_count=$(echo "$q_array" | jq 'length')
  echo "    ✓ ${q_count} questions generated"

  # ── STEP 4: Insert context_anchor row ────────────────────────────────────
  local anchor_row; anchor_row=$(jq -n \
    --arg curriculum "$curriculum" \
    --arg subject "$subject" \
    --argjson year "$year" \
    --arg topic "$topic" \
    --arg title "$anchor_title" \
    --arg description "$anchor_desc" \
    --arg image_url "$anchor_image_url" \
    --argjson formulas "$formulas_json" \
    --argjson data_table "$data_table_json" \
    '{curriculum:$curriculum,subject:$subject,year_level:$year,topic:$topic,title:$title,
      description:$description,
      image_url:(if $image_url=="" then null else $image_url end),
      latex_formulas:$formulas,
      data_table:$data_table,
      source:"ai"}')

  local insert_resp
  insert_resp=$(curl -s \
    "${SUPABASE_URL}/rest/v1/context_anchors" \
    -H "apikey: ${SUPABASE_SERVICE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "$anchor_row")

  local anchor_id
  anchor_id=$(echo "$insert_resp" | jq -r '.[0].id // empty')
  if [[ -z "$anchor_id" ]]; then
    echo "    ✗ Failed to insert anchor (${insert_resp:0:120})" >&2; return 1
  fi
  echo "    ✓ Anchor inserted: ${anchor_id}"

  # ── STEP 5: Insert questions linked to anchor_id ─────────────────────────
  local inserted=0
  for i in $(seq 0 $((q_count - 1))); do
    local q; q=$(echo "$q_array" | jq ".[$i]")
    local q_text opts cidx exp topic_val
    q_text=$(echo "$q"    | jq -r '.question_text // empty')
    opts=$(echo "$q"      | jq -c '.options // []')
    cidx=$(echo "$q"      | jq -r '.correct_index // 0')
    exp=$(echo "$q"       | jq -r '.explanation // ""')
    topic_val=$(echo "$q" | jq -r '.topic // "'"$topic"'"')

    [[ -z "$q_text" ]] && continue

    local opts_len; opts_len=$(echo "$opts" | jq 'length')
    if ! [[ "$cidx" =~ ^[0-9]+$ ]] || [[ "$cidx" -ge "$opts_len" ]]; then cidx=0; fi

    local q_data; q_data=$(jq -n \
      --arg q "$q_text" --argjson opts "$opts" --argjson a "$cidx" \
      --arg exp "$exp" --arg topic "$topic_val" \
      '{q:$q,opts:$opts,a:$a,exp:$exp,topic:$topic}')

    local position=$((i + 1))
    local row; row=$(jq -n \
      --arg anchor_id "$anchor_id" \
      --arg subject "$subject" \
      --argjson year "$year" \
      --arg topic "$topic_val" \
      --arg q_text "$q_text" \
      --argjson opts "$opts" \
      --argjson cidx "$cidx" \
      --arg exp "$exp" \
      --arg curriculum "$curriculum" \
      --argjson position "$position" \
      --argjson q_data "$q_data" \
      '{context_anchor_id:$anchor_id,subject:$subject,year_level:$year,topic:$topic,
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
  echo "    ✓ ${inserted}/${q_count} questions linked to anchor ${anchor_id}"
  sleep "$SLEEP_BETWEEN"
}

# ─── MAIN ─────────────────────────────────────────────────────────────────────
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  LaunchPard Context Anchor Generator v2                    ║"
echo "║  New subjects: maths, CS/ICT, accounting, agric, home ec,  ║"
echo "║  history, civic ed, religious studies, statistics          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Targets   : ${#ANCHOR_TARGETS[@]} anchor topics"
echo "Questions : ${QUESTIONS_PER_ANCHOR} per anchor"
echo "Model     : ${MODEL}"
echo "Images    : ${IMAGE_PROVIDER:-openrouter (${IMAGE_MODEL})}"
echo ""

total_anchors=0
total_questions=0

for target in "${ANCHOR_TARGETS[@]}"; do
  IFS='|' read -r curriculum subject year topic has_formulas <<< "$target"
  echo ""
  if generate_anchor_set "$curriculum" "$subject" "$year" "$topic" "$has_formulas"; then
    ((total_anchors++)) || true
    total_questions=$((total_questions + QUESTIONS_PER_ANCHOR))
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Anchors created   : ${total_anchors}"
echo "  Questions inserted: ${total_questions}"
echo "═══════════════════════════════════════════════════════════════"