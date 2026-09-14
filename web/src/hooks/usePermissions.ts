import { useAuthStore, UserRole } from '@/store/useAuthStore';

export interface PermissionMatrix {
  canAccessOverview: boolean;
  canAccessInventory: boolean;
  canManageInventory: boolean; // Create/Edit/Delete vehicles
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
  canManageEmployees: boolean; // Create/Edit salary/Delete employees
  canAccessSettings: boolean;
  canSelectBranch: boolean; // System Admin only
  isSystemAdmin: boolean;
  isBranchManager: boolean;
  isSalesExecutive: boolean;
  isCustomer: boolean;
}

export function usePermissions(): PermissionMatrix {
  const { user } = useAuthStore();
  const role: UserRole = user?.role || 'CUSTOMER';

  const isSystemAdmin = role === 'SYSTEM_ADMIN' || role === 'ADMIN';
  const isBranchManager = role === 'BRANCH_MANAGER';
  const isSalesExecutive = role === 'SALES_EXECUTIVE';
  const isCustomer = role === 'CUSTOMER';

  return {
    canAccessOverview: isSystemAdmin || isBranchManager || isSalesExecutive,
    canAccessInventory: isSystemAdmin || isBranchManager || isSalesExecutive,
    canManageInventory: isSystemAdmin || isBranchManager,
    canAccessSales: isSystemAdmin || isBranchManager || isSalesExecutive,
    canManageSales: isSystemAdmin || isBranchManager || isSalesExecutive,
    canAccessDeliveries: isSystemAdmin || isBranchManager || isSalesExecutive,
    canManageDeliveries: isSystemAdmin || isBranchManager,
    canAccessLeads: isSystemAdmin || isBranchManager || isSalesExecutive,
    canManageLeads: isSystemAdmin || isBranchManager || isSalesExecutive,
    canAccessTestDrives: isSystemAdmin || isBranchManager || isSalesExecutive,
    canManageTestDrives: isSystemAdmin || isBranchManager || isSalesExecutive,
    canAccessReviews: isSystemAdmin || isBranchManager,
    canAccessReports: isSystemAdmin || isBranchManager,
    canAccessEmployees: isSystemAdmin || isBranchManager,
    canManageEmployees: isSystemAdmin, // Only System Admin can create/delete/promote staff
    canAccessSettings: isSystemAdmin, // Only System Admin can manage branch settings
    canSelectBranch: isSystemAdmin,
    isSystemAdmin,
    isBranchManager,
    isSalesExecutive,
    isCustomer,
  };
}
