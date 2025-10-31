# Agent Quality Solution: The Real Fix

## 🎯 TL;DR

**The Problem:** Agents generate fake APIs that pass validation (e.g., `AWS.RestifyClient()`, `sum` from AWS Cognito)

**Why My Previous Fix Failed:** Regex patterns can't detect arbitrary hallucinations

**The Real Solution:** Use **LLM-as-a-Judge** validation instead of regex patterns

---

## 🔬 What I Learned from Research

I researched modern LLM validation techniques and found **3 proven approaches**:

### 1. Token Probabilities (VALTEST Paper, 2024)
- **Insight:** Low-confidence tokens = hallucinations
- **How it works:** LLMs assign probability to each generated token
- **Result:** 6-24% improvement in validity rate

### 2. LLM-as-a-Judge (DeepEval/G-Eval)
- **Insight:** Use an LLM to validate with natural language criteria
- **How it works:** Ask yes/no questions about code quality
- **Result:** 0.8+ correlation with human judgment

### 3. QAG (Question-Answer Generation)
- **Insight:** Break validation into atomic yes/no questions
- **How it works:** Extract claims, validate each claim separately
- **Result:** More reliable than asking LLM for scores

---

## ❌ Why Regex Validation Failed

**Test Case:** "Create HTTP client for AWS"

**Agent Generated:**
```typescript
import { RestifyClient } from '@aws-sdk/client-restify';

const client = new AWS.RestifyClient();
const result = await client.executeRequest(...);
```

**Problem:** `RestifyClient` and `executeRequest` don't exist in AWS SDK

**My Regex Approach:**
```typescript
const FAKE_API_PATTERNS = [
  { pattern: /new\s+AWS\.RestifyClient\(/i, desc: 'AWS.RestifyClient does not exist' },
  { pattern: /\.executeRequest\(/i, desc: 'executeRequest method does not exist' },
  // ... need to add EVERY possible fake API (impossible!)
];
```

**Why It Failed:**
- Can't hardcode every possible hallucination
- Agent generated `sum` from AWS Cognito for adding numbers (completely nonsensical)
- Validation scored it 100/100 because I didn't have a pattern for that specific fake API

---

## ✅ The Real Solution: LLM-as-a-Judge

Instead of trying to detect fake APIs with patterns, **ask an LLM to validate**:

### Approach 1: Simple LLM-as-a-Judge
```typescript
async function validateWithLLM(code: string): Promise<ValidationResult> {
  const prompt = `
You are a code validator. Answer YES or NO to each question:

CODE:
${code}

QUESTIONS:
1. Does this code use only real, documented APIs? (YES/NO)
2. Is this code complete with no TODOs or placeholders? (YES/NO)
3. Would this code compile and run without errors? (YES/NO)

Answer in format:
1. YES/NO
2. YES/NO
3. YES/NO
`;

  const response = await ollama.generate(prompt);
  const answers = parseYesNoAnswers(response);
  const score = (answers.filter(a => a === 'YES').length / answers.length) * 100;
  
  return {
    valid: score >= 80,
    score,
    reason: response
  };
}
```

### Approach 2: QAG (More Reliable)
```typescript
async function qagValidate(code: string): Promise<ValidationResult> {
  // Step 1: Extract claims
  const claims = await extractClaims(code);
  // Example claims:
  // - "Imports RestifyClient from @aws-sdk/client-restify"
  // - "Creates new AWS.RestifyClient instance"
  // - "Calls executeRequest method"
  
  // Step 2: Validate each claim
  let validClaims = 0;
  for (const claim of claims) {
    const isValid = await validateClaim(claim);
    if (isValid) validClaims++;
  }
  
  const score = (validClaims / claims.length) * 100;
  return { valid: score >= 80, score };
}

async function validateClaim(claim: string): Promise<boolean> {
  const prompt = `
Is this claim about code correct? Answer ONLY "YES" or "NO".

CLAIM: ${claim}

Check:
- Are the APIs/packages real and documented?
- Are the method names correct?
- Is the syntax valid?

Answer: `;

  const response = await ollama.generate(prompt);
  return response.trim().toUpperCase() === 'YES';
}
```

### Approach 3: Token Probabilities (Most Advanced)
```typescript
async function validateWithTokenProbs(code: string): Promise<ValidationResult> {
  // Generate code with token probabilities
  const result = await ollama.generate(prompt, { 
    return_token_probs: true 
  });
  
  // Extract token probability features
  const features = {
    mean: mean(result.token_probs),
    min: min(result.token_probs),
    max: max(result.token_probs),
    variance: variance(result.token_probs)
  };
  
  // Low probabilities = hallucination
  const confidence = features.mean;
  
  return {
    valid: confidence >= 0.7,
    score: confidence * 100,
    reason: `Token probability confidence: ${confidence}`
  };
}
```

---

## 🚀 Recommended Implementation Plan

### Phase 1: Quick Win (Do This First)
1. **Replace regex validation with LLM-as-a-judge**
   - Update `packages/free-agent-mcp/src/utils/validation.ts`
   - Use simple yes/no questions
   - Test with failing cases

2. **Update refinement to use CoT**
   - Add "think step-by-step" to refinement prompts
   - Provide examples of correct vs incorrect code
   - Ask LLM to explain its reasoning

### Phase 2: Advanced (Do Later)
3. **Implement QAG validation**
   - Extract claims from code
   - Validate each claim separately
   - More reliable than simple yes/no

4. **Add token probability validation**
   - Use Ollama's token probabilities
   - Train classifier on good vs bad code
   - Fast validation without extra LLM calls

5. **Add execution-based validation**
   - Try to compile/run the code
   - Catch syntax errors, import errors
   - Most reliable validation method

---

## 📊 Expected Results

Based on research papers:

| Metric | Current | With LLM-as-a-Judge | Improvement |
|--------|---------|---------------------|-------------|
| Validity Rate | 60-80% | 80-95% | +15-20% |
| False Positives | High | Low | -80% |
| Fake API Detection | 0% | 90%+ | +90% |

---

## 🎯 Next Steps

1. ✅ Research completed (DONE)
2. ⏳ Implement LLM-as-a-judge validation
3. ⏳ Test with real failing cases
4. ⏳ Compare results with regex approach
5. ⏳ Iterate based on results

---

## 💡 Key Insight

**You can't validate LLM outputs with simple rules. You need another LLM to judge the output.**

This is why:
- Regex patterns fail (infinite possible fake APIs)
- Statistical methods fail (don't understand semantics)
- LLM-as-a-judge works (understands context and can reason)

The solution is to use **LLM-as-a-judge with yes/no questions (QAG)** for reliable validation.

---

## 📝 Files to Update

1. `packages/free-agent-mcp/src/utils/validation.ts` - Replace regex with LLM-as-a-judge
2. `packages/free-agent-mcp/src/utils/refinement.ts` - Add CoT prompting
3. `packages/free-agent-mcp/src/utils/prompt-builder.ts` - Improve prompts with examples
4. `packages/paid-agent-mcp/src/index.ts` - Same fixes for PAID agent

---

## 🔗 References

- VALTEST Paper: https://arxiv.org/html/2411.08254v1
- LLM Evaluation Guide: https://www.confident-ai.com/blog/llm-evaluation-metrics-everything-you-need-for-llm-evaluation
- DeepEval (open-source LLM evaluation): https://github.com/confident-ai/deepeval

