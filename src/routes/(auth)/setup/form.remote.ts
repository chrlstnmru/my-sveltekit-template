import { redirect } from '@sveltejs/kit';

import { dev } from '$app/environment';
import { form, getRequestEvent } from '$app/server';
import { authService } from '$lib/server/auth';
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
  const { getClientAddress, request, cookies } = getRequestEvent();
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

      await tx
        .insert(systemOrganizationSettingsTable)
        .values({
          organizationId: organization.id
        })
        .returning();

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

      return organization.id;
    });

    // Login user
    const ipAddress = getClientAddress();
    const userAgent = request.headers.get('user-agent') ?? null;

    const result = await authService.login(data.email, data.password, ipAddress, userAgent, false);

    if (!result.success) {
      // NOTE: Not yet implemented in remote function form
      // return invalid(issue.email('Invalid credentials'));
      return invalid(result.error ?? 'Invalid credentials');
    }

    if (result.accessToken && result.refreshToken) {
      const accessTokenMaxAge = result.accessTokenExpiresAt.getTime() / 1000;
      const refreshTokenMaxAge = result.refreshTokenExpiresAt.getTime() / 1000;

      cookies.set('access_token', result.accessToken, {
        path: '/',
        httpOnly: true,
        secure: !dev,
        sameSite: 'lax',
        maxAge: accessTokenMaxAge
      });

      cookies.set('refresh_token', result.refreshToken, {
        path: '/',
        httpOnly: true,
        secure: !dev,
        sameSite: 'lax',
        maxAge: refreshTokenMaxAge
      });
    }
  } catch (error) {
    console.error(error);
    return invalid('Failed to setup organization');
  }

  redirect(303, '/login');
});
