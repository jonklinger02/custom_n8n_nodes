"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationAnalyzerApi = void 0;
class AutomationAnalyzerApi {
    constructor() {
        this.name = 'automationAnalyzerApi';
        this.displayName = 'Automation Analyzer API';
        this.documentationUrl = 'https://docs.openai.com/api-reference/authentication';
        this.properties = [
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
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '={{"Bearer " + $credentials.apiKey}}',
                },
            },
        };
    }
}
exports.AutomationAnalyzerApi = AutomationAnalyzerApi;
