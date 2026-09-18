# SEO foundation — September 18, 2026

## Scope

- A shared metadata helper gives every public page a unique title, description, self-referencing production canonical, Open Graph metadata, and Twitter card. Removes duplicated brand suffixes and outdated upload-first positioning.
- Adds a generated 1200×630 PNG sharing image at /opengraph-image. No external asset service required.
- Sitemap includes Pricing and excludes account/transaction screens. Omits fabricated per-build last-modified dates. robots.txt advertises the canonical production sitemap.
- Login, signup, checkout, password recovery, and authenticated app screens declare noindex. Authentication and access checks remain unchanged; the app layout now wraps its existing client component with server metadata.
- Replaces the old /nclex-practice landing content with a server-rendered study-guide hub and adds a public footer link. Existing article URLs remain intact. Updates article calls to action and removes claims that a three-question sample diagnoses reasoning patterns.
- Adds factual Organization/WebSite JSON-LD on Home and renders existing FAQ JSON-LD in the initial HTML. No ratings, clinical credentials, or rich-result eligibility claims are invented.
- Optional GOOGLE_SITE_VERIFICATION and BING_SITE_VERIFICATION environment variables render verification tags. No actual tokens have been supplied or fabricated.

## Owner steps

1. Open Google Search Console with the Google account that will own the site. Select the existing forgenursing.com property or add one. Domain verification uses a DNS TXT record; URL-prefix verification may use an HTML tag. Supply the exact token/record if implementation help is needed.
2. Submit https://forgenursing.com/sitemap.xml after verification. Inspect the homepage and key guide URLs; request indexing where available. Submission does not guarantee indexing.
3. Add/import the site in Bing Webmaster Tools and submit the same sitemap.
4. Review indexing exclusions, search queries, and Core Web Vitals as data becomes available. No current Search Console ownership, submission, or indexing claims are made by this release.

Source guidance: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls and https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap . Official NCLEX CPR and test-plan links in the guide hub were verified.
