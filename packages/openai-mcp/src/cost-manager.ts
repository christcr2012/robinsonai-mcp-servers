import { encoding_for_model } from "tiktoken";
import * as fs from "fs";
import * as path from "path";

// OpenAI Pricing (as of January 2025)
// Updated with latest models: GPT-5, GPT-4.1, o1, o3, o4-mini, gpt-4o, etc.
export const PRICING = {
  // GPT-5 Series (Latest flagship models)
  "gpt-5": { input_per_1k: 0.00125, output_per_1k: 0.01 },
  "gpt-5-mini": { input_per_1k: 0.00025, output_per_1k: 0.002 },
  "gpt-5-nano": { input_per_1k: 0.00005, output_per_1k: 0.0004 },
  "gpt-5-pro": { input_per_1k: 0.015, output_per_1k: 0.12 },

  // GPT-4.1 Series
  "gpt-4.1": { input_per_1k: 0.003, output_per_1k: 0.012 },
  "gpt-4.1-mini": { input_per_1k: 0.0008, output_per_1k: 0.0032 },
  "gpt-4.1-nano": { input_per_1k: 0.0002, output_per_1k: 0.0008 },

  // GPT-4o Series (Optimized models)
  "gpt-4o": { input_per_1k: 0.0025, output_per_1k: 0.01 },
  "gpt-4o-2024-05-13": { input_per_1k: 0.0025, output_per_1k: 0.01 },
  "gpt-4o-mini": { input_per_1k: 0.00015, output_per_1k: 0.0006 },
  "gpt-4o-mini-2024-07-18": { input_per_1k: 0.00015, output_per_1k: 0.0006 },

  // o-series (Reasoning models)
  "o1": { input_per_1k: 0.015, output_per_1k: 0.06 },
  "o1-preview": { input_per_1k: 0.015, output_per_1k: 0.06 },
  "o1-mini": { input_per_1k: 0.003, output_per_1k: 0.012 },
  "o1-2024-12-17": { input_per_1k: 0.015, output_per_1k: 0.06 },
  "o3": { input_per_1k: 0.02, output_per_1k: 0.08 },
  "o3-mini": { input_per_1k: 0.004, output_per_1k: 0.016 },
  "o4-mini": { input_per_1k: 0.004, output_per_1k: 0.016 },

  // GPT-4 Series (Legacy)
  "gpt-4": { input_per_1k: 0.03, output_per_1k: 0.06 },
  "gpt-4-turbo": { input_per_1k: 0.01, output_per_1k: 0.03 },
  "gpt-4-turbo-preview": { input_per_1k: 0.01, output_per_1k: 0.03 },
  "gpt-4-0125-preview": { input_per_1k: 0.01, output_per_1k: 0.03 },
  "gpt-4-1106-preview": { input_per_1k: 0.01, output_per_1k: 0.03 },

  // GPT-3.5 Series
  "gpt-3.5-turbo": { input_per_1k: 0.0005, output_per_1k: 0.0015 },
  "gpt-3.5-turbo-16k": { input_per_1k: 0.001, output_per_1k: 0.002 },
  "gpt-3.5-turbo-0125": { input_per_1k: 0.0005, output_per_1k: 0.0015 },

  // Embeddings
  "text-embedding-3-small": { per_1k: 0.00002 },
  "text-embedding-3-large": { per_1k: 0.00013 },
  "text-embedding-ada-002": { per_1k: 0.0001 },

  // Image Generation
  "dall-e-3": {
    standard_1024: 0.04,
    standard_1792: 0.08,
    hd_1024: 0.08,
    hd_1792: 0.12,
  },
  "dall-e-2": {
    "1024x1024": 0.02,
    "512x512": 0.018,
    "256x256": 0.016,
  },

  // Audio
  "whisper-1": { per_minute: 0.006 },
  "tts-1": { per_1k_chars: 0.015 },
  "tts-1-hd": { per_1k_chars: 0.03 },
};

export interface CostEstimate {
  estimated_cost_usd: number;
  breakdown: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
    input_cost?: number;
    output_cost?: number;
    model: string;
    pricing?: any;
  };
  budget_check: {
    daily_budget: number;
    daily_spent: number;
    daily_remaining: number;
    monthly_spent: number;
    monthly_remaining: number;
    this_call_percentage: string;
    safe_to_proceed: boolean;
    requires_approval: boolean;
    requires_double_approval: boolean;
    approval_reason?: string;
    warning?: string;
    recommendation?: {
      action: string;
      suggested_model?: string;
      estimated_savings?: number;
      new_cost?: number;
    };
  };
}

export interface CostConfig {
  daily_budget: number;
  monthly_budget: number;
  require_approval_over: number;
  require_double_approval_over: number;
  warn_at_percentage: number;
  model_fallback_enabled: boolean;
  fallback_model: string;
  cost_tracking_file: string;
}

export class CostManager {
  private config: CostConfig;
  private costData: any;

  constructor(config?: Partial<CostConfig>) {
    this.config = {
      daily_budget: parseFloat(process.env.OPENAI_DAILY_BUDGET || "10.00"),
      monthly_budget: parseFloat(process.env.OPENAI_MONTHLY_BUDGET || "200.00"),
      require_approval_over: parseFloat(process.env.OPENAI_APPROVAL_THRESHOLD || "0.50"),
      require_double_approval_over: parseFloat(process.env.OPENAI_DOUBLE_APPROVAL_THRESHOLD || "5.00"),
      warn_at_percentage: parseFloat(process.env.OPENAI_WARN_PERCENTAGE || "80"),
      model_fallback_enabled: process.env.OPENAI_MODEL_FALLBACK !== "false",
      fallback_model: process.env.OPENAI_FALLBACK_MODEL || "gpt-3.5-turbo",
      cost_tracking_file: process.env.OPENAI_COST_FILE || path.join(process.cwd(), "openai-costs.json"),
      ...config,
    };

    this.loadCostData();
  }

  private loadCostData() {
    try {
      if (fs.existsSync(this.config.cost_tracking_file)) {
        const data = fs.readFileSync(this.config.cost_tracking_file, "utf-8");
        this.costData = JSON.parse(data);
      } else {
        this.costData = { daily: {}, monthly: {} };
      }
    } catch (error) {
      console.error("Error loading cost data:", error);
      this.costData = { daily: {}, monthly: {} };
    }
  }

  private saveCostData() {
    try {
      fs.writeFileSync(this.config.cost_tracking_file, JSON.stringify(this.costData, null, 2));
    } catch (error) {
      console.error("Error saving cost data:", error);
    }
  }

  private getToday(): string {
    return new Date().toISOString().split("T")[0];
  }

  private getMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }

  public getDailySpent(): number {
    const today = this.getToday();
    return this.costData.daily[today]?.total || 0;
  }

  public getMonthlySpent(): number {
    const month = this.getMonth();
    return this.costData.monthly[month]?.total || 0;
  }

  public estimateTokens(text: string, model: string): number {
    try {
      const encoder = encoding_for_model(model as any);
      const tokens = encoder.encode(text);
      const count = tokens.length;
      encoder.free();
      return count;
    } catch (error) {
      // Fallback: rough estimate (1 token ≈ 4 characters)
      return Math.ceil(text.length / 4);
    }
  }

  public estimateChatCost(
    model: string,
    inputText: string,
    maxTokens: number = 1000
  ): CostEstimate {
    let pricing = PRICING[model as keyof typeof PRICING] as any;

    // If model not found in pricing table, use conservative estimate based on GPT-4o
    if (!pricing || !pricing.input_per_1k) {
      console.warn(`Unknown model: ${model}. Using conservative pricing estimate based on gpt-4o.`);
      pricing = {
        input_per_1k: 0.0025,  // gpt-4o input price
        output_per_1k: 0.01,   // gpt-4o output price
        estimated: true,       // Flag to indicate this is an estimate
      };
    }

    const inputTokens = this.estimateTokens(inputText, model);
    const outputTokens = maxTokens;
    const totalTokens = inputTokens + outputTokens;

    const inputCost = (inputTokens / 1000) * pricing.input_per_1k;
    const outputCost = (outputTokens / 1000) * pricing.output_per_1k;
    const totalCost = inputCost + outputCost;

    return this.buildCostEstimate(totalCost, {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      input_cost: inputCost,
      output_cost: outputCost,
      model,
      pricing,
      warning: pricing.estimated ? `Pricing for ${model} is estimated (not in pricing table)` : undefined,
    });
  }

  public estimateEmbeddingCost(model: string, texts: string[]): CostEstimate {
    const pricing = PRICING[model as keyof typeof PRICING] as any;
    if (!pricing || !pricing.per_1k) {
      throw new Error(`Unknown embedding model: ${model}`);
    }

    const totalTokens = texts.reduce((sum, text) => sum + this.estimateTokens(text, model), 0);
    const totalCost = (totalTokens / 1000) * pricing.per_1k;

    return this.buildCostEstimate(totalCost, {
      total_tokens: totalTokens,
      model,
      pricing,
    });
  }

  public estimateImageCost(model: string, size: string, quality: string, count: number): CostEstimate {
    const pricing = PRICING[model as keyof typeof PRICING] as any;
    if (!pricing) {
      throw new Error(`Unknown image model: ${model}`);
    }

    let costPerImage = 0;
    if (model === "dall-e-3") {
      const key = `${quality}_${size.split("x")[0]}` as keyof typeof pricing;
      costPerImage = pricing[key] || pricing.standard_1024;
    } else if (model === "dall-e-2") {
      costPerImage = pricing[size as keyof typeof pricing] || pricing["1024x1024"];
    }

    const totalCost = costPerImage * count;

    return this.buildCostEstimate(totalCost, {
      model,
      pricing: { per_image: costPerImage, count },
    });
  }

  private buildCostEstimate(cost: number, breakdown: any): CostEstimate {
    const dailySpent = this.getDailySpent();
    const monthlySpent = this.getMonthlySpent();
    const dailyRemaining = this.config.daily_budget - dailySpent;
    const monthlyRemaining = this.config.monthly_budget - monthlySpent;
    const percentage = ((cost / this.config.daily_budget) * 100).toFixed(2);

    const requiresApproval = cost > this.config.require_approval_over;
    const requiresDoubleApproval = cost > this.config.require_double_approval_over;
    const exceedsDailyBudget = cost > dailyRemaining;
    const exceedsMonthlyBudget = (monthlySpent + cost) > this.config.monthly_budget;
    const budgetLow = (dailySpent / this.config.daily_budget) * 100 > this.config.warn_at_percentage;

    let warning: string | undefined;
    let approvalReason: string | undefined;
    let recommendation: any;

    // Determine approval reason and warnings
    if (exceedsMonthlyBudget) {
      warning = `⚠️ CRITICAL: This operation ($${cost.toFixed(4)}) would exceed MONTHLY budget!\n` +
                `Monthly spent: $${monthlySpent.toFixed(2)} / $${this.config.monthly_budget.toFixed(2)}\n` +
                `After this call: $${(monthlySpent + cost).toFixed(2)} (over by $${((monthlySpent + cost) - this.config.monthly_budget).toFixed(2)})`;
      approvalReason = "exceeds_monthly_budget";
    } else if (exceedsDailyBudget) {
      warning = `⚠️ CRITICAL: This operation ($${cost.toFixed(4)}) would exceed DAILY budget!\n` +
                `Daily spent: $${dailySpent.toFixed(2)} / $${this.config.daily_budget.toFixed(2)}\n` +
                `After this call: $${(dailySpent + cost).toFixed(2)} (over by $${((dailySpent + cost) - this.config.daily_budget).toFixed(2)})`;
      approvalReason = "exceeds_daily_budget";
    } else if (requiresDoubleApproval) {
      warning = `⚠️ HIGH COST: This operation costs $${cost.toFixed(4)} (>${this.config.require_double_approval_over})\n` +
                `This requires DOUBLE APPROVAL (you'll be asked "Are you sure?" after initial approval)`;
      approvalReason = "high_cost";
    } else if (budgetLow) {
      warning = `WARNING: Daily budget ${((dailySpent / this.config.daily_budget) * 100).toFixed(1)}% depleted`;
      approvalReason = "budget_low";

      if (this.config.model_fallback_enabled && breakdown.model && breakdown.model.includes("gpt-4")) {
        const fallbackCost = cost * 0.05; // GPT-3.5 is ~5% the cost of GPT-4
        recommendation = {
          action: "downgrade_model",
          suggested_model: this.config.fallback_model,
          estimated_savings: cost - fallbackCost,
          new_cost: fallbackCost,
        };
      }
    } else if (requiresApproval) {
      warning = `This operation requires approval (cost > $${this.config.require_approval_over})`;
      approvalReason = "standard_approval";
    }

    return {
      estimated_cost_usd: cost,
      breakdown: {
        ...breakdown,
      },
      budget_check: {
        daily_budget: this.config.daily_budget,
        daily_spent: dailySpent,
        daily_remaining: dailyRemaining,
        monthly_spent: monthlySpent,
        monthly_remaining: monthlyRemaining,
        this_call_percentage: `${percentage}%`,
        safe_to_proceed: !exceedsDailyBudget && !exceedsMonthlyBudget,
        requires_approval: requiresApproval || budgetLow || exceedsDailyBudget || exceedsMonthlyBudget,
        requires_double_approval: requiresDoubleApproval || exceedsDailyBudget || exceedsMonthlyBudget,
        approval_reason: approvalReason,
        warning,
        recommendation,
      },
    };
  }

  public recordCost(cost: number, model: string, operation: string, metadata?: any) {
    const today = this.getToday();
    const month = this.getMonth();

    if (!this.costData.daily[today]) {
      this.costData.daily[today] = { total: 0, calls: [] };
    }
    if (!this.costData.monthly[month]) {
      this.costData.monthly[month] = { total: 0, calls: [] };
    }

    const record = {
      timestamp: new Date().toISOString(),
      operation,
      model,
      cost,
      ...metadata,
    };

    this.costData.daily[today].total += cost;
    this.costData.daily[today].calls.push(record);
    this.costData.monthly[month].total += cost;
    this.costData.monthly[month].calls.push(record);

    this.saveCostData();
  }

  public getBudgetStatus() {
    return {
      daily: {
        budget: this.config.daily_budget,
        spent: this.getDailySpent(),
        remaining: this.config.daily_budget - this.getDailySpent(),
        percentage_used: ((this.getDailySpent() / this.config.daily_budget) * 100).toFixed(2) + "%",
      },
      monthly: {
        budget: this.config.monthly_budget,
        spent: this.getMonthlySpent(),
        remaining: this.config.monthly_budget - this.getMonthlySpent(),
        percentage_used: ((this.getMonthlySpent() / this.config.monthly_budget) * 100).toFixed(2) + "%",
      },
      config: this.config,
    };
  }

  public getCostHistory() {
    // Return all cost records from all days and months
    const allRecords: any[] = [];

    // Collect from daily records
    Object.values(this.costData.daily).forEach((day: any) => {
      allRecords.push(...day.calls);
    });

    // Sort by timestamp (newest first)
    allRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return allRecords;
  }
}

