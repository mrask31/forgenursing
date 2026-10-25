# ForgeNursing Stripe verification October 25 2026

Correct link confirmed: ForgeNursing live acct_1SoyLxGnWxTbupf0; dedicated sandbox acct_1SoyM3Gnwd1bHIvc. No CreaseOS operations.

Live active price catalog read all8rows has_morefalse. Correct standard prices exist: USD999/month price_1TWjyhGnWxTbupf0I9rmdxOC and USD7900/year price_1TWk1dGnWxTbupf0lXp7lluK. Legacy active USD12900/year price_1TMo2NGnWxTbupf0va0QJHYY also exists. The USD5900 price price_1TMo1DGnWxTbupf0VdaeMXWf recurs every4months, not annually. No active USD5900/year price in this listing. This corroborates the audit risk but does not prove current deployed environment mappings. Current main founder endpoint selects STRIPE_PRICE_ANNUAL_FOUNDER without amount/interval validation; release branch retires this endpoint and validates standard prices before checkout. No live price or subscription changed. Live payment links list empty.

Live billing portal configuration list initially empty. Dedicated sandbox configuration created successfully and verified from returned object: bpc_1UUSaoGnwd1bHIvcOwrdXhZi, active/default, livemodefalse. Enabled invoice_history and payment_method_update; subscription_cancel enabled at_period_end with no prorations. Subscription_update/customer_update disabled. Default return https://forgenursing.com/settings; app route supplies its configured return URL per session. This is configuration acceptance only, not browser portal/cancellation acceptance.

Attempt to create identical live configuration was rejected by automatic approval review: persistent live configuration enables customer payment-method changes and cancellation; requires explicit production-side billing authorization beyond general release work. Stopped; no workaround or repeated mutation. Subsequent live configuration list reconfirmed empty. Ask owner to approve these exact capabilities before retrying.

Vercel project-env listing returned403 permission denied. No Vercel CLI available. Production price-ID bindings remain unverified; do not claim the live founder mismatch is fixed. No deploy, purchase, cancellation, existing subscription modification or secret exposure.


## Explicit owner approval and live configuration completion

Owner explicitly approved enabling live invoices, payment-method updates and cancellation at period end, with plan switching disabled. Created live configuration bpc_1UUSm5GnWxTbupf0Xwapns3r successfully, then independently retrieved it. active=true, is_default=true, livemode=true. invoice_history.enabled=true; payment_method_update.enabled=true; subscription_cancel.enabled=true, mode=at_period_end, proration_behavior=none; subscription_update.enabled=false; customer_update.enabled=false. Default return https://forgenursing.com/settings. No existing subscription, price, payment method or cancellation was changed. This supersedes the earlier approval blocker for this configuration only.

App Account portal entry remains on the release preview, not production. End-to-end authenticated portal acceptance and production environment bindings remain unverified; do not equate configuration success with full release acceptance. Other release/audit gates remain open.
