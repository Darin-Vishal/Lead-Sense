import os
import re

ROOT_DIR = r"c:\Users\darin\OneDrive\Desktop\Sales Lead Qualifier\frontend\src"

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Clean remaining slates
    content = re.sub(r'bg-slate-[56789]00(/\d+)?', 'bg-[#0A0A0A]', content)
    content = re.sub(r'bg-slate-[12]00(/\d+)?', 'bg-[#0A0A0A]', content)
    content = re.sub(r'bg-slate-50(/\d+)?', 'bg-[#0A0A0A]', content)
    
    content = re.sub(r'divide-slate-[56789]00(/\d+)?', 'divide-[#121212]', content)
    
    content = re.sub(r'border-slate-[45678]00(/\d+)?', 'border-[#121212]', content)
    content = re.sub(r'border-slate-[12]00(/\d+)?', 'border-[#121212]', content)
    
    content = re.sub(r'text-slate-[9]00', 'text-white', content)
    content = re.sub(r'text-slate-[78]00', 'text-[#8A8A8A]', content)
    content = re.sub(r'text-slate-400', 'text-[#8A8A8A]', content)

    content = re.sub(r'to-slate-[4-8]00', 'to-[#8A8A8A]', content)
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk(ROOT_DIR):
    for file in files:
        if file.endswith('.jsx'):
            replace_in_file(os.path.join(root, file))

print("Leftovers script execution complete.")
