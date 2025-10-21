# @robinsonai/context7-mcp

**Enhanced Context7 MCP Server**

Advanced library documentation access with 8 powerful tools for searching, comparing, and learning from library docs.

## 📚 Features

### 8 Documentation Tools

1. **context7_resolve_library_id** - Find Context7-compatible library IDs
2. **context7_get_library_docs** - Fetch up-to-date documentation
3. **context7_search_libraries** (NEW) - Search across all available libraries
4. **context7_compare_versions** (NEW) - Compare different library versions
5. **context7_get_examples** (NEW) - Get code examples for specific use cases
6. **context7_get_migration_guide** (NEW) - Get migration guides between versions
7. **context7_search_by_topic** (NEW) - Search documentation by topic across libraries
8. **context7_get_changelog** (NEW) - Get changelog for specific versions

## 🚀 Installation

```bash
cd packages/context7-mcp
npm install
npm run build
npm link
```

## ⚙️ Configuration

### For Augment Code

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["context7-mcp"],
      "env": {
        "CONTEXT7_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## 📖 Usage Examples

### Resolve Library ID
```typescript
{
  "libraryName": "next.js"
}
// Returns: /vercel/next.js
```

### Get Documentation
```typescript
{
  "context7CompatibleLibraryID": "/vercel/next.js",
  "topic": "routing",
  "tokens": 5000
}
```

### Compare Versions
```typescript
{
  "libraryId": "/vercel/next.js",
  "fromVersion": "13.0.0",
  "toVersion": "14.0.0"
}
// Returns: Breaking changes, new features, migration steps
```

### Get Examples
```typescript
{
  "libraryId": "/vercel/next.js",
  "useCase": "server-side rendering",
  "language": "typescript"
}
```

### Search by Topic
```typescript
{
  "topic": "authentication",
  "libraries": ["/vercel/next.js", "/supabase/supabase"],
  "limit": 10
}
```

## 🎯 Benefits

- **Up-to-Date Docs**: Always get the latest library documentation
- **Version Comparison**: Easily see what changed between versions
- **Code Examples**: Get real-world examples for specific use cases
- **Migration Guides**: Smooth upgrades with detailed migration instructions
- **Cross-Library Search**: Find solutions across multiple libraries
- **Changelog Access**: Stay informed about library updates

## 📝 License

MIT - Robinson AI Systems

