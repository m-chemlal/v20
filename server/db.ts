import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';
import bcrypt from 'bcryptjs';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config';

export interface QueryResultRow {
  [column: string]: unknown;
}

export interface QueryResult<T extends QueryResultRow = QueryResultRow> {
  rows: T[];
  rowCount: number;
  lastInsertRowid?: number;
}

export interface DbUser extends QueryResultRow {
  id: number;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'chef_projet' | 'donateur';
  created_at: string;
}

class SqlitePool {
  constructor(private readonly db: SqlJsDatabase, private readonly filePath: string) {}

  async query<T extends QueryResultRow = QueryResultRow>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
    const trimmed = sql.trim().toLowerCase();
    const hasReturning = /\breturning\b/.test(trimmed);

    if (trimmed.startsWith('select') || hasReturning) {
      const rows = executeSelect<T>(this.db, sql, params);
      return { rows, rowCount: rows.length };
    }

    const { changes, lastInsertRowid } = executeRun(this.db, sql, params);
    return { rows: [] as T[], rowCount: changes, lastInsertRowid };
  }
}

let SQL: SqlJsStatic | null = null;
let database: SqlJsDatabase | null = null;
let databasePath: string | ':memory:' | null = null;
let pool: SqlitePool | null = null;
let initialization: Promise<void> | null = null;
let transactionDepth = 0;

const MIGRATIONS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','chef_projet','donateur')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  `CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('planning','enCours','completed','paused')),
      start_date TEXT NOT NULL,
      end_date TEXT,
      budget REAL NOT NULL,
      spent REAL NOT NULL DEFAULT 0,
      admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      chef_project_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  `CREATE TABLE IF NOT EXISTS project_donors (
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      committed_amount REAL NOT NULL DEFAULT 0,
      spent_amount REAL NOT NULL DEFAULT 0,
      PRIMARY KEY (project_id, user_id)
    );`,
  `CREATE TABLE IF NOT EXISTS indicators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      target_value REAL NOT NULL,
      current_value REAL NOT NULL,
      unit TEXT NOT NULL,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  `CREATE TABLE IF NOT EXISTS indicator_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      indicator_id INTEGER NOT NULL REFERENCES indicators(id) ON DELETE CASCADE,
      value REAL NOT NULL,
      notes TEXT,
      evidence TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  `CREATE INDEX IF NOT EXISTS idx_projects_chef_project_id ON projects(chef_project_id);`,
  `CREATE INDEX IF NOT EXISTS idx_project_donors_user_id ON project_donors(user_id);`,
  `CREATE INDEX IF NOT EXISTS idx_project_donors_project_id ON project_donors(project_id);`,
  `ALTER TABLE project_donors ADD COLUMN committed_amount REAL NOT NULL DEFAULT 0;`,
  `ALTER TABLE project_donors ADD COLUMN spent_amount REAL NOT NULL DEFAULT 0;`,
  `CREATE INDEX IF NOT EXISTS idx_indicators_project_id ON indicators(project_id);`,
  `CREATE INDEX IF NOT EXISTS idx_indicator_entries_indicator_id ON indicator_entries(indicator_id);`
];

function shouldIgnoreMigrationError(statement: string, error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const normalizedMessage = error.message.toLowerCase();
  const normalizedStatement = statement.trim().toLowerCase();

  if (normalizedStatement.startsWith('create table') && normalizedMessage.includes('already exists')) {
    return true;
  }

  if (normalizedStatement.startsWith('create index') && normalizedMessage.includes('already exists')) {
    return true;
  }

  if (normalizedStatement.includes('alter table') && normalizedMessage.includes('duplicate column name')) {
    return true;
  }

  return false;
}

function runMigration(db: SqlJsDatabase, statement: string) {
  try {
    db.exec(statement);
  } catch (error) {
    if (shouldIgnoreMigrationError(statement, error)) {
      return;
    }
    throw error;
  }
}

async function getSqlModule(): Promise<SqlJsStatic> {
  if (!SQL) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const wasmPath = join(__dirname, '../node_modules/sql.js/dist');

    SQL = await initSqlJs({
      locateFile: (file: string) => resolve(wasmPath, file),
    });
  }
  return SQL;
}

function resolveDatabasePath(): string | ':memory:' {
  const raw = config.databaseUrl?.trim();
  if (!raw) {
    const fallback = resolve(process.cwd(), 'data', 'dev.sqlite');
    ensureDirectory(fallback);
    return fallback;
  }

  if (raw === ':memory:' || raw === 'file::memory:' || raw === 'memory') {
    return ':memory:';
  }

  if (raw.startsWith('file:')) {
    const withoutScheme = raw.slice('file:'.length);
    const resolved = resolve(process.cwd(), withoutScheme);
    ensureDirectory(resolved);
    return resolved;
  }

  if (!raw.includes('://')) {
    const resolved = resolve(process.cwd(), raw);
    ensureDirectory(resolved);
    return resolved;
  }

  throw new Error(
    `DATABASE_URL="${raw}" n'est pas supporté. Utilisez un chemin de fichier SQLite (ex: file:./data/dev.sqlite).`
  );
}

function ensureDirectory(filePath: string) {
  const directory = dirname(filePath);
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }
}

async function openDatabase(): Promise<SqlJsDatabase> {
  if (!database) {
    databasePath = resolveDatabasePath();
    const SQL = await getSqlModule();
    if (databasePath === ':memory:') {
      database = new SQL.Database();
    } else {
      const fileExists = existsSync(databasePath);
      database = fileExists ? new SQL.Database(readFileSync(databasePath)) : new SQL.Database();
    }
  }
  return database!;
}

async function initializeDatabase() {
  const db = await openDatabase();
  for (const statement of MIGRATIONS) {
    runMigration(db, statement);
  }
  await seedDatabase(db);
  persistDatabase(db, databasePath ?? ':memory:');
}

function ensureInitialization(): Promise<void> {
  if (!initialization) {
    initialization = initializeDatabase();
  }
  return initialization;
}

export async function getPool(): Promise<SqlitePool> {
  await ensureInitialization();
  if (!pool) {
    pool = new SqlitePool(await openDatabase(), databasePath ?? ':memory:');
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
  const activePool = await getPool();
  return activePool.query<T>(sql, params);
}

export async function withTransaction<T>(callback: (client: SqlitePool) => Promise<T>): Promise<T> {
  const db = await openDatabase();
  await ensureInitialization();
  transactionDepth += 1;
  db.run('BEGIN');
  try {
    const result = await callback(await getPool());
    db.run('COMMIT');
    transactionDepth = Math.max(0, transactionDepth - 1);
    persistDatabase(db, databasePath ?? ':memory:');
    return result;
  } catch (error) {
    db.run('ROLLBACK');
    transactionDepth = Math.max(0, transactionDepth - 1);
    persistDatabase(db, databasePath ?? ':memory:');
    throw error;
  }
}

function executeSelect<T>(db: SqlJsDatabase, sql: string, params: any[]): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

function executeRun(db: SqlJsDatabase, sql: string, params: any[]) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();

  const changes = db.getRowsModified();
  const rowidResult = db.exec('SELECT last_insert_rowid() AS id');
  const lastInsertRowid = rowidResult[0]?.values?.[0]?.[0];
  if (transactionDepth === 0) {
    persistDatabase(db, databasePath ?? ':memory:');
  }
  return { changes, lastInsertRowid: typeof lastInsertRowid === 'number' ? lastInsertRowid : undefined };
}

function persistDatabase(db: SqlJsDatabase, filePath: string | ':memory:') {
  if (filePath === ':memory:') return;
  const data = db.export();
  writeFileSync(filePath, Buffer.from(data));
}

async function seedDatabase(db: SqlJsDatabase) {
  const countRows = executeSelect<{ count: number }>(db, `SELECT COUNT(*) as count FROM users`, []);
  if (countRows[0] && Number(countRows[0].count ?? 0) > 0) return;

  const adminPassword = await bcrypt.hash('Impact2024!', 12);
  const chefPassword = await bcrypt.hash('Impact2024!', 12);
  const donorPassword = await bcrypt.hash('Impact2024!', 12);

  const insertUser = (
    email: string,
    passwordHash: string,
    firstName: string,
    lastName: string,
    role: 'admin' | 'chef_projet' | 'donateur',
  ) => {
    const result = executeRun(
      db,
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES (?, ?, ?, ?, ?)`,
      [email, passwordHash, firstName, lastName, role],
    );
    if (typeof result.lastInsertRowid === 'number') {
      return result.lastInsertRowid;
    }
    const idRow = executeSelect<{ id: number }>(db, `SELECT last_insert_rowid() as id`, []);
    return Number(idRow[0]?.id ?? 0);
  };

  const adminId = insertUser('admin@impacttracker.org', adminPassword, 'Alice', 'Johnson', 'admin');
  const chefId = insertUser('chef@impacttracker.org', chefPassword, 'Bob', 'Smith', 'chef_projet');
  const chef2Id = insertUser('chef2@impacttracker.org', chefPassword, 'David', 'Brown', 'chef_projet');
  const donorId = insertUser('donateur@impacttracker.org', donorPassword, 'Carol', 'White', 'donateur');
  const donor2Id = insertUser('donateur2@impacttracker.org', donorPassword, 'Emma', 'Davis', 'donateur');

  const insertProject = (project: {
    name: string;
    description: string;
    status: 'planning' | 'enCours' | 'completed' | 'paused';
    startDate: string;
    endDate: string | null;
    budget: number;
    spent: number;
    chefProjectId: number;
    donors: Array<{ userId: number; committedAmount: number; spentAmount: number }>;
  }) => {
    const result = executeRun(
      db,
      `INSERT INTO projects (name, description, status, start_date, end_date, budget, spent, admin_id, chef_project_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    const projectId =
      typeof result.lastInsertRowid === 'number'
        ? result.lastInsertRowid
        : executeSelect<{ id: number }>(db, `SELECT last_insert_rowid() as id`, [])[0]?.id ?? 0;
    for (const donor of project.donors) {
      executeRun(
        db,
        `INSERT OR IGNORE INTO project_donors (project_id, user_id, committed_amount, spent_amount)
         VALUES (?, ?, ?, ?)`,
        [projectId, donor.userId, donor.committedAmount, donor.spentAmount],
      );
    }
    return Number(projectId);
  };

  const project1Id = insertProject({
    name: 'Education Initiative - Rural Schools',
    description: 'Providing quality education to 500 children in rural areas through school infrastructure and teacher training.',
    status: 'enCours',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    budget: 50000,
    spent: 32000,
    chefProjectId: chefId,
    donors: [
      { userId: donorId, committedAmount: 30000, spentAmount: 18500 },
      { userId: donor2Id, committedAmount: 20000, spentAmount: 13500 },
    ],
  });

  const project2Id = insertProject({
    name: 'Clean Water Project',
    description: 'Building 20 water wells in villages to provide clean drinking water to 5000 people.',
    status: 'enCours',
    startDate: '2024-02-01',
    endDate: '2025-01-31',
    budget: 75000,
    spent: 45000,
    chefProjectId: chef2Id,
    donors: [{ userId: donorId, committedAmount: 50000, spentAmount: 30000 }],
  });

  const project3Id = insertProject({
    name: 'Healthcare Clinic Expansion',
    description: 'Expanding healthcare services to 3 new clinics in underserved communities.',
    status: 'planning',
    startDate: '2024-12-01',
    endDate: '2025-11-30',
    budget: 100000,
    spent: 5000,
    chefProjectId: chefId,
    donors: [{ userId: donor2Id, committedAmount: 60000, spentAmount: 5000 }],
  });

  const insertIndicator = (indicator: {
    projectId: number;
    name: string;
    description: string;
    targetValue: number;
    currentValue: number;
    unit: string;
  }) => {
    executeRun(
      db,
      `INSERT INTO indicators (project_id, name, description, target_value, current_value, unit)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [indicator.projectId, indicator.name, indicator.description, indicator.targetValue, indicator.currentValue, indicator.unit],
    );
    const indicatorId = executeSelect<{ id: number }>(db, `SELECT last_insert_rowid() as id`, [])[0]?.id ?? 0;
    return Number(indicatorId);
  };

  const enrollmentIndicatorId = insertIndicator({
    projectId: project1Id,
    name: 'Number of Children Enrolled',
    description: 'Total number of children enrolled in the education program',
    targetValue: 500,
    currentValue: 450,
    unit: 'children',
  });

  insertIndicator({
    projectId: project1Id,
    name: 'Teachers Trained',
    description: 'Number of teachers trained in modern teaching methods',
    targetValue: 50,
    currentValue: 42,
    unit: 'teachers',
  });

  insertIndicator({
    projectId: project2Id,
    name: 'Wells Constructed',
    description: 'Number of water wells built',
    targetValue: 20,
    currentValue: 15,
    unit: 'wells',
  });

  insertIndicator({
    projectId: project2Id,
    name: 'People with Access to Clean Water',
    description: 'Number of people with access to clean drinking water',
    targetValue: 5000,
    currentValue: 3750,
    unit: 'people',
  });

  insertIndicator({
    projectId: project3Id,
    name: 'Clinics Established',
    description: 'Number of new healthcare clinics opened',
    targetValue: 3,
    currentValue: 0,
    unit: 'clinics',
  });

  executeRun(
    db,
    `INSERT INTO indicator_entries (indicator_id, value, notes, created_by)
     VALUES (?, ?, ?, ?)`,
    [enrollmentIndicatorId, 420, 'Initial enrollment phase completed with strong community participation.', chefId],
  );

  executeRun(
    db,
    `INSERT INTO indicator_entries (indicator_id, value, notes, created_by)
     VALUES (?, ?, ?, ?)`,
    [enrollmentIndicatorId, 450, 'Enrollment drive extended to neighboring villages increasing participation.', chefId],
  );
}
