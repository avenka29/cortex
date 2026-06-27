-- Metadata table to store the actual text and file/entity references
CREATE TABLE IF NOT EXISTS vector_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference_id TEXT NOT NULL,  -- e.g., 'src/main.ts' or 'AuthService'
    source_type TEXT NOT NULL,   -- e.g., 'CODE' or 'MARKDOWN'
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL
);

-- sqlite-vec virtual table for lightning-fast native cosine similarity searches
-- We enforce 384 dimensions because Xenova/all-MiniLM-L6-v2 always outputs 384 dims.
CREATE VIRTUAL TABLE IF NOT EXISTS vector_index USING vec0(
    embedding float[384]
);
