-- База данных: bd_calc
-- Владелец: hrroot

-- Пользователи
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Сессии пользователей
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Проекты
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Шкафы
CREATE TABLE cabinets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Шаблоны блоков
CREATE TABLE block_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    parameters JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Типы компонентов
CREATE TABLE component_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Производители
CREATE TABLE manufacturers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Параметры
CREATE TABLE parameters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Значения параметров компонентов
CREATE TABLE component_param_values (
    id SERIAL PRIMARY KEY,
    component_id INTEGER,
    param_id INTEGER REFERENCES parameters(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Компоненты
CREATE TABLE components (
    id SERIAL PRIMARY KEY,
    type_id INTEGER REFERENCES component_types(id) ON DELETE SET NULL,
    manufacturer_id INTEGER REFERENCES manufacturers(id) ON DELETE SET NULL,
    model VARCHAR(255),
    price DECIMAL(10,2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Блоки проектов
CREATE TABLE project_blocks (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    cabinet_id INTEGER REFERENCES cabinets(id) ON DELETE CASCADE,
    template_id INTEGER REFERENCES block_templates(id) ON DELETE SET NULL,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Параметры блоков проектов
CREATE TABLE project_block_params (
    id SERIAL PRIMARY KEY,
    block_id INTEGER REFERENCES project_blocks(id) ON DELETE CASCADE,
    param_id INTEGER REFERENCES parameters(id) ON DELETE CASCADE,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Результаты проектов
CREATE TABLE project_results (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Автоматические выключатели
CREATE TABLE breakers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(50),
    rating VARCHAR(20),
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============ ИНДЕКСЫ ============
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_cabinets_project_id ON cabinets(project_id);
CREATE INDEX idx_cabinets_user_id ON cabinets(user_id);
CREATE INDEX idx_project_blocks_project_id ON project_blocks(project_id);
CREATE INDEX idx_project_blocks_cabinet_id ON project_blocks(cabinet_id);
CREATE INDEX idx_project_blocks_template_id ON project_blocks(template_id);
CREATE INDEX idx_project_block_params_block_id ON project_block_params(block_id);
CREATE INDEX idx_project_block_params_param_id ON project_block_params(param_id);
CREATE INDEX idx_components_type_id ON components(type_id);
CREATE INDEX idx_components_manufacturer_id ON components(manufacturer_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_project_results_project_id ON project_results(project_id);

-- ============ ТРИГГЕРЫ ============
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cabinets_updated_at BEFORE UPDATE ON cabinets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_block_templates_updated_at BEFORE UPDATE ON block_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
