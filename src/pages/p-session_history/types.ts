

export interface SessionData {
  id: string;
  name: string;
  agents: string[];
  lastActive: string;
  status: 'active' | 'archived' | 'starred';
  isStarred: boolean;
}

export interface SessionFilters {
  status: string;
  agent: string;
  time: string;
}

