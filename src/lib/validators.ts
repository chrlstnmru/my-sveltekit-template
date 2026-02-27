import * as v from 'valibot';

export const Slug = v.pipe(
  v.string('Slug is required'),
  v.trim(),
  v.nonEmpty('Slug is required'),
  v.regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must contain only lowercase letters, numbers, and dashes'
  ),
  v.minLength(3, 'Slug must be at least 3 characters long'),
  v.maxLength(64, 'Slug must be at most 64 characters long')
);

export const Password = v.pipe(
  v.string('Password is required'),
  v.trim(),
  v.nonEmpty('Password is required'),
  v.regex(/[a-z]/, 'Password must contain at least one lowercase letter'),
  v.regex(/[A-Z]/, 'Password must contain at least one uppercase letter'),
  v.regex(/\d/, 'Password must contain at least one digit'),
  v.regex(/[^a-z\d]/i, 'Password must contain at least one special character'),
  v.minLength(8, 'Password must be at least 8 characters long'),
  v.maxLength(254, 'Password must be at most 254 characters long')
);

export const Numeric = v.pipe(
  v.union([v.string(), v.number()]),
  v.transform((value) => {
    if (typeof value === 'number') return value;
    // Clean and parse string
    const cleaned = value.replace(/[$,\s]/g, '');
    const num = Number(cleaned);
    if (Number.isNaN(num) || !Number.isFinite(num)) {
      throw new TypeError('Invalid number');
    }
    return num;
  }),
  v.number()
);

export const Booleanish = v.pipe(
  v.union([v.boolean(), v.string()]),
  v.transform((value) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1' || value === 'on' || value === 'yes';
    }
    return value;
  })
);

export const LoginSchema = v.object({
  email: v.pipe(
    v.string('Email is required'),
    v.trim(),
    v.nonEmpty('Email is required'),
    v.email('Invalid email address')
  ),
  password: v.pipe(v.string('Password is required'), v.nonEmpty('Password is required')),
  rememberMe: v.optional(v.boolean(), false)
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
  orgSlug: Slug,
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
  password: Password
});

export const PasswordPolicySchema = v.object({
  requirements: v.optional(
    v.object({
      uppercase: v.optional(Booleanish),
      lowercase: v.optional(Booleanish),
      numbers: v.optional(Booleanish),
      symbols: v.optional(Booleanish)
    })
  ),
  minLength: v.pipe(Numeric, v.gtValue(7, 'Minimum length cannot be less than 8')),
  preventPasswordReuse: v.pipe(Numeric, v.gtValue(-1, 'Invalid value'))
});

export const SessionPolicySchema = v.object({
  maxConcurrentSessions: v.pipe(Numeric, v.gtValue(-1, 'Invalid value')),
  idleTimeoutMinutes: v.pipe(Numeric, v.gtValue(-1, 'Invalid value')),
  sessionTimeoutMinutes: v.pipe(Numeric, v.gtValue(-1, 'Invalid value')),
  rememberMeAbsoluteTimeoutDays: v.pipe(Numeric, v.gtValue(-1, 'Invalid value')),
  sessionExpiryWarningMinutes: v.pipe(Numeric, v.gtValue(-1, 'Invalid value'))
});

export const NestedTest = v.object({
  test: v.object({
    switch: v.boolean(),
    test: v.object({
      name: v.pipe(v.string(), v.trim(), v.nonEmpty('Name is required'))
    })
  }),
  test2: v.object({
    switch: v.optional(v.boolean())
  })
});
