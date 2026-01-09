# Epic Work Item Specification

**Epic ID**: [To be assigned by ADO]  
**Title**: [Descriptive Epic Title]  
**Created By**: ProductManagerAgent  
**Created Date**: [Date]

---

## Work Item Details

### Azure DevOps Fields

```json
{
  "op": "add",
  "path": "/fields/System.WorkItemType",
  "value": "Epic"
}
```

| Field | Value |
|-------|-------|
| **System.Title** | [Descriptive Epic Title] |
| **System.Description** | [Detailed description with business value and context] |
| **System.AreaPath** | AlphaEchoCharlieOscar\\[Team] |
| **System.IterationPath** | AlphaEchoCharlieOscar |
| **Microsoft.VSTS.Common.Priority** | 1 (1=High, 2=Medium, 3=Low, 4=Very Low) |
| **Microsoft.VSTS.Common.ValueArea** | Business (or Technical) |
| **Microsoft.VSTS.Common.BusinessValue** | [1-100] |
| **Microsoft.VSTS.Common.TimeCriticality** | [0-1, where 1 is most time-critical] |
| **System.Tags** | [domain-tag]; [tech-stack]; product-management |

---

## Epic Description

### Problem Statement
[What problem does this epic solve?]

### Business Value
[Why is this epic important? What business outcomes will it achieve?]

### Target Users
- [User persona 1]
- [User persona 2]

---

## Scope

### In Scope
- [Feature/capability 1]
- [Feature/capability 2]
- [Feature/capability 3]

### Out of Scope
- [Explicitly excluded item 1]
- [Explicitly excluded item 2]

---

## Success Criteria

### Acceptance Criteria
- [ ] [Measurable criterion 1]
- [ ] [Measurable criterion 2]
- [ ] [Measurable criterion 3]

### Success Metrics
| Metric | Current Baseline | Target | Measurement Method |
|--------|------------------|--------|-------------------|
| [Metric 1] | [Value] | [Target] | [How to measure] |
| [Metric 2] | [Value] | [Target] | [How to measure] |

---

## Dependencies

### Internal Dependencies
- **Epic**: [EPIC-XXX] - [Description]
- **Feature**: [Feature name] - [Status]

### External Dependencies
- **Third-party Service**: [Service name] - [Dependency description]
- **Infrastructure**: [Infrastructure requirement]

---

## Timeline

| Phase | Target Date | Status |
|-------|-------------|--------|
| Design & Planning | [Date] | ⏳ Not Started |
| Development Start | [Date] | ⏳ Not Started |
| Feature Complete | [Date] | ⏳ Not Started |
| Testing Complete | [Date] | ⏳ Not Started |
| Production Release | [Date] | ⏳ Not Started |

---

## Teams & Responsibilities

| Team | Scope | Story Points (Estimated) |
|------|-------|--------------------------|
| Frontend Team | UI components, client logic | ~XX points |
| Backend Team | APIs, business logic | ~XX points |
| Infrastructure Team | Azure resources, deployment | ~XX points |
| Business Team | Analytics, reporting | ~XX points |

---

## Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| [Risk 1] | High/Medium/Low | High/Medium/Low | [Mitigation strategy] |
| [Risk 2] | High/Medium/Low | High/Medium/Low | [Mitigation strategy] |

---

## Related Artifacts

- **PRD**: [/products/prds/[filename].md]
- **Roadmap**: [/products/roadmaps/[YYYY-MM]-roadmap.md]
- **Design Docs**: [Link to design files]
- **Architecture**: [Link to architecture docs]

---

## Notes

### Assumptions
- [Assumption 1]
- [Assumption 2]

### Open Questions
- [ ] [Question 1]
- [ ] [Question 2]

---

## ADO API Payload (for automation)

```json
[
  {
    "op": "add",
    "path": "/fields/System.Title",
    "value": "[Epic Title]"
  },
  {
    "op": "add",
    "path": "/fields/System.Description",
    "value": "<div>[HTML formatted description]</div>"
  },
  {
    "op": "add",
    "path": "/fields/System.AreaPath",
    "value": "AlphaEchoCharlieOscar"
  },
  {
    "op": "add",
    "path": "/fields/Microsoft.VSTS.Common.Priority",
    "value": 1
  },
  {
    "op": "add",
    "path": "/fields/Microsoft.VSTS.Common.ValueArea",
    "value": "Business"
  },
  {
    "op": "add",
    "path": "/fields/System.Tags",
    "value": "[tag1]; [tag2]; product-management"
  }
]
```

---

**Status Legend**:
- ⏳ Not Started
- 🔄 In Progress
- ✅ Complete
- 🔴 Blocked
- ⏸️ On Hold
