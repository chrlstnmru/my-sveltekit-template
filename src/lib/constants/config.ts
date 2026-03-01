import type { IconProps } from '@lucide/svelte';
import type { Component } from 'svelte';

import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
import SettingsIcon from '@lucide/svelte/icons/settings';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const MFA_CHALLENGE_COOKIE = 'mfa_challenge_id';

/** @default 5 minutes */
export const ACCESS_TOKEN_TIMEOUT_MINUTES = 5;

export type AppRoute = {
  title: string;
  description?: string;
  url?: string;
  icon?: Component<IconProps>;
  hideInSidebar?: boolean;
  navigateable?: boolean;
  items?: AppRoute[];
};

/** Routes that are always visible in the sidebar */
export const APP_ROUTES: AppRoute[] = [
  {
    url: '/',
    title: 'Dashboard',
    icon: LayoutDashboardIcon
  },
  {
    url: '/settings',
    title: 'Settings',
    icon: SettingsIcon,
    navigateable: false,
    items: [
      {
        url: '/settings/general',
        title: 'General',
        description: 'Manage your organization settings'
      },
      {
        url: '/settings/policies',
        title: 'Policies',
        description: 'Manage your organization policies'
      }
    ]
  }
];

export const getRoute = (url: string) => findRoute(APP_ROUTES, url);

function findRoute(routes: AppRoute[], url: string): AppRoute | null {
  for (const route of routes) {
    if (route.url === url) return route;

    if (route.items) {
      const found = findRoute(route.items, url);
      if (found) return found;
    }
  }
  return null;
}
