import os

files_to_fix = [
    'app/status-pre-assy/page.tsx',
    'app/status-pre-assy-cc-stripping/page.tsx',
    'app/status-pre-assy-gl/page.tsx',
    'app/status-pre-assy-inspector/page.tsx',
    'app/status-pre-assy-pressure-jig/page.tsx',
    'app/status-final-assy/page.tsx',
    'app/status-final-assy-gl/page.tsx',
    'app/status-final-assy-inspector/page.tsx',
    'app/pelaporan-list/page-content.tsx',
    'app/status/page.tsx',
]

fixed = 0
for file_path in files_to_fix:
    full_path = os.path.join(os.getcwd(), file_path.replace('/', '\\\\'))
    if not os.path.exists(full_path):
        print(f'NOT FOUND: {file_path}')
        continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'const [redirected' in content:
        print(f'SKIP (already fixed): {file_path}')
        continue
    
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
