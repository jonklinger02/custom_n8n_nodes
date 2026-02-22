"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationAnalyzer = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const https = __importStar(require("https"));
// Industry patterns embedded for standalone operation
const INDUSTRY_PATTERNS = {
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
// Helper functions outside the class
function mapIndustryToKey(industry) {
    const mapping = {
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
function generateMarkdownReport(data) {
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
function generateTemplateAnalysis(clientData) {
    var _a, _b, _c;
    const industryKey = mapIndustryToKey(clientData.industry);
    const patterns = INDUSTRY_PATTERNS[industryKey] || INDUSTRY_PATTERNS['professional_services'];
    const date = new Date().toISOString().split('T')[0];
    const hourlyRate = 20;
    // Generate bottlenecks with cost estimates
    const bottlenecks = patterns.bottlenecks.map((bottleneck, idx) => {
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
    const lowHangingFruit = patterns.lowHangingFruit.map((item, idx) => {
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
    const deepDive = patterns.hiddenAutomations.map((item, idx) => ({
        name: item,
        implementationTime: `${2 + idx} weeks`,
        paybackPeriod: `${2 + idx} months`,
        strategicValue: idx === 0 ? 'High' : idx === 1 ? 'Medium' : 'Medium-High',
    }));
    // Top recommendations
    const recommendations = [
        {
            priority: 1,
            name: ((_a = lowHangingFruit[0]) === null || _a === void 0 ? void 0 : _a.name) || 'Lead Response Automation',
            reason: 'Near-instant payback, high visibility impact, builds trust with prospects',
        },
        {
            priority: 2,
            name: ((_b = lowHangingFruit[1]) === null || _b === void 0 ? void 0 : _b.name) || 'Scheduling Automation',
            reason: 'Reduces administrative overhead, improves customer experience',
        },
        {
            priority: 3,
            name: ((_c = deepDive[0]) === null || _c === void 0 ? void 0 : _c.name) || 'Process Optimization',
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
async function executePythonScript(clientData, scriptPath) {
    // Create temp JSON file for input
    const tempFile = path.join(os.tmpdir(), `automation-analyzer-${Date.now()}.json`);
    fs.writeFileSync(tempFile, JSON.stringify(clientData));
    try {
        const result = (0, child_process_1.execSync)(`python3 "${scriptPath}" --json "${tempFile}"`, {
            encoding: 'utf-8',
            timeout: 120000,
        });
        // Try to parse structured output, otherwise return as markdown
        try {
            return JSON.parse(result);
        }
        catch {
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
    }
    finally {
        // Cleanup
        try {
            fs.unlinkSync(tempFile);
        }
        catch { /* ignore */ }
    }
}
function buildAnalysisPrompt(clientData) {
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
async function callOpenAI(prompt, credentials) {
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
                var _a, _b, _c;
                try {
                    const response = JSON.parse(body);
                    const content = (_c = (_b = (_a = response.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
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
                    }
                    else {
                        reject(new Error('No content in OpenAI response'));
                    }
                }
                catch (e) {
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
async function callAnthropic(prompt, credentials) {
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
                var _a, _b;
                try {
                    const response = JSON.parse(body);
                    const content = (_b = (_a = response.content) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.text;
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
                    }
                    else {
                        reject(new Error('No content in Anthropic response'));
                    }
                }
                catch (e) {
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
async function executeLLMAnalysis(clientData, credentials) {
    const prompt = buildAnalysisPrompt(clientData);
    if (credentials.llmProvider === 'openai') {
        return await callOpenAI(prompt, credentials);
    }
    else if (credentials.llmProvider === 'anthropic') {
        return await callAnthropic(prompt, credentials);
    }
    // Fallback
    return generateTemplateAnalysis(clientData);
}
class AutomationAnalyzer {
    constructor() {
        this.description = {
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
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const operation = this.getNodeParameter('operation', 0);
        for (let i = 0; i < items.length; i++) {
            try {
                const clientName = this.getNodeParameter('clientName', i);
                const businessName = this.getNodeParameter('businessName', i);
                const industry = this.getNodeParameter('industry', i);
                const customIndustry = industry === 'other'
                    ? this.getNodeParameter('customIndustry', i)
                    : '';
                const currentSoftware = this.getNodeParameter('currentSoftware', i);
                const email = this.getNodeParameter('email', i);
                const phone = this.getNodeParameter('phone', i);
                const additionalContext = this.getNodeParameter('additionalContext', i);
                const clientData = {
                    name: clientName,
                    business: businessName,
                    industry: customIndustry || industry,
                    software: currentSoftware,
                    email: email || 'N/A',
                    phone: phone || 'N/A',
                    additionalContext,
                };
                let result;
                if (operation === 'quickScan') {
                    // Generate template-based analysis without LLM
                    result = generateTemplateAnalysis(clientData);
                }
                else {
                    // Try LLM-based analysis
                    const credentials = await this.getCredentials('automationAnalyzerApi').catch(() => null);
                    if ((credentials === null || credentials === void 0 ? void 0 : credentials.llmProvider) === 'python' && (credentials === null || credentials === void 0 ? void 0 : credentials.pythonScriptPath)) {
                        result = await executePythonScript(clientData, credentials.pythonScriptPath);
                    }
                    else if (credentials === null || credentials === void 0 ? void 0 : credentials.apiKey) {
                        result = await executeLLMAnalysis(clientData, credentials);
                    }
                    else {
                        // Fallback to template-based analysis
                        result = generateTemplateAnalysis(clientData);
                    }
                }
                returnData.push({
                    json: JSON.parse(JSON.stringify(result)),
                    pairedItem: { item: i },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                        },
                        pairedItem: { item: i },
                    });
                    continue;
                }
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), error, { itemIndex: i });
            }
        }
        return [returnData];
    }
}
exports.AutomationAnalyzer = AutomationAnalyzer;
