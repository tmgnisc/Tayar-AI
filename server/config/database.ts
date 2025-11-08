import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tayar_ai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
export const pool = mysql.createPool(dbConfig);

// Initialize database and create tables
export async function initializeDatabase() {
  try {
    console.log('📊 Initializing database...');
    
    // Create database if it doesn't exist
    const tempPool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
    });
    
    await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await tempPool.end();
    console.log('✅ Database created/verified');

    // Create tables
    await createTables();
    console.log('✅ Tables created/verified');
    
    // Migrate existing tables (add new columns if they don't exist)
    await migrateTables();
    console.log('✅ Tables migrated');
    
    // Seed initial data
    await seedDomains();
    console.log('✅ Domains seeded');
    await seedAdminUser();
    console.log('✅ Initial data seeded');
    
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

async function createTables() {
  const connection = await pool.getConnection();
  
  try {
    // Create domains table first (users references it)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS domains (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        domain_id INT NULL,
        level ENUM('beginner', 'intermediate', 'senior', 'principal', 'lead') NULL,
        subscription_type ENUM('free', 'pro', 'enterprise') DEFAULT 'free',
        subscription_status ENUM('active', 'cancelled', 'expired') DEFAULT 'active',
        subscription_start_date DATE,
        subscription_end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_domain_id (domain_id),
        FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS interviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        role VARCHAR(255) NOT NULL,
        difficulty ENUM('beginner', 'intermediate', 'advanced', 'expert') NOT NULL,
        language VARCHAR(50) NOT NULL,
        overall_score DECIMAL(4,2),
        status ENUM('in_progress', 'completed', 'cancelled') DEFAULT 'in_progress',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        duration_minutes INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS interview_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        interview_id INT NOT NULL,
        category VARCHAR(100) NOT NULL,
        score DECIMAL(4,2) NOT NULL,
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
        INDEX idx_interview_id (interview_id),
        INDEX idx_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        activity_type VARCHAR(100) NOT NULL,
        description TEXT,
        metadata JSON,
        ip_address VARCHAR(45),
        user_agent VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_activity_type (activity_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        plan_type ENUM('free', 'pro', 'enterprise') NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status ENUM('active', 'cancelled', 'expired', 'pending') NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        payment_method VARCHAR(100),
        transaction_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } finally {
    connection.release();
  }
}

async function migrateTables() {
  const connection = await pool.getConnection();
  
  try {
    // Check if users table exists and add missing columns
    const [usersTable]: any = await connection.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'"
    );
    
    if (usersTable.length > 0) {
      // Check if domain_id column exists
      const [domainIdColumn]: any = await connection.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_schema = DATABASE() 
         AND table_name = 'users' 
         AND column_name = 'domain_id'`
      );
      
      if (domainIdColumn.length === 0) {
        console.log('🔄 Adding domain_id column to users table...');
        // First, ensure domains table exists (it might not have the foreign key constraint yet)
        try {
          await connection.query(`
            ALTER TABLE users 
            ADD COLUMN domain_id INT NULL AFTER role
          `);
          console.log('✅ Added domain_id column');
        } catch (error: any) {
          console.warn('Could not add domain_id column:', error.message);
        }
      }
      
      // Check if level column exists
      const [levelColumn]: any = await connection.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_schema = DATABASE() 
         AND table_name = 'users' 
         AND column_name = 'level'`
      );
      
      if (levelColumn.length === 0) {
        console.log('🔄 Adding level column to users table...');
        try {
          await connection.query(`
            ALTER TABLE users 
            ADD COLUMN level ENUM('beginner', 'intermediate', 'senior', 'principal', 'lead') NULL AFTER domain_id
          `);
          console.log('✅ Added level column');
        } catch (error: any) {
          console.warn('Could not add level column:', error.message);
        }
      }
      
      // Add index for domain_id if it doesn't exist
      try {
        const [indexExists]: any = await connection.query(
          `SELECT 1 FROM information_schema.statistics 
           WHERE table_schema = DATABASE() 
           AND table_name = 'users' 
           AND index_name = 'idx_domain_id'`
        );
        
        if (indexExists.length === 0) {
          await connection.query(`
            CREATE INDEX idx_domain_id ON users(domain_id)
          `);
          console.log('✅ Added index for domain_id');
        }
      } catch (error: any) {
        // Index might already exist, that's okay
        console.warn('Could not create domain_id index:', error.message);
      }
      
      // Add foreign key constraint if domains table exists and constraint doesn't exist
      // Re-check if domain_id column exists (it might have been added above)
      const [domainIdColumnCheck]: any = await connection.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_schema = DATABASE() 
         AND table_name = 'users' 
         AND column_name = 'domain_id'`
      );
      
      if (domainIdColumnCheck.length > 0) {
        const [domainsTable]: any = await connection.query(
          "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'domains'"
        );
        
        if (domainsTable.length > 0) {
          const [fkExists]: any = await connection.query(
            `SELECT 1 FROM information_schema.table_constraints 
             WHERE table_schema = DATABASE() 
             AND table_name = 'users' 
             AND constraint_type = 'FOREIGN KEY' 
             AND constraint_name LIKE '%domain_id%'`
          );
          
          if (fkExists.length === 0) {
            try {
              await connection.query(`
                ALTER TABLE users 
                ADD CONSTRAINT fk_users_domain_id 
                FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
              `);
              console.log('✅ Added foreign key constraint for domain_id');
            } catch (error: any) {
              console.warn('Could not add foreign key constraint:', error.message);
            }
          }
        }
      }
    }
  } catch (error: any) {
    console.error('Migration error:', error);
    // Don't throw - allow the app to continue even if migration fails
  } finally {
    connection.release();
  }
}

async function seedDomains() {
  const connection = await pool.getConnection();
  
  try {
    const domains = [
      { name: 'Frontend', description: 'Frontend development technologies' },
      { name: 'Backend', description: 'Backend development technologies' },
      { name: 'Full Stack', description: 'Full stack development' },
      { name: 'MERN', description: 'MongoDB, Express, React, Node.js' },
      { name: 'MEAN', description: 'MongoDB, Express, Angular, Node.js' },
      { name: 'DevOps', description: 'DevOps and infrastructure' },
      { name: 'SEO', description: 'Search Engine Optimization' },
      { name: 'Mobile Development', description: 'iOS and Android development' },
      { name: 'Data Science', description: 'Data science and analytics' },
      { name: 'Machine Learning', description: 'Machine learning and AI' },
      { name: 'Cloud Computing', description: 'Cloud platforms and services' },
      { name: 'Cybersecurity', description: 'Information security' },
    ];

    for (const domain of domains) {
      const [existing]: any = await connection.query(
        'SELECT * FROM domains WHERE name = ?',
        [domain.name]
      );

      if (existing.length === 0) {
        await connection.query(
          'INSERT INTO domains (name, description) VALUES (?, ?)',
          [domain.name, domain.description]
        );
      }
    }
  } finally {
    connection.release();
  }
}

async function seedAdminUser() {
  const connection = await pool.getConnection();
  
  try {
    const bcrypt = await import('bcryptjs');
    
    // Check if admin exists
    const [rows]: any = await connection.query(
      'SELECT * FROM users WHERE email = ?',
      ['admin@tayar.ai']
    );
    
    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        `INSERT INTO users (name, email, password, role, subscription_type) 
         VALUES (?, ?, ?, 'admin', 'enterprise')`,
        ['Super Admin', 'admin@tayar.ai', hashedPassword]
      );
      console.log('👤 Admin user created: admin@tayar.ai / admin123');
    }
  } finally {
    connection.release();
  }
}

