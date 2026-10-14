-- PostgreSQL authoritative due-cohort report. Not a PostHog event-based proxy.
-- Uses first presentation schedule (miss + 1 day), 7-day response grace, matured cohorts only.
-- Internal operator report: owner excluded, but other QA accounts/devices are not classified.
-- Do not present this as a clean public return rate until a QA-account exclusion is supplied.
-- Owner excluded. Do not count withdrawn content. No clinical outcomes inferred from absence.
select date_trunc('week',q.missed_at+interval '1 day') as due_week,
 count(*) as due_opportunities,
 count(a.id) filter(where a.answered_at <= q.missed_at+interval '8 days') as answered_within_grace,
 count(a.id) filter(where a.answered_at <= q.missed_at+interval '8 days')::numeric/nullif(count(*),0) as return_rate
from public.learning_review_queue q
join public.clinical_content_versions c on c.id=q.clinical_content_id and c.withdrawn_at is null
join auth.users u on u.id=q.user_id and lower(coalesce(u.email,''))<>'mrask30@gmail.com'
left join public.learning_review_attempts a on a.queue_id=q.id and a.review_round=0
where q.missed_at >= now()-interval '90 days' and q.missed_at <= now()-interval '8 days'
group by 1 order by 1;
