
import os

file_path = r'c:\Users\cogni\Adani-CEO-tracker\app\components\UserTable.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
import_added = False

# Identify the range of the placeholder component to exclude
# Placeholder seems to be around lines 1124 to 1143 based on previous view
# We will look for the specific import line of the placeholder to identify it

for line in lines:
    # Remove the leading "// " if present
    if line.startswith('// '):
        content = line[3:]
    elif line.startswith('//'):
        content = line[2:]
    else:
        content = line

    # Skip the placeholder component lines
    if 'import React, { useRef } from "react";' in content:
        continue
    if 'function UserTable({ users }) {' in content:
        continue
    if 'export default UserTable;' in content and len(new_lines) > 1000: # Only skip if it's the one in the middle
         # Wait, the original code also has export default UserTable at the end.
         # The placeholder is likely the one that doesn't match the main component structure.
         # Let's rely on the fact that the main component is huge.
         pass
    
    # We will filter out the specific placeholder lines more robustly
    if content.strip() == 'import React, { useRef } from "react";':
        continue
    if content.strip() == 'function UserTable({ users }) {':
        continue
    if content.strip() == 'const tableRef = useRef(null);' and 'UserTable' in new_lines[-1]: # Heuristic
        continue
    
    # Actually, let's just exclude the block if we can identify it.
    # The placeholder block:
    # // import React, { useRef } from "react";
    # 
    # // function UserTable({ users }) {
    # //   const tableRef = useRef(null);
    # 
    # //   return (
    # //     <div>
    # //       {users.length === 0 ? (
    # //         <div className="flex justify-center items-center h-48">
    # //           <div className="text-center">
    # //             <h3 className="text-lg font-semibold">No users found</h3>
    # //             <p className="mt-2 text-sm text-gray-500">Get started by adding a new user.</p>
    # //           </div>
    # //         </div>
    # //       ) : null}
    # //     </div>
    # //   );
    # // };
    # 
    # // export default UserTable;

    if 'function UserTable({ users })' in content:
        continue
    if 'No users found' in content:
        continue
    if 'Get started by adding a new user' in content:
        continue
    
    # Add the API_BASE_URL import
    if not import_added and "import { API_BASE_URL } from '@/lib/config';" not in content and "import * as XLSX" in content:
        new_lines.append("import { API_BASE_URL } from '@/lib/config';\n")
        import_added = True

    new_lines.append(content)

# Post-processing to remove the placeholder artifacts if any remained
# and ensure the file ends correctly.
# The original file had a weird break.
# Let's just write what we have and then I can manually inspect/fix if needed.
# But I should try to be precise.

# Re-reading the file to be precise about line numbers from the view
# Lines 1124-1143 in the view were the placeholder.
# I will exclude lines by index from the original read if possible, but line numbers might shift.
# Let's stick to the content filtering which is safer.

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
