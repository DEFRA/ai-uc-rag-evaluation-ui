vi.stubEnv('BACKEND_RAG_SERVICE_HOST', 'http://localhost:8085')
vi.stubEnv('INGESTION_DATA_BUCKET_NAME', 'my-bucket')
vi.mock('ioredis')
