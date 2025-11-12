#!/bin/bash
echo "# TOOL NAMING ANALYSIS"
echo ""

# Sample 5 tools from each category
categories=("github" "vercel" "neon" "upstash" "openai" "stripe" "supabase" "cloudflare" "gmail" "drive")

for cat in "${categories[@]}"; do
  echo "## ${cat^^} - Sample Tool Names:"
  grep "name: '${cat}_" src/index.ts 2>/dev/null | head -5 | sed "s/.*name: '/  - /" | sed "s/',$//"
  
  # Also check for tool files
  if [ -f "src/${cat}-tools.ts" ]; then
    grep "name: '${cat}_" "src/${cat}-tools.ts" 2>/dev/null | head -5 | sed "s/.*name: '/  - /" | sed "s/',$//"
  fi
  echo ""
done

# Check for inconsistencies
echo "## NAMING PATTERNS:"
echo ""
echo "### Verbs Used:"
grep -oh "name: '[a-z_]*_[a-z]*_" src/index.ts src/*-tools.ts 2>/dev/null | \
  sed "s/name: '[a-z]*_//" | sed "s/_$//" | sort | uniq -c | sort -rn | head -20
echo ""

echo "### Common Patterns:"
echo "- create_* (create resources)"
echo "- get_* (retrieve single item)"
echo "- list_* (retrieve multiple items)"
echo "- update_* (modify existing)"
echo "- delete_* (remove)"
echo "- search_* (find items)"
