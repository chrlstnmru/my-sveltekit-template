import { defineRelationsPart } from 'drizzle-orm';

import * as schema from './schema';

const _relations = defineRelationsPart(schema);

const systemRelations = defineRelationsPart(schema, (r) => ({
  systemOrganizationsTable: {
    config: r.one.systemOrganizationSettingsTable({
      from: r.systemOrganizationsTable.id,
      to: r.systemOrganizationSettingsTable.organizationId
    }),
    branches: r.many.systemBranchesTable({
      from: r.systemOrganizationsTable.id,
      to: r.systemBranchesTable.organizationId
    }),
    users: r.many.systemUsersTable({
      from: r.systemOrganizationsTable.id,
      to: r.systemUsersTable.organizationId
    }),
    groups: r.many.systemGroupsTable({
      from: r.systemOrganizationsTable.id,
      to: r.systemGroupsTable.organizationId
    }),
    roles: r.many.systemRolesTable({
      from: r.systemOrganizationsTable.id,
      to: r.systemRolesTable.organizationId
    })
  },

  systemBranchesTable: {
    organization: r.one.systemOrganizationsTable({
      from: r.systemBranchesTable.organizationId,
      to: r.systemOrganizationsTable.id
    })
  },

  systemGroupsTable: {
    users: r.many.systemUsersTable({
      from: r.systemGroupsTable.id.through(r.systemGroupUsersTable.groupId),
      to: r.systemUsersTable.id.through(r.systemGroupUsersTable.userId)
    }),
    roles: r.many.systemRolesTable({
      from: r.systemGroupsTable.id.through(r.systemGroupRolesTable.groupId),
      to: r.systemRolesTable.id.through(r.systemGroupRolesTable.roleId)
    }),
    organization: r.one.systemOrganizationsTable({
      from: r.systemGroupsTable.organizationId,
      to: r.systemOrganizationsTable.id
    })
  },

  systemUsersTable: {
    employeeData: r.one.systemEmployeesTable({
      from: r.systemUsersTable.id,
      to: r.systemEmployeesTable.userId
    }),
    groups: r.many.systemGroupsTable({
      from: r.systemUsersTable.id.through(r.systemGroupUsersTable.userId),
      to: r.systemGroupsTable.id.through(r.systemGroupUsersTable.groupId)
    }),
    passwordHistory: r.many.systemUserPasswordHistoryTable({
      from: r.systemUsersTable.id,
      to: r.systemUserPasswordHistoryTable.userId
    })
  },

  systemRolesTable: {
    permissions: r.many.sharedPermissionsTable({
      from: r.systemRolesTable.id.through(r.systemRolePermissionsTable.roleId),
      to: r.sharedPermissionsTable.key.through(r.systemRolePermissionsTable.permissionKey)
    }),
    groups: r.many.systemGroupsTable({
      from: r.systemRolesTable.id.through(r.systemGroupRolesTable.roleId),
      to: r.systemGroupsTable.id.through(r.systemGroupRolesTable.groupId)
    }),
    users: r.many.systemUsersTable({
      from: r.systemRolesTable.id.through(r.systemUserRolesTable.roleId),
      to: r.systemUsersTable.id.through(r.systemUserRolesTable.userId)
    })
  },

  systemSetupTable: {
    organization: r.one.systemOrganizationsTable({
      from: r.systemSetupTable.organizationId,
      to: r.systemOrganizationsTable.id
    })
  },

  systemEmployeesTable: {
    user: r.one.systemUsersTable({
      from: r.systemEmployeesTable.userId,
      to: r.systemUsersTable.id
    })
  }
}));

const sharedRelations = defineRelationsPart(schema, (r) => ({
  sharedPermissionsTable: {
    systemRoles: r.many.systemRolesTable({
      from: r.sharedPermissionsTable.key.through(r.systemRolePermissionsTable.permissionKey),
      to: r.systemRolesTable.id.through(r.systemRolePermissionsTable.roleId)
    })
  }
}));

export const relations = {
  ..._relations,
  ...sharedRelations,
  ...systemRelations
};
