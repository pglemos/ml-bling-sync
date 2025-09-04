// Utilitário para gerenciar roles de usuário temporariamente
// Este arquivo pode ser removido quando o sistema de roles estiver totalmente implementado

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
}

// Definição de roles disponíveis
export const AVAILABLE_ROLES = {
  owner: {
    name: 'owner',
    label: 'Proprietário',
    permissions: ['*'] // Todas as permissões
  },
  super_admin: {
    name: 'super_admin',
    label: 'Super Administrador',
    permissions: ['admin:*', 'users:*', 'reports:*', 'security:*', 'billing:*']
  },
  admin: {
    name: 'admin',
    label: 'Administrador',
    permissions: ['users:read', 'users:write', 'reports:read', 'suppliers:*', 'products:*']
  },
  moderator: {
    name: 'moderator',
    label: 'Moderador',
    permissions: ['products:read', 'products:write', 'suppliers:read', 'suppliers:write']
  },
  lojista: {
    name: 'lojista',
    label: 'Lojista',
    permissions: ['products:read', 'orders:*', 'customers:*']
  },
  viewer: {
    name: 'viewer',
    label: 'Visualizador',
    permissions: ['products:read', 'orders:read', 'customers:read']
  }
};

// Mapeamento de emails para roles (temporário para desenvolvimento)
export const EMAIL_ROLE_MAPPING: Record<string, string> = {
  'admin@empresa.com': 'admin',
  'super.admin@empresa.com': 'super_admin',
  'moderator@empresa.com': 'moderator',
  'owner@empresa.com': 'owner',
  // Adicione outros emails conforme necessário
};

// Função para obter role baseada no email
export function getRoleByEmail(email: string): string | null {
  return EMAIL_ROLE_MAPPING[email] || null;
}

// Função para verificar se uma role tem permissões administrativas
export function isAdminRole(role: string): boolean {
  const adminRoles = ['owner', 'super_admin', 'admin', 'moderator'];
  return adminRoles.includes(role);
}

// Função para verificar se um usuário tem uma permissão específica
export function hasPermission(userProfile: UserProfile, permission: string): boolean {
  const userRole = userProfile.role || getRoleByEmail(userProfile.email);
  
  if (!userRole) return false;
  
  const roleConfig = AVAILABLE_ROLES[userRole as keyof typeof AVAILABLE_ROLES];
  if (!roleConfig) return false;
  
  // Se tem permissão total (*), permite tudo
  if (roleConfig.permissions.includes('*')) return true;
  
  // Verificar permissão específica
  return roleConfig.permissions.some(perm => {
    if (perm === permission) return true;
    if (perm.endsWith(':*')) {
      const resource = perm.split(':')[0];
      return permission.startsWith(resource + ':');
    }
    return false;
  });
}

// Função para obter todas as permissões de um usuário
export function getUserPermissions(userProfile: UserProfile): string[] {
  const userRole = userProfile.role || getRoleByEmail(userProfile.email);
  
  if (!userRole) return [];
  
  const roleConfig = AVAILABLE_ROLES[userRole as keyof typeof AVAILABLE_ROLES];
  return roleConfig?.permissions || [];
}

// Função para verificar se um usuário pode acessar o painel administrativo
export function canAccessAdminPanel(userProfile: UserProfile): boolean {
  const userRole = userProfile.role || getRoleByEmail(userProfile.email);
  return userRole ? isAdminRole(userRole) : false;
}
