export type DocType =
  | 'plan' | 'design' | 'rfc' | 'decision' | 'completion' | 'postmortem'
  | 'retro' | 'changelog' | 'spec' | 'readme' | 'status' | 'other';

export type DocRecord = {
  id: string;
  uri: string;
  title: string;
  type: DocType;
  status?: 'draft' | 'in-progress' | 'approved' | 'done' | 'deprecated' | 'unknown';
  version?: string;
  date?: string;          // ISO if we can detect
  summary?: string;       // first paragraph or abstract
  tags?: string[];
  tasks?: Array<{ text: string; done?: boolean }>;
  links?: Array<{ kind: 'code'|'issue'|'url'; ref: string }>;
};

