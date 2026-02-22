---
name: n8n-node-creator
description: Create, build, deploy, and install custom n8n nodes. Use when creating new n8n community/private nodes, debugging node installation issues, setting up CI/CD for n8n nodes, or working with n8n's custom node system. Covers TypeScript node structure, package.json configuration, build process (npm ci && npm run build), deployment to Docker containers, and the critical npm install step (copying files alone doesn't work).
---

# n8n Node Creator

Create custom n8n nodes from scratch, build them, deploy to servers, and install into n8n instances.

## Critical Lesson Learned

**Copying files doesn't work.** n8n requires nodes to be npm-installed, not just copied:

```bash
# WRONG - node won't be detected
cp -r my-node /home/node/.n8n/nodes/

# RIGHT - creates proper npm links
cd ~/.n8n/nodes && npm install /path/to/my-node
```

## Workflow Overview

```
1. Create Node Package → 2. Build Locally → 3. Deploy to Server → 4. Install via npm → 5. Restart n8n
```

## Step 1: Create Node Package

### Package Structure

```
n8n-nodes-mynode/
├── package.json         # n8n.nodes entry required
├── tsconfig.json        # TypeScript config
├── src/
│   ├── nodes/
│   │   └── MyNode/
│   │       ├── MyNode.node.ts      # Main node logic
│   │       └── mynode.svg          # Node icon
│   └── credentials/
│       └── MyNodeApi.credentials.ts  # Optional credentials
└── dist/                # Built output (after npm run build)
```

### package.json Requirements

```json
{
  "name": "n8n-nodes-mynode",
  "version": "0.1.0",
  "description": "My custom n8n node",
  "license": "MIT",
  "main": "dist/nodes/MyNode/MyNode.node.js",
  "n8n": {
    "n8nNodesApiVersion": 1,
    "nodes": [
      "dist/nodes/MyNode/MyNode.node.js"
    ],
    "credentials": [
      "dist/credentials/MyNodeApi.credentials.js"
    ]
  },
  "scripts": {
    "build": "tsc && gulp build:icons",
    "dev": "tsc --watch",
    "lint": "eslint . --ext .ts",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "gulp": "^4.0.2",
    "n8n-core": "*",
    "n8n-workflow": "*",
    "typescript": "^5.0.0"
  }
}
```

**Key fields:**
- `n8n.nodes` - Array of node entry points (required)
- `n8n.credentials` - Array of credential types (if any)
- `n8n.n8nNodesApiVersion` - Must be 1

### Node TypeScript Template

See `references/node-template.md` for full TypeScript node examples including:
- Basic trigger node
- Action node with operations
- Credentials setup

## Step 2: Build Locally

**Never build on the server** - build locally where npm/Node.js is properly configured.

```bash
cd n8n-nodes-mynode
npm ci                    # Install dependencies
npm run build             # Compile TypeScript → dist/
```

Output: `dist/` folder with compiled JavaScript.

## Step 3: Deploy to Server

### Recommended Architecture

```
Repository: custom_n8n_nodes/          # Monorepo for all custom nodes
├── n8n-nodes-mynode/
├── n8n-nodes-anothernode/
└── .github/workflows/deploy.yml

Server:
├── /opt/n8n/custom_nodes/             # Host path (deployment target)
└── Docker mounts to → /home/node/.n8n/custom/
```

### Deployment Methods

**Method A: GitHub Actions (Recommended)**

See `references/deployment.md` for complete workflow YAML.

Key steps:
1. Checkout monorepo
2. Build all nodes locally
3. SCP packages to server
4. SSH to run npm install inside container
5. Restart n8n

**Method B: Manual Deployment**

```bash
# On build machine
cd custom_n8n_nodes/n8n-nodes-mynode
npm ci && npm run build

# Copy to server
scp -r n8n-nodes-mynode user@server:/opt/n8n/custom_nodes/

# On server - install in container
docker exec n8n_main sh -c 'cd /home/node/.n8n/nodes && npm install /home/node/.n8n/custom/n8n-nodes-mynode'

# Restart n8n
docker restart n8n_main
```

## Step 4: Install via npm

**This is the critical step most people miss.**

```bash
# Inside n8n container
docker exec -it n8n_main sh

# Create nodes directory if needed
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes

# Install the node (creates proper npm links)
npm install /home/node/.n8n/custom/n8n-nodes-mynode

# Verify installation
ls -la node_modules/
# Should show: n8n-nodes-mynode → ../../custom/n8n-nodes-mynode
```

**Why npm install is required:**
- n8n scans `~/.n8n/nodes/node_modules/` for nodes
- npm creates package.json with dependencies
- Creates proper symlinks for node resolution

## Step 5: Restart n8n

```bash
docker restart n8n_main
```

Check logs for node registration:
```bash
docker logs n8n_main 2>&1 | grep -i "mynode"
```

## Troubleshooting

### Node doesn't appear in UI

1. **Check npm installation:**
   ```bash
   docker exec n8n_main sh -c 'ls -la ~/.n8n/nodes/node_modules/'
   ```

2. **Check n8n logs:**
   ```bash
   docker logs n8n_main 2>&1 | grep -i error
   ```

3. **Verify package.json n8n entry:**
   - `n8n.nodes` must point to correct dist paths
   - Paths must exist after build

### "Unrecognized node type" on API activation

- Node visible in UI but API can't activate workflows
- Usually a node naming mismatch
- Check `name` property in `.node.ts` matches API reference

### npm errors in container

n8n Docker image has limited npm. Solutions:
- Build locally, deploy compiled
- Use `npm install /path/to/package` (not `npm install -g`)

### Permission errors

```bash
# Fix deployment directory ownership
sudo chown -R deployment:deployment /opt/n8n/custom_nodes
```

## Server Path Reference

| Location | Path |
|----------|------|
| Host deployment dir | `/opt/n8n/custom_nodes/` |
| Container mount | `/home/node/.n8n/custom/` |
| n8n nodes dir | `/home/node/.n8n/nodes/` |
| Installed modules | `/home/node/.n8n/nodes/node_modules/` |

## Reference Files

- `references/node-template.md` - TypeScript node and credential templates
- `references/deployment.md` - GitHub Actions workflow for CI/CD

## Quick Start Checklist

- [ ] Create package with `n8n.nodes` in package.json
- [ ] Write node TypeScript in `src/nodes/MyNode/`
- [ ] Build locally: `npm ci && npm run build`
- [ ] Deploy package to server
- [ ] Install via npm: `cd ~/.n8n/nodes && npm install /path/to/package`
- [ ] Restart n8n container
- [ ] Verify node appears in UI
