#!/usr/bin/env python3
"""Fix remaining home/page.tsx and ga-home/page.tsx issues"""

import os
import re

def fix_home_page():
    """Fix app/home/page.tsx"""
    filepath = "app/home/page.tsx"
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix manager role removal and group-leader rename
    replacements = [
        # Remove manager section completely
        (r'    manager: \[\n(?:[^\]]*\n)*?    \],\n', ''),
        
        # Rename group-leader to group-leader-qa
        (r'"group-leader":', '"group-leader-qa":'),
        
        # Fix hrefs with old role names
        (r'subType=group-leader(?!=)', 'subType=group-leader-qa'),
        (r'subType=inspector(?!-)', 'subType=inspector-qa'),
        
        # Fix role checks in JSX
        (r'currentRole === "manager"', 'false /* manager role removed */'),
        (r'currentRole === "group-leader"', 'currentRole === "group-leader-qa"'),
        (r'roleCards\["group-leader"\]', 'roleCards["group-leader-qa"]'),
    ]
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content, flags=re.IGNORECASE | re.MULTILINE)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Fixed {filepath}")

def fix_ga_home_page():
    """Fix app/ga-home/page.tsx"""
    filepath = "app/ga-home/page.tsx"
    
    if not os.path.exists(filepath):
        print(f"⚠️  File not found: {filepath}")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    replacements = [
        # Fix query params
        (r'subType=group-leader(?!=)', 'subType=group-leader-qa'),
        (r'subType=inspector(?!-)', 'subType=inspector-qa'),
        
        # Fix role checks
        (r'user\.role === "manager"', 'false /* manager role removed */'),
        (r'user\.role === "group-leader"', 'user.role === "group-leader-qa"'),
    ]
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content, flags=re.IGNORECASE | re.MULTILINE)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Fixed {filepath}")

def fix_sidebar():
    """Fix components/Sidebar.tsx"""
    filepath = "components/Sidebar.tsx"
    
    if not os.path.exists(filepath):
        print(f"⚠️  File not found: {filepath}")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove manager checks
    content = re.sub(
        r'if \(role\.includes\("manager"\) \|\| role === "manager"\) return "[^"]+";',
        '// manager role removed',
        content,
        flags=re.IGNORECASE | re.MULTILINE
    )
    
    # Remove manager from admin check
    content = re.sub(
        r'if \(role\.includes\("manager"\) \|\| role === "manager" \|\| role\.includes\("admin"\)',
        'if (role.includes("admin")',
        content,
        flags=re.IGNORECASE | re.MULTILINE
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Fixed {filepath}")

if __name__ == "__main__":
    os.chdir('e:\\SEMESTER 6 MAGANG BOS\\E-CheckSheet\\E-Checksheet_GA_QA')
    fix_home_page()
    fix_ga_home_page()
    fix_sidebar()
    print("\n✅ All remaining role issues fixed!")
