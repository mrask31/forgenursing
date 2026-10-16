-- Source-checked production tier ONLY. Operator report, not a clinical learning claim.
-- Exclude preview records, owner and explicitly identified QA accounts before using publicly.
-- Historical anonymous QA is not reliably classified; do not combine with independent review.
select date_trunc('week',q.missed_at+interval '1 day') as due_week,
 count(*) as matured_due_opportunities,
 count(a.id) filter(where a.answered_at <= q.missed_at+interval '8 days') as answered_within_grace,
 count(a.id) filter(where a.answered_at <= q.missed_at+interval '8 days')::numeric/nullif(count(*),0) as return_rate
from public.source_checked_review_queue q
join public.source_checked_content_versions c on c.id=q.content_id and c.withdrawn_at is null and c.audience='production'
join auth.users u on u.id=q.user_id and lower(coalesce(u.email,''))<>'mrask30@gmail.com'
left join public.source_checked_review_attempts a on a.queue_id=q.id
where q.missed_at >= now()-interval '90 days' and q.missed_at <= now()-interval '8 days'
group by 1 order by 1;
