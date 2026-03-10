export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: string;
  teamId?: string;
  organizationId?: string; // active org context (set after switch-org)
}
