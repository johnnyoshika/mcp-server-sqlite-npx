# MCP SQLite Server

[![smithery badge](https://smithery.ai/badge/mcp-server-sqlite-npx)](https://smithery.ai/server/mcp-server-sqlite-npx) [![MseeP.ai Security Assessment Badge](https://mseep.net/mseep-audited.png)](https://mseep.ai/app/johnnyoshika-mcp-server-sqlite-npx)

A Node.js implementation of the Model Context Protocol SQLite server, based on the [official Python reference](https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite). This version provides an npx-based alternative for environments where Python's UVX runner is not available, such as [LibreChat](https://github.com/danny-avila/LibreChat/issues/4876#issuecomment-2561363955).

## Use with Claude Desktop

### Installing Manually

Add the following to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "/absolute/path/to/npx",
      "args": [
        "-y",
        "mcp-server-sqlite-npx",
        "/absolute/path/to/database.db"
      ],
      "env": {
        "PATH": "/absolute/path/to/executables",
        "NODE_PATH": "/absolute/path/to/node_modules"
      }
    }
  }
}
```

Full example when using nvm on macoS:

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "/Users/{username}/.nvm/versions/node/v22.12.0/bin/npx",
      "args": [
        "-y",
        "mcp-server-sqlite-npx",
        "/Users/{username}/projects/database.db"
      ],
      "env": {
        "PATH": "/Users/{username}/.nvm/versions/node/v22.12.0/bin:/usr/local/bin:/usr/bin:/bin",
        "NODE_PATH": "/Users/{username}/.nvm/versions/node/v22.12.0/lib/node_modules"
      }
    }
  }
}
```

Full example when using nvm on Windows:

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "C:\\Program Files\\nodejs\\npx.cmd",
      "args": [
        "-y",
        "mcp-server-sqlite-npx",
        "C:\\Users\\{username}\\projects\\database.db"
      ],
      "env": {
        "PATH": "C:\\Program Files\\nodejs;%PATH%",
        "NODE_PATH": "C:\\Program Files\\nodejs\\node_modules"
      }
    }
  }
}
```

### Installing via Smithery

To install MCP SQLite Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/mcp-server-sqlite-npx):

```bash
npx -y @smithery/cli install mcp-server-sqlite-npx --client claude
```

## Development

1. Install dependencies:

```bash
npm ci
```

2. Build the TypeScript code:

```bash
npm run build
```

### Testing with MCP Inspector

You can test the server using the [MCP Inspector tool](https://modelcontextprotocol.io/docs/tools/inspector):

```bash
npx @modelcontextprotocol/inspector node dist/index.js /absolute/path/to/database.db
```

`Connect` and go to `Tools` to start using the server.

### Testing with Claude Desktop

Add the following to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "/absolute/path/to/node",
      "args": [
        "/absolute/path/to/dist/index.js",
        "/absolute/path/to/database.db"
      ]
    }
  }
}
```

Examples:

- `/absolute/path/to/node`: `/Users/{username}/.nvm/versions/node/v20.18.1/bin/node`
- `/absolute/path/to/index.js`: `/Users/{username}/projects/mcp-server-sqlite-npx/dist/index.js`
- `/absolute/path/to/database.db`: `/Users/{username}/projects/database.db`

### Publish

- Bump version in package.json
- `npm install`
- Commit with message: `Release {version, e.g. 0.1.6}`
