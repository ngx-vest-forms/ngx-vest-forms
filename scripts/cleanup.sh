#!/bin/bash

# NgxVestForms v2 Beta Cleanup Script
# Removes backup files and identifies commented code blocks for manual review

echo "🧹 Starting cleanup for ngx-vest-forms v2 beta..."

# Set the project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📁 Project root: $PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for removed files
removed_count=0

echo -e "\n${YELLOW}Step 1: Removing backup files...${NC}"

# Find and remove backup files
backup_patterns=(
  "*.backup"
  "*.clean"
  "*.old"
  "*.bak"
  "*backup*"
)

for pattern in "${backup_patterns[@]}"; do
  while IFS= read -r -d '' file; do
    echo -e "${RED}Removing:${NC} $file"
    rm "$file"
    ((removed_count++))
  done < <(find . -name "$pattern" -type f -print0 2>/dev/null)
done

# Remove backup directories
backup_dirs=(
  "backup-old-examples"
  "*backup*"
  "*old*"
)

for dir_pattern in "${backup_dirs[@]}"; do
  while IFS= read -r -d '' dir; do
    echo -e "${RED}Removing directory:${NC} $dir"
    rm -rf "$dir"
    ((removed_count++))
  done < <(find . -name "$dir_pattern" -type d -print0 2>/dev/null)
done

echo -e "\n${YELLOW}Step 2: Identifying large commented code blocks...${NC}"

# Find large commented code blocks (5+ consecutive commented lines)
echo -e "${YELLOW}Files with potential commented code blocks:${NC}"
grep -r -n -A 5 -B 1 "^\s*//.*" --include="*.ts" --include="*.js" . | \
  awk '/--/ {
    if (count >= 5) print file ":" start_line "-" prev_line " (" count " lines)";
    count=0; file=""; start_line=0
  }
  /^[^-]/ {
    if (count == 0) {
      split($0, parts, ":");
      file=parts[1];
      start_line=parts[2]
    };
    count++;
    prev_line=parts[2]
  }
  END {
    if (count >= 5) print file ":" start_line "-" prev_line " (" count " lines)"
  }'

echo -e "\n${YELLOW}Step 3: Identifying TODO/FIXME comments...${NC}"

# Find TODO/FIXME comments
echo -e "${YELLOW}TODO/FIXME items found:${NC}"
grep -r -n -i "todo\|fixme\|xxx\|hack" --include="*.ts" --include="*.js" --include="*.md" . | head -20

echo -e "\n${YELLOW}Step 4: Finding unused imports...${NC}"

# Look for files that might have unused imports (this is a basic check)
echo -e "${YELLOW}Files that might have unused imports (manual review needed):${NC}"
find . -name "*.ts" -not -path "./node_modules/*" -not -path "./dist/*" | head -10 | \
  xargs grep -l "^import.*from" | head -5

echo -e "\n${GREEN}✅ Cleanup completed!${NC}"
echo -e "${GREEN}📊 Summary:${NC}"
echo -e "  - Removed $removed_count backup files/directories"
echo -e "  - Identified commented code blocks (review above)"
echo -e "  - Listed TODO/FIXME items (review above)"

echo -e "\n${YELLOW}📋 Next manual steps:${NC}"
echo -e "  1. Review and remove large commented code blocks identified above"
echo -e "  2. Address or document TODO/FIXME items"
echo -e "  3. Run 'npm run lint' to check for unused imports"
echo -e "  4. Test the application: 'npm start'"

echo -e "\n${GREEN}🎯 Ready for next step: Add Playwright E2E test${NC}"
