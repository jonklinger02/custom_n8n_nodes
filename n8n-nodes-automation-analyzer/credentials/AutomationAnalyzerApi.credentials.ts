import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class AutomationAnalyzerApi implements ICredentialType {
	name = 'automationAnalyzerApi';
	displayName = 'Automation Analyzer API';
	documentationUrl = 'https://docs.openai.com/api-reference/authentication';
	properties: INodeProperties[] = [
		{
			displayName: 'LLM Provider',
			name: 'llmProvider',
			type: 'options',
			options: [
				{ name: 'OpenAI', value: 'openai' },
				{ name: 'Anthropic', value: 'anthropic' },
				{ name: 'Local Python Script', value: 'python' },
			],
			default: 'openai',
			description: 'Which LLM provider to use for analysis',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'API key for the selected LLM provider (not required for Python script)',
			displayOptions: {
				hide: {
					llmProvider: ['python'],
				},
			},
		},
		{
			displayName: 'Model',
			name: 'model',
			type: 'string',
			default: 'gpt-4',
			description: 'Model to use (e.g., gpt-4, gpt-3.5-turbo, claude-3-opus)',
			displayOptions: {
				hide: {
					llmProvider: ['python'],
				},
			},
		},
		{
			displayName: 'Python Script Path',
			name: 'pythonScriptPath',
			type: 'string',
			default: '',
			description: 'Path to analyze_automation_opportunities.py script',
			displayOptions: {
				show: {
					llmProvider: ['python'],
				},
			},
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{"Bearer " + $credentials.apiKey}}',
			},
		},
	};
}
