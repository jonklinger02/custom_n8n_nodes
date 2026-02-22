#!/bin/bash
# Create a new n8n custom node template
# Usage: ./create-node-template.sh <node-name> [output-dir]
# Example: ./create-node-template.sh my-api ~/projects/

set -e

NODE_NAME="${1:-mynode}"
OUTPUT_DIR="${2:-.}"

# Convert to various case formats
KEBAB_NAME=$(echo "$NODE_NAME" | sed 's/[A-Z]/-\l&/g' | sed 's/^-//' | tr '[:upper:]' '[:lower:]')
PASCAL_NAME=$(echo "$KEBAB_NAME" | sed -r 's/(^|-)([a-z])/\U\2/g')
CAMEL_NAME=$(echo "$PASCAL_NAME" | sed 's/^./\L&/')

PACKAGE_NAME="n8n-nodes-$KEBAB_NAME"
PACKAGE_DIR="$OUTPUT_DIR/$PACKAGE_NAME"

echo "Creating n8n node template:"
echo "  Package: $PACKAGE_NAME"
echo "  Node: $PASCAL_NAME"
echo "  Directory: $PACKAGE_DIR"
echo ""

# Create directory structure
mkdir -p "$PACKAGE_DIR/src/nodes/$PASCAL_NAME"
mkdir -p "$PACKAGE_DIR/src/credentials"

# Create package.json
cat > "$PACKAGE_DIR/package.json" << EOF
{
  "name": "$PACKAGE_NAME",
  "version": "0.1.0",
  "description": "$PASCAL_NAME node for n8n",
  "license": "MIT",
  "main": "dist/nodes/$PASCAL_NAME/$PASCAL_NAME.node.js",
  "n8n": {
    "n8nNodesApiVersion": 1,
    "nodes": [
      "dist/nodes/$PASCAL_NAME/$PASCAL_NAME.node.js"
    ],
    "credentials": [
      "dist/credentials/${PASCAL_NAME}Api.credentials.js"
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
EOF

# Create tsconfig.json
cat > "$PACKAGE_DIR/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "strict": true,
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "es2019",
    "lib": ["es2019"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create gulpfile.js
cat > "$PACKAGE_DIR/gulpfile.js" << 'EOF'
const { src, dest } = require('gulp');

function buildIcons() {
  return src('src/**/*.{svg,png}')
    .pipe(dest('dist'));
}

exports['build:icons'] = buildIcons;
EOF

# Create node file
cat > "$PACKAGE_DIR/src/nodes/$PASCAL_NAME/$PASCAL_NAME.node.ts" << EOF
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

export class $PASCAL_NAME implements INodeType {
  description: INodeTypeDescription = {
    displayName: '$PASCAL_NAME',
    name: '$CAMEL_NAME',
    icon: 'file:$KEBAB_NAME.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Interact with $PASCAL_NAME',
    defaults: {
      name: '$PASCAL_NAME',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: '${CAMEL_NAME}Api',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Get',
            value: 'get',
            description: 'Get a resource',
          },
          {
            name: 'List',
            value: 'list',
            description: 'List resources',
          },
        ],
        default: 'get',
      },
      {
        displayName: 'Resource ID',
        name: 'resourceId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['get'],
          },
        },
        description: 'ID of the resource to get',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    const credentials = await this.getCredentials('${CAMEL_NAME}Api');

    for (let i = 0; i < items.length; i++) {
      try {
        if (operation === 'get') {
          const resourceId = this.getNodeParameter('resourceId', i) as string;
          
          const response = await this.helpers.request({
            method: 'GET',
            url: \`\${credentials.baseUrl}/resources/\${resourceId}\`,
            headers: {
              'Authorization': \`Bearer \${credentials.apiKey}\`,
            },
            json: true,
          });
          
          returnData.push({ json: response });
        }
        
        if (operation === 'list') {
          const response = await this.helpers.request({
            method: 'GET',
            url: \`\${credentials.baseUrl}/resources\`,
            headers: {
              'Authorization': \`Bearer \${credentials.apiKey}\`,
            },
            json: true,
          });
          
          if (Array.isArray(response)) {
            returnData.push(...response.map((item: object) => ({ json: item })));
          } else {
            returnData.push({ json: response });
          }
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: (error as Error).message } });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
EOF

# Create credentials file
cat > "$PACKAGE_DIR/src/credentials/${PASCAL_NAME}Api.credentials.ts" << EOF
import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class ${PASCAL_NAME}Api implements ICredentialType {
  name = '${CAMEL_NAME}Api';
  displayName = '$PASCAL_NAME API';
  documentationUrl = 'https://docs.example.com/api';
  properties: INodeProperties[] = [
    {
      displayName: 'Base URL',
      name: 'baseUrl',
      type: 'string',
      default: 'https://api.example.com',
    },
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
    },
  ];
}
EOF

# Create placeholder icon
cat > "$PACKAGE_DIR/src/nodes/$PASCAL_NAME/$KEBAB_NAME.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
  <circle cx="12" cy="12" r="4"/>
</svg>
EOF

# Create .gitignore
cat > "$PACKAGE_DIR/.gitignore" << 'EOF'
node_modules/
dist/
*.log
.DS_Store
EOF

echo "✅ Created n8n node template at $PACKAGE_DIR"
echo ""
echo "Next steps:"
echo "  1. cd $PACKAGE_DIR"
echo "  2. npm install"
echo "  3. Edit src/nodes/$PASCAL_NAME/$PASCAL_NAME.node.ts"
echo "  4. npm run build"
echo "  5. Test and deploy"
