import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as https from 'https';

// Industry patterns embedded for standalone operation
const INDUSTRY_PATTERNS: Record<string, {
	bottlenecks: string[];
	lowHangingFruit: Array<{ name: string; tools: string; time: string; payback: string }>;
	hiddenAutomations: string[];
}> = {
	'construction': {
		bottlenecks: [
			'Lead follow-up delays (avg 8-12 hours)',
			'Manual estimate creation (2-4 hours per estimate)',
			'Job scheduling conflicts and rework',
			'Invoice creation and follow-up',
			'Material ordering coordination',
		],
		lowHangingFruit: [
			{ name: 'Lead Response Automation', tools: 'Zapier + CRM, Twilio', time: '1-2 days', payback: '2-4 weeks' },
			{ name: 'Appointment Scheduling', tools: 'Calendly, Acuity', time: '1 week', payback: '1-2 months' },
			{ name: 'Invoice Generation', tools: 'QuickBooks API, FreshBooks', time: '1-2 weeks', payback: '2-3 months' },
		],
		hiddenAutomations: [
			'Photo documentation workflow',
			'Permit tracking and renewal notifications',
			'Weather-based job rescheduling',
			'Crew dispatch optimization',
		],
	},
	'professional_services': {
		bottlenecks: [
			'Client onboarding paperwork',
			'Meeting scheduling across timezones',
			'Document version control',
			'Time tracking and billing',
			'Client communication follow-ups',
		],
		lowHangingFruit: [
			{ name: 'Client Intake Forms', tools: 'TypeForm + Zapier + CRM', time: '2-3 days', payback: '1-2 months' },
			{ name: 'Document Assembly', tools: 'PandaDoc, DocuSign', time: '1 week', payback: '2-3 months' },
			{ name: 'Time Tracking Integration', tools: 'Toggl, Harvest', time: '3-5 days', payback: '6-8 weeks' },
		],
		hiddenAutomations: [
			'Matter/project status updates to clients',
			'Research task delegation based on keywords',
			'Engagement letter generation from intake data',
		],
	},
	'ecommerce': {
		bottlenecks: [
			'Inventory sync across channels',
			'Order fulfillment coordination',
			'Customer support ticket routing',
			'Return/refund processing',
			'Marketing campaign setup',
		],
		lowHangingFruit: [
			{ name: 'Inventory Synchronization', tools: 'Shopify integrations, TradeGecko', time: '1-2 weeks', payback: '1-2 months' },
			{ name: 'Order Status Updates', tools: 'ShipStation, AfterShip', time: '2-4 days', payback: 'Immediate' },
			{ name: 'Abandoned Cart Recovery', tools: 'Klaviyo, Mailchimp', time: '1 week', payback: '2-4 weeks' },
		],
		hiddenAutomations: [
			'Dynamic pricing based on competitor monitoring',
			'Restock notifications based on sales velocity',
			'Product recommendation engine',
			'Fraud detection scoring',
		],
	},
	'healthcare': {
		bottlenecks: [
			'Patient appointment reminders',
			'Insurance verification',
			'Prescription refill coordination',
			'Patient record requests',
			'Billing claim submission',
		],
		lowHangingFruit: [
			{ name: 'Appointment Reminders', tools: 'Weave, Solutionreach', time: '1-2 days', payback: 'Immediate' },
			{ name: 'Insurance Eligibility Checks', tools: 'Availity, Change Healthcare', time: '1-2 weeks', payback: '1-2 months' },
			{ name: 'Patient Intake Forms', tools: 'JotForm HIPAA, IntakeQ', time: '3-5 days', payback: '1 month' },
		],
		hiddenAutomations: [
			'Post-visit care instructions delivery',
			'Lab result notification workflow',
			'Referral tracking and follow-up',
			'Chronic care patient check-ins',
		],
	},
	'real_estate': {
		bottlenecks: [
			'Lead qualification and nurturing',
			'Property listing syndication',
			'Showing coordination',
			'Document collection for closings',
			'Commission tracking',
		],
		lowHangingFruit: [
			{ name: 'Lead Distribution', tools: 'Follow Up Boss, LionDesk', time: '2-4 days', payback: '2-3 weeks' },
			{ name: 'Showing Scheduling', tools: 'ShowingTime, Calendly', time: '1 week', payback: '1-2 months' },
			{ name: 'Listing Syndication', tools: 'Zillow Premier Agent, MLS', time: '1-2 days', payback: 'Immediate' },
		],
		hiddenAutomations: [
			'Market report generation for clients',
			'Transaction milestone reminders',
			'Post-close follow-up sequences',
			'Comparable property analysis',
		],
	},
	'restaurant': {
		bottlenecks: [
			'Reservation management',
			'Staff scheduling',
			'Inventory ordering',
			'Online order coordination',
			'Customer feedback collection',
		],
		lowHangingFruit: [
			{ name: 'Online Ordering Integration', tools: 'Chowly, ItsaCheckmate', time: '1 week', payback: '2-4 weeks' },
			{ name: 'Reservation Management', tools: 'OpenTable, Resy', time: '2-3 days', payback: 'Immediate' },
			{ name: 'Inventory Alerts', tools: 'MarketMan, Toast', time: '1-2 weeks', payback: '1-2 months' },
		],
		hiddenAutomations: [
			'Recipe cost tracking',
			'Staff schedule optimization',
			'Customer preference tracking',
			'Review response automation',
		],
	},
	'saas': {
		bottlenecks: [
			'User onboarding sequences',
			'Support ticket triage',
			'Trial-to-paid conversion',
			'Feature usage tracking',
			'Churn prediction',
		],
		lowHangingFruit: [
			{ name: 'Onboarding Email Sequences', tools: 'Intercom, Customer.io', time: '1 week', payback: '1-2 months' },
			{ name: 'In-app Messaging', tools: 'Appcues, Pendo', time: '1-2 weeks', payback: '2-3 months' },
			{ name: 'Trial Expiration Workflow', tools: 'Stripe + email platform', time: '3-5 days', payback: '1 month' },
		],
		hiddenAutomations: [
			'Feature adoption scoring',
			'Usage-based upsell triggers',
			'Health score calculation',
			'Documentation auto-updates',
		],
	},
};

interface ClientData {
	name: string;
	business: string;
	industry: string;
	software: string;
	email: string;
	phone: string;
	additionalContext?: string;
}

interface Bottleneck {
	name: string;
	description: string;
	hoursPerWeek: number;
	weeklyCost: number;
	annualCost: number;
}

interface LowHangingFruit {
	name: string;
	tools: string;
	implementationTime: string;
	paybackPeriod: string;
	hoursSavedPerWeek: number;
	weeklySavings: number;
	annualSavings: number;
}

interface DeepDive {
	name: string;
	implementationTime: string;
	paybackPeriod: string;
	strategicValue: string;
}

interface Recommendation {
	priority: number;
	name: string;
	reason: string;
}

interface AnalysisResult {
	success: boolean;
	analysisType: string;
	metadata: {
		clientName: string;
		businessName: string;
		industry: string;
		analyzedAt: string;
	};
	bottlenecks: Bottleneck[];
	low_hanging_fruit: LowHangingFruit[];
	deep_dive: DeepDive[];
	recommendations: Recommendation[];
	summary: {
		totalWeeklyBottleneckCost: number;
		totalAnnualBottleneckCost: number;
		potentialWeeklySavings: number;
		potentialAnnualSavings: number;
		roiPotential: string;
	};
	markdownReport: string;
}

// Helper functions outside the class
function mapIndustryToKey(industry: string): string {
	const mapping: Record<string, string> = {
		'construction': 'construction',
		'roofing': 'construction',
		'home services': 'construction',
		'professional_services': 'professional_services',
		'legal': 'professional_services',
		'accounting': 'professional_services',
		'consulting': 'professional_services',
		'ecommerce': 'ecommerce',
		'retail': 'ecommerce',
		'healthcare': 'healthcare',
		'medical': 'healthcare',
		'real_estate': 'real_estate',
		'restaurant': 'restaurant',
		'food service': 'restaurant',
		'saas': 'saas',
		'technology': 'saas',
		'software': 'saas',
	};

	const lowerIndustry = industry.toLowerCase();
	for (const [key, value] of Object.entries(mapping)) {
		if (lowerIndustry.includes(key)) {
			return value;
		}
	}
	return 'professional_services';
}

function generateMarkdownReport(data: {
	clientData: ClientData;
	date: string;
	bottlenecks: Bottleneck[];
	lowHangingFruit: LowHangingFruit[];
	deepDive: DeepDive[];
	recommendations: Recommendation[];
	totals: {
		totalWeeklyBottleneckCost: number;
		totalAnnualBottleneckCost: number;
		totalWeeklySavings: number;
		totalAnnualSavings: number;
	};
}): string {
	const { clientData, date, bottlenecks, lowHangingFruit, deepDive, recommendations, totals } = data;

	return `# AUTOMATION OPPORTUNITY ANALYSIS

**Client:** ${clientData.name}  
**Business:** ${clientData.business}  
**Industry:** ${clientData.industry}  
**Date:** ${date}

---

## Executive Summary

Based on industry analysis for ${clientData.industry}, we've identified significant automation opportunities that could save your business an estimated **$${totals.totalAnnualSavings.toLocaleString()} annually**.

---

## 1. WORKFLOW BOTTLENECK ANALYSIS

${bottlenecks.map((b, i) => `### Bottleneck #${i + 1}: ${b.name}
- **Description:** ${b.description}
- **Time Investment:** ${b.hoursPerWeek} hours/week
- **Labor Cost:** $${b.weeklyCost}/week ($${b.annualCost.toLocaleString()} annually at $20/hr)
`).join('\n')}

**Total Bottleneck Cost:** $${totals.totalWeeklyBottleneckCost}/week ($${totals.totalAnnualBottleneckCost.toLocaleString()}/year)

---

## 2. LOW-HANGING FRUIT AUTOMATIONS

${lowHangingFruit.map((l, i) => `### Automation #${i + 1}: ${l.name}
- **Tools:** ${l.tools}
- **Implementation Time:** ${l.implementationTime}
- **Payback Period:** ${l.paybackPeriod}
- **Labor Savings:** ${l.hoursSavedPerWeek} hours/week ($${l.weeklySavings}/week, $${l.annualSavings.toLocaleString()}/year)
`).join('\n')}

---

## 3. DEEP DIVE HIDDEN AUTOMATIONS

${deepDive.map((d, i) => `### Hidden Automation #${i + 1}: ${d.name}
- **Implementation Time:** ${d.implementationTime}
- **Payback Period:** ${d.paybackPeriod}
- **Strategic Value:** ${d.strategicValue}
`).join('\n')}

---

## 4. BIGGEST IMPACT RECOMMENDATIONS

${recommendations.map((r) => `### Priority #${r.priority}: ${r.name}
**Why Prioritize:** ${r.reason}
`).join('\n')}

---

## Summary & ROI

| Metric | Value |
|--------|-------|
| Current Bottleneck Cost | $${totals.totalAnnualBottleneckCost.toLocaleString()}/year |
| Potential Savings | $${totals.totalAnnualSavings.toLocaleString()}/year |
| ROI Potential | ${Math.round((totals.totalAnnualSavings / totals.totalAnnualBottleneckCost) * 100)}% |

---

## Next Steps

1. Review and validate bottleneck analysis
2. Prioritize automation opportunities based on strategic goals
3. Develop detailed implementation plan for top recommendations
4. Schedule discovery session to gather additional workflow details

---

*Generated by Automation Opportunity Analyzer*
`;
}

function generateTemplateAnalysis(clientData: ClientData): AnalysisResult {
	const industryKey = mapIndustryToKey(clientData.industry);
	const patterns = INDUSTRY_PATTERNS[industryKey] || INDUSTRY_PATTERNS['professional_services'];
	const date = new Date().toISOString().split('T')[0];
	const hourlyRate = 20;

	// Generate bottlenecks with cost estimates
	const bottlenecks: Bottleneck[] = patterns.bottlenecks.map((bottleneck, idx) => {
		const hoursPerWeek = 5 + (idx * 2);
		const weeklyCost = hoursPerWeek * hourlyRate;
		const annualCost = weeklyCost * 52;
		return {
			name: bottleneck.split('(')[0].trim(),
			description: bottleneck,
			hoursPerWeek,
			weeklyCost,
			annualCost,
		};
	});

	// Generate low-hanging fruit with savings
	const lowHangingFruit: LowHangingFruit[] = patterns.lowHangingFruit.map((item, idx) => {
		const hoursSaved = 8 + (idx * 3);
		return {
			name: item.name,
			tools: item.tools,
			implementationTime: item.time,
			paybackPeriod: item.payback,
			hoursSavedPerWeek: hoursSaved,
			weeklySavings: hoursSaved * hourlyRate,
			annualSavings: hoursSaved * hourlyRate * 52,
		};
	});

	// Hidden automations
	const deepDive: DeepDive[] = patterns.hiddenAutomations.map((item, idx) => ({
		name: item,
		implementationTime: `${2 + idx} weeks`,
		paybackPeriod: `${2 + idx} months`,
		strategicValue: idx === 0 ? 'High' : idx === 1 ? 'Medium' : 'Medium-High',
	}));

	// Top recommendations
	const recommendations: Recommendation[] = [
		{
			priority: 1,
			name: lowHangingFruit[0]?.name || 'Lead Response Automation',
			reason: 'Near-instant payback, high visibility impact, builds trust with prospects',
		},
		{
			priority: 2,
			name: lowHangingFruit[1]?.name || 'Scheduling Automation',
			reason: 'Reduces administrative overhead, improves customer experience',
		},
		{
			priority: 3,
			name: deepDive[0]?.name || 'Process Optimization',
			reason: 'Strategic long-term value, compounds over time',
		},
	];

	// Calculate totals
	const totalWeeklyBottleneckCost = bottlenecks.reduce((sum, b) => sum + b.weeklyCost, 0);
	const totalAnnualBottleneckCost = bottlenecks.reduce((sum, b) => sum + b.annualCost, 0);
	const totalWeeklySavings = lowHangingFruit.reduce((sum, l) => sum + l.weeklySavings, 0);
	const totalAnnualSavings = lowHangingFruit.reduce((sum, l) => sum + l.annualSavings, 0);

	// Generate markdown report
	const markdownReport = generateMarkdownReport({
		clientData,
		date,
		bottlenecks,
		lowHangingFruit,
		deepDive,
		recommendations,
		totals: {
			totalWeeklyBottleneckCost,
			totalAnnualBottleneckCost,
			totalWeeklySavings,
			totalAnnualSavings,
		},
	});

	return {
		success: true,
		analysisType: 'template',
		metadata: {
			clientName: clientData.name,
			businessName: clientData.business,
			industry: clientData.industry,
			analyzedAt: new Date().toISOString(),
		},
		bottlenecks,
		low_hanging_fruit: lowHangingFruit,
		deep_dive: deepDive,
		recommendations,
		summary: {
			totalWeeklyBottleneckCost,
			totalAnnualBottleneckCost,
			potentialWeeklySavings: totalWeeklySavings,
			potentialAnnualSavings: totalAnnualSavings,
			roiPotential: `${Math.round((totalAnnualSavings / totalAnnualBottleneckCost) * 100)}%`,
		},
		markdownReport,
	};
}

async function executePythonScript(clientData: ClientData, scriptPath: string): Promise<AnalysisResult> {
	// Create temp JSON file for input
	const tempFile = path.join(os.tmpdir(), `automation-analyzer-${Date.now()}.json`);
	fs.writeFileSync(tempFile, JSON.stringify(clientData));

	try {
		const result = execSync(`python3 "${scriptPath}" --json "${tempFile}"`, {
			encoding: 'utf-8',
			timeout: 120000,
		});

		// Try to parse structured output, otherwise return as markdown
		try {
			return JSON.parse(result);
		} catch {
			return {
				success: true,
				analysisType: 'python_script',
				metadata: {
					clientName: clientData.name,
					businessName: clientData.business,
					industry: clientData.industry,
					analyzedAt: new Date().toISOString(),
				},
				bottlenecks: [],
				low_hanging_fruit: [],
				deep_dive: [],
				recommendations: [],
				summary: {
					totalWeeklyBottleneckCost: 0,
					totalAnnualBottleneckCost: 0,
					potentialWeeklySavings: 0,
					potentialAnnualSavings: 0,
					roiPotential: '0%',
				},
				markdownReport: result,
			};
		}
	} finally {
		// Cleanup
		try {
			fs.unlinkSync(tempFile);
		} catch { /* ignore */ }
	}
}

function buildAnalysisPrompt(clientData: ClientData): string {
	return `You are an automation consultant analyzing a client's business for workflow automation opportunities.

CLIENT INFORMATION:
- Client Name: ${clientData.name}
- Business Name: ${clientData.business}
- Industry: ${clientData.industry}
- Current Software: ${clientData.software}
- Contact: ${clientData.email} / ${clientData.phone}
${clientData.additionalContext ? `- Additional Context: ${clientData.additionalContext}` : ''}

Provide a comprehensive automation opportunity analysis with the following sections in JSON format:

{
  "bottlenecks": [
    {
      "name": "string",
      "description": "string",
      "hoursPerWeek": number,
      "weeklyCost": number,
      "annualCost": number
    }
  ],
  "low_hanging_fruit": [
    {
      "name": "string",
      "tools": "string",
      "implementationTime": "string",
      "paybackPeriod": "string",
      "hoursSavedPerWeek": number,
      "weeklySavings": number,
      "annualSavings": number
    }
  ],
  "deep_dive": [
    {
      "name": "string",
      "description": "string",
      "implementationTime": "string",
      "paybackPeriod": "string",
      "strategicValue": "string"
    }
  ],
  "recommendations": [
    {
      "priority": number,
      "name": "string",
      "reason": "string"
    }
  ],
  "summary": {
    "totalWeeklyBottleneckCost": number,
    "totalAnnualBottleneckCost": number,
    "potentialWeeklySavings": number,
    "potentialAnnualSavings": number
  }
}

Use $20/hr for labor cost calculations. Be specific to the ${clientData.industry} industry.
Return ONLY valid JSON, no markdown formatting.`;
}

async function callOpenAI(prompt: string, credentials: { apiKey: string; model?: string }): Promise<AnalysisResult> {
	return new Promise((resolve, reject) => {
		const data = JSON.stringify({
			model: credentials.model || 'gpt-4',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.7,
		});

		const options = {
			hostname: 'api.openai.com',
			port: 443,
			path: '/v1/chat/completions',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${credentials.apiKey}`,
			},
		};

		const req = https.request(options, (res) => {
			let body = '';
			res.on('data', (chunk) => body += chunk);
			res.on('end', () => {
				try {
					const response = JSON.parse(body);
					const content = response.choices?.[0]?.message?.content;
					if (content) {
						const parsed = JSON.parse(content);
						resolve({
							success: true,
							analysisType: 'openai',
							metadata: {
								clientName: '',
								businessName: '',
								industry: '',
								analyzedAt: new Date().toISOString(),
							},
							markdownReport: '',
							...parsed,
						});
					} else {
						reject(new Error('No content in OpenAI response'));
					}
				} catch (e) {
					reject(e);
				}
			});
		});

		req.on('error', reject);
		req.setTimeout(120000, () => reject(new Error('OpenAI request timeout')));
		req.write(data);
		req.end();
	});
}

async function callAnthropic(prompt: string, credentials: { apiKey: string; model?: string }): Promise<AnalysisResult> {
	return new Promise((resolve, reject) => {
		const data = JSON.stringify({
			model: credentials.model || 'claude-3-opus-20240229',
			max_tokens: 4096,
			messages: [{ role: 'user', content: prompt }],
		});

		const options = {
			hostname: 'api.anthropic.com',
			port: 443,
			path: '/v1/messages',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': credentials.apiKey,
				'anthropic-version': '2023-06-01',
			},
		};

		const req = https.request(options, (res) => {
			let body = '';
			res.on('data', (chunk) => body += chunk);
			res.on('end', () => {
				try {
					const response = JSON.parse(body);
					const content = response.content?.[0]?.text;
					if (content) {
						const parsed = JSON.parse(content);
						resolve({
							success: true,
							analysisType: 'anthropic',
							metadata: {
								clientName: '',
								businessName: '',
								industry: '',
								analyzedAt: new Date().toISOString(),
							},
							markdownReport: '',
							...parsed,
						});
					} else {
						reject(new Error('No content in Anthropic response'));
					}
				} catch (e) {
					reject(e);
				}
			});
		});

		req.on('error', reject);
		req.setTimeout(120000, () => reject(new Error('Anthropic request timeout')));
		req.write(data);
		req.end();
	});
}

async function executeLLMAnalysis(clientData: ClientData, credentials: { llmProvider: string; apiKey: string; model?: string }): Promise<AnalysisResult> {
	const prompt = buildAnalysisPrompt(clientData);

	if (credentials.llmProvider === 'openai') {
		return await callOpenAI(prompt, credentials);
	} else if (credentials.llmProvider === 'anthropic') {
		return await callAnthropic(prompt, credentials);
	}

	// Fallback
	return generateTemplateAnalysis(clientData);
}

export class AutomationAnalyzer implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Automation Opportunity Analyzer',
		name: 'automationAnalyzer',
		icon: 'file:automationAnalyzer.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Analyze business workflows and generate automation opportunity reports',
		defaults: {
			name: 'Automation Analyzer',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'automationAnalyzerApi',
				required: false,
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
						name: 'Analyze',
						value: 'analyze',
						description: 'Analyze a business for automation opportunities',
						action: 'Analyze a business for automation opportunities',
					},
					{
						name: 'Quick Scan',
						value: 'quickScan',
						description: 'Generate a quick template-based analysis without LLM',
						action: 'Generate quick template-based analysis',
					},
				],
				default: 'analyze',
			},
			{
				displayName: 'Client Name',
				name: 'clientName',
				type: 'string',
				default: '',
				required: true,
				description: 'Name of the client contact',
			},
			{
				displayName: 'Business Name',
				name: 'businessName',
				type: 'string',
				default: '',
				required: true,
				description: 'Name of the business being analyzed',
			},
			{
				displayName: 'Industry',
				name: 'industry',
				type: 'options',
				default: 'construction',
				required: true,
				options: [
					{ name: 'Construction / Roofing / Home Services', value: 'construction' },
					{ name: 'Professional Services (Legal, Accounting)', value: 'professional_services' },
					{ name: 'E-commerce / Retail', value: 'ecommerce' },
					{ name: 'Healthcare / Medical', value: 'healthcare' },
					{ name: 'Real Estate', value: 'real_estate' },
					{ name: 'Restaurant / Food Service', value: 'restaurant' },
					{ name: 'SaaS / Technology', value: 'saas' },
					{ name: 'Other', value: 'other' },
				],
				description: 'Industry category for the business',
			},
			{
				displayName: 'Custom Industry',
				name: 'customIndustry',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						industry: ['other'],
					},
				},
				description: 'Specify the industry if not listed above',
			},
			{
				displayName: 'Current Software',
				name: 'currentSoftware',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				description: 'Current software and tools used by the business (comma-separated or one per line)',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				description: 'Contact email address (optional)',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'Contact phone number (optional)',
			},
			{
				displayName: 'Additional Context',
				name: 'additionalContext',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Any additional context about the business workflows or pain points',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const clientName = this.getNodeParameter('clientName', i) as string;
				const businessName = this.getNodeParameter('businessName', i) as string;
				const industry = this.getNodeParameter('industry', i) as string;
				const customIndustry = industry === 'other' 
					? this.getNodeParameter('customIndustry', i) as string 
					: '';
				const currentSoftware = this.getNodeParameter('currentSoftware', i) as string;
				const email = this.getNodeParameter('email', i) as string;
				const phone = this.getNodeParameter('phone', i) as string;
				const additionalContext = this.getNodeParameter('additionalContext', i) as string;

				const clientData: ClientData = {
					name: clientName,
					business: businessName,
					industry: customIndustry || industry,
					software: currentSoftware,
					email: email || 'N/A',
					phone: phone || 'N/A',
					additionalContext,
				};

				let result: AnalysisResult;

				if (operation === 'quickScan') {
					// Generate template-based analysis without LLM
					result = generateTemplateAnalysis(clientData);
				} else {
					// Try LLM-based analysis
					const credentials = await this.getCredentials('automationAnalyzerApi').catch(() => null);
					
					if (credentials?.llmProvider === 'python' && credentials?.pythonScriptPath) {
						result = await executePythonScript(clientData, credentials.pythonScriptPath as string);
					} else if (credentials?.apiKey) {
						result = await executeLLMAnalysis(clientData, credentials as { llmProvider: string; apiKey: string; model?: string });
					} else {
						// Fallback to template-based analysis
						result = generateTemplateAnalysis(clientData);
					}
				}

				returnData.push({
					json: JSON.parse(JSON.stringify(result)) as IDataObject,
					pairedItem: { item: i },
				});

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
