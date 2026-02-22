# n8n-nodes-automation-analyzer

An n8n custom node that analyzes business workflows and generates automation opportunity reports with ROI projections.

## Features

- **Workflow Bottleneck Analysis** - Identifies top workflow inefficiencies with cost estimates
- **Low-Hanging Fruit Automations** - Quick-win opportunities with fast payback
- **Deep Dive Hidden Automations** - Strategic, less obvious opportunities
- **Prioritized Recommendations** - Ranked suggestions by impact and feasibility
- **Industry-Specific Patterns** - Pre-loaded patterns for 7+ industries
- **Multiple Analysis Modes** - Template-based, OpenAI, Anthropic, or Python script

## Supported Industries

- Construction / Roofing / Home Services
- Professional Services (Legal, Accounting, Consulting)
- E-commerce / Retail
- Healthcare / Medical
- Real Estate
- Restaurant / Food Service
- SaaS / Technology

## Installation

### Option 1: npm (Recommended)

```bash
# Navigate to your n8n custom nodes directory
cd ~/.n8n/custom

# Install the package
npm install /path/to/n8n-nodes-automation-analyzer
```

### Option 2: Link during development

```bash
# In the package directory
cd ~/projects/n8n-nodes-automation-analyzer
npm install
npm run build
npm link

# In n8n custom directory
cd ~/.n8n/custom
npm link n8n-nodes-automation-analyzer
```

### Option 3: Copy to n8n custom folder

```bash
# Build the package
cd ~/projects/n8n-nodes-automation-analyzer
npm install
npm run build

# Copy to n8n
cp -r dist ~/.n8n/custom/n8n-nodes-automation-analyzer
```

## Configuration

### Credentials (Optional)

The node works out-of-the-box without credentials using template-based analysis. For LLM-powered analysis, configure credentials:

1. **OpenAI**
   - Provider: OpenAI
   - API Key: Your OpenAI API key
   - Model: gpt-4 (recommended) or gpt-3.5-turbo

2. **Anthropic**
   - Provider: Anthropic
   - API Key: Your Anthropic API key
   - Model: claude-3-opus-20240229 or claude-3-sonnet-20240229

3. **Python Script**
   - Provider: Local Python Script
   - Script Path: `/path/to/analyze_automation_opportunities.py`

## Node Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Operation | Dropdown | Yes | `Analyze` (LLM) or `Quick Scan` (template) |
| Client Name | String | Yes | Contact person's name |
| Business Name | String | Yes | Company name |
| Industry | Dropdown | Yes | Select from predefined industries |
| Current Software | Multiline | Yes | Tools/software currently used |
| Email | String | No | Contact email |
| Phone | String | No | Contact phone |
| Additional Context | Multiline | No | Extra workflow details |

## Output Structure

The node returns structured JSON compatible with n8n workflows:

```json
{
  "success": true,
  "analysisType": "template|openai|anthropic|python_script",
  "metadata": {
    "clientName": "John Doe",
    "businessName": "Acme Roofing",
    "industry": "construction",
    "analyzedAt": "2024-01-15T10:30:00Z"
  },
  "bottlenecks": [
    {
      "name": "Lead follow-up delays",
      "description": "Lead follow-up delays (avg 8-12 hours)",
      "hoursPerWeek": 5,
      "weeklyCost": 100,
      "annualCost": 5200
    }
  ],
  "low_hanging_fruit": [
    {
      "name": "Lead Response Automation",
      "tools": "Zapier + CRM, Twilio",
      "implementationTime": "1-2 days",
      "paybackPeriod": "2-4 weeks",
      "hoursSavedPerWeek": 8,
      "weeklySavings": 160,
      "annualSavings": 8320
    }
  ],
  "deep_dive": [
    {
      "name": "Photo documentation workflow",
      "implementationTime": "2 weeks",
      "paybackPeriod": "2 months",
      "strategicValue": "High"
    }
  ],
  "recommendations": [
    {
      "priority": 1,
      "name": "Lead Response Automation",
      "reason": "Near-instant payback, high visibility impact"
    }
  ],
  "summary": {
    "totalWeeklyBottleneckCost": 270,
    "totalAnnualBottleneckCost": 14040,
    "potentialWeeklySavings": 490,
    "potentialAnnualSavings": 25480,
    "roiPotential": "181%"
  },
  "markdownReport": "# AUTOMATION OPPORTUNITY ANALYSIS\n..."
}
```

## Example Workflows

### Basic Analysis Workflow

1. **Trigger**: Webhook or Form submission
2. **Automation Analyzer**: Process client data
3. **Send Email**: Email the markdown report
4. **Save to CRM**: Store analysis results

### Batch Processing

The node supports batch processing - input multiple items and receive individual analysis for each:

```
[
  { clientName: "Client A", ... },
  { clientName: "Client B", ... }
]
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Format code
npm run format

# Lint
npm run lint
```

## File Structure

```
n8n-nodes-automation-analyzer/
├── package.json
├── tsconfig.json
├── gulpfile.js
├── README.md
├── credentials/
│   └── AutomationAnalyzerApi.credentials.ts
└── nodes/
    └── AutomationAnalyzer/
        ├── AutomationAnalyzer.node.ts
        └── automationAnalyzer.svg
```

## Troubleshooting

### Node doesn't appear in n8n
- Ensure you've run `npm run build`
- Restart n8n after installation
- Check `~/.n8n/custom` for the dist folder

### LLM analysis fails
- Verify API key is correct
- Check model name spelling
- Fallback to Quick Scan mode for template-based analysis

### Python script errors
- Ensure Python 3 is installed
- Check script path is absolute
- Verify script has execute permissions

## License

MIT

## Credits

Based on the OpenClaw automation-opportunity-analyzer skill.
