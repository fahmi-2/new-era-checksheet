import os
import re

files_to_fix = [
    'app/status-pre-assy-pressure-jig/page.tsx',  # Has 2 useEffect
]

for file_path in files_to_fix:
    full_path = os.path.join(os.getcwd(), file_path.replace('/', '\\\\'))
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for [user, router, redirected] - if already have multiple deps with redirected
    count = content.count('redirected]')
    if count >= 2:
        print(f'SKIP: {file_path} (already handled)')
        continue
    
    # Add redirected state if not present
    if 'const [redirected' not in content and '[user, router, redirected]' in content:
        # Find where to insert the const [redirected...
        # Look for pattern: const [something, setSomething] = useState(...)
        match = re.search(r'(const \[.*?\] = useState\(.*?\);)', content)
        if match:
            insert_pos = match.end() + 2
            content = content[:insert_pos] + '  const [redirected, setRedirected] = useState(false);\\n' + content[insert_pos:]
            print(f'ADDED redirected state: {file_path}')
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)

print('Done')
