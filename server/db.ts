import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { DataType, newDb } from 'pg-mem';
import bcrypt from 'bcryptjs';
import { config } from './config';

let pool: Pool | null = null;

export interface DbUser {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'chef_projet' | 'donateur';
  created_at: Date;
}

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','chef_projet','donateur')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
  `CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('planning','enCours','completed','paused')),
      start_date DATE NOT NULL,
      end_date DATE,
      budget NUMERIC(14,2) NOT NULL,
      spent NUMERIC(14,2) NOT NULL DEFAULT 0,
      admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
      chef_project_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
  `CREATE TABLE IF NOT EXISTS project_donors (
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (project_id, user_id)
    );`,
  `CREATE TABLE IF NOT EXISTS indicators (
      id SERIAL PRIMARY KEY,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      target_value NUMERIC(14,2) NOT NULL,
      current_value NUMERIC(14,2) NOT NULL,
      unit TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
  `CREATE TABLE IF NOT EXISTS indicator_entries (
      id SERIAL PRIMARY KEY,
      indicator_id INTEGER NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
      value NUMERIC(14,2) NOT NULL,
      notes TEXT,
      evidence TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`,
];

async function createPool(): Promise<Pool> {
  if (config.databaseUrl) {
    return new Pool({ connectionString: config.databaseUrl });
  }

  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({ name: 'now', returns: DataType.timestamptz, implementation: () => new Date() });
  const adapter = db.adapters.createPg();
  return new adapter.Pool();
}

export async function getPool(): Promise<Pool> {
  if (!pool) {
    pool = await createPool();
    await runMigrations(pool);
    await seedDatabase(pool);
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: any[],
): Promise<QueryResult<T>> {
  const activePool = await getPool();
  return activePool.query<T>(sql, params);
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const activePool = await getPool();
  const client = await activePool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function runMigrations(activePool: Pool) {
  for (const statement of MIGRATIONS) {
    await activePool.query(statement);
  }
}

async function seedDatabase(activePool: Pool) {
  const { rows } = await activePool.query<{ count: string }>('SELECT COUNT(*)::text as count FROM users');
  if (rows[0]?.count !== '0') {
    return;
  }

  const adminPassword = await bcrypt.hash('Impact2024!', 12);
  const chefPassword = await bcrypt.hash('Impact2024!', 12);
  const donorPassword = await bcrypt.hash('Impact2024!', 12);

  const insertUser = async (
    email: string,
    passwordHash: string,
    firstName: string,
    lastName: string,
    role: 'admin' | 'chef_projet' | 'donateur',
  ) => {
    const result = await activePool.query<{ id: number }>(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id;`,
      [email, passwordHash, firstName, lastName, role],
    );
    return result.rows[0].id;
  };

  const adminId = await insertUser('admin@impacttracker.org', adminPassword, 'Alice', 'Johnson', 'admin');
  const chefId = await insertUser('chef@impacttracker.org', chefPassword, 'Bob', 'Smith', 'chef_projet');
  const chef2Id = await insertUser('chef2@impacttracker.org', chefPassword, 'David', 'Brown', 'chef_projet');
  const donorId = await insertUser('donateur@impacttracker.org', donorPassword, 'Carol', 'White', 'donateur');
  const donor2Id = await insertUser('donateur2@impacttracker.org', donorPassword, 'Emma', 'Davis', 'donateur');

  const insertProject = async (project: {
    name: string;
    description: string;
    status: 'planning' | 'enCours' | 'completed' | 'paused';
    startDate: string;
    endDate: string | null;
    budget: number;
    spent: number;
    chefProjectId: number;
    donors: number[];
  }) => {
    const result = await activePool.query<{ id: number }>(
      `INSERT INTO projects (name, description, status, start_date, end_date, budget, spent, admin_id, chef_project_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id;`,
      [
        project.name,
        project.description,
        project.status,
        project.startDate,
        project.endDate,
        project.budget,
        project.spent,
        adminId,
        project.chefProjectId,
      ],
    );
    const projectId = result.rows[0].id;

    if (project.donors.length > 0) {
      for (const donor of project.donors) {
        await activePool.query(
          `INSERT INTO project_donors (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
          [projectId, donor],
        );
      }
    }
    return projectId;
  };

  const project1Id = await insertProject({
    name: 'Education Initiative - Rural Schools',
    description:
      'Providing quality education to 500 children in rural areas through school infrastructure and teacher training.',
    status: 'enCours',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    budget: 50000,
    spent: 32000,
    chefProjectId: chefId,
    donors: [donorId, donor2Id],
  });

  const project2Id = await insertProject({
    name: 'Clean Water Project',
    description: 'Building 20 water wells in villages to provide clean drinking water to 5000 people.',
    status: 'enCours',
    startDate: '2024-02-01',
    endDate: '2025-01-31',
    budget: 75000,
    spent: 45000,
    chefProjectId: chef2Id,
    donors: [donorId],
  });

  const project3Id = await insertProject({
    name: 'Healthcare Clinic Expansion',
    description: 'Expanding healthcare services to 3 new clinics in underserved communities.',
    status: 'planning',
    startDate: '2024-12-01',
    endDate: '2025-11-30',
    budget: 100000,
    spent: 5000,
    chefProjectId: chefId,
    donors: [donor2Id],
  });

  const insertIndicator = async (indicator: {
    projectId: number;
    name: string;
    description: string;
    targetValue: number;
    currentValue: number;
    unit: string;
  }) => {
    const result = await activePool.query<{ id: number }>(
      `INSERT INTO indicators (project_id, name, description, target_value, current_value, unit)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id;`,
      [
        indicator.projectId,
        indicator.name,
        indicator.description,
        indicator.targetValue,
        indicator.currentValue,
        indicator.unit,
      ],
    );
    return result.rows[0].id;
  };

  const enrollmentIndicatorId = await insertIndicator({
    projectId: project1Id,
    name: 'Number of Children Enrolled',
    description: 'Total number of children enrolled in the education program',
    targetValue: 500,
    currentValue: 450,
    unit: 'children',
  });

  await insertIndicator({
    projectId: project1Id,
    name: 'Teachers Trained',
    description: 'Number of teachers trained in modern teaching methods',
    targetValue: 50,
    currentValue: 42,
    unit: 'teachers',
  });

  await insertIndicator({
    projectId: project2Id,
    name: 'Wells Constructed',
    description: 'Number of water wells built',
    targetValue: 20,
    currentValue: 15,
    unit: 'wells',
  });

  await insertIndicator({
    projectId: project2Id,
    name: 'People with Access to Clean Water',
    description: 'Number of people with access to clean drinking water',
    targetValue: 5000,
    currentValue: 3750,
    unit: 'people',
  });

  await insertIndicator({
    projectId: project3Id,
    name: 'Clinics Established',
    description: 'Number of new healthcare clinics opened',
    targetValue: 3,
    currentValue: 0,
    unit: 'clinics',
  });

  const insertEntry = async (
    indicatorId: number,
    value: number,
    createdBy: number,
    notes: string,
  ) => {
    await activePool.query(
      `INSERT INTO indicator_entries (indicator_id, value, notes, created_by)
       VALUES ($1, $2, $3, $4);`,
      [indicatorId, value, notes, createdBy],
    );
  };

  await insertEntry(
    enrollmentIndicatorId,
    420,
    chefId,
    'Initial enrollment phase completed with strong community participation.',
  );
  await insertEntry(
    enrollmentIndicatorId,
    450,
    chefId,
    'Enrollment drive extended to neighboring villages increasing participation.',
  );
}
