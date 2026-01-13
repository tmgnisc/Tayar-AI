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
    
    // Migrate interview table for Vapi integration
    await migrateInterviewTable();
    console.log('✅ Interview table migrated for Vapi');
    
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
        avatar_url TEXT NULL,
        password_reset_otp VARCHAR(6) NULL,
        password_reset_otp_expiry TIMESTAMP NULL,
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
        vapi_call_id VARCHAR(255) NULL,
        vapi_assistant_id VARCHAR(255) NULL,
        vapi_recording_url TEXT NULL,
        conversation_transcript TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_vapi_call_id (vapi_call_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS interview_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        interview_id INT NOT NULL,
        category VARCHAR(100) NOT NULL,
        score DECIMAL(4,2) NOT NULL,
        feedback TEXT,
        details JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
        INDEX idx_interview_id (interview_id),
        INDEX idx_category (category),
        UNIQUE KEY idx_interview_category (interview_id, category)
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

    // Code practice tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS code_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        challenge_id INT NULL,
        language VARCHAR(50) NOT NULL,
        code TEXT NOT NULL,
        status ENUM('pending', 'running', 'success', 'error', 'timeout') DEFAULT 'pending',
        execution_time DECIMAL(10,3) NULL COMMENT 'Execution time in seconds',
        memory_used DECIMAL(10,2) NULL COMMENT 'Memory used in MB',
        output TEXT NULL,
        error_message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_submissions (user_id, created_at),
        INDEX idx_status (status),
        INDEX idx_language (language)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS coding_stats (
        user_id INT PRIMARY KEY,
        total_submissions INT DEFAULT 0,
        accepted_submissions INT DEFAULT 0,
        easy_solved INT DEFAULT 0,
        medium_solved INT DEFAULT 0,
        hard_solved INT DEFAULT 0,
        favorite_language VARCHAR(50) NULL,
        total_execution_time DECIMAL(10,2) DEFAULT 0 COMMENT 'Total execution time in seconds',
        streak_days INT DEFAULT 0,
        last_submission_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS coding_challenges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
        category VARCHAR(100) NULL COMMENT 'arrays, strings, dp, etc.',
        tags JSON NULL COMMENT 'Array of tags',
        starter_code JSON NULL COMMENT 'Starter code for each language',
        test_cases JSON NULL COMMENT 'Array of test cases',
        constraints TEXT NULL,
        time_limit INT DEFAULT 5 COMMENT 'Time limit in seconds',
        memory_limit INT DEFAULT 128 COMMENT 'Memory limit in MB',
        difficulty_score INT DEFAULT 1 COMMENT 'Score from 1-10',
        acceptance_rate DECIMAL(5,2) DEFAULT 0.00,
        total_attempts INT DEFAULT 0,
        total_accepted INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_difficulty (difficulty),
        INDEX idx_category (category),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS code_snippets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NULL,
        language VARCHAR(50) NOT NULL,
        code TEXT NOT NULL,
        is_public BOOLEAN DEFAULT FALSE,
        tags JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_snippets (user_id, created_at),
        INDEX idx_public (is_public, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // CV/Resume table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_cvs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        template VARCHAR(50) DEFAULT 'modern',
        personal_info JSON NOT NULL,
        summary TEXT NULL,
        experience JSON NULL,
        education JSON NULL,
        skills JSON NULL,
        projects JSON NULL,
        certifications JSON NULL,
        languages JSON NULL,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_cv (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  } finally {
    connection.release();
  }
}

async function migrateTables() {
  const connection = await pool.getConnection();
  
  try {
    // Add avatar_url column if it doesn't exist
    try {
      await connection.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS avatar_url TEXT NULL
      `);
      console.log('✅ Added avatar_url column to users table');
    } catch (error: any) {
      // Column might already exist or MySQL doesn't support IF NOT EXISTS
      if (!error.message.includes('Duplicate column name')) {
        console.log('⚠️  Avatar URL column migration:', error.message);
      }
    }
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

      // Check if avatar_url column exists
      const [avatarColumn]: any = await connection.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_schema = DATABASE() 
         AND table_name = 'users' 
         AND column_name = 'avatar_url'`
      );
      
      if (avatarColumn.length === 0) {
        console.log('🔄 Adding avatar_url column to users table...');
        try {
          await connection.query(`
            ALTER TABLE users 
            ADD COLUMN avatar_url TEXT NULL
          `);
          console.log('✅ Added avatar_url column');
        } catch (error: any) {
          console.warn('Could not add avatar_url column:', error.message);
        }
      }

      // Check if password reset OTP columns exist
      const [otpColumn]: any = await connection.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_schema = DATABASE() 
         AND table_name = 'users' 
         AND column_name = 'password_reset_otp'`
      );
      
      if (otpColumn.length === 0) {
        console.log('🔄 Adding password reset OTP columns to users table...');
        try {
          await connection.query(`
            ALTER TABLE users 
            ADD COLUMN password_reset_otp VARCHAR(6) NULL,
            ADD COLUMN password_reset_otp_expiry TIMESTAMP NULL
          `);
          console.log('✅ Added password reset OTP columns');
        } catch (error: any) {
          console.warn('Could not add password reset OTP columns:', error.message);
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

async function migrateInterviewTable() {
  const connection = await pool.getConnection();
  
  try {
      // Check if interviews table exists
    const [interviewsTable]: any = await connection.query(
      "SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'interviews'"
    );
    
      if (interviewsTable.length > 0) {
      // Check and add vapi_call_id column
      const [vapiCallIdColumn]: any = await connection.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_schema = DATABASE() 
         AND table_name = 'interviews' 
         AND column_name = 'vapi_call_id'`
      );
      
      if (vapiCallIdColumn.length === 0) {
        console.log('🔄 Adding vapi_call_id column to interviews table...');
        try {
          await connection.query(`
            ALTER TABLE interviews 
            ADD COLUMN vapi_call_id VARCHAR(255) NULL AFTER duration_minutes
          `);
          console.log('✅ Added vapi_call_id column');
        } catch (error: any) {
          console.warn('Could not add vapi_call_id column:', error.message);
        }
      }

      // Add details column to interview_feedback if missing
      const [detailsColumn]: any = await connection.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_schema = DATABASE() 
         AND table_name = 'interview_feedback' 
         AND column_name = 'details'`
      );

      if (detailsColumn.length === 0) {
        console.log('🔄 Adding details column to interview_feedback table...');
        try {
          // Remove duplicate rows per (interview_id, category) before adding unique index
          await connection.query(`
            DELETE tf1 FROM interview_feedback tf1
            INNER JOIN interview_feedback tf2
              ON tf1.interview_id = tf2.interview_id
             AND tf1.category = tf2.category
             AND tf1.id > tf2.id
          `);

          await connection.query(`
            ALTER TABLE interview_feedback 
            ADD COLUMN details JSON NULL,
            ADD UNIQUE KEY idx_interview_category (interview_id, category)
          `);
          console.log('✅ Added details column to interview_feedback table');
        } catch (error: any) {
          console.warn('Could not add details column:', error.message);
        }
      }
      
      // Check and add vapi_assistant_id column
      const [vapiAssistantIdColumn]: any = await connection.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_schema = DATABASE() 
         AND table_name = 'interviews' 
         AND column_name = 'vapi_assistant_id'`
      );
      
      if (vapiAssistantIdColumn.length === 0) {
        console.log('🔄 Adding vapi_assistant_id column to interviews table...');
        try {
          await connection.query(`
            ALTER TABLE interviews 
            ADD COLUMN vapi_assistant_id VARCHAR(255) NULL AFTER vapi_call_id
          `);
          console.log('✅ Added vapi_assistant_id column');
        } catch (error: any) {
          console.warn('Could not add vapi_assistant_id column:', error.message);
        }
      }
      
      // Check and add vapi_recording_url column
      const [vapiRecordingUrlColumn]: any = await connection.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_schema = DATABASE() 
         AND table_name = 'interviews' 
         AND column_name = 'vapi_recording_url'`
      );
      
      if (vapiRecordingUrlColumn.length === 0) {
        console.log('🔄 Adding vapi_recording_url column to interviews table...');
        try {
          await connection.query(`
            ALTER TABLE interviews 
            ADD COLUMN vapi_recording_url TEXT NULL AFTER vapi_assistant_id
          `);
          console.log('✅ Added vapi_recording_url column');
        } catch (error: any) {
          console.warn('Could not add vapi_recording_url column:', error.message);
        }
      }
      
      // Check and add conversation_transcript column
      const [conversationTranscriptColumn]: any = await connection.query(
        `SELECT 1 FROM information_schema.columns 
         WHERE table_schema = DATABASE() 
         AND table_name = 'interviews' 
         AND column_name = 'conversation_transcript'`
      );
      
      if (conversationTranscriptColumn.length === 0) {
        console.log('🔄 Adding conversation_transcript column to interviews table...');
        try {
          await connection.query(`
            ALTER TABLE interviews 
            ADD COLUMN conversation_transcript TEXT NULL AFTER vapi_recording_url
          `);
          console.log('✅ Added conversation_transcript column');
        } catch (error: any) {
          console.warn('Could not add conversation_transcript column:', error.message);
        }
      }
      
      // Add index for vapi_call_id
      try {
        const [indexExists]: any = await connection.query(
          `SELECT 1 FROM information_schema.statistics 
           WHERE table_schema = DATABASE() 
           AND table_name = 'interviews' 
           AND index_name = 'idx_vapi_call_id'`
        );
        
        if (indexExists.length === 0) {
          await connection.query(`
            CREATE INDEX idx_vapi_call_id ON interviews(vapi_call_id)
          `);
          console.log('✅ Added index for vapi_call_id');
        }
      } catch (error: any) {
        console.warn('Could not create vapi_call_id index:', error.message);
      }
    }
  } catch (error: any) {
    console.error('Interview table migration error:', error);
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

