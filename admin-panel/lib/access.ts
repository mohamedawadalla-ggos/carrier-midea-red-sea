import type { AppRole, PriceEntry, RecordStatus, StaffProfile } from "@/lib/types";

const permissions = {
  viewPrices: ["super_admin", "management", "accounts", "sales", "auditor"],
  editPriceDrafts: ["super_admin", "management", "accounts"],
  publishPrices: ["super_admin", "management"],
  editDiscounts: ["super_admin", "management", "marketing"],
  publishDiscounts: ["super_admin", "management"],
  editSettings: ["super_admin", "management", "marketing"],
  publishSettings: ["super_admin", "management"],
  editLocations: ["super_admin", "management", "operations"],
  editWarehouses: ["super_admin", "management", "accounts", "operations"],
  viewAudit: ["super_admin", "management", "auditor"],
} as const satisfies Record<string, readonly AppRole[]>;

export type Permission = keyof typeof permissions;
export function can(role: AppRole, permission: Permission): boolean {
  const allowedRoles: readonly AppRole[] = permissions[permission];
  return allowedRoles.includes(role);
}

export function isPreApprovalStatus(status: RecordStatus): boolean {
  return status === "draft" || status === "pending_approval";
}

export function findEditablePriceEntry(entries: PriceEntry[], modelCode: string, profile: StaffProfile): PriceEntry | undefined {
  if (!can(profile.role, "editPriceDrafts")) return undefined;
  return entries.find((entry) => {
    if (entry.model_code !== modelCode || !isPreApprovalStatus(entry.status)) return false;
    return profile.role !== "accounts" || entry.created_by === profile.user_id;
  });
}

export function findPublishablePriceEntry(entries: PriceEntry[], modelCode: string, role: AppRole): PriceEntry | undefined {
  if (!can(role, "publishPrices")) return undefined;
  const modelEntries = entries.filter((entry) => entry.model_code === modelCode);
  return modelEntries.find((entry) => entry.status === "pending_approval")
    ?? modelEntries.find((entry) => entry.status === "approved");
}

export function canEditSettingDraft(role: AppRole, status: RecordStatus): boolean {
  return can(role, "editSettings") && isPreApprovalStatus(status);
}
