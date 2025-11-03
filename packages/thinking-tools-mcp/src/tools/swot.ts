/**
 * SWOT Analysis Tool
 * Analyzes Strengths, Weaknesses, Opportunities, and Threats
 * Enhanced with context search to find relevant code/docs
 */

import { withContext } from '../lib/context-enhancer.js';

export interface SWOTInput {
  subject: string;
  context?: string;
  perspective?: 'technical' | 'business' | 'product' | 'team';
  useContext?: boolean;
  contextQuery?: string;
}

export interface SWOTOutput {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  strategicRecommendations: string[];
  confidence: number;
  reasoning: string;
}

export function swotAnalysis(input: SWOTInput): SWOTOutput {
  const { subject, context = '', perspective = 'technical' } = input;
  
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const opportunities: string[] = [];
  const threats: string[] = [];
  const strategicRecommendations: string[] = [];
  
  const lowerSubject = subject.toLowerCase();
  const lowerContext = context.toLowerCase();
  
  // Technology/Architecture SWOT
  if (lowerSubject.includes('typescript') || lowerContext.includes('typescript')) {
    strengths.push('Strong type safety catches bugs at compile time');
    strengths.push('Excellent IDE support and autocomplete');
    strengths.push('Large ecosystem and community');
    
    weaknesses.push('Adds build step complexity');
    weaknesses.push('Learning curve for team');
    weaknesses.push('Type definitions can be verbose');
    
    opportunities.push('Improve code quality and maintainability');
    opportunities.push('Reduce runtime errors');
    opportunities.push('Better refactoring support');
    
    threats.push('Build times may slow down development');
    threats.push('Type errors may frustrate developers');
  }
  
  if (lowerSubject.includes('react') || lowerContext.includes('react')) {
    strengths.push('Component-based architecture');
    strengths.push('Large ecosystem of libraries');
    strengths.push('Strong community support');
    strengths.push('Virtual DOM for performance');
    
    weaknesses.push('Steep learning curve for beginners');
    weaknesses.push('Frequent breaking changes');
    weaknesses.push('JSX syntax may confuse some developers');
    
    opportunities.push('Server components for better performance');
    opportunities.push('Rich ecosystem of UI libraries');
    opportunities.push('Easy to find React developers');
    
    threats.push('Framework fatigue - new frameworks emerging');
    threats.push('Bundle size can grow large');
  }
  
  if (lowerSubject.includes('microservice')) {
    strengths.push('Independent deployment of services');
    strengths.push('Technology diversity - use best tool for each service');
    strengths.push('Team autonomy and ownership');
    
    weaknesses.push('Operational complexity');
    weaknesses.push('Distributed system challenges');
    weaknesses.push('Network latency between services');
    weaknesses.push('Harder to debug and trace');
    
    opportunities.push('Scale services independently');
    opportunities.push('Isolate failures to single services');
    opportunities.push('Easier to understand individual services');
    
    threats.push('Service orchestration failures');
    threats.push('Data consistency issues');
    threats.push('Increased infrastructure costs');
  }
  
  if (lowerSubject.includes('monolith')) {
    strengths.push('Simple deployment');
    strengths.push('Easy to debug and trace');
    strengths.push('No network latency between components');
    strengths.push('Easier to maintain consistency');
    
    weaknesses.push('All-or-nothing deployment');
    weaknesses.push('Harder to scale specific features');
    weaknesses.push('Can become large and complex');
    
    opportunities.push('Modular monolith can get many microservice benefits');
    opportunities.push('Simpler operations and monitoring');
    opportunities.push('Lower infrastructure costs');
    
    threats.push('May outgrow single server capacity');
    threats.push('Tight coupling can slow development');
  }
  
  if (lowerSubject.includes('serverless') || lowerSubject.includes('lambda')) {
    strengths.push('No server management');
    strengths.push('Automatic scaling');
    strengths.push('Pay only for execution time');
    
    weaknesses.push('Cold start latency');
    weaknesses.push('Vendor lock-in');
    weaknesses.push('Debugging is harder');
    weaknesses.push('Timeout limits');
    
    opportunities.push('Focus on code, not infrastructure');
    opportunities.push('Cost-effective for variable workloads');
    opportunities.push('Built-in high availability');
    
    threats.push('Costs can spike unexpectedly');
    threats.push('Limited control over environment');
    threats.push('Not suitable for long-running tasks');
  }
  
  if (lowerSubject.includes('postgres') || lowerSubject.includes('sql')) {
    strengths.push('ACID compliance');
    strengths.push('Strong consistency');
    strengths.push('Powerful query language');
    strengths.push('Mature and battle-tested');
    
    weaknesses.push('Vertical scaling limits');
    weaknesses.push('Schema changes can be complex');
    weaknesses.push('Harder to scale horizontally');
    
    opportunities.push('JSON support for flexible data');
    opportunities.push('Full-text search capabilities');
    opportunities.push('Extensions for specialized features');
    
    threats.push('NoSQL may be better for some use cases');
    threats.push('Scaling costs can be high');
  }
  
  if (lowerSubject.includes('mongodb') || lowerSubject.includes('nosql')) {
    strengths.push('Flexible schema');
    strengths.push('Horizontal scaling');
    strengths.push('Good for unstructured data');
    
    weaknesses.push('Eventual consistency by default');
    weaknesses.push('No joins - denormalization needed');
    weaknesses.push('Can lead to data duplication');
    
    opportunities.push('Fast iteration on data model');
    opportunities.push('Good for rapid prototyping');
    opportunities.push('Scales well for read-heavy workloads');
    
    threats.push('Data integrity harder to maintain');
    threats.push('Complex queries are harder');
  }
  
  // Team/Process SWOT
  if (perspective === 'team' || lowerSubject.includes('team')) {
    strengths.push('Existing team knowledge');
    strengths.push('Established processes');
    
    weaknesses.push('Limited bandwidth');
    weaknesses.push('Knowledge silos');
    
    opportunities.push('Cross-training team members');
    opportunities.push('Improving documentation');
    opportunities.push('Automating repetitive tasks');
    
    threats.push('Key person dependencies');
    threats.push('Burnout from overwork');
  }
  
  // Generic SWOT if nothing specific
  if (strengths.length === 0) {
    strengths.push('Proven technology/approach');
    strengths.push('Available resources and documentation');
    
    weaknesses.push('Learning curve');
    weaknesses.push('Implementation complexity');
    
    opportunities.push('Improve current state');
    opportunities.push('Learn new skills');
    
    threats.push('Better alternatives may exist');
    threats.push('Changing requirements');
  }
  
  // Strategic recommendations based on SWOT
  if (strengths.length > weaknesses.length) {
    strategicRecommendations.push('Leverage strengths to capitalize on opportunities');
    strategicRecommendations.push('Use strengths to mitigate threats');
  } else {
    strategicRecommendations.push('Address weaknesses before they become critical');
    strategicRecommendations.push('Consider alternatives that better fit needs');
  }
  
  if (opportunities.length > threats.length) {
    strategicRecommendations.push('Pursue opportunities aggressively');
  } else {
    strategicRecommendations.push('Develop contingency plans for threats');
    strategicRecommendations.push('Monitor threats closely');
  }
  
  strategicRecommendations.push('Document decision rationale for future reference');
  
  const confidence = (strengths.length + weaknesses.length + opportunities.length + threats.length) > 8 ? 0.85 : 0.7;

  const reasoning = `Analyzed ${subject} from ${perspective} perspective. Found ${strengths.length} strengths, ${weaknesses.length} weaknesses, ${opportunities.length} opportunities, ${threats.length} threats.`;

  return {
    strengths,
    weaknesses,
    opportunities,
    threats,
    strategicRecommendations,
    confidence,
    reasoning
  };
}

/**
 * Enhanced version with context search
 */
export const swotAnalysisEnhanced = withContext(
  swotAnalysis,
  (input) => `${input.subject} ${input.context || ''}`.slice(0, 200)
);

