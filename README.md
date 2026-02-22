# Custom n8n Nodes Monorepo

This repository contains all custom n8n nodes used in our n8n deployment.

## Structure

```
custom_n8n_nodes/
├── n8n-nodes-automation-analyzer/    # Automation Analyzer node
└── (future nodes go here)/
```

## Nodes

### n8n-nodes-automation-analyzer
AI-powered workflow analyzer that evaluates your n8n automations for cost savings, efficiency improvements, and expansion opportunities.

See [n8n-nodes-automation-analyzer/README.md](./n8n-nodes-automation-analyzer/README.md) for details.

## Installation

Each node package in this monorepo is installed separately into n8n. The deployment workflow handles:

1. Cloning this repository
2. Running `npm install` in each node directory
3. Building the TypeScript files
4. Symlinking to n8n's custom nodes directory

## Adding New Nodes

1. Create a new directory for your node package
2. Set up the standard n8n custom node structure (package.json, nodes/, credentials/, etc.)
3. Add a README.md documenting the node
4. Update the deployment workflow if needed

## Development

To work on a node locally:

```bash
cd n8n-nodes-automation-analyzer
npm install
npm run build
```

Then link it to your local n8n instance.

## License

MIT
