# Aha! Integration Plan: Syncing Issues from functions.md

This plan outlines the steps and provides the necessary script to synchronize the backend tasks from `functions.md` into the Aha! issue tracker as Features.

## 1. Prerequisites & Access
To interact with the Aha! API, you need the following:

- **Aha! Subdomain**: Your account name (e.g., `yourcompany.aha.io`).
- **Aha! API Key**: Generate this under **Settings -> Personal -> API Tokens**.
- **Product Key**: The unique prefix for your workspace (e.g., `OPENT`).

## 2. Sync Logic Overview
The provided script performs the following steps:
1. **Parsing**: Reads `functions.md` and extracts Issue Title, Labels, Epic, Sprint, AssignedTo, Description, Tasks, and Acceptance Criteria.
2. **HTML Formatting**: Converts the markdown sections into HTML for the Aha! rich text editor.
3. **Dynamic Resolution**:
    - **Epics**: Automatically finds or creates an Epic if `**Epic**:` is provided.
    - **Sprints**: Automatically finds or creates an Iteration if `**Sprint**:` is provided.
    - **Assignments**: Searches for users by name or email provided in `**AssignedTo**:` and links the feature to their ID.
4. **Idempotency**: Fetches existing features first to avoid duplicates.
5. **Creation**: Sends a POST request to create the Feature with its associated Epic, Iteration, and Assigned User.

## 3. Environment Setup
Create or export these variables in your terminal before running the script:

```powershell
$env:AHA_SUBDOMAIN="your-subdomain"
$env:AHA_API_KEY="your-personal-api-key"
$env:AHA_PRODUCT_KEY="OPENT"
```

## 4. The Sync Script

The script should be saved as `opentickets-api/scripts/sync-to-aha.mjs`.

```javascript
import fs from 'fs';
import path from 'path';

// Configuration - Use environment variables for security
const AHA_SUBDOMAIN = process.env.AHA_SUBDOMAIN; // e.g. 'yourcompany'
const AHA_API_KEY = process.env.AHA_API_KEY;
const AHA_PRODUCT_KEY = process.env.AHA_PRODUCT_KEY; // The ID/Key of the product/workspace in Aha!
const FILE_PATH = path.resolve('./functions.md');

if (!AHA_SUBDOMAIN || !AHA_API_KEY || !AHA_PRODUCT_KEY) {
  console.error('Error: Please set AHA_SUBDOMAIN, AHA_API_KEY, and AHA_PRODUCT_KEY environment variables.');
  process.exit(1);
}

const API_BASE_URL = `https://${AHA_SUBDOMAIN}.aha.io/api/v1`;

// Caches to minimize API calls
const cache = {
  epics: new Map(), // name -> id
  iterations: new Map(), // name -> id (Aha! Iterations = Sprints)
  users: new Map(), // email/name -> id
};

async function syncToAha() {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      throw new Error(`File not found at ${FILE_PATH}`);
    }

    const markdown = fs.readFileSync(FILE_PATH, 'utf8');
    const issues = parseMarkdown(markdown);

    console.log(`🔍 Found ${issues.length} issues in ${FILE_PATH}. Starting sync...`);

    const existingFeatures = await getExistingFeatures();

    for (const issue of issues) {
      if (existingFeatures.has(issue.title.toLowerCase())) {
        console.log(`⏩ Skipping: "${issue.title}" (Already exists)`);
        continue;
      }

      console.log(`🚀 Syncing: ${issue.title}...`);

      // Resolve Epic, Sprint (Iteration), and Assignment
      const epicId = issue.epic ? await getOrCreateEpic(issue.epic) : null;
      const iterationId = issue.sprint ? await getOrCreateIteration(issue.sprint) : null;
      const userId = issue.assignedTo ? await resolveUser(issue.assignedTo) : null;

      await createAhaFeature(issue, { epicId, iterationId, userId });
    }

    console.log('✅ Sync completed successfully!');
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
  }
}

function parseMarkdown(content) {
  const issues = [];
  const sections = content.split(/^## Issue #/m).filter(s => s.trim() !== '' && !s.startsWith('# GitHub Issues'));

  for (const section of sections) {
    const lines = section.split('\n');
    const titleLine = lines[0].replace(/^\d+:\s*/, '').trim();
    
    // Extract labels
    const labelMatch = section.match(/\*\*Labels\*\*:\s*(.*)/);
    const labels = labelMatch ? labelMatch[1].replace(/`/g, '').split(',').map(s => s.trim()) : [];

    // Extract New Fields: Epic, Sprint, AssignedTo
    const epic = section.match(/\*\*Epic\*\*:\s*(.*)/)?.[1]?.trim();
    const sprint = section.match(/\*\*Sprint\*\*:\s*(.*)/)?.[1]?.trim();
    const assignedTo = section.match(/\*\*AssignedTo\*\*:\s*(.*)/)?.[1]?.trim();

    // Extract description
    const descriptionMatch = section.match(/### Description\n([\s\S]*?)(?=###|$)/);
    const description = descriptionMatch ? descriptionMatch[1].trim() : '';

    // Extract tasks
    const tasksMatch = section.match(/### Tasks\n([\s\S]*?)(?=###|$)/);
    const tasks = tasksMatch ? tasksMatch[1].trim() : '';

    // Extract acceptance criteria
    const acceptanceMatch = section.match(/### Acceptance Criteria\n([\s\S]*?)(?=---|$|##)/);
    const acceptance = acceptanceMatch ? acceptanceMatch[1].trim() : '';

    // Format description as HTML for Aha! Rich Text support
    let richDescription = `<p>${description.replace(/\n/g, '<br>')}</p>`;
    if (tasks) {
      const taskList = tasks.split('\n')
        .filter(t => t.trim())
        .map(t => `<li>${t.replace('- [ ] ', '').replace('- [x] ', '').trim()}</li>`)
        .join('');
      richDescription += `<h3>Tasks</h3><ul>${taskList}</ul>`;
    }
    if (acceptance) {
      richDescription += `<h3>Acceptance Criteria</h3><blockquote>${acceptance.replace(/\n/g, '<br>')}</blockquote>`;
    }

    issues.push({
      title: titleLine,
      labels,
      epic,
      sprint,
      assignedTo,
      description: richDescription
    });
  }

  return issues;
}

async function getOrCreateEpic(name) {
  if (cache.epics.has(name)) return cache.epics.get(name);
  
  const searchUrl = `${API_BASE_URL}/products/${AHA_PRODUCT_KEY}/epics?q=${encodeURIComponent(name)}`;
  const response = await apiRequest(searchUrl);
  const existing = response.epics.find(e => e.name.toLowerCase() === name.toLowerCase());
  
  if (existing) {
    cache.epics.set(name, existing.id);
    return existing.id;
  }

  console.log(`   🛠️ Creating Epic: ${name}...`);
  const createUrl = `${API_BASE_URL}/products/${AHA_PRODUCT_KEY}/epics`;
  const created = await apiRequest(createUrl, 'POST', { epic: { name } });
  cache.epics.set(name, created.epic.id);
  return created.epic.id;
}

async function getOrCreateIteration(name) {
  if (cache.iterations.has(name)) return cache.iterations.get(name);

  // Search for existing iteration (Sprint)
  const searchUrl = `${API_BASE_URL}/products/${AHA_PRODUCT_KEY}/iterations`;
  const response = await apiRequest(searchUrl);
  const existing = response.iterations.find(i => i.name.toLowerCase() === name.toLowerCase());

  if (existing) {
    cache.iterations.set(name, existing.id);
    return existing.id;
  }

  console.log(`   📅 Creating Sprint (Iteration): ${name}...`);
  const createUrl = `${API_BASE_URL}/products/${AHA_PRODUCT_KEY}/iterations`;
  const created = await apiRequest(createUrl, 'POST', { iteration: { name } });
  cache.iterations.set(name, created.iteration.id);
  return created.iteration.id;
}

async function resolveUser(identifier) {
  if (cache.users.has(identifier)) return cache.users.get(identifier);

  const url = `${API_BASE_URL}/users?q=${encodeURIComponent(identifier)}`;
  const response = await apiRequest(url);
  const user = response.users.find(u => 
    u.name.toLowerCase().includes(identifier.toLowerCase()) || 
    u.email.toLowerCase() === identifier.toLowerCase()
  );

  if (user) {
    cache.users.set(identifier, user.id);
    return user.id;
  }
  console.warn(`   ⚠️ Could not find user: "${identifier}". Feature will be unassigned.`);
  return null;
}

async function getExistingFeatures() {
  const url = `${API_BASE_URL}/products/${AHA_PRODUCT_KEY}/features?fields=name&per_page=200`;
  const data = await apiRequest(url);
  return new Set(data.features.map(f => f.name.toLowerCase()));
}

async function createAhaFeature(issue, { epicId, iterationId, userId }) {
  const url = `${API_BASE_URL}/products/${AHA_PRODUCT_KEY}/features`;
  const body = {
    feature: {
      name: issue.title,
      description: issue.description,
      tags: issue.labels,
      epic_id: epicId,
      iteration_id: iterationId,
      assigned_to_user_id: userId
    }
  };

  const data = await apiRequest(url, 'POST', body);
  console.log(`   ✅ Created Feature: ${data.feature.reference_num}`);
}

async function apiRequest(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${AHA_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(url, options);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Aha! API Error (${response.status}): ${JSON.stringify(errorData)}`);
  }
  return response.json();
}

syncToAha();
```

## 5. Execution
Run the following commands from the root directory:

```bash
cd opentickets-api
node scripts/sync-to-aha.mjs
```
