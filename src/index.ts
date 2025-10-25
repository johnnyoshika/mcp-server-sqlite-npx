import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import sqlite3 from "sqlite3";
import { z } from "zod";
import path from "path";

// Command line argument parsing
const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error("Usage: mcp-server-sqlite-npx <database-path>");
  process.exit(1);
}

const dbPath = path.resolve(args[0]);

/**
 * Wrapper for sqlite3.Database that bridges CommonJS and ESM modules.
 * This abstraction is necessary because:
 * 1. sqlite3 is a CommonJS module while we're using ESM (type: "module")
 * 2. The module interop requires careful handling of the Database import
 * 3. We need to promisify the callback-based API to work better with async/await
 */
class DatabaseWrapper {
  private readonly db: sqlite3.Database;

  constructor(filename: string) {
    this.db = new sqlite3.Database(filename);
  }

  query(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err: Error | null, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  execute(
    sql: string,
    params: any[] = []
  ): Promise<
    {
      affectedRows: number;
    }[]
  > {
    return new Promise((resolve, reject) => {
      this.db.run(
        sql,
        params,
        function (this: sqlite3.RunResult, err: Error | null) {
          if (err) reject(err);
          else resolve([{ affectedRows: this.changes }]);
        }
      );
    });
  }
}

class SqliteDatabase {
  private readonly db: DatabaseWrapper;

  constructor(dbPath: string) {
    this.db = new DatabaseWrapper(dbPath);
  }

  private async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    return this.db.query(sql, params);
  }

  async listTables(): Promise<any[]> {
    return this.query("SELECT name FROM sqlite_master WHERE type='table'");
  }

  async describeTable(tableName: string): Promise<any[]> {
    return this.query(`PRAGMA table_info(${tableName})`);
  }

  async executeReadQuery(query: string): Promise<any[]> {
    if (!query.trim().toUpperCase().startsWith("SELECT")) {
      throw new Error("Only SELECT queries are allowed for read_query");
    }
    return this.query(query);
  }

  async executeWriteQuery(query: string): Promise<any[]> {
    if (query.trim().toUpperCase().startsWith("SELECT")) {
      throw new Error("SELECT queries are not allowed for write_query");
    }
    return this.query(query);
  }

  async createTable(query: string): Promise<any[]> {
    if (!query.trim().toUpperCase().startsWith("CREATE TABLE")) {
      throw new Error("Only CREATE TABLE statements are allowed");
    }
    return this.query(query);
  }
}

const db = new SqliteDatabase(dbPath);

async function withErrorHandling<T>(fn: () => Promise<T>) {
  try {
    const result = await fn();
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
}

// Server setup
const server = new McpServer(
  {
    name: "sqlite-manager",
    version: "0.5.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);


server.tool(
  "read_query",
  "Execute a SELECT query on the SQLite database",
  {
    query: z.string().describe("SELECT SQL query to execute"),
  },
  async ({ query }) => withErrorHandling(() => db.executeReadQuery(query))
);

server.tool(
  "write_query",
  "Execute an INSERT, UPDATE, or DELETE query on the SQLite database",
  {
    query: z
      .string()
      .describe("INSERT, UPDATE, or DELETE SQL query to execute"),
  },
  async ({ query }) => withErrorHandling(() => db.executeWriteQuery(query))
);

server.tool(
  "create_table",
  "Create a new table in the SQLite database",
  {
    query: z.string().describe("CREATE TABLE SQL statement"),
  },
  async ({ query }) => withErrorHandling(() => db.createTable(query))
);

server.tool(
  "list_tables",
  "List all tables in the SQLite database",
  {},
  async () => withErrorHandling(() => db.listTables())
);

server.tool(
  "describe_table",
  "Get the schema information for a specific table",
  {
    table_name: z.string().describe("Name of the table to describe"),
  },
  async ({ table_name }) =>
    withErrorHandling(() => db.describeTable(table_name))
);

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Use console.error to show error output.
  // console.log results in JSon exception.
  console.error("SQLite MCP Server running on stdio");
  console.error("Database path:", dbPath);
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
