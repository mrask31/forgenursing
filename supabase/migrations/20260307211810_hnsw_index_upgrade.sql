-- Drop old index if exists
DROP INDEX IF EXISTS documents_embedding_idx;

-- Create HNSW index for faster vector similarity search
CREATE INDEX documents_embedding_hnsw ON documents 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);
