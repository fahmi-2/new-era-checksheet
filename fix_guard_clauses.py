import os
import re

# Files that need guard clauses and setRedirected calls added
files_to_fix = [
    "app/status-pre-assy/page.tsx",
    "app/status-pre-assy-inspector/page.tsx",
    "app/status-pre-assy-gl/page.tsx",
    "app/status-pre-assy-cc-stripping/page.tsx",
    "app/status-final-assy-inspector/page.tsx",
    "app/status-ga/inspeksi-preventif-lift-barang/page.tsx",
    "app/status-ga/inspeksi-preventif-lift-barang/preventif/page.tsx",
    "app/status-ga/inspeksi-preventif-lift-barang/inspeksi/page.tsx",
    "app/status-ga/inspeksi-preventif-lift-barang/preventif/riwayat/page.tsx",
    "app/status-ga/inspeksi-preventif-lift-barang/inspeksi/riwayat/page.tsx",
    "app/status-ga/inspeksi-preventif-lift-barang/inspeksi/form/[itemId]/page.tsx",
    "app/status-ga/e-checksheet-apd/page.tsx",
    "app/status-final-assy-gl/page.tsx",
    "app/status-final-assy/page.tsx",
    "app/status/page.tsx",
    "app/pelaporan-list/page-content.tsx",
]

fixed_count = 0

for file_path in files_to_fix:
    full_path = os.path.join(os.getcwd(), file_path)
    
    if not os.path.exists(full_path):
        print(f"❌ File not found: {file_path}")
        continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if this file has the redirected state
    if 'const [redirected' not in content:
        print(f"⏭️  Missing redirected state: {file_path}")
        continue
    
    # Check if already has guard clause
    if 'if (redirected) return' in content:
        print(f"⏭️  Already has guard clause: {file_path}")
        continue
    
    # Find useEffect blocks with [user, router, redirected] and add guard clause
    # Pattern: useEffect(() => { ... }, [user, router, redirected])
    # We need to add: if (redirected) return; at the start of each effect
    
    # More specific: find the opening brace of useEffect
    # useEffect(() => { should be followed by our guard clause
    
    pattern = r'(useEffect\(\(\) => \{\s*)'
    
    replacement = r'\1if (redirected) return;\n    '
    
    new_content = re.sub(pattern, replacement, content)
    
    # Also add setRedirected(true) before router.push calls within these useEffects
    # Look for router.push patterns and add setRedirected(true) before them
    # But be careful to only add once per useEffect
    
    # Pattern: find setRedirected(true) before router.push - if not already there
    pattern2 = r'(\s+)(router\.push\()'
    
    # Check if setRedirected is already present
    if 'setRedirected(true)' not in new_content:
        # Add setRedirected before first router.push in useEffect with redirected
        # Find useEffect blocks with [user, router, redirected]
        useeffect_pattern = r'(useEffect\(\(\) => \{[^}]*\[user, router, redirected\]\))'
        
        def add_setRedirected(match):
            block = match.group(1)
            # Add setRedirected before router.push within this block
            return re.sub(
                r'(\s+)(router\.push\()',
                r'\1setRedirected(true)\n\1\2',
                block,
                count=1  # Only once per useEffect
            )
        
        new_content = re.sub(useeffect_pattern, add_setRedirected, new_content, flags=re.DOTALL)
    
    if new_content != content:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        fixed_count += 1
        print(f"✅ Fixed: {file_path}")
    else:
        print(f"⚠️  No changes made: {file_path}")

print(f"\n✅ Total files fixed: {fixed_count}")
