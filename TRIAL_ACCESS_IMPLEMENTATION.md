# Trial Access Implementation

## Summary
Updated subscription logic to grant access based on either active subscription OR active trial period.

## Changes Made

### 1. Database Migration (`supabase_trial_ends_at_migration.sql`)
- Added `trial_ends_at` column to `profiles` table (TIMESTAMPTZ)
- Added index for efficient trial expiration queries
- Users now have access if `current_date < trial_ends_at`

### 2. Subscription Access Logic (`src/lib/subscription-access.ts`)
- Added `isTrialActive()` function to check if trial is currently active
- Added `hasAccess()` function that checks BOTH subscription status AND trial status
- Kept original `hasSubscriptionAccess()` for backward compatibility

### 3. Entitlement Service (`src/lib/entitlement.ts`)
- Updated to fetch `trial_ends_at` from database
- Added `isTrialActive` boolean to return type
- Added `trialEndsAt` timestamp to return type
- Uses new `hasAccess()` function to determine access

### 4. Middleware (`middleware.ts`)
- Updated to fetch `trial_ends_at` in both subscription check locations
- Changed from `hasSubscriptionAccess()` to `hasAccess()` 
- Added `trialEndsAt` to debug logs

### 5. Database Types (`src/types/database.ts`)
- Added `trial_ends_at: string | null` to profiles Row, Insert, and Update types

## Access Logic

A user now has access if:
- `subscription_status` is 'active' OR 'trialing', OR
- Current date is before `trial_ends_at`

## Usage Example

```typescript
// In your components or API routes
import { getEntitlementForUser } from '@/lib/entitlement'

const entitlement = await getEntitlementForUser(userId)

console.log({
  hasAccess: entitlement.hasAccess,           // true if subscription OR trial active
  isTrialActive: entitlement.isTrialActive,   // true if trial is active
  trialEndsAt: entitlement.trialEndsAt,       // ISO timestamp or null
  status: entitlement.status                   // subscription_status
})
```

## Next Steps

1. Run the migration: Execute `supabase_trial_ends_at_migration.sql` in Supabase SQL Editor
2. Set trial dates: Update existing users or new signups with `trial_ends_at` values
3. Test: Verify users with trial dates can access the app even without active subscription

## Example: Setting a 7-day trial

```sql
-- Set 7-day trial for a user
UPDATE profiles 
SET trial_ends_at = NOW() + INTERVAL '7 days'
WHERE id = '<user-id>';
```
