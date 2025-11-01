-- Initialize databases for MCP servers

-- Create databases
CREATE DATABASE IF NOT EXISTS architect_db;
CREATE DATABASE IF NOT EXISTS credit_optimizer_db;
CREATE DATABASE IF NOT EXISTS skill_packs_db;
CREATE DATABASE IF NOT EXISTS free_agent_learning_db;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE architect_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE credit_optimizer_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE skill_packs_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE free_agent_learning_db TO postgres;

-- Log initialization
SELECT 'MCP databases initialized successfully!' AS status;

