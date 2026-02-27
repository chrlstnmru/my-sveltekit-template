import * as v from 'valibot';

export const MfaSetupSchema = v.object({
  method: v.picklist(['totp', 'email'], 'Invalid MFA method')
});

export const MfaSetupVerifySchema = v.object({
  code: v.pipe(
    v.string('Code is required'),
    v.trim(),
    v.nonEmpty('Code is required'),
    v.length(6, 'Code must be 6 digits')
  )
});
