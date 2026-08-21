import os
import re

# List of files to fix
files_to_fix = [
    'app/status-ga/fire-alarm/riwayat/[zona]/page.tsx',
    'app/status-ga/inspeksi-preventif-lift-barang/page.tsx',
    'app/status-ga/inspeksi-preventif-lift-barang/inspeksi/page.tsx',
    'app/status-ga/inspeksi-preventif-lift-barang/inspeksi/riwayat/page.tsx',
    'app/status-ga/inspeksi-preventif-lift-barang/inspeksi/form/[itemId]/page.tsx',
    'app/status-ga/inspeksi-preventif-lift-barang/preventif/page.tsx',
    'app/status-ga/inspeksi-preventif-lift-barang/preventif/riwayat/page.tsx',
    'app/status-ga/e-checksheet-apd/page.tsx',
]

fixed = 0
for file_path in files_to_fix:
    full_path = os.path.join(os.getcwd(), file_path.replace('/', '\\\\'))
    if not os.path.exists(full_path):
        print(f'NOT FOUND: {file_path}')
        continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already has redirected flag
    if 'const [redirected' in content:
        print(f'SKIP (already fixed): {file_path}')
        continue
    
    # Replace pattern 1: useState without redirected
    if ', [user, router])' in content:
        content = content.replace(', [user, router])', ', [user, router, redirected])')
        fixed += 1
        print(f'FIXED: {file_path}')
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
    elif ', [user, router]);' in content:
        content = content.replace(', [user, router]);', ', [user, router, redirected]);')
        fixed += 1
        print(f'FIXED: {file_path}')
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)

print(f'\\nTotal fixed: {fixed}')
