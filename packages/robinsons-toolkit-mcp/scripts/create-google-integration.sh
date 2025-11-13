#!/bin/bash
# Create Google Workspace integration files

echo "Creating Google Workspace tools.ts..."

mkdir -p src/categories/google

# Create tools.ts header
cat > src/categories/google/tools.ts << 'HEADER'
/**
 * Google Workspace Tool Definitions
 * Extracted from temp-google-workspace-mcp.ts
 */

export const GOOGLE_TOOLS = [
HEADER

# Extract and format tools (lines 85-287 - before the closing bracket)
sed -n '85,287p' temp-google-workspace-mcp.ts | \
  sed 's/^      /  /g' >> src/categories/google/tools.ts

# Close the array
echo "];" >> src/categories/google/tools.ts

echo "✅ Created src/categories/google/tools.ts"

echo "Creating Google Workspace handlers.ts..."

# Create handlers.ts
cat > src/categories/google/handlers.ts << 'HEADER'
/**
 * Google Workspace Handler Functions
 * Extracted from temp-google-workspace-mcp.ts
 */

import { google } from 'googleapis';

const serviceAccountKeyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '';
const userEmail = process.env.GOOGLE_USER_EMAIL || 'me';

if (!serviceAccountKeyPath) {
  console.warn('Warning: GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set');
}

const auth = serviceAccountKeyPath ? new google.auth.GoogleAuth({
  keyFile: serviceAccountKeyPath,
  scopes: [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/admin.directory.user',
    'https://www.googleapis.com/auth/admin.directory.group',
    'https://www.googleapis.com/auth/admin.directory.orgunit',
    'https://www.googleapis.com/auth/admin.directory.domain',
    'https://www.googleapis.com/auth/admin.directory.rolemanagement',
    'https://www.googleapis.com/auth/admin.directory.device.mobile',
    'https://www.googleapis.com/auth/admin.directory.device.chromeos',
    'https://www.googleapis.com/auth/admin.directory.resource.calendar',
    'https://www.googleapis.com/auth/tasks',
    'https://www.googleapis.com/auth/contacts',
    'https://www.googleapis.com/auth/forms.body',
    'https://www.googleapis.com/auth/forms.responses.readonly',
    'https://www.googleapis.com/auth/classroom.courses',
    'https://www.googleapis.com/auth/classroom.rosters',
    'https://www.googleapis.com/auth/classroom.coursework.students',
    'https://www.googleapis.com/auth/chat.spaces',
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/admin.reports.usage.readonly',
    'https://www.googleapis.com/auth/admin.reports.audit.readonly',
    'https://www.googleapis.com/auth/apps.licensing'
  ],
  clientOptions: { subject: userEmail !== 'me' ? userEmail : undefined }
}) : null;

const gmail = auth ? google.gmail({ version: 'v1', auth }) : null;
const drive = auth ? google.drive({ version: 'v3', auth }) : null;
const calendar = auth ? google.calendar({ version: 'v3', auth }) : null;
const sheets = auth ? google.sheets({ version: 'v4', auth }) : null;
const docs = auth ? google.docs({ version: 'v1', auth }) : null;
const admin = auth ? google.admin({ version: 'directory_v1', auth }) : null;
const slides = auth ? google.slides({ version: 'v1', auth }) : null;
const tasks = auth ? google.tasks({ version: 'v1', auth }) : null;
const people = auth ? google.people({ version: 'v1', auth }) : null;
const forms = auth ? google.forms({ version: 'v1', auth }) : null;
const classroom = auth ? google.classroom({ version: 'v1', auth }) : null;
const chat = auth ? google.chat({ version: 'v1', auth }) : null;
const reports = auth ? google.admin({ version: 'reports_v1', auth }) : null;
const licensing = auth ? google.licensing({ version: 'v1', auth }) : null;

function formatResponse(data: any) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

HEADER

# Extract handler methods (lines 508-1593) and transform
sed -n '508,1593p' temp-google-workspace-mcp.ts | \
  sed 's/private async /export async function /g' | \
  sed 's/this\.gmail/gmail/g' | \
  sed 's/this\.drive/drive/g' | \
  sed 's/this\.calendar/calendar/g' | \
  sed 's/this\.sheets/sheets/g' | \
  sed 's/this\.docs/docs/g' | \
  sed 's/this\.admin/admin/g' | \
  sed 's/this\.slides/slides/g' | \
  sed 's/this\.tasks/tasks/g' | \
  sed 's/this\.people/people/g' | \
  sed 's/this\.forms/forms/g' | \
  sed 's/this\.classroom/classroom/g' | \
  sed 's/this\.chat/chat/g' | \
  sed 's/this\.reports/reports/g' | \
  sed 's/this\.licensing/licensing/g' | \
  sed 's/this\.formatResponse/formatResponse/g' >> src/categories/google/handlers.ts

echo "✅ Created src/categories/google/handlers.ts"

# Update all-tools.ts
if ! grep -q "GOOGLE_TOOLS" src/all-tools.ts; then
  echo "export { GOOGLE_TOOLS } from './categories/google/tools.js';" >> src/all-tools.ts
  echo "✅ Added GOOGLE_TOOLS to src/all-tools.ts"
fi

# Update generate-registry.mjs
if ! grep -q "'categories/google/tools.ts'" scripts/generate-registry.mjs; then
  sed -i "/const TOOL_FILE_MAPPING = {/a\\  'categories/google/tools.ts': { category: 'google', handlerModule: './categories/google/handlers.js', exportName: 'GOOGLE_TOOLS' }," scripts/generate-registry.mjs
  echo "✅ Added Google to scripts/generate-registry.mjs"
fi

echo ""
echo "🎉 Google Workspace integration files created!"
echo "Next: Run 'npm run build' to compile and test"

