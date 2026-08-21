import os

fixes = [
    {
        "path": "app/status-ga/inspeksi-preventif-lift-barang/page.tsx",
        "import_old": 'import { useEffect } from "react";',
        "import_new": 'import { useState, useEffect } from "react";',
        "effect_old": '  useEffect(() => {\n    if (redirected) return;\n    if (!user) return;\n    if (user.role !== "inspector-ga") {\n      router.push("/home");\n    }\n  }, [user, router, redirected]);',
        "effect_new": '  useEffect(() => {\n    if (redirected) return;\n    if (!user) return;\n    if (user.role !== "inspector-ga") {\n      setRedirected(true);\n      router.push("/home");\n    }\n  }, [user, router, redirected]);'
    },
    {
        "path": "app/status-ga/e-checksheet-apd/page.tsx",
        "import_old": 'import { useState, useEffect } from "react"',
        "import_new": 'import { useState, useEffect } from "react"',
        "effect_old": '  useEffect(() => {\n    if (redirected) return;\n    if (!user || user.role !== "inspector-ga") {\n      router.push("/home")\n    }\n  }, [user, router, redirected])',
        "effect_new": '  useEffect(() => {\n    if (redirected) return;\n    if (!user || user.role !== "inspector-ga") {\n      setRedirected(true)\n      router.push("/home")\n    }\n  }, [user, router, redirected])'
    },
    {
        "path": "app/pelaporan-list/page-content.tsx",
        "import_old": 'import { useState, useEffect } from "react"',
        "import_new": 'import { useState, useEffect } from "react"',
        "effect_old": '  useEffect(() => {\n    if (redirected) return;\n    if (!user) {\n      router.push("/login-page")\n    }\n  }, [user, router, redirected])',
        "effect_new": '  useEffect(() => {\n    if (redirected) return;\n    if (!user) {\n      setRedirected(true)\n      router.push("/login-page")\n    }\n  }, [user, router, redirected])'
    },
]

fixed_count = 0
for fix_info in fixes:
    file_path = fix_info["path"]
    full_path = os.path.join(os.getcwd(), file_path)
    
    if not os.path.exists(full_path):
        print(f"❌ File not found: {file_path}")
        continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # First fix import if needed
    if fix_info["import_old"] in content and fix_info["import_old"] != fix_info["import_new"]:
        content = content.replace(fix_info["import_old"], fix_info["import_new"])
        print(f"   Updated import in: {file_path}")
    
    # Then fix the useEffect
    if fix_info["effect_old"] in content:
        content = content.replace(fix_info["effect_old"], fix_info["effect_new"])
        fixed_count += 1
        print(f"✅ Fixed: {file_path}")
    else:
        print(f"⚠️  Pattern not found: {file_path}")
    
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"\n✅ Total files fixed: {fixed_count}")
