import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'vite'
import electron from 'electron'

const server = await createServer({ server: { host: '127.0.0.1', port: 0 } })
try {
  await server.listen()
  const child = spawn(electron, ['tests/electron-runner.cjs', server.resolvedUrls.local[0]], { stdio: 'inherit' })
  const [code] = await once(child, 'exit')
  process.exitCode = code ?? 1
} finally {
  await server.close()
}
