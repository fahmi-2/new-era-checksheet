import os
import re

files_with_fixes = [
    {
        "path": "app/status-pre-assy/page.tsx",
        "old": "  useEffect(() => {\n    if (redirected) return;\n    if (!user) router.push(\"/login-page\")\n  }, [user, router, redirected])",
        "new": "  useEffect(() => {\n    if (redirected) return;\n    if (!user) {\n      setRedirected(true)\n      router.push(\"/login-page\")\n    }\n  }, [user, router, redirected])"
    },
    {
        "path": "app/status-pre-assy-inspector/page.tsx",
        "old": "  useEffect(() => {\n    if (redirected) return;\n    if (!user || user.role !== \"group-leader\")\n      router.push(\"/login-page\")\n  }, [user, router, redirected])",
        "new": "  useEffect(() => {\n    if (redirected) return;\n    if (!user || user.role !== \"group-leader\") {\n      setRedirected(true)\n      router.push(\"/login-page\")\n    }\n  }, [user, router, redirected])"
    },
    {
        "path": "app/status-pre-assy-gl/page.tsx",
        "old": "  useEffect(() => {\n    if (redirected) return;\n    if (!user || user.role !== \"group-leader\")\n      router.push(\"/home\")\n  }, [user, router, redirected])",
        "new": "  useEffect(() => {\n    if (redirected) return;\n    if (!user || user.role !== \"group-leader\") {\n      setRedirected(true)\n      router.push(\"/home\")\n    }\n  }, [user, router, redirected])"
    },
    {
        "path": "app/status-pre-assy-cc-stripping/page.tsx",
        "old": "  useEffect(() => {\n    if (redirected) return;\n    if (!user || user.role !== \"group-leader\")\n      router.push(\"/login-page\")\n  }, [user, router, redirected])",
        "new": "  useEffect(() => {\n    if (redirected) return;\n    if (!user || user.role !== \"group-leader\") {\n      setRedirected(true)\n      router.push(\"/login-page\")\n    }\n  }, [user, router, redirected])"
    },
    {
        "path": "app/status-final-assy-inspector/page.tsx",
        "old": "  useEffect(() => {\n    if (redirected) return;\n    if (!user || user.role !== \"group-leader\")\n      router.push(\"/login-page\")\n  }, [user, router, redirected])",
        "new": "  useEffect(() => {\n    if (redirected) return;\n    if (!user || user.role !== \"group-leader\") {\n      setRedirected(true)\n      router.push(\"/login-page\")\n    }\n  }, [user, router, redirected])"
    },
    {
        "path": "app/status-final-assy-gl/page.tsx",
        "old": "  useEffect(() => {\n    if (redirected) return;\n    if (!user || user.role !== \"group-leader\")\n      router.push(\"/home\")\n  }, [user, router, redirected])",
        "new": "  useEffect(() => {\n    if (redirected) return;\n    if (!user || user.role !== \"group-leader\") {\n      setRedirected(true)\n      router.push(\"/home\")\n    }\n  }, [user, router, redirected])"
    },
    {
        "path": "app/status-final-assy/page.tsx",
        "old": "  useEffect(() => {\n    if (redirected) return;\n    if (!user) router.push(\"/login-page\")\n  }, [user, router, redirected])",
        "new": "  useEffect(() => {\n    if (redirected) return;\n    if (!user) {\n      setRedirected(true)\n      router.push(\"/login-page\")\n    }\n  }, [user, router, redirected])"
    },
    {
        "path": "app/status/page.tsx",
        "old": "      if (redirected) return;\n      if (!user) router.push(\"/login-page\")",
        "new": "      if (redirected) return;\n      if (!user) {\n        setRedirected(true)\n        router.push(\"/login-page\")\n      }"
    },
]

fixed_count = 0
for file_info in files_with_fixes:
    file_path = file_info["path"]
    old_text = file_info["old"]
    new_text = file_info["new"]
    
    full_path = os.path.join(os.getcwd(), file_path)
    
    if not os.path.exists(full_path):
        print(f"❌ File not found: {file_path}")
        continue
    
    with open(full_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if old_text in content:
        new_content = content.replace(old_text, new_text)
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        fixed_count += 1
        print(f"✅ Fixed: {file_path}")
    else:
        print(f"⚠️  Pattern not found in: {file_path}")

print(f"\n✅ Total files fixed: {fixed_count}")
