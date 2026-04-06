import type { AdminIdentity } from './auth';

export type AdminModuleStatus = 'ready' | 'planned';

export type AdminModuleSummary = {
  id: string;
  label: string;
  description: string;
  status: AdminModuleStatus;
};

export type AdminOverviewResponse = {
  admin: {
    email: string;
    displayName?: string;
    roles: string[];
    lastAuthProvider: string;
  };
  permissions: {
    isAdmin: true;
    matchedRoles: string[];
  };
  portal: {
    name: string;
    stage: string;
    routePrefix: string;
    lambda: string;
    protection: string;
  };
  modules: AdminModuleSummary[];
  generatedAt: string;
};

const INITIAL_MODULES: AdminModuleSummary[] = [
  {
    id: 'dashboard',
    label: 'Dashboard base',
    description: 'Portal admin separado, look claro y overview conectado a su propia lambda.',
    status: 'ready',
  },
  {
    id: 'users',
    label: 'Gestion de usuarios',
    description: 'Base para listar cuentas, revisar estados y administrar permisos administrativos.',
    status: 'ready',
  },
  {
    id: 'videos',
    label: 'Programacion de videos',
    description: 'Vista para asignar publishOn, revisar carga por dia y mover videos entre estados de publicacion.',
    status: 'ready',
  },
  {
    id: 'content',
    label: 'Gestion de contenido',
    description: 'Separar catalogos internos del flujo publico para historias, vocabulario y assets.',
    status: 'planned',
  },
];

export function buildAdminOverview(
  admin: AdminIdentity & { email: string },
  options?: { stage?: string },
): AdminOverviewResponse {
  return {
    admin: {
      email: admin.email,
      displayName: admin.displayName,
      roles: admin.roles,
      lastAuthProvider: admin.lastAuthProvider,
    },
    permissions: {
      isAdmin: true,
      matchedRoles: admin.roles.filter((role) => role === 'admin'),
    },
    portal: {
      name: 'Luva Admin',
      stage: options?.stage || 'unknown',
      routePrefix: '/v1/admin',
      lambda: 'AdminFunction',
      protection: 'Cognito authorizer + rol admin validado en la lambda',
    },
    modules: INITIAL_MODULES,
    generatedAt: new Date().toISOString(),
  };
}
