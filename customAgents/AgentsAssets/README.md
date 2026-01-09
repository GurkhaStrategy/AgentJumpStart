# AgentsAssets Directory

This directory contains all the essential assets needed to run the 8-agent system for AlphaEchoCharlieOscar platform automation.

## Directory Structure

```
AgentsAssets/
├── .github/
│   └── agents/              # 8 agent definition files (*.agent.md)
│       ├── ProductManagerAgent.agent.md
│       ├── RequirementsGatheringAndStoryCreationAgent.agent.md
│       ├── ScrumMasterAgent.agent.md
│       ├── AzureArchitectureAgent.agent.md
│       ├── DevOpsAgent.agent.md
│       ├── TestingQualityAgent.agent.md
│       ├── DocumentationMaintainerAgent.agent.md
│       └── AhaIntegrationAgent.agent.md
│
├── templates/               # Templates for all work items
│   ├── prd-template.md
│   ├── roadmap-template.md
│   ├── epic-template.md
│   ├── aha-epic-template.json
│   ├── aha-feature-template.json
│   └── aha-templates-readme.md
│
├── agent-logs/              # Summary logs for each agent
│   ├── ProductManagerAgent.reportlogs.md
│   ├── RequirementsGatheringAndStoryCreationAgent.reportlogs.md
│   ├── ScrumMasterAgent.reportlogs.md
│   ├── AzureArchitectureAgent.reportlogs.md
│   ├── DevOpsAgent.reportlogs.md
│   ├── TestingQualityAgent.reportlogs.md
│   ├── DocumentationMaintainerAgent.reportlogs.md
│   └── AhaIntegrationAgent.reportlogs.md
│
├── config/                  # Configuration files
│   ├── ado-config.json      # Azure DevOps configuration
│   └── aha-config.json      # Aha! API configuration
│
├── ado-staging/             # Azure DevOps work item staging
│   ├── epics/
│   ├── stories/
│   ├── tasks/
│   └── test-cases/
│
├── aha-staging/             # Aha! work item staging
│   ├── epics/
│   ├── features/
│   ├── requirements/
│   └── releases/
│
└── context-handoffs/        # Cross-agent context sharing
    └── current-context.md

```

## Purpose

This directory is **self-contained** and includes everything needed for:

1. **Agent Definitions** - All 8 agent `.agent.md` files that VS Code Copilot reads
2. **Templates** - Standard templates for PRDs, roadmaps, epics, user stories, and Aha! work items
3. **Configuration** - Azure DevOps and Aha! API credentials and settings
4. **Staging Areas** - JSON specifications for work items before they're created in ADO/Aha!
5. **Logs** - Summary logs of all agent operations
6. **Context Sharing** - Files that enable agents to pass information between phases

## Setup

### Quick Start

1. **Configure Azure DevOps**:
   ```powershell
   notepad config\ado-config.json
   # Add your organization, project, and PAT token
   ```

2. **Configure Aha! (Optional)**:
   ```powershell
   notepad config\aha-config.json
   # Add your subdomain, product key, and API token
   ```

3. **Set GitHub Token**:
   ```powershell
   $env:GITHUB_TOKEN="ghp_your_token_here"
   ```

4. **Invoke First Agent**:
   ```
   @ProductManagerAgent Create a PRD for [your feature]
   ```

## Agent Workflow

```
ProductManagerAgent
    ↓ (Creates PRD + Epic)
RequirementsGatheringAgent
    ↓ (Generates User Stories)
Human Review & Approval
    ↓
ScrumMasterAgent
    ↓ (Sprint Planning)
AzureArchitectureAgent + DevOpsAgent (Parallel)
    ↓ (IaC + CI/CD)
TestingQualityAgent
    ↓ (E2E Tests)
DocumentationMaintainerAgent
    ↓ (Docs + APIs)
AhaIntegrationAgent (Optional)
    ↓ (Sync to Aha!)
```

## Files You Need to Edit

### Before First Use:

1. **config/ado-config.json** - Azure DevOps credentials ⚠️
2. **config/aha-config.json** - Aha! credentials (if using Aha!) ⚠️

### During Operation:

- **context-handoffs/current-context.md** - Updated automatically by agents
- **ado-staging/** - JSON files created by agents
- **aha-staging/** - JSON files created by agents (if using Aha!)
- **agent-logs/** - Appended by agents as they work

## Integration Points

### Azure DevOps
- Reads configuration from `config/ado-config.json`
- Stages work items in `ado-staging/`
- Creates Epics, User Stories, Tasks, Test Cases

### Aha! (Optional)
- Reads configuration from `config/aha-config.json`
- Stages work items in `aha-staging/`
- Creates Epics, Features, Requirements

### GitHub Models
- Uses `GITHUB_TOKEN` environment variable
- Models: GPT-4o (complex agents), GPT-4o-mini (routine agents)

## Best Practices

1. **Never commit tokens** - Keep credentials in config files, add to .gitignore
2. **Review before approval** - Check stories in `ado-staging/` before approving
3. **Monitor logs** - Review `agent-logs/` to track agent activity
4. **Backup config** - Keep secure copies of your configuration files
5. **Test incrementally** - Start with ProductManagerAgent, validate each phase

## Troubleshooting

### Agent Not Found
- Verify `.github/agents/*.agent.md` files exist
- Check VS Code has GitHub Copilot extension installed

### Configuration Errors
- Validate JSON syntax in `config/*.json`
- Check credentials are correct
- Test API connections manually

### Staging Files Not Created
- Check agent logs for errors
- Verify permissions in ADO/Aha!
- Ensure templates directory is accessible

## Support

- **Main Documentation**: See parent `README.md`
- **Agent Definitions**: `.github/agents/*.agent.md`
- **Templates**: `templates/*.md` and `templates/*.json`

---

**Version**: 1.1.0  
**Last Updated**: 2026-01-08  
**Part of**: AgentJumpStart System
