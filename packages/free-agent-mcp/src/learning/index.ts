#!/usr/bin/env node
/**
 * Learning System - Exports
 * 
 * Compact learning loop that teaches the agent from its own attempts:
 * 1. SQLite experience memory (runs, signals, pairs, web_cache)
 * 2. Reward calculation (compile + tests + errors + human)
 * 3. Prompt portfolio bandit (ε-greedy selection)
 * 4. Model router (easy→local, hard→API)
 * 5. Context shaper (learn which retrieval bundles work)
 * 6. Safe web knowledge (whitelist + cache + summarize)
 * 7. LoRA fine-tuning datasets (SFT export)
 */

export { ExperienceDB, Run, Signals, Pair, WebCache } from './experience-db.js';
export { LearningLoop, RewardInputs, PromptVariant, ModelVariant } from './learning-loop.js';
export { SFTExporter, SFTExample } from './make-sft.js';
export { WebKnowledge, WebKnowledgeConfig, WebPage } from './web-knowledge.js';

