export const ROLES = {
  ADMIN: 'admin',
  LEAD: 'lead',
  BIDDER: 'bidder',
  CLOSER: 'closer',
  PROJECT_MANAGER: 'project_manager',
  OPERATOR: 'operator',
  QA: 'qa',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];
