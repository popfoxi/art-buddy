
import os

file_path = r"c:\Users\irisa\Documents\trae_projects\Draw score\art-buddy\app\page.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_index = -1
end_index = -1

for i, line in enumerate(lines):
    if "{/* Favorites Gallery */}" in line:
        start_index = i
    if "{/* Menu List */}" in line:
        end_index = i
        break

if start_index != -1 and end_index != -1:
    # We want to remove from start_index to end_index - 1
    # But wait, there is a closing </div> before {/* Menu List */} that belongs to the Favorites Gallery
    # Let's check the lines before end_index
    # lines[end_index] is "                {/* Menu List */}\n"
    # lines[end_index-1] is "\n" (probably)
    # lines[end_index-2] is "                </div>\n" (closing of favorites gallery)
    
    # We want to remove everything from start_index up to (but not including) lines[end_index]
    # Actually, we want to keep the empty line before Menu List if possible, or maybe not.
    # Let's remove from start_index to end_index (exclusive) to remove the gap too.
    
    del lines[start_index:end_index]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Successfully deleted Favorites Gallery section.")
else:
    print("Could not find start or end markers.")
