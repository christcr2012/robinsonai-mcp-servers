#!/bin/bash
# Extract tool definitions from each class

echo "Extracting GitHub tools..."
# Find the ListToolsRequestSchema handler in GitHubMCP class
sed -n '/class GitHubMCP/,/^class /p' src/index.ts | \
  sed -n '/setRequestHandler(ListToolsRequestSchema/,/\]\)/p' | \
  sed '1d;$d' > temp-github-tools.txt

echo "Extracting Vercel tools..."
sed -n '/class VercelMCP/,/^class /p' src/index.ts | \
  sed -n '/setRequestHandler(ListToolsRequestSchema/,/\]\)/p' | \
  sed '1d;$d' > temp-vercel-tools.txt

echo "Extracting Neon tools..."
sed -n '/class NeonMCP/,/^const toolkit/p' src/index.ts | \
  sed -n '/setRequestHandler(ListToolsRequestSchema/,/\]\)/p' | \
  sed '1d;$d' > temp-neon-tools.txt

wc -l temp-*-tools.txt
