# Billing acceptance and diagnostic October 25

Owner's independent browser acceptance reports passes for stale starter removal, one recommendation source across Home/Progress/chooser, identical timezone-labelled review copy, signed-out review to login, FAQ link. Preserve those accepted behaviors. Trial-days remains unverified because account is paid. Billing half failed: repeated generic details503 and no portal button for a confirmed live subscribed owner account.

A test-key/live-customer mismatch is plausible, not confirmed by generic503. Earlier environment-listing403 still blocks inspection; no CLI credentials available. No unchanged permission-denied retries or security workarounds attempted. No keys changed, no production or sandbox subscriptions touched.

Added bounded diagnostics to authenticated /api/account/billing and Settings: configured key mode live/test/unknown (recognizes sk and rk formats, never returns key bytes); error categories resource_missing/authentication/permission/generic. UI displays mode even when details503, so next independent browser pass can establish mode rather than guessing. Diagnostics describe configured key prefix, not independent account identity or proof the credential works. No raw Stripe messages exposed. Missing-record errors do not alone prove mode mismatch. No portal availability or full billing acceptance claimed.

212tests/29files, TypeScript and incremental lint pass (zero new/blocking,451legacy/16warnings). Remaining fix: inspect actual deployment mode on Settings; if test, owner-authorized branch-scoped live credential configuration requires Vercel environment access and rebuild. Avoid replacing shared preview keys across unrelated branches. Existing founder prices unchanged; existing release gates remain open.
