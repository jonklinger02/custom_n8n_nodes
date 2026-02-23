# Deployment Instructions

## Fix Applied (2026-02-23)

**Issue:** Anthropic API returning markdown-formatted JSON (```json ... ```) instead of raw JSON, causing parse error.

**Fix:** Added `extractJSON()` helper function that strips markdown code fences before parsing JSON. Applied to both `callAnthropic()` and `callOpenAI()` functions.

## Deploy to Production n8n

### Option 1: If using npm link (development)
The build is already complete. Just restart n8n:

```bash
# Restart n8n service
sudo systemctl restart n8n
# or if using docker:
docker restart n8n
```

### Option 2: If copying files manually

1. Copy the built files to n8n custom nodes directory:
```bash
cp -r ~/projects/custom_n8n_nodes/n8n-nodes-automation-analyzer /path/to/n8n/custom/
```

2. Restart n8n:
```bash
sudo systemctl restart n8n
```

### Option 3: If using Docker

1. Rebuild the Docker image or copy files into the container:
```bash
docker cp ~/projects/custom_n8n_nodes/n8n-nodes-automation-analyzer n8n:/data/custom/
docker restart n8n
```

## Verify Deployment

After restarting, test the Automation Analyzer node with an Anthropic credential to ensure JSON parsing works correctly.

## Files Changed

- `nodes/AutomationAnalyzer/AutomationAnalyzer.node.ts` - Added `extractJSON()` function and updated both LLM call handlers
- `dist/nodes/AutomationAnalyzer/AutomationAnalyzer.node.js` - Compiled output
