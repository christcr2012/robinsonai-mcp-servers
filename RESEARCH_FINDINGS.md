# Research Findings: How to Fix Agent Code Quality

## 🔍 The Real Problem

**What I was doing wrong:**
- Trying to detect fake APIs with regex patterns (impossible to cover all cases)
- Relying on simple prompts without proper validation
- Not using modern LLM evaluation techniques

**What actually works (from research):**
1. **Token Probabilities** - Low probability tokens indicate hallucinations
2. **LLM-as-a-Judge** - Use an LLM to validate with natural language criteria
3. **QAG (Question-Answer Generation)** - Break validation into yes/no questions
4. **Chain-of-Thought** - Use CoT to fix invalid code, not just detect it

---

## 📚 Key Research Papers

### 1. VALTEST (2024) - Automated Validation of LLM-Generated Test Cases
**Source:** https://arxiv.org/html/2411.08254v1

**Key Insight:** Token probabilities are reliable indicators of hallucinations
- Valid code has higher token probabilities
- Invalid code (with hallucinations) has lower token probabilities
- Can train ML model on token probability features to predict validity

**Algorithm:**
1. Generate code with LLM (get token probabilities)
2. Extract statistical features from token probabilities (mean, max, min, variance)
3. Train classifier to predict valid vs invalid
4. Use predictions to filter or refine code

**Results:** Improved validity rate by 6.2% to 24% across datasets

### 2. LLM Evaluation Metrics Guide
**Source:** https://www.confident-ai.com/blog/llm-evaluation-metrics-everything-you-need-for-llm-evaluation

**Key Insights:**
- **G-Eval**: LLM-as-a-judge framework with chain-of-thought evaluation
- **QAG (Question-Answer Generation)**: Break evaluation into yes/no questions for reliability
- **DAG (Deep Acyclic Graph)**: Decision tree powered by LLM-as-a-judge

**Why LLM-as-a-Judge Works:**
- Takes full semantics into account (unlike regex)
- Can reason about code correctness
- More accurate than statistical methods (BLEU, ROUGE, etc.)

**QAG Algorithm for Code Validation:**
1. Extract all claims/statements from generated code
2. For each claim, ask yes/no question: "Is this API real?"
3. Count yes/no answers to compute score
4. Reliable because LLM doesn't directly generate scores

---

## ✅ What We Should Do

### Immediate Fixes (High Priority)

1. **Implement LLM-as-a-Judge Validation**
   - Instead of regex patterns, use LLM to validate code
   - Ask specific questions: "Does this code use real APIs?", "Is this code complete?"
   - Get yes/no answers for reliability

2. **Use Token Probabilities (if available)**
   - Ollama API provides token probabilities
   - Extract features: mean, min, max, variance
   - Use as confidence score for generated code

3. **Improve Refinement Prompts**
   - Use Chain-of-Thought in refinement
   - Provide specific examples of correct vs incorrect code
   - Ask LLM to reason step-by-step

### Long-term Improvements (Medium Priority)

4. **Build Validation Dataset**
   - Collect examples of good vs bad agent outputs
   - Train lightweight classifier on token probability features
   - Use for fast validation without LLM calls

5. **Implement QAG Validation**
   - Break validation into atomic yes/no questions
   - More reliable than asking for scores
   - Example questions:
     - "Does this code import real packages?"
     - "Are all function calls using real methods?"
     - "Is the logic complete (no TODOs)?"

6. **Add Execution-Based Validation**
   - Try to actually run/compile the code
   - Catch syntax errors, import errors
   - Most reliable validation method

---

## 🚫 What Doesn't Work

1. **Regex-based fake API detection** - Impossible to cover all cases
2. **Simple prompts** - LLMs ignore generic instructions
3. **Statistical scorers (BLEU, ROUGE)** - Don't understand semantics
4. **One-shot generation** - Need iterative refinement

---

## 💡 Recommended Implementation

### Phase 1: Quick Wins (Do Now)
```python
# 1. LLM-as-a-Judge validation
def validate_with_llm(code: str) -> ValidationResult:
    questions = [
        "Does this code use only real, documented APIs?",
        "Is this code complete with no placeholders?",
        "Would this code compile and run?",
    ]
    
    answers = []
    for question in questions:
        answer = ask_llm_yes_no(question, code)
        answers.append(answer == "yes")
    
    score = sum(answers) / len(answers) * 100
    return ValidationResult(valid=score >= 80, score=score)

# 2. Use token probabilities
def get_confidence_score(token_probs: List[float]) -> float:
    return {
        'mean': np.mean(token_probs),
        'min': np.min(token_probs),
        'variance': np.var(token_probs)
    }
```

### Phase 2: Advanced (Do Later)
```python
# 3. QAG-based validation
def qag_validate(code: str) -> float:
    # Extract claims
    claims = extract_code_claims(code)
    
    # Validate each claim
    valid_claims = 0
    for claim in claims:
        if validate_claim(claim):
            valid_claims += 1
    
    return valid_claims / len(claims)

# 4. Execution-based validation
def execution_validate(code: str) -> bool:
    try:
        compile(code, '<string>', 'exec')
        return True
    except:
        return False
```

---

## 📊 Expected Results

Based on VALTEST paper:
- **Validity improvement:** 6-24% increase
- **Cost:** Minimal (uses same LLM for validation)
- **Reliability:** Much higher than regex patterns

Based on LLM Evaluation research:
- **Accuracy:** LLM-as-a-judge correlates 0.8+ with human judgment
- **Flexibility:** Can adapt to any validation criteria
- **Scalability:** Works for any programming language/framework

---

## 🎯 Next Steps

1. ✅ Research completed
2. ⏳ Implement LLM-as-a-judge validation
3. ⏳ Test with real agent outputs
4. ⏳ Compare results with current regex-based approach
5. ⏳ Iterate based on results

---

## 📝 Key Takeaways

**The fundamental insight:** You can't validate LLM outputs with simple rules. You need another LLM to judge the output.

**Why this works:**
- LLMs understand semantics and context
- Can reason about code correctness
- More flexible than hardcoded patterns

**Why regex doesn't work:**
- Infinite possible fake APIs
- Can't understand context
- Too brittle for complex code

**The solution:** Use LLM-as-a-judge with yes/no questions (QAG) for reliable validation.

