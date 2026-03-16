vi.stubEnv('BACKEND_RAG_SERVICE_HOST', 'http://localhost:8085')
vi.stubEnv('EVALUATION_SERVICE_HOST', 'http://localhost:9085')
vi.stubEnv('SERVICE_URL', 'http://localhost:3000')
vi.mock('ioredis')
