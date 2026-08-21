import os
import re

# Files we just modified - check if they need const [redirected added
files_to_check = [
    'app/status-pre-assy-pressure-jig/page.tsx',
]

for file_path in files_to_check:
    full_path = os.path.join(os.getcwd(), file_path.replace('/', '\\\\'))
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if has [user, router, redirected] but NOT const [redirected
    if '[user, router, redirected]' in content and 'const [redirected' not in content:
        print(f'MISSING redirected state in: {file_path}')
        
        # Find first useState after export default
        match = re.search(r'(const \[.*?, set.*?\] = useState\([^)]*\);)', content)
        if match:
            insert_pos = content.find(match.group(1)) + len(match.group(1)) + 1
            content = content[:insert_pos] + '\\n  const [redirected, setRedirected] = useState(false);' + content[insert_pos:]
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f'FIXED: Added redirected state')

print('Done')
