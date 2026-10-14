-- Returned students only; same reviewed distinction/opportunity, first delayed attempt.
WITH immediate AS (
 SELECT JSONExtractString(properties,'retry_opportunity_id') AS opportunity,
  JSONExtractString(properties,'distinction_id') AS distinction,
  argMin(JSONExtractBool(properties,'correct'),timestamp) AS immediate_correct
 FROM events WHERE timestamp>=now()-INTERVAL 90 DAY AND timestamp<=now()
  AND event='question_answered' AND JSONExtractInt(properties,'loop_version')=2
  AND JSONExtractInt(properties,'attempt')=2
  AND JSONExtractString(properties,'distinction_status')='reviewed'
  /* PUBLIC_FILTER */
 GROUP BY opportunity,distinction
), delayed AS (
 SELECT JSONExtractString(properties,'question_id') AS question,
  JSONExtractString(properties,'retry_opportunity_id') AS opportunity,
  JSONExtractString(properties,'distinction_id') AS distinction,
  argMin(JSONExtractBool(properties,'correct'),timestamp) AS delayed_correct,
  argMin(JSONExtractInt(properties,'days_since_miss'),timestamp) AS days
 FROM events WHERE timestamp>=now()-INTERVAL 90 DAY AND timestamp<=now()
  AND event='review_question_answered' AND JSONExtractInt(properties,'loop_version')=2
  AND JSONExtractInt(properties,'review_round')=1
  AND JSONExtractString(properties,'distinction_status')='reviewed'
  /* PUBLIC_FILTER */
 GROUP BY question,opportunity,distinction
)
SELECT d.distinction, if(d.days<3,'1–2 days',if(d.days<7,'3–6 days','7+ days')) AS delay,
 count() AS matched_returning_opportunities,
 round(avg(i.immediate_correct),4) AS immediate_success_same_cohort,
 round(avg(d.delayed_correct),4) AS delayed_success_same_cohort
FROM delayed d INNER JOIN immediate i ON d.opportunity=i.opportunity AND d.distinction=i.distinction
GROUP BY d.distinction,delay LIMIT 100
