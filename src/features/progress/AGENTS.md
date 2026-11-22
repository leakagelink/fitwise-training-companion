# Progress
- Result analysis scores (diet, workout, water, sleep, weight trend) are computed by resultAnalysis in src/lib/fitness.ts from one shared loader (result-data.ts) used by both the screen and the AI server function — the numbers the user sees are the numbers the coach analyses.
- The coach review is cached once per user per day in ai_recommendations (kind "result_analysis") — keeps AI usage low; no extra table to clean up.
