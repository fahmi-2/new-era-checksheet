import os
import re

# Files that need setRedirected(true) added before router.push
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
    
    # Check if file needs fixing - has guard clause but no setRedirected(true)
    if 'if (redirected) return' not in content:
        print(f"⏭️  No guard clause found: {file_path}")
        continue
    
    original_content = content
    
    # Find all router.push patterns in useEffect blocks with redirected guard
    # We need to be careful to only add setRedirected(true) in the right places
    
    # Pattern: find router.push(...) and add setRedirected(true) before it
    # But only if not already there
    
    # Look for patterns like:
    # if (!user) {
    #   router.push(...)
    # }
    # OR
    # if (!user) router.push(...)
    # OR
    # router.push(...)
    
    # Add setRedirected(true) before each router.push
    lines = content.split('\n')
    new_lines = []
    
    for i, line in enumerate(lines):
        new_lines.append(line)
        
        # If this line contains router.push and the next doesn't have setRedirected
        if 'router.push(' in line and 'setRedirected(true)' not in line:
            # Check if this is inside a useEffect with [user, router, redirected]
            # Look backwards to find the useEffect
            in_relevant_useeffect = False
            for j in range(i, -1, -1):
                if 'useEffect' in lines[j]:
                    # Check if this useEffect has [user, router, redirected]
                    if '[user, router, redirected]' in lines[j]:
                        in_relevant_useeffect = True
                    break
            
            if in_relevant_useeffect:
                # Get the indentation of the current line
                indent_match = re.match(r'^(\s*)', line)
                indent = indent_match.group(1) if indent_match else ''
                
                # Check if the line is indented further (inside an if block)
                if indent and not line.strip().startswith('//'):
                    # Add setRedirected before this line
                    new_lines[-1] = indent + 'setRedirected(true)' + '\n' + line
    
    new_content = '\n'.join(new_lines)
    
    if new_content != original_content:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        fixed_count += 1
        print(f"✅ Fixed: {file_path}")
    else:
        print(f"⏭️  Already has setRedirected(true): {file_path}")

print(f"\n✅ Total files fixed: {fixed_count}")
