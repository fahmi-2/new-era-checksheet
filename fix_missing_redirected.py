import os
import re

# Files that need the redirected state added
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
    
    # Check if redirected state already exists
    if 'const [redirected' in content:
        print(f"⏭️  Already has redirected state: {file_path}")
        continue
    
    # Check if this file uses [user, router, redirected] in dependencies
    if '[user, router, redirected]' not in content:
        print(f"⏭️  Doesn't use [user, router, redirected]: {file_path}")
        continue
    
    # Pattern to find where to insert the state
    pattern = r'(const \{ user \} = useAuth\(\))'
    
    if not re.search(pattern, content):
        print(f"⚠️  Could not find useAuth pattern in: {file_path}")
        continue
    
    # Insert the redirected state after useAuth
    new_content = re.sub(
        pattern,
        r'\1\n  const [redirected, setRedirected] = useState(false)',
        content
    )
    
    if new_content != content:
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        fixed_count += 1
        print(f"✅ Fixed: {file_path}")
    else:
        print(f"⚠️  No changes made: {file_path}")

print(f"\n✅ Total files fixed: {fixed_count}")
