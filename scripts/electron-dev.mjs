import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import electron from 'electron'
import { createServer } from 'vite'

export async function startDesktopDevelopment({ createDevelopmentServer = createServer, launch = spawn } = {}) {
  const server = await createDevelopmentServer({ server: { host: '127.0.0.1', port: 5173, strictPort: true } })
  try {
    await server.listen()
  } catch (error) {
    await server.close()
    throw error
  }
  const child = launch(electron, ['.'], {
    stdio: 'inherit',
    env: { ...process.env, VITE_DEV_SERVER_URL: server.resolvedUrls.local[0] },
  })
  let shuttingDown = false
  const onInterrupt = () => { void shutdown(130) }
  const onTerminate = () => { void shutdown(143) }
  async function shutdown(code) {
    if (shuttingDown) return
    shuttingDown = true
    process.off('SIGINT', onInterrupt)
    process.off('SIGTERM', onTerminate)
    if (child.exitCode === null) child.kill('SIGTERM')
    await server.close()
    process.exitCode = code
  }
  child.on('error', (error) => { console.error(error); void shutdown(1) })
  child.on('exit', (code) => { void shutdown(code ?? 0) })
  process.on('SIGINT', onInterrupt)
  process.on('SIGTERM', onTerminate)
  return { child, shutdown }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startDesktopDevelopment()
}
