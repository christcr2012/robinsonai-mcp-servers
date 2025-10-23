/**
 * Brainstorming Tool
 * Generate many ideas quickly without judgment
 */

export interface BrainstormingInput {
  prompt: string;
  context?: string;
  quantity?: number;
}

export interface BrainstormingOutput {
  ideas: Array<{ idea: string; category: string; novelty: number }>;
  categories: string[];
  wildIdeas: string[];
  practicalIdeas: string[];
  confidence: number;
  reasoning: string;
}

export function brainstorming(input: BrainstormingInput): BrainstormingOutput {
  const { prompt, context = '', quantity = 20 } = input;
  const combined = `${prompt} ${context}`.toLowerCase();
  
  const ideas: Array<{ idea: string; category: string; novelty: number }> = [];
  const wildIdeas: string[] = [];
  const practicalIdeas: string[] = [];
  
  // Generate ideas based on prompt domain
  if (combined.includes('feature') || combined.includes('product')) {
    ideas.push({ idea: 'AI-powered auto-complete for user inputs', category: 'AI/ML', novelty: 70 });
    ideas.push({ idea: 'Dark mode with custom color themes', category: 'UX', novelty: 30 });
    ideas.push({ idea: 'Collaborative real-time editing', category: 'Collaboration', novelty: 60 });
    ideas.push({ idea: 'Voice commands for hands-free operation', category: 'Accessibility', novelty: 75 });
    ideas.push({ idea: 'Gamification with points and achievements', category: 'Engagement', novelty: 50 });
    ideas.push({ idea: 'Export to 10+ different file formats', category: 'Integration', novelty: 40 });
    ideas.push({ idea: 'Offline mode with sync when online', category: 'Reliability', novelty: 65 });
    ideas.push({ idea: 'Plugin marketplace for third-party extensions', category: 'Ecosystem', novelty: 80 });
    ideas.push({ idea: 'Time-travel debugging to replay user sessions', category: 'Developer Tools', novelty: 85 });
    ideas.push({ idea: 'Blockchain-based audit trail', category: 'Security', novelty: 90 });
  }
  
  if (combined.includes('performance') || combined.includes('optimize')) {
    ideas.push({ idea: 'Implement aggressive caching at every layer', category: 'Caching', novelty: 30 });
    ideas.push({ idea: 'Use WebAssembly for compute-heavy operations', category: 'Technology', novelty: 75 });
    ideas.push({ idea: 'Lazy load everything - images, components, data', category: 'Loading', novelty: 40 });
    ideas.push({ idea: 'Pre-compute and cache common queries', category: 'Database', novelty: 50 });
    ideas.push({ idea: 'Use edge computing to serve from closest location', category: 'Infrastructure', novelty: 70 });
    ideas.push({ idea: 'Implement virtual scrolling for large lists', category: 'UI', novelty: 55 });
    ideas.push({ idea: 'Use service workers for background processing', category: 'PWA', novelty: 65 });
    ideas.push({ idea: 'Compress all assets with Brotli', category: 'Compression', novelty: 35 });
    ideas.push({ idea: 'Use HTTP/3 and QUIC protocol', category: 'Network', novelty: 80 });
    ideas.push({ idea: 'Implement predictive prefetching based on user behavior', category: 'AI/ML', novelty: 85 });
  }
  
  if (combined.includes('monetize') || combined.includes('revenue')) {
    ideas.push({ idea: 'Freemium model with premium features', category: 'Pricing', novelty: 20 });
    ideas.push({ idea: 'Usage-based pricing (pay per API call)', category: 'Pricing', novelty: 50 });
    ideas.push({ idea: 'Enterprise tier with custom SLAs', category: 'B2B', novelty: 40 });
    ideas.push({ idea: 'Marketplace for user-created content', category: 'Platform', novelty: 70 });
    ideas.push({ idea: 'Affiliate program for referrals', category: 'Growth', novelty: 45 });
    ideas.push({ idea: 'White-label solution for agencies', category: 'B2B', novelty: 65 });
    ideas.push({ idea: 'Sponsored features or integrations', category: 'Partnerships', novelty: 60 });
    ideas.push({ idea: 'Data insights as a paid product', category: 'Data', novelty: 75 });
    ideas.push({ idea: 'Certification program for power users', category: 'Education', novelty: 55 });
    ideas.push({ idea: 'NFT-based access tokens', category: 'Web3', novelty: 95 });
  }
  
  if (combined.includes('growth') || combined.includes('marketing')) {
    ideas.push({ idea: 'Viral referral program with incentives', category: 'Referral', novelty: 40 });
    ideas.push({ idea: 'Content marketing with SEO-optimized blog', category: 'Content', novelty: 25 });
    ideas.push({ idea: 'Partner with influencers for promotion', category: 'Influencer', novelty: 50 });
    ideas.push({ idea: 'Create free tools that lead to paid product', category: 'Lead Gen', novelty: 60 });
    ideas.push({ idea: 'Host virtual events and webinars', category: 'Events', novelty: 45 });
    ideas.push({ idea: 'Build in public and share journey on social media', category: 'Community', novelty: 55 });
    ideas.push({ idea: 'Create API-first product for developer adoption', category: 'Developer', novelty: 70 });
    ideas.push({ idea: 'Gamify onboarding with progress tracking', category: 'Onboarding', novelty: 65 });
    ideas.push({ idea: 'Launch on Product Hunt, Hacker News, Reddit', category: 'Launch', novelty: 35 });
    ideas.push({ idea: 'Create memes and viral content', category: 'Viral', novelty: 80 });
  }
  
  if (combined.includes('reduce') || combined.includes('cost')) {
    ideas.push({ idea: 'Move to cheaper cloud provider', category: 'Infrastructure', novelty: 30 });
    ideas.push({ idea: 'Use spot instances for non-critical workloads', category: 'Cloud', novelty: 50 });
    ideas.push({ idea: 'Implement aggressive data retention policies', category: 'Storage', novelty: 40 });
    ideas.push({ idea: 'Replace paid services with open source alternatives', category: 'Software', novelty: 45 });
    ideas.push({ idea: 'Optimize database queries to reduce compute', category: 'Database', novelty: 55 });
    ideas.push({ idea: 'Use CDN for static assets instead of origin', category: 'CDN', novelty: 35 });
    ideas.push({ idea: 'Implement tiered storage (hot/warm/cold)', category: 'Storage', novelty: 60 });
    ideas.push({ idea: 'Batch process jobs during off-peak hours', category: 'Scheduling', novelty: 50 });
    ideas.push({ idea: 'Use serverless for variable workloads', category: 'Serverless', novelty: 65 });
    ideas.push({ idea: 'Run own data center instead of cloud', category: 'Infrastructure', novelty: 85 });
  }
  
  // Add wild ideas (high novelty)
  wildIdeas.push('Make the entire product a game');
  wildIdeas.push('Use AI to generate the product based on user description');
  wildIdeas.push('Charge users in cryptocurrency only');
  wildIdeas.push('Make it work only on Tuesdays to create scarcity');
  wildIdeas.push('Replace all text with emojis');
  wildIdeas.push('Use quantum computing for... something');
  wildIdeas.push('Make it a DAO where users vote on features');
  wildIdeas.push('Integrate with brain-computer interfaces');
  wildIdeas.push('Use AR/VR for the entire interface');
  wildIdeas.push('Make it smell-enabled (olfactory UX)');
  
  // Add practical ideas (low novelty but proven)
  practicalIdeas.push('Add comprehensive documentation');
  practicalIdeas.push('Implement proper error handling');
  practicalIdeas.push('Add unit and integration tests');
  practicalIdeas.push('Set up monitoring and alerting');
  practicalIdeas.push('Create onboarding tutorial');
  practicalIdeas.push('Add keyboard shortcuts');
  practicalIdeas.push('Implement search functionality');
  practicalIdeas.push('Add export/import features');
  practicalIdeas.push('Create mobile-responsive design');
  practicalIdeas.push('Add email notifications');
  
  // Categorize ideas
  const categories = [...new Set(ideas.map(i => i.category))];
  
  const confidence = 60;
  
  return {
    ideas,
    categories,
    wildIdeas,
    practicalIdeas,
    confidence,
    reasoning: `Generated ${ideas.length} ideas across ${categories.length} categories, plus ${wildIdeas.length} wild ideas and ${practicalIdeas.length} practical ideas.`
  };
}

