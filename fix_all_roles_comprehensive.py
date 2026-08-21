#!/usr/bin/env python3
"""
Comprehensive role fix script for E-Checksheet project.
Fixes all occurrences of old roles (group-leader, inspector, manager) 
with new 3-role structure (group-leader-qa, inspector-qa, inspector-ga).
"""

import os
import re
import glob

# Define replacements
REPLACEMENTS = [
    # Old auth-context style roles - should only be in pages as "group-leader-qa" and "inspector-qa" for QA
    # inspector-ga for GA
    (r'user\.role\s*===?\s*"group-leader"(?!-qa)', 'user.role === "group-leader-qa"'),
    (r'user\.role\s*===?\s*"inspector"(?!-qa)', 'user.role === "inspector-qa"'),
    (r'user\.role\s*!==?\s*"group-leader"(?!-qa)', 'user.role !== "group-leader-qa"'),
    (r'user\.role\s*!==?\s*"inspector"(?!-qa)', 'user.role !== "inspector-qa"'),
    
    # State types
    (r'useState<"group-leader"\s*\|\s*"inspector">', 'useState<"group-leader-qa" | "inspector-qa">'),
    (r'type\s+SubType\s*=\s*"group-leader"\s*\|\s*"inspector"', 'type SubType = "group-leader-qa" | "inspector-qa"'),
    
    # Storage keys
    (r'preAssy(GroupLeader|Inspector)(?!QA)', 'preAssy\1QA'),
    
    # Conditional checks in arrays
    (r'\["group-leader",\s*"inspector"(?!-qa)',  '["group-leader-qa", "inspector-qa"'),
    (r'\["group-leader",\s*"inspector",', '["group-leader-qa", "inspector-qa",'),
    
    # Manager role removal - not needed in new structure
    (r',\s*"manager"(?!")', ''),
    (r'"manager",\s*', ''),
    
    # Label updates
    (r'roleLabels\[.*?"group-leader".*?\]', 'roleLabels["group-leader-qa"]'),
    
    # Property name fix: nik -> niki
    (r'\.nik(?!i)', '.niki'),
    (r'"nik"(?!i)', '"niki"'),
]

# Files to skip (usually library files or generated files)
SKIP_PATTERNS = [
    "node_modules",
    ".next",
    ".git",
    "pnpm-lock.yaml",
    "public",
    "*.json",
    "*.md",
    "*.txt",
    "*.js.orig",
]

def should_skip_file(filepath):
    """Check if file should be skipped"""
    for pattern in SKIP_PATTERNS:
        if pattern in filepath:
            return True
    if not filepath.endswith(('.tsx', '.ts', '.jsx', '.js')):
        return True
    return False

def fix_file(filepath):
    """Fix roles in a single file"""
    if should_skip_file(filepath):
        return False
    
    if not os.path.exists(filepath):
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return False
    
    original_content = content
    
    # Apply replacements
    for pattern, replacement in REPLACEMENTS:
        try:
            content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
        except:
            pass
    
    # Only write if content changed
    if content != original_content:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        except:
            return False
    
    return False

def main():
    """Fix all Python, TypeScript, and JavaScript files in the workspace"""
    root_dir = os.getcwd()
    fixed_count = 0
    
    print(f"🔍 Scanning {root_dir}...")
    
    # Find all relevant files
    for pattern in ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js']:
        for filepath in glob.glob(os.path.join(root_dir, pattern), recursive=True):
            if fix_file(filepath):
                rel_path = os.path.relpath(filepath, root_dir)
                print(f"✅ Fixed: {rel_path}")
                fixed_count += 1
    
    print(f"\n✅ Total files fixed: {fixed_count}")
    return fixed_count > 0

if __name__ == "__main__":
    main()
