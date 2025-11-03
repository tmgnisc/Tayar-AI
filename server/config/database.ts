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
    
    // Seed initial admin user
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
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        subscription_type ENUM('free', 'pro', 'enterprise') DEFAULT 'free',
        subscription_status ENUM('active', 'cancelled', 'expired') DEFAULT 'active',
        subscription_start_date DATE,
        subscription_end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        INDEX idx_email (email),
        INDEX idx_role (role)
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

