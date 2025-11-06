#!/usr/bin/env python3
"""
Systematic audit of Robinson's Toolkit MCP
Counts EVERY tool definition, case statement, and handler method
"""

import re
from collections import defaultdict

def audit_toolkit():
    """Perform full systematic audit"""
    
    with open('src/index.ts', 'r', encoding='utf-8') as f:
        content = f.read()
    
    print("=" * 80)
    print("ROBINSON'S TOOLKIT MCP - SYSTEMATIC AUDIT")
    print("=" * 80)
    print()
    
    # 1. Count tool definitions in BROKER_TOOLS
    print("📋 STEP 1: Counting tool definitions in broker-tools.ts...")
    with open('src/broker-tools.ts', 'r', encoding='utf-8') as f:
        broker_content = f.read()
    
    # Count by category
    categories = {
        'github': 0,
        'vercel': 0,
        'neon': 0,
        'upstash': 0,
        'google': 0,
        'openai': 0
    }
    
    for category in categories:
        pattern = rf"name: '{category}_[^']+'"
        matches = re.findall(pattern, broker_content)
        categories[category] = len(matches)
    
    total_tools = sum(categories.values())
    print(f"  GitHub: {categories['github']} tools")
    print(f"  Vercel: {categories['vercel']} tools")
    print(f"  Neon: {categories['neon']} tools")
    print(f"  Upstash: {categories['upstash']} tools")
    print(f"  Google: {categories['google']} tools")
    print(f"  OpenAI: {categories['openai']} tools")
    print(f"  TOTAL: {total_tools} tools")
    print()
    
    # 2. Count case statements
    print("🔀 STEP 2: Counting case statements in index.ts...")
    case_counts = defaultdict(int)
    
    # Find all case statements
    case_pattern = r"case '([a-z_]+)_[^']+'"
    case_matches = re.findall(case_pattern, content)
    
    for prefix in case_matches:
        case_counts[prefix] += 1
    
    total_cases = sum(case_counts.values())
    print(f"  github: {case_counts['github']} cases")
    print(f"  vercel: {case_counts['vercel']} cases")
    print(f"  neon: {case_counts['neon']} cases")
    print(f"  upstash: {case_counts['upstash']} cases")
    print(f"  gmail: {case_counts['gmail']} cases")
    print(f"  drive: {case_counts['drive']} cases")
    print(f"  calendar: {case_counts['calendar']} cases")
    print(f"  sheets: {case_counts['sheets']} cases")
    print(f"  docs: {case_counts['docs']} cases")
    print(f"  admin: {case_counts['admin']} cases")
    print(f"  slides: {case_counts['slides']} cases")
    print(f"  tasks: {case_counts['tasks']} cases")
    print(f"  people: {case_counts['people']} cases")
    print(f"  forms: {case_counts['forms']} cases")
    print(f"  classroom: {case_counts['classroom']} cases")
    print(f"  chat: {case_counts['chat']} cases")
    print(f"  reports: {case_counts['reports']} cases")
    print(f"  licensing: {case_counts['licensing']} cases")
    print(f"  openai: {case_counts['openai']} cases")
    print(f"  TOTAL: {total_cases} cases")
    print()
    
    # 3. Count handler methods
    print("⚙️  STEP 3: Counting handler method implementations...")
    handler_counts = defaultdict(int)
    
    # Find all private async methods
    method_pattern = r'private async ([a-z][a-zA-Z0-9]+)\(args: any\)'
    method_matches = re.findall(method_pattern, content)
    
    # Categorize by prefix
    for method in method_matches:
        # Extract prefix (github, vercel, neon, etc.)
        for prefix in ['github', 'vercel', 'neon', 'upstash', 'gmail', 'drive', 'calendar', 
                       'sheets', 'docs', 'admin', 'slides', 'tasks', 'people', 'forms', 
                       'classroom', 'chat', 'reports', 'licensing', 'openai']:
            if method.lower().startswith(prefix):
                handler_counts[prefix] += 1
                break
    
    total_handlers = sum(handler_counts.values())
    print(f"  github: {handler_counts['github']} handlers")
    print(f"  vercel: {handler_counts['vercel']} handlers")
    print(f"  neon: {handler_counts['neon']} handlers")
    print(f"  upstash: {handler_counts['upstash']} handlers")
    print(f"  gmail: {handler_counts['gmail']} handlers")
    print(f"  drive: {handler_counts['drive']} handlers")
    print(f"  calendar: {handler_counts['calendar']} handlers")
    print(f"  sheets: {handler_counts['sheets']} handlers")
    print(f"  docs: {handler_counts['docs']} handlers")
    print(f"  admin: {handler_counts['admin']} handlers")
    print(f"  slides: {handler_counts['slides']} handlers")
    print(f"  tasks: {handler_counts['tasks']} handlers")
    print(f"  people: {handler_counts['people']} handlers")
    print(f"  forms: {handler_counts['forms']} handlers")
    print(f"  classroom: {handler_counts['classroom']} handlers")
    print(f"  chat: {handler_counts['chat']} handlers")
    print(f"  reports: {handler_counts['reports']} handlers")
    print(f"  licensing: {handler_counts['licensing']} handlers")
    print(f"  openai: {handler_counts['openai']} handlers")
    print(f"  TOTAL: {total_handlers} handlers")
    print()
    
    # 4. Count TODO stubs
    print("⚠️  STEP 4: Counting TODO stubs (missing implementations)...")
    todo_counts = defaultdict(int)
    
    # Find all TODO comments
    todo_pattern = r'// TODO: Implement ([a-z_]+)_'
    todo_matches = re.findall(todo_pattern, content)
    
    for prefix in todo_matches:
        todo_counts[prefix] += 1
    
    total_todos = sum(todo_counts.values())
    if total_todos > 0:
        for prefix, count in sorted(todo_counts.items(), key=lambda x: -x[1]):
            print(f"  {prefix}: {count} TODOs")
        print(f"  TOTAL: {total_todos} TODOs")
    else:
        print("  ✅ NO TODOs FOUND!")
    print()
    
    # 5. Summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"Tool Definitions: {total_tools}")
    print(f"Case Statements:  {total_cases}")
    print(f"Handler Methods:  {total_handlers}")
    print(f"Missing (TODOs):  {total_todos}")
    print()
    
    # 6. Discrepancies
    print("=" * 80)
    print("DISCREPANCIES (Tools vs Cases vs Handlers)")
    print("=" * 80)
    
    all_prefixes = set(list(categories.keys()) + list(case_counts.keys()) + list(handler_counts.keys()))
    
    for prefix in sorted(all_prefixes):
        tools = categories.get(prefix, 0)
        cases = case_counts.get(prefix, 0)
        handlers = handler_counts.get(prefix, 0)
        
        if tools != cases or cases != handlers:
            print(f"  {prefix}:")
            print(f"    Tools: {tools}, Cases: {cases}, Handlers: {handlers}")
            if tools > cases:
                print(f"    ⚠️  {tools - cases} tools WITHOUT case statements")
            if cases > handlers:
                print(f"    ⚠️  {cases - handlers} cases WITHOUT handler implementations")
    
    print()
    print("=" * 80)
    print("AUDIT COMPLETE")
    print("=" * 80)

if __name__ == '__main__':
    audit_toolkit()

