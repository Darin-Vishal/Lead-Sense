import os
import re

ROOT_DIR = r"c:\Users\darin\OneDrive\Desktop\Sales Lead Qualifier\frontend\src"

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # BACKGROUNDS (Remove opacity overrides like bg-slate-900/50 since the hex is absolute per rules, but we can preserve /opacity if it's there? The prompt says "Remove bright whites" and "pure black". We will drop opacities or apply pure colors)
    # Actually, to keep layered effects, if they had /50, they wanted it to blend. We'll strip opacity modifiers for base backgrounds since black #000000 doesn't need opacity.
    content = re.sub(r'bg-slate-950(/\d+)?', 'bg-[#000000]', content)
    content = re.sub(r'bg-slate-900(/\d+)?', 'bg-[#050505]', content)
    
    # In App.jsx, there's `hover:bg-slate-800`.
    content = re.sub(r'hover:bg-slate-[78]00(/\d+)?', 'hover:bg-[#0A0A0A]', content)
    # Regular bg-slate-800 should be elevated cards or secondary buttons
    content = re.sub(r'bg-slate-800(/\d+)?', 'bg-[#0A0A0A]', content)
    # Any other slate grays for backgrounds
    content = re.sub(r'bg-slate-[67]00(/\d+)?', 'bg-[#0A0A0A]', content)
    content = re.sub(r'bg-gray-[89]00(/\d+)?', 'bg-[#050505]', content)

    # BORDERS
    content = re.sub(r'border-slate-[678]00(/\d+)?', 'border-[#121212]', content)
    content = re.sub(r'border-gray-[678]00(/\d+)?', 'border-[#121212]', content)

    # TEXT
    content = re.sub(r'text-slate-[12]00', 'text-white', content)
    content = re.sub(r'text-slate-[3-6]00', 'text-[#8A8A8A]', content)

    # SHADOWS (Minimize)
    content = re.sub(r'shadow-(xl|2xl|lg|md)', 'shadow-none', content)
    content = re.sub(r'shadow-(inner|sm)', 'shadow-none', content)

    # BADGES / CATEGORIES (Except in the helper function specifically)
    # The prompt specified:
    # SUPER -> text-[#22C55E] bg-[#22C55E]/10
    # GOOD -> text-[#3B82F6] bg-[#3B82F6]/10
    # BAD -> text-[#EF4444] bg-[#EF4444]/10
    # So we should make sure the JS mapping functions return these.

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(ROOT_DIR):
    for file in files:
        if file.endswith('.jsx') or file.endswith('.css'):
            replace_in_file(os.path.join(root, file))

print("Theme Replacement Script Execution Completed.")
