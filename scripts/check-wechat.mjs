import { createServer } from 'vite'
import electron from 'electron'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { parseArgs } from 'node:util'
import fs from 'node:fs'
import path from 'node:path'

const { values } = parseArgs({ options: { engine: { type: 'string' }, out: { type: 'string', default: 'release/wechat-audit' } } })
if (!values.engine || !fs.existsSync(values.engine)) {
  throw new Error('请用 --engine 指定官方 build-browser.mjs 生成的 verify-article-structure.browser.js，参见 docs/wechat-compatibility.md。')
}
const server = await createServer({ server: { host: '127.0.0.1', port: 5187, strictPort: true } })
try {
  await server.listen()
  const child = spawn(electron, [
    'tests/wechat-audit.cjs', server.resolvedUrls.local[0], path.resolve(values.engine), path.resolve(values.out),
  ], { stdio: 'inherit' })
  const [code] = await once(child, 'exit')
  process.exitCode = code ?? 2
} finally { await server.close() }
