-- Update match_documents function defaults
-- Change match_threshold from required to DEFAULT 0.35
-- Change match_count from required to DEFAULT 4
-- This matches the production function signature with filter_class_id and filter_term

CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector,
  match_threshold double precision DEFAULT 0.35,
  match_count integer DEFAULT 4,
  user_id_filter uuid DEFAULT NULL,
  filter_active boolean DEFAULT true,
  filter_class_id text DEFAULT NULL,
  filter_term text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  content text,
  metadata jsonb,
  similarity double precision
)
LANGUAGE plpgsql
AS $function$
begin
  return query
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  and (user_id_filter is null or documents.user_id = user_id_filter)
  and (filter_active is null or (documents.metadata->>'is_active')::boolean = filter_active)
  and (filter_class_id is null or documents.metadata->>'class_id' = filter_class_id)
  and (filter_term is null or documents.metadata->>'term' = filter_term)
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$function$;
