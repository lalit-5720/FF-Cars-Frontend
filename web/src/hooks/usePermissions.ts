'use client';

import { useAuthStore, UserRole } from '@/store/useAuthStore';
import { useEffect, useState } from 'react';

export interface PermissionMatrix {
  canAccessOverview: boolean;
  canAccessInventory: boolean;
  canManageInventory: boolean;
  canAccessSales: boolean;
  canManageSales: boolean;
  canAccessDeliveries: boolean;
  canManageDeliveries: boolean;
  canAccessLeads: boolean;
  canManageLeads: boolean;
  canAccessTestDrives: boolean;
  canManageTestDrives: boolean;
  canAccessReviews: boolean;
  canAccessReports: boolean;
  canAccessEmployees: boolean;
  canManageEmployees: boolean;
  canAccessSettings: boolean;
  canSelectBranch: boolean;
  isSystemAdmin: boolean;
  isBranchManager: boolean;
  isSalesExecutive: boolean;
  isCustomer: boolean;
}

const DEFAULT_ROLE_PERMISSIONS: Record<string, Partial<PermissionMatrix>> = {
  SYSTEM_ADMIN: {
    canAccessOverview: true,
    canAccessInventory: true,
    canManageInventory: true,
    canAccessSales: true,
    canManageSales: true,
    canAccessDeliveries: true,
    canManageDeliveries: true,
    canAccessLeads: true,
    canManageLeads: true,
    canAccessTestDrives: true,
    canManageTestDrives: true,
    canAccessReviews: true,
    canAccessReports: true,
    canAccessEmployees: true,
    canManageEmployees: true,
    canAccessSettings: true,
    canSelectBranch: true,
  },
  ADMIN: {
    canAccessOverview: true,
    canAccessInventory: true,
    canManageInventory: true,
    canAccessSales: true,
    canManageSales: true,
    canAccessDeliveries: true,
    canManageDeliveries: true,
    canAccessLeads: true,
    canManageLeads: true,
    canAccessTestDrives: true,
    canManageTestDrives: true,
    canAccessReviews: true,
    canAccessReports: true,
    canAccessEmployees: true,
    canManageEmployees: true,
    canAccessSettings: true,
    canSelectBranch: true,
  },
  BRANCH_MANAGER: {
    canAccessOverview: true,
    canAccessInventory: true,
    canManageInventory: true,
    canAccessSales: true,
    canManageSales: true,
    canAccessDeliveries: true,
    canManageDeliveries: true,
    canAccessLeads: true,
    canManageLeads: true,
    canAccessTestDrives: true,
    canManageTestDrives: true,
    canAccessReviews: true,
    canAccessReports: true,
    canAccessEmployees: true,
    canManageEmployees: false,
    canAccessSettings: false,
    canSelectBranch: false,
  },
  SALES_EXECUTIVE: {
    canAccessOverview: true,
    canAccessInventory: false,
    canManageInventory: false,
    canAccessSales: false,
    canManageSales: false,
    canAccessDeliveries: true,
    canManageDeliveries: true,
    canAccessLeads: true,
    canManageLeads: true,
    canAccessTestDrives: true,
    canManageTestDrives: true,
    canAccessReviews: false,
    canAccessReports: false,
    canAccessEmployees: false,
    canManageEmployees: false,
    canAccessSettings: false,
    canSelectBranch: false,
  },
  FINANCE_EXECUTIVE: {
    canAccessOverview: true,
    canAccessInventory: false,
    canManageInventory: false,
    canAccessSales: true,
    canManageSales: true,
    canAccessDeliveries: false,
    canManageDeliveries: false,
    canAccessLeads: false,
    canManageLeads: false,
    canAccessTestDrives: false,
    canManageTestDrives: false,
    canAccessReviews: false,
    canAccessReports: true,
    canAccessEmployees: false,
    canManageEmployees: false,
    canAccessSettings: false,
    canSelectBranch: false,
  },
  INVENTORY_AUDITOR: {
    canAccessOverview: true,
    canAccessInventory: true,
    canManageInventory: true,
    canAccessSales: false,
    canManageSales: false,
    canAccessDeliveries: true,
    canManageDeliveries: false,
    canAccessLeads: false,
    canManageLeads: false,
    canAccessTestDrives: true,
    canManageTestDrives: false,
    canAccessReviews: true,
    canAccessReports: true,
    canAccessEmployees: false,
    canManageEmployees: false,
    canAccessSettings: false,
    canSelectBranch: true,
  },
};

export function usePermissions(): PermissionMatrix {
  const { user } = useAuthStore();
  const rawRole: string = String(user?.role || 'CUSTOMER').toUpperCase();
  const [customRolesCache, setCustomRolesCache] = useState<Record<string, Partial<PermissionMatrix>>>({});

  useEffect(() => {
    // Attempt to load any locally cached dynamic custom roles defined by the admin
    try {
      const stored = localStorage.getItem('carrevive_custom_roles');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const map: Record<string, Partial<PermissionMatrix>> = {};
          parsed.forEach((r: any) => {
            if (r.id && r.permissions) {
              map[r.id.toUpperCase()] = r.permissions;
            }
          });
          setCustomRolesCache(map);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const isSystemAdmin = rawRole === 'SYSTEM_ADMIN' || rawRole === 'ADMIN';
  const isBranchManager = rawRole === 'BRANCH_MANAGER';
  const isSalesExecutive = rawRole === 'SALES_EXECUTIVE';
  const isCustomer = rawRole === 'CUSTOMER';

  // Base fallback permissions
  const fallback = DEFAULT_ROLE_PERMISSIONS[rawRole] || (isSystemAdmin ? DEFAULT_ROLE_PERMISSIONS.SYSTEM_ADMIN : {});
  const customRolePerms = customRolesCache[rawRole] || {};
  const userExplicitPerms = user?.permissions || {};

  const merged = {
    ...fallback,
    ...customRolePerms,
    ...userExplicitPerms,
  };

  return {
    canAccessOverview: Boolean(isSystemAdmin || merged.canAccessOverview),
    canAccessInventory: Boolean(isSystemAdmin || merged.canAccessInventory),
    canManageInventory: Boolean(isSystemAdmin || merged.canManageInventory),
    canAccessSales: Boolean(isSystemAdmin || merged.canAccessSales),
    canManageSales: Boolean(isSystemAdmin || merged.canManageSales),
    canAccessDeliveries: Boolean(isSystemAdmin || merged.canAccessDeliveries),
    canManageDeliveries: Boolean(isSystemAdmin || merged.canManageDeliveries),
    canAccessLeads: Boolean(isSystemAdmin || merged.canAccessLeads),
    canManageLeads: Boolean(isSystemAdmin || merged.canManageLeads),
    canAccessTestDrives: Boolean(isSystemAdmin || merged.canAccessTestDrives),
    canManageTestDrives: Boolean(isSystemAdmin || merged.canManageTestDrives),
    canAccessReviews: Boolean(isSystemAdmin || merged.canAccessReviews),
    canAccessReports: Boolean(isSystemAdmin || merged.canAccessReports),
    canAccessEmployees: Boolean(isSystemAdmin || merged.canAccessEmployees),
    canManageEmployees: Boolean(isSystemAdmin || merged.canManageEmployees),
    canAccessSettings: Boolean(isSystemAdmin || merged.canAccessSettings),
    canSelectBranch: Boolean(isSystemAdmin || merged.canSelectBranch),
    isSystemAdmin,
    isBranchManager,
    isSalesExecutive,
    isCustomer,
  };
}
