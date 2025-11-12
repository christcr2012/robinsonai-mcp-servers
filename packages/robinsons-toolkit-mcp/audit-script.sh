#!/bin/bash
echo "# ROBINSON'S TOOLKIT COMPREHENSIVE AUDIT"
echo ""
echo "Generated: $(date)"
echo ""

categories=("github" "vercel" "neon" "upstash" "google" "openai" "stripe" "supabase" "cloudflare" "playwright" "twilio" "resend" "context7" "postgres" "neo4j" "qdrant" "langchain" "n8n" "gateway" "health")

for cat in "${categories[@]}"; do
  echo "## Category: ${cat^^}"
  echo ""
  
  # Count tool definitions in index.ts
  inline_defs=$(grep -c "{ name: '${cat}_" src/index.ts 2>/dev/null || echo "0")
  echo "- Inline definitions (index.ts): $inline_defs"
  
  # Count tool definitions in separate files
  tool_files=$(find src -name "${cat}*-tools*.ts" 2>/dev/null)
  if [ -n "$tool_files" ]; then
    echo "- Tool definition files:"
    for file in $tool_files; do
      count=$(grep -c "name: '${cat}_" "$file" 2>/dev/null || echo "0")
      echo "  - $file: $count tools"
    done
  fi
  
  # Count handlers in index.ts
  handlers=$(grep -c "case '${cat}_" src/index.ts 2>/dev/null || echo "0")
  echo "- Handler case statements (index.ts): $handlers"
  
  # Find handler files
  handler_files=$(find src -name "${cat}*-handler*.ts" 2>/dev/null)
  if [ -n "$handler_files" ]; then
    echo "- Handler implementation files:"
    for file in $handler_files; do
      echo "  - $file"
    done
  fi
  
  echo ""
done
