# Aha! Integration Templates

This directory contains JSON templates for creating work items in Aha!

## Available Templates

### 1. Epic Template
**File**: `epic-template.json`  
**Description**: Template for creating epics in Aha! from PRD specifications

### 2. Feature Template (User Story)
**File**: `feature-template.json`  
**Description**: Template for creating features (equivalent to user stories) in Aha!

### 3. Requirement Template
**File**: `requirement-template.json`  
**Description**: Template for creating requirements (acceptance criteria) linked to features

### 4. Release Template
**File**: `release-template.json`  
**Description**: Template for creating quarterly releases in Aha!

## Usage

1. Copy template file to appropriate staging directory:
   - Epics → `/aha-staging/epics/`
   - Features → `/aha-staging/features/`
   - Requirements → `/aha-staging/requirements/`
   - Releases → `/aha-staging/releases/`

2. Fill in placeholder values (marked with `[PLACEHOLDER]`)

3. Invoke AhaIntegrationAgent:
   ```
   @AhaIntegrationAgent Create work items from /aha-staging/epics/my-epic.json
   ```

4. Agent will create in Aha! and update file with Aha! ID

## Field Guidelines

- **name**: Required, 3-100 characters
- **description**: Optional but recommended, Markdown supported
- **workflow_status**: Must match configured workflows in Aha!
- **tags**: Array of strings, lowercase-with-hyphens format
- **custom_fields**: Must match custom field configuration in your Aha! product

## Reference

See [AhaIntegrationAgent.agent.md](../.github/agents/AhaIntegrationAgent.agent.md) for complete API documentation.
