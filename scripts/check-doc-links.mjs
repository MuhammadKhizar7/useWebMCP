import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const requiredPages = [
  'getting-started/vue-installation.md',
  'getting-started/vue-first-tool.md',
  'getting-started/how-webmcp-works.md',
  'core/controller-reference.md',
  'vue/use-webmcp.md',
  'guides/security.md',
  'guides/ssr-and-browser-support.md',
  'guides/troubleshooting.md',
  'vue/examples/coffee-shop.md',
  'examples/external/upstream-demos.md',
  'javascript.md',
]

export const requiredExternalCatalogLinks = [
  'https://github.com/GoogleChromeLabs/webmcp-tools',
  'https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos/coffee-shop',
  'https://googlechromelabs.github.io/webmcp-tools/demos/coffee-shop/',
  '/vue/examples/coffee-shop',
]

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await markdownFiles(entryPath))
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(entryPath)
  }
  return files
}

function localTarget(source, target, contentRoot) {
  const withoutFragment = target.split('#', 1)[0]
  const withoutQuery = withoutFragment.split('?', 1)[0]
  if (!withoutQuery) return undefined
  if (withoutQuery.startsWith('/')) {
    const route = withoutQuery.replace(/^\/+/, '')
    return [path.join(contentRoot, `${route}.md`), path.join(contentRoot, route, 'index.md')]
  }
  const resolved = path.resolve(path.dirname(source), withoutQuery)
  return [resolved, `${resolved}.md`, path.join(resolved, 'index.md')]
}

export async function checkDocumentation(root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')) {
  const contentRoot = path.join(root, 'docs-site', 'content')
  const files = await markdownFiles(contentRoot)
  for (const requiredPage of requiredPages) {
    try {
      await readFile(path.join(contentRoot, requiredPage))
    } catch {
      assert.fail(`Required documentation page is missing: ${requiredPage}`)
    }
  }

  let checkedLinks = 0
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    const links = source.matchAll(/\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)
    for (const [, target] of links) {
      if (!target || /^(?:[a-z]+:|\/\/)/i.test(target)) continue
      const candidates = localTarget(file, target, contentRoot)
      if (!candidates) continue
      checkedLinks += 1
      let resolved = false
      for (const candidate of candidates) {
        try {
          await readFile(candidate)
          resolved = true
          break
        } catch {
          // Try the next Markdown route candidate.
        }
      }
      assert.ok(resolved, `Broken local documentation link in ${path.relative(root, file)}: ${target}`)
    }
  }

  const allContent = await Promise.all(files.map((file) => readFile(file, 'utf8')))
  const externalCatalog = await readFile(path.join(contentRoot, 'examples/external/upstream-demos.md'), 'utf8')
  for (const link of requiredExternalCatalogLinks) {
    assert.ok(externalCatalog.includes(`](${link})`), `Required external catalog link is missing: ${link}`)
  }
  assert.ok(!allContent.some((content) => /exposedTo\s*:\s*\[\s*['"]assistant['"]\s*\]/.test(content)), 'Generic assistant exposedTo label remains')
  return { files: files.length, checkedLinks, requiredPages: requiredPages.length }
}

const invokedPath = process.argv[1]
if (invokedPath && path.resolve(invokedPath) === fileURLToPath(import.meta.url)) {
  const result = await checkDocumentation()
  console.log(`Documentation checks passed: ${result.files} Markdown files, ${result.checkedLinks} local links, ${result.requiredPages} required pages`)
}
