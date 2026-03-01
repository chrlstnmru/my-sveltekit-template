import * as v from 'valibot';

import { booleanish, numeric, password, slug } from './validators/helpers';

export const LoginSchema = v.object({
  email: v.pipe(
    v.string('Email is required'),
    v.trim(),
    v.nonEmpty('Email is required'),
    v.email('Invalid email address')
  ),
  password: v.pipe(v.string('Password is required'), v.nonEmpty('Password is required')),
  rememberMe: v.optional(booleanish(), false)
});

export const MfaVerifySchema = v.object({
  challengeId: v.string(),
  code: v.pipe(
    v.string('Code is required'),
    v.trim(),
    v.nonEmpty('Code is required'),
    v.length(6, 'Code must be 6 digits')
  )
});

export const SetupSchema = v.object({
  orgName: v.pipe(
    v.string('Organization name is required'),
    v.trim(),
    v.nonEmpty('Organization name is required'),
    v.minLength(3, 'Organization name must be at least 3 characters long'),
    v.maxLength(128, 'Organization name must be at most 128 characters long')
  ),
  orgSlug: slug('Organization slug'),
  name: v.pipe(
    v.string('Name is required'),
    v.trim(),
    v.nonEmpty('Name is required'),
    v.minLength(3, 'Name must be at least 3 characters long'),
    v.maxLength(128, 'Name must be at most 128 characters long')
  ),
  email: v.pipe(
    v.string('Email is required'),
    v.trim(),
    v.nonEmpty('Email is required'),
    v.email()
  ),
  password: password()
});

export const SessionPolicySchema = v.pipe(
  v.object({
    maxConcurrentSessions: v.pipe(
      numeric(),
      v.minValue(0, 'Invalid value'),
      v.maxValue(5, 'Cannot exceed 5 concurrent sessions')
    ),
    sessionIdleTimeoutMinutes: v.pipe(
      numeric(),
      v.minValue(0, 'Invalid value'),
      v.maxValue(60, 'Cannot exceed 60 minutes of idle duration')
    ),
    accessTokenLifetimeMinutes: v.pipe(
      numeric(),
      v.minValue(5, 'Access token lifetime must be at least 5 minutes'),
      v.maxValue(240, 'Access token lifetime must be at most 240 minutes')
    ),
    refreshTokenLifetimeMinutes: v.pipe(
      numeric(),
      v.minValue(0, 'Invalid value'),
      v.maxValue(1440, 'Refresh token lifetime must be at most 1440 minutes')
    ),
    rememberMeDays: v.pipe(
      numeric(),
      v.minValue(0, 'Invalid value'),
      v.check((input) => input >= 7, 'Remember me must be at least 7 days'),
      v.maxValue(30, 'Remember me must be at most 30 days')
    )
  }),
  v.forward(
    v.partialCheck(
      [['accessTokenLifetimeMinutes'], ['refreshTokenLifetimeMinutes']],
      (input) => input.accessTokenLifetimeMinutes * 6 <= input.refreshTokenLifetimeMinutes,
      'Refresh token lifetime must be at least 6 times the access token lifetime'
    ),
    ['refreshTokenLifetimeMinutes']
  )
);
