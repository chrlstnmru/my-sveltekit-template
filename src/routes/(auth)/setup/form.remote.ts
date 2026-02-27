import { redirect } from '@sveltejs/kit';

import { form } from '$app/server';
import { hashPassword } from '$lib/server/auth/crypto';
import { db } from '$lib/server/db';
import {
  systemOrganizationSettingsTable,
  systemOrganizationsTable,
  systemRolePermissionsTable,
  systemRolesTable,
  systemSetupTable,
  systemUserRolesTable,
  systemUsersTable
} from '$lib/server/db/schema';
import { SetupSchema } from '$lib/validators';

export const remoteSetupForm = form(SetupSchema, async (data, invalid) => {
  // const { getClientAddress, request } = getRequestEvent();
  const existingSetup = await db.query.systemSetupTable.findFirst();

  if (existingSetup?.completedAt) {
    redirect(303, '/login');
  }

  try {
    // Create org
    await db.transaction(async (tx) => {
      const [organization] = await tx
        .insert(systemOrganizationsTable)
        .values({
          name: data.orgName,
          slug: data.orgSlug
        })
        .returning();

      await tx.insert(systemOrganizationSettingsTable).values({
        organizationId: organization.id
      });

      const passwordHash = await hashPassword(data.password);

      const [user] = await tx
        .insert(systemUsersTable)
        .values({
          organizationId: organization.id,
          email: data.email,
          displayName: data.name,
          password: passwordHash
        })
        .returning();

      const [ownerRole] = await tx
        .insert(systemRolesTable)
        .values({
          organizationId: organization.id,
          name: 'Owner',
          priority: 100,
          isBuiltIn: true,
          isAssignable: false,
          isRemovable: false
        })
        .returning();

      await tx.insert(systemRolePermissionsTable).values({
        roleId: ownerRole.id,
        permissionKey: '*',
        scope: 'organization'
      });

      await tx.insert(systemUserRolesTable).values({
        userId: user.id,
        roleId: ownerRole.id
      });

      await tx.insert(systemSetupTable).values({
        organizationId: organization.id,
        rootUserId: user.id,
        completedAt: new Date()
      });
    });

    // Login user
    // const ipAddress = await getClientAddress();
    // const userAgent = request.headers.get('user-agent') ?? null;
  } catch (error) {
    console.error(error);
    return invalid('Failed to setup organization');
  }

  redirect(303, '/login');
});
