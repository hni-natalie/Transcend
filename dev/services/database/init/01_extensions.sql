-- add features to postgresql
CREATE EXTENSION IF NOT EXISTS vector;      -- pgvector for RAG
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- UUID generation instead of normal #1, #2