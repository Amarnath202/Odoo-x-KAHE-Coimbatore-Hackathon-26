import { Role } from '@prisma/client';

export const ROLES = Role;

// Role hierarchy for RBAC checks
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.BUSINESS_OWNER]: 100,
  [Role.ADMIN]: 90,
  [Role.INVENTORY_MANAGER]: 70,
  [Role.MANUFACTURING_USER]: 60,
  [Role.PURCHASE_USER]: 50,
  [Role.SALES_USER]: 40,
};

// All roles
export const ALL_ROLES = Object.values(Role);

// Management roles (can access most resources)
export const MANAGEMENT_ROLES: Role[] = [
  Role.ADMIN,
  Role.BUSINESS_OWNER,
];

// Roles that can read inventory
export const INVENTORY_READ_ROLES: Role[] = [
  Role.ADMIN,
  Role.BUSINESS_OWNER,
  Role.INVENTORY_MANAGER,
  Role.MANUFACTURING_USER,
];
