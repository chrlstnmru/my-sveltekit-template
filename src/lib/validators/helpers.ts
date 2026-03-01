import * as v from 'valibot';

export function numeric(message: string = 'Invalid number') {
  return v.pipe(
    v.union([v.string(), v.number()]),
    v.transform((value) => {
      if (typeof value === 'number') return value;
      // Remove currency symbols, commas, whitespace
      return value.trim().replace(/[$,\s]/g, '');
    }),
    v.custom((input): input is string => {
      // Check if it's a non-empty string
      return (typeof input === 'string' && input !== '') || typeof input === 'number';
    }, message),
    v.transform((value) => {
      const num = typeof value === 'number' ? value : Number(value);
      return num;
    }),
    v.number(message)
  );
}

export function booleanish() {
  return v.pipe(
    v.union([v.boolean(), v.string()]),
    v.transform((value) => {
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1' || value === 'on' || value === 'yes';
      }
      return value;
    })
  );
}

export function password(name: string = 'Password') {
  return v.pipe(
    v.string(`${name} is required`),
    v.trim(),
    v.nonEmpty(`${name} is required`),
    v.regex(/[a-z]/, `${name} must contain at least one lowercase letter`),
    v.regex(/[A-Z]/, `${name} must contain at least one uppercase letter`),
    v.regex(/\d/, `${name} must contain at least one digit`),
    v.regex(/[^a-z\d]/i, `${name} must contain at least one special character`),
    v.minLength(8, `${name} must be at least 8 characters long`),
    v.maxLength(254, `${name} must be at most 254 characters long`)
  );
}

export function slug(name: string = 'Slug') {
  return v.pipe(
    v.string(`${name} is required`),
    v.trim(),
    v.nonEmpty(`${name} is required`),
    v.regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      `${name} must contain only lowercase letters, numbers, and dashes`
    ),
    v.minLength(3, `${name} must be at least 3 characters long`),
    v.maxLength(64, `${name} must be at most 64 characters long`)
  );
}
