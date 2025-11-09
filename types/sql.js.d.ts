declare module 'sql.js' {
  interface QueryExecResult {
    columns: string[];
    values: (number | string | Uint8Array | null)[][];
  }

  interface SqlJsConfig {
    locateFile?: (file: string, scriptDirectory?: string) => string;
    [key: string]: unknown;
  }

  export class Statement {
    bind(params?: unknown): boolean;
    step(): boolean;
    get(): unknown[];
    getAsObject(): Record<string, unknown>;
    reset(): void;
    free(): void;
  }

  export class Database {
    constructor(data?: ArrayLike<number> | Buffer | null);
    close(): void;
    run(sql: string, params?: unknown): Database;
    exec(sql: string, params?: unknown): QueryExecResult[];
    prepare(sql: string, params?: unknown): Statement;
    export(): Uint8Array;
    getRowsModified(): number;
  }

  export interface SqlJsStatic {
    Database: typeof Database;
    Statement: typeof Statement;
  }

  export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}
