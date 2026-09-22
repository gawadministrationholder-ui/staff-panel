/**
 * Clearance utility functions for staff access control.
 * 
 * SEPARATION OF CONCERNS:
 * - Clearance: What permissions/actions you have (can you issue strikes? suspend staff?)
 * - Rank: Supervisory hierarchy (who you can perform actions on)
 * 
 * These are INDEPENDENT:
 * - You can have high clearance but low rank → can perform actions only on lower-ranked people
 * - You can have high rank but low clearance → cannot perform actions even on lower-ranked people
 * 
 * Page access = clearance only (no rank check)
 * Action on person = clearance required + rank hierarchy (target must be lower rank)
 */

export type ClearanceLevel = "Staff" | "Application Reviewer" | "Staff Manager" | "Executive" | "Network Administrator" | "Network Engineer";

export const CLEARANCE_LEVELS = ["Staff", "Application Reviewer", "Staff Manager", "Executive", "Network Administrator", "Network Engineer"] as const;

/**
 * Parse clearances from comma-separated string
 */
export function parseClearances(clearanceStr: string): ClearanceLevel[] {
  if (!clearanceStr) return [];
  return clearanceStr
    .split(",")
    .map((c) => c.trim())
    .filter((c): c is ClearanceLevel => CLEARANCE_LEVELS.includes(c as ClearanceLevel));
}

/**
 * Check if user has any staff access
 * Requires: Any staff clearance
 */
export function hasStaffAccess(clearance: string): boolean {
  const clearances = parseClearances(clearance);
  return clearances.length > 0;
}

/**
 * Check if user can perform basic moderation tasks
 * Requires: Staff or higher clearance
 * (Rank hierarchy still applies when targeting specific people)
 */
export function canModerate(clearance: string): boolean {
  return hasStaffAccess(clearance);
}

/**
 * Check if user can access staff management features
 * Requires: Any staff clearance for viewing
 * Requires: Staff Manager+ clearance for actions
 * NOTE: Rank hierarchy still applies - can only manage lower rank people
 */
export function canAccessStaffManagement(clearance: string, forEdit = false): boolean {
  const clearances = parseClearances(clearance);
  if (forEdit) {
    return canManagePolicies(clearance);
  }
  return clearances.length > 0;
}

/**
 * Check if user can manage policies and staff hub features
 * Requires: Staff Manager, Executive, Network Administrator, or Network Engineer clearance
 * NOTE: This is CLEARANCE only. Rank hierarchy applies when affecting specific people.
 */
export function canManagePolicies(clearance: string): boolean {
  const clearances = parseClearances(clearance);
  return clearances.includes("Staff Manager") ||
         clearances.includes("Executive") ||
         clearances.includes("Network Administrator") ||
         clearances.includes("Network Engineer");
}

/**
 * Check if user can manage another staff member (suspend, reset password, issue strikes, etc.)
 * Requires: Staff Manager+ clearance
 * NOTE: This is PERMISSION only. Still need rank hierarchy check (target.rank < user.rank).
 */
export function canManageStaff(userClearance: string): boolean {
  return canManagePolicies(userClearance);
}

/**
 * Check if user can modify another staff member's clearances
 * Requires: Staff Manager+ clearance
 * NOTE: This is PERMISSION only. Still need rank hierarchy check.
 */
export function canModifyClearances(userClearance: string): boolean {
  return canManagePolicies(userClearance);
}

/**
 * Check if user can access developer portal
 * Requires: Staff clearance for viewing
 * Requires: Network Admin clearance for editing
 * NOTE: No rank checks - these are global admin features
 */
export function canAccessDeveloperPortal(clearance: string, forEdit = false): boolean {
  const clearances = parseClearances(clearance);
  if (forEdit) {
    return canAdminister(clearance);
  }
  return clearances.length > 0;
}

/**
 * Check if user can view system logs
 * Requires: Network Administrator or Network Engineer clearance
 * NOTE: Global system access - no rank checks
 */
export function canViewLogs(clearance: string): boolean {
  const clearances = parseClearances(clearance);
  return clearances.includes("Network Administrator") ||
         clearances.includes("Network Engineer");
}

/**
 * Check if user can access high-level admin features
 * Requires: Network Administrator or Network Engineer clearance
 * NOTE: Global system access - no rank checks
 */
export function canAdminister(clearance: string): boolean {
  const clearances = parseClearances(clearance);
  return clearances.includes("Network Administrator") ||
         clearances.includes("Network Engineer");
}

/**
 * Check if user is a network engineer (highest clearance level)
 */
export function isNetworkEngineer(clearance: string): boolean {
  const clearances = parseClearances(clearance);
  return clearances.includes("Network Engineer");
}
