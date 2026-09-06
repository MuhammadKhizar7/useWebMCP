/**
 * Generate API documentation from TypeScript source files.
 *
 * This script reads the source files from packages/core and packages/vue,
 * extracts exported types and functions, and generates markdown files
 * for the Docus documentation site.
 *
 * Usage: node docs-site/scripts/generate-api-docs.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..', '..')
const contentDir = join(__dirname, '..', 'content', '05.api')

// Ensure output directory exists
if (!existsSync(contentDir)) {
  mkdirSync(contentDir, { recursive: true })
}

/**
 * Read a source file and return its content
 */
function readSource(relativePath) {
  const fullPath = join(rootDir, relativePath)
  return readFileSync(fullPath, 'utf-8')
}

/**
 * Extract type/interface definitions from TypeScript source
 */
function extractTypes(content, packageName) {
  const types = []

  // Match interface declarations
  const interfaceRegex = /export\s+interface\s+(\w+)(?:<[^>]+>)?\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g
  let match

  while ((match = interfaceRegex.exec(content)) !== null) {
    const name = match[1]
    const body = match[2]
    const properties = extractProperties(body)
    types.push({ name, kind: 'interface', properties, package: packageName })
  }

  // Match type declarations
  const typeRegex = /export\s+type\s+(\w+)(?:<[^>]+>)?\s*=\s*([^;]+);/g
  while ((match = typeRegex.exec(content)) !== null) {
    const name = match[1]
    const definition = match[2].trim()
    types.push({ name, kind: 'type', definition, package: packageName })
  }

  // Match class declarations
  const classRegex = /export\s+class\s+(\w+)(?:\s+extends\s+\w+)?\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g
  while ((match = classRegex.exec(content)) !== null) {
    const name = match[1]
    const body = match[2]
    const methods = extractMethods(body)
    const properties = extractProperties(body)
    types.push({ name, kind: 'class', methods, properties, package: packageName })
  }

  return types
}

/**
 * Extract property definitions from an interface body
 */
function extractProperties(body) {
  const properties = []
  const lines = body.split('\n').map(l => l.trim()).filter(Boolean)

  for (const line of lines) {
    // Match readonly property with optional type
    const propMatch = line.match(/^(readonly\s+)?(\w+)(\?)?\s*:\s*(.+?)(?:;|$)/)
    if (propMatch) {
      properties.push({
        readonly: !!propMatch[1],
        name: propMatch[2],
        optional: !!propMatch[3],
        type: propMatch[4].trim(),
      })
    }
  }

  return properties
}

/**
 * Extract method definitions from a class body
 */
function extractMethods(body) {
  const methods = []
  const methodRegex = /(\w+)(?:<[^>]+>)?\(([^)]*)\)\s*:\s*([^;{]+)(?:;|{)/g
  let match

  while ((match = methodRegex.exec(body)) !== null) {
    methods.push({
      name: match[1],
      params: match[2].trim(),
      returnType: match[3].trim(),
    })
  }

  return methods
}

/**
 * Extract function signatures from TypeScript source
 */
function extractFunctions(content, packageName) {
  const functions = []

  // Match exported function declarations
  const funcRegex = /export\s+(?:async\s+)?function\s+(\w+)(?:<[^>]+>)?\(([^)]*)\)\s*(?::\s*([^;{]+))?(?:;|{)/g
  let match

  while ((match = funcRegex.exec(content)) !== null) {
    functions.push({
      name: match[1],
      params: match[2].trim(),
      returnType: match[3]?.trim() || 'void',
      package: packageName,
    })
  }

  return functions
}

/**
 * Generate markdown for a type
 */
function generateTypeMarkdown(type) {
  let md = `### ${type.name}\n\n`

  if (type.kind === 'interface') {
    md += `**Interface**\n\n`
    if (type.properties && type.properties.length > 0) {
      md += `| Property | Type | Optional | Description |\n`
      md += `|----------|------|----------|-------------|\n`
      for (const prop of type.properties) {
        const readonly = prop.readonly ? 'readonly ' : ''
        const optional = prop.optional ? 'Yes' : 'No'
        md += `| ${prop.name} | \`${readonly}${prop.type}\` | ${optional} | |\n`
      }
      md += '\n'
    }
  } else if (type.kind === 'type') {
    md += `**Type Alias**\n\n`
    md += `\`\`\`ts\ntype ${type.name} = ${type.definition}\n\`\`\`\n\n`
  } else if (type.kind === 'class') {
    md += `**Class**\n\n`
    if (type.properties && type.properties.length > 0) {
      md += `#### Properties\n\n`
      md += `| Property | Type | Description |\n`
      md += `|----------|------|-------------|\n`
      for (const prop of type.properties) {
        const readonly = prop.readonly ? 'readonly ' : ''
        md += `| ${prop.name} | \`${readonly}${prop.type}\` | |\n`
      }
      md += '\n'
    }
    if (type.methods && type.methods.length > 0) {
      md += `#### Methods\n\n`
      for (const method of type.methods) {
        md += `##### ${method.name}(${method.params})\n\n`
        md += `Returns: \`${method.returnType}\`\n\n`
      }
    }
  }

  return md
}

/**
 * Generate markdown for a function
 */
function generateFunctionMarkdown(func) {
  let md = `### ${func.name}\n\n`
  md += `\`\`\`ts\n`
  md += `function ${func.name}(${func.params}): ${func.returnType}\n`
  md += `\`\`\`\n\n`
  return md
}

/**
 * Generate API documentation for a package
 */
function generatePackageDocs(packageName, sourceFiles, description) {
  let md = `---\ntitle: ${packageName} API\nnavigation:\n  title: ${packageName}\n---\n\n`
  md += `# ${packageName} API Reference\n\n`
  md += `${description}\n\n`

  for (const file of sourceFiles) {
    const content = readSource(file.path)
    const types = extractTypes(content, packageName)
    const functions = extractFunctions(content, packageName)

    if (types.length > 0 || functions.length > 0) {
      md += `## ${file.name}\n\n`

      for (const type of types) {
        md += generateTypeMarkdown(type)
      }

      for (const func of functions) {
        md += generateFunctionMarkdown(func)
      }
    }
  }

  return md
}

// Generate docs for webmcp-tool-core
const coreDocs = generatePackageDocs(
  'webmcp-tool-core',
  [
    { name: 'Types', path: 'packages/core/src/types.ts' },
    { name: 'Controller', path: 'packages/core/src/controller.ts' },
    { name: 'Normalize', path: 'packages/core/src/normalize.ts' },
    { name: 'Errors', path: 'packages/core/src/errors.ts' },
    { name: 'Identity', path: 'packages/core/src/identity.ts' },
    { name: 'Environment', path: 'packages/core/src/environment.ts' },
  ],
  'Framework-neutral core for WebMCP tool registration, lifecycle management, and result normalization.'
)

writeFileSync(join(contentDir, '02.core.md'), coreDocs)
console.log('Generated core API docs')

// Generate docs for vue-webmcp-tool
const vueDocs = generatePackageDocs(
  'vue-webmcp-tool',
  [
    { name: 'Types', path: 'packages/vue/src/types.ts' },
    { name: 'useWebMCP', path: 'packages/vue/src/useWebMCP.ts' },
  ],
  'Vue 3 composable for reactive WebMCP tool registration with automatic lifecycle management.'
)

writeFileSync(join(contentDir, '03.vue.md'), vueDocs)
console.log('Generated Vue API docs')

console.log('API documentation generation complete!')
