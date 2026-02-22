# n8n Node Templates

## Basic Node Structure

### MyNode.node.ts

```typescript
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

export class MyNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'My Node',
    name: 'myNode',                    // Internal name (camelCase)
    icon: 'file:mynode.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Description of what the node does',
    defaults: {
      name: 'My Node',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'myNodeApi',
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
            name: 'Create',
            value: 'create',
            description: 'Create a resource',
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
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        displayOptions: {
          show: {
            operation: ['create'],
          },
        },
        description: 'Name of the resource to create',
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];
    const operation = this.getNodeParameter('operation', 0) as string;

    const credentials = await this.getCredentials('myNodeApi');

    for (let i = 0; i < items.length; i++) {
      try {
        if (operation === 'get') {
          const resourceId = this.getNodeParameter('resourceId', i) as string;
          
          // Make API call
          const response = await this.helpers.request({
            method: 'GET',
            url: `${credentials.baseUrl}/resources/${resourceId}`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            json: true,
          });
          
          returnData.push({ json: response });
        }
        
        if (operation === 'create') {
          const name = this.getNodeParameter('name', i) as string;
          
          const response = await this.helpers.request({
            method: 'POST',
            url: `${credentials.baseUrl}/resources`,
            headers: {
              'Authorization': `Bearer ${credentials.apiKey}`,
            },
            body: { name },
            json: true,
          });
          
          returnData.push({ json: response });
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ json: { error: error.message } });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
```

## Credentials Template

### MyNodeApi.credentials.ts

```typescript
import {
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class MyNodeApi implements ICredentialType {
  name = 'myNodeApi';
  displayName = 'My Node API';
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
```

## Trigger Node Template

For nodes that receive webhooks or poll for data:

```typescript
import {
  ITriggerFunctions,
  ITriggerResponse,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow';

export class MyTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'My Trigger',
    name: 'myTrigger',
    icon: 'file:mytrigger.svg',
    group: ['trigger'],
    version: 1,
    description: 'Triggers when something happens',
    defaults: {
      name: 'My Trigger',
    },
    inputs: [],
    outputs: ['main'],
    webhooks: [
      {
        name: 'default',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: 'webhook',
      },
    ],
    properties: [
      {
        displayName: 'Event',
        name: 'event',
        type: 'options',
        options: [
          { name: 'Created', value: 'created' },
          { name: 'Updated', value: 'updated' },
        ],
        default: 'created',
      },
    ],
  };

  async webhook(this: ITriggerFunctions): Promise<ITriggerResponse> {
    const req = this.getRequestObject();
    const body = req.body;

    return {
      workflowData: [
        this.helpers.returnJsonArray(body),
      ],
    };
  }
}
```

## tsconfig.json

```json
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
```

## gulpfile.js (for icons)

```javascript
const { src, dest } = require('gulp');

function buildIcons() {
  return src('src/**/*.{svg,png}')
    .pipe(dest('dist'));
}

exports['build:icons'] = buildIcons;
```

## Node Naming Conventions

| Field | Convention | Example |
|-------|-----------|---------|
| `name` (internal) | camelCase | `myNode` |
| `displayName` | Title Case | `My Node` |
| package name | kebab-case with prefix | `n8n-nodes-mynode` |
| filename | PascalCase | `MyNode.node.ts` |

## Property Types Reference

```typescript
// String input
{
  displayName: 'Name',
  name: 'name',
  type: 'string',
  default: '',
}

// Number input
{
  displayName: 'Limit',
  name: 'limit',
  type: 'number',
  default: 10,
}

// Boolean toggle
{
  displayName: 'Active',
  name: 'active',
  type: 'boolean',
  default: true,
}

// Dropdown
{
  displayName: 'Format',
  name: 'format',
  type: 'options',
  options: [
    { name: 'JSON', value: 'json' },
    { name: 'XML', value: 'xml' },
  ],
  default: 'json',
}

// Multi-select
{
  displayName: 'Fields',
  name: 'fields',
  type: 'multiOptions',
  options: [
    { name: 'Name', value: 'name' },
    { name: 'Email', value: 'email' },
  ],
  default: [],
}

// Code editor
{
  displayName: 'JSON',
  name: 'json',
  type: 'json',
  default: '{}',
}

// Conditional display
{
  displayName: 'Custom Field',
  name: 'customField',
  type: 'string',
  default: '',
  displayOptions: {
    show: {
      operation: ['custom'],
    },
  },
}
```
