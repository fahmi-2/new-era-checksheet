import os

fixes = [
    {
        "path": "app/status-ga/inspeksi-preventif-lift-barang/preventif/page.tsx",
        "old": '    if (!user) return;\n    if (user.role !== "inspector-ga") {\n      router.push("/home");\n    }\n  }, [user, router, redirected]);',
        "new": '    if (!user) return;\n    if (user.role !== "inspector-ga") {\n      setRedirected(true);\n      router.push("/home");\n    }\n  }, [user, router, redirected]);'
    },
    {
        "path": "app/status-ga/inspeksi-preventif-lift-barang/inspeksi/page.tsx",
        "old": '    if (!user) return;\n    if (user.role !== "inspector-ga") {\n      router.push("/home");\n    }\n  }, [user, router, redirected]);',
        "new": '    if (!user) return;\n    if (user.role !== "inspector-ga") {\n      setRedirected(true);\n      router.push("/home");\n    }\n  }, [user, router, redirected]);'
    },
    {
        "path": "app/status-ga/inspeksi-preventif-lift-barang/preventif/riwayat/page.tsx",
        "old": '    if (!user) return;\n    if (user.role !== "inspector-ga") {\n      router.push("/home");\n    }\n  }, [user, router, redirected]);',
        "new": '    if (!user) return;\n    if (user.role !== "inspector-ga") {\n      setRedirected(true);\n      router.push("/home");\n    }\n  }, [user, router, redirected]);'
    },
    {
        "path": "app/status-ga/inspeksi-preventif-lift-barang/inspeksi/riwayat/page.tsx",
        "old": '    if (!user) return;\n    if (user.role !== "inspector-ga") {\n      router.push("/home");\n    }\n  }, [user, router, redirected]);',
        "new": '    if (!user) return;\n    if (user.role !== "inspector-ga") {\n      setRedirected(true);\n      router.push("/home");\n    }\n  }, [user, router, redirected]);'
    },
    {
        "path": "app/status-ga/inspeksi-preventif-lift-barang/inspeksi/form/[itemId]/page.tsx",
        "old": '      if (redirected) return;\n      if (!user) return;\n      if (user.role !== "inspector-ga") {\n        router.push("/home");\n      }',
        "new": '      if (redirected) return;\n      if (!user) return;\n      if (user.role !== "inspector-ga") {\n        setRedirected(true);\n        router.push("/home");\n      }'
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
    
    if fix_info["old"] in content:
        content = content.replace(fix_info["old"], fix_info["new"])
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        fixed_count += 1
        print(f"✅ Fixed: {file_path}")
    else:
        print(f"⚠️  Pattern not found: {file_path}")

print(f"\n✅ Total files fixed: {fixed_count}")
