-- V2 matched opportunities; finalized rates use a full 24-hour outcome window.
-- PUBLIC_FILTER is replaced with explicit host/QA/owner exclusions for public reports.
WITH opportunities AS (
 SELECT
  JSONExtractString(properties,'experience') AS experience,
  JSONExtractString(properties,'retry_opportunity_id') AS opportunity,
  countIf(event='question_answered' AND JSONExtractInt(properties,'attempt')=1 AND NOT JSONExtractBool(properties,'correct') AND JSONExtractBool(properties,'retry_eligible')) AS misses,
  minIf(timestamp,event='question_answered' AND JSONExtractInt(properties,'attempt')=1 AND NOT JSONExtractBool(properties,'correct') AND JSONExtractBool(properties,'retry_eligible')) AS missed_at,
  minIf(timestamp,event='related_retry_offered') AS offered_at,
  minIf(timestamp,event='related_retry_started') AS started_at,
  minIf(timestamp,event='related_retry_loaded') AS loaded_at,
  minIf(timestamp,event='question_answered' AND JSONExtractInt(properties,'attempt')=2) AS answered_at,
  minIf(timestamp,event='question_answered' AND JSONExtractInt(properties,'attempt')=2 AND JSONExtractBool(properties,'correct')) AS correct_at,
  countIf(event='related_retry_failed') AS failures
 FROM events
 WHERE timestamp >= now()-INTERVAL 30 DAY AND timestamp <= now()
  AND event IN ('question_answered','related_retry_offered','related_retry_started','related_retry_loaded','related_retry_failed')
  AND JSONExtractInt(properties,'loop_version')=2
  AND JSONExtractString(properties,'retry_opportunity_id')!=''
  /* PUBLIC_FILTER */
 GROUP BY experience,opportunity
), matched AS (
 SELECT *, missed_at <= now()-INTERVAL 1 DAY AS mature,
  offered_at>=missed_at AND offered_at<=missed_at+INTERVAL 1 DAY AS was_offered,
  started_at>=offered_at AND started_at>=missed_at AND started_at<=missed_at+INTERVAL 1 DAY AS was_started,
  loaded_at>=started_at AND loaded_at>=missed_at AND loaded_at<=missed_at+INTERVAL 1 DAY AS was_loaded,
  answered_at>=loaded_at AND answered_at>=missed_at AND answered_at<=missed_at+INTERVAL 1 DAY AS was_answered,
  correct_at=answered_at AND correct_at>=missed_at AS was_correct
 FROM opportunities WHERE misses>0
)
SELECT experience,
 countIf(NOT mature) AS pending_opportunities,
 countIf(mature) AS eligible_misses,
 countIf(mature AND was_offered) AS offered,
 countIf(mature AND was_offered AND was_started) AS started,
 countIf(mature AND was_offered AND was_started AND was_loaded) AS loaded,
 countIf(mature AND was_offered AND was_started AND was_loaded AND was_answered) AS answered,
 countIf(mature AND was_offered AND was_started AND was_loaded AND was_answered AND was_correct) AS correct,
 round(countIf(mature AND was_offered AND was_started)*1.0/nullIf(countIf(mature AND was_offered),0),4) AS retry_uptake,
 round(countIf(mature AND was_offered AND was_started AND was_loaded)*1.0/nullIf(countIf(mature AND was_offered AND was_started),0),4) AS load_success,
 round(countIf(mature AND was_offered AND was_started AND was_loaded AND was_answered)*1.0/nullIf(countIf(mature AND was_offered AND was_started),0),4) AS retry_completion,
 round(countIf(mature AND was_offered AND was_started AND was_loaded AND was_answered AND was_correct)*1.0/nullIf(countIf(mature AND was_offered AND was_started AND was_loaded AND was_answered),0),4) AS immediate_success,
 countIf(mature AND failures>0) AS opportunities_with_failures
FROM matched GROUP BY experience LIMIT 10
