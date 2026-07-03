
import json
import re

def extract_base(s):
    # Try to find content in parentheses
    # Matches: "'없음' (without)" -> "without"
    # Matches: "Latin, -abilis (capable of being)" -> "capable of being"
    match = re.search(r'\(([^)]+)\)', s)
    if match:
        return match.group(1).strip()
    
    # Otherwise, clean up the string
    # Remove surrounding single quotes if they exist
    s = s.strip()
    if s.startswith("'") and s.endswith("'"):
        s = s[1:-1]
    return s

with open(r'E:\myapp\etymology-expo\all_unique_strings.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

all_strings = sorted(list(set(data['meanings'] + data['origins'])))

# We will process a subset if it's too many, but let's see how many there are
print(f"Total unique strings: {len(all_strings)}")

# Group by base to avoid redundant translations if different strings have same base
base_to_strings = {}
for s in all_strings:
    base = extract_base(s)
    if base not in base_to_strings:
        base_to_strings[base] = []
    base_to_strings[base].append(s)

print(f"Total unique bases: {len(base_to_strings)}")

# Save the bases for processing
with open('bases.json', 'w', encoding='utf-8') as f:
    json.dump(base_to_strings, f, ensure_ascii=False, indent=2)
