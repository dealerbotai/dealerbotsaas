export type PlanType = 'free' | 'starter' | 'pro';

export interface PlanACL {
    maxInstances: number;
    maxStores: number;
    maxAgents: number;
    canUseAdvancedAnalytics: boolean;
    canUseBulkImporter: boolean;
    canUsePrioritySupport: boolean;
    canManageInventory: boolean;
}

export const ACL: Record<PlanType, PlanACL> = {
    free: {
        maxInstances: 1,
        maxStores: 1,
        maxAgents: 1,
        canUseAdvancedAnalytics: false,
        canUseBulkImporter: false,
        canUsePrioritySupport: false,
        canManageInventory: true,
    },
    starter: {
        maxInstances: 3,
        maxStores: 10,
        maxAgents: 5,
        canUseAdvancedAnalytics: true,
        canUseBulkImporter: true,
        canUsePrioritySupport: false,
        canManageInventory: true,
    },
    pro: {
        maxInstances: 10,
        maxStores: 999,
        maxAgents: 999,
        canUseAdvancedAnalytics: true,
        canUseBulkImporter: true,
        canUsePrioritySupport: true,
        canManageInventory: true,
    },
};

export const hasPermission = (plan: PlanType, permission: keyof PlanACL): boolean => {
    const acl = ACL[plan];
    if (!acl) return false;
    const value = acl[permission];
    return typeof value === 'boolean' ? value : false;
};

export const getLimit = (plan: PlanType, resource: keyof PlanACL): number => {
    const acl = ACL[plan];
    if (!acl) return 0;
    const value = acl[resource];
    return typeof value === 'number' ? value : 0;
};
