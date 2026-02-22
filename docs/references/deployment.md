# n8n Custom Node Deployment

## Repository Structure

### Monorepo Pattern (Recommended)

```
custom_n8n_nodes/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── n8n-nodes-mynode/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
└── n8n-nodes-anothernode/
    ├── package.json
    └── ...
```

Benefits:
- Single repo for all custom nodes
- Unified CI/CD pipeline
- Easy to add new nodes
- Consistent build process

## GitHub Actions Workflow

### deploy.yml

```yaml
name: Build and Deploy n8n Custom Nodes

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout custom nodes repo
        uses: actions/checkout@v4
        with:
          path: custom_n8n_nodes
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: '**/package-lock.json'
      
      - name: Build all custom nodes
        run: |
          for dir in custom_n8n_nodes/n8n-nodes-*/; do
            if [ -f "$dir/package.json" ]; then
              echo "Building $(basename $dir)..."
              cd "$dir"
              npm ci
              npm run build
              cd -
            fi
          done
      
      - name: Deploy to server
        uses: appleboy/scp-action@v0.1.7
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          source: "custom_n8n_nodes/n8n-nodes-*"
          target: "/opt/n8n/"
          strip_components: 1
          rm: true
      
      - name: Install nodes and restart n8n
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            # Install each custom node via npm
            for dir in /opt/n8n/custom_nodes/n8n-nodes-*/; do
              if [ -d "$dir" ]; then
                node_name=$(basename "$dir")
                echo "Installing $node_name..."
                docker exec n8n_main sh -c "cd /home/node/.n8n/nodes && npm install /home/node/.n8n/custom/$node_name"
              fi
            done
            
            # Restart n8n to load new nodes
            docker restart n8n_main
            
            echo "Deployment complete!"
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | Server hostname or IP |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_KEY` | SSH private key |

## Docker Compose Volume Mount

In your `docker-compose.yml`:

```yaml
services:
  n8n:
    image: n8nio/n8n
    container_name: n8n_main
    volumes:
      - n8n_data:/home/node/.n8n
      - /opt/n8n/custom_nodes:/home/node/.n8n/custom:ro
    environment:
      - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
    # ... other config
```

Key points:
- Mount custom_nodes as read-only (`:ro`)
- Set `N8N_CUSTOM_EXTENSIONS` environment variable
- Actual installation happens in `/home/node/.n8n/nodes/`

## Manual Deployment Script

For deployments without GitHub Actions:

```bash
#!/bin/bash
# deploy-n8n-nodes.sh

set -e

SERVER="user@server"
REMOTE_PATH="/opt/n8n/custom_nodes"
N8N_CONTAINER="n8n_main"

# Build all nodes
for dir in n8n-nodes-*/; do
  if [ -f "$dir/package.json" ]; then
    echo "Building $dir..."
    (cd "$dir" && npm ci && npm run build)
  fi
done

# Copy to server (exclude node_modules to save bandwidth)
for dir in n8n-nodes-*/; do
  if [ -d "$dir" ]; then
    rsync -avz --exclude 'node_modules' "$dir" "$SERVER:$REMOTE_PATH/"
  fi
done

# Install on server
ssh "$SERVER" << 'EOF'
for dir in /opt/n8n/custom_nodes/n8n-nodes-*/; do
  node_name=$(basename "$dir")
  docker exec n8n_main sh -c "cd /home/node/.n8n/nodes && npm install /home/node/.n8n/custom/$node_name"
done
docker restart n8n_main
EOF

echo "Deployment complete!"
```

## Server Directory Permissions

Ensure the deployment user can write to the custom nodes directory:

```bash
# Create directory
sudo mkdir -p /opt/n8n/custom_nodes

# Set ownership
sudo chown -R deployment:deployment /opt/n8n/custom_nodes

# Set permissions
sudo chmod -R 755 /opt/n8n/custom_nodes
```

## Verifying Deployment

After deployment, verify nodes are properly installed:

```bash
# Check files were copied
ls -la /opt/n8n/custom_nodes/

# Check npm installation in container
docker exec n8n_main sh -c 'ls -la ~/.n8n/nodes/node_modules/'

# Check n8n logs for node loading
docker logs n8n_main 2>&1 | grep -i "loaded" | tail -20

# Check for errors
docker logs n8n_main 2>&1 | grep -i "error" | tail -20
```

## Rollback Procedure

If a deployment breaks n8n:

```bash
# 1. Remove problematic node
docker exec n8n_main sh -c 'cd ~/.n8n/nodes && npm uninstall n8n-nodes-problematic'

# 2. Restart n8n
docker restart n8n_main

# 3. Remove files from server
rm -rf /opt/n8n/custom_nodes/n8n-nodes-problematic
```

## Multi-Environment Deployment

For staging/production environments:

```yaml
# deploy.yml with environment selection
on:
  push:
    branches:
      - main        # → production
      - develop     # → staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'staging' }}
    steps:
      # ... deployment steps
      # Secrets are environment-specific
```

Set up separate environments in GitHub with different secrets for each.
