import test from 'node:test'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { startDesktopDevelopment } from '../scripts/electron-dev.mjs'

test('桌面启动等待服务器就绪，并传递真实 URL 和清理子进程', async () => {
  let listening = false
  let closed = false
  let terminated = false
  const child = new EventEmitter()
  child.exitCode = null
  child.kill = () => { terminated = true }
  const { shutdown } = await startDesktopDevelopment({
    createDevelopmentServer: async () => ({
      resolvedUrls: { local: ['http://127.0.0.1:5173/'] },
      listen: async () => { listening = true },
      close: async () => { closed = true },
    }),
    launch: (_executable, args, options) => {
      assert.equal(listening, true)
      assert.deepEqual(args, ['.'])
      assert.equal(options.env.VITE_DEV_SERVER_URL, 'http://127.0.0.1:5173/')
      return child
    },
  })
  await shutdown(0)
  assert.equal(closed, true)
  assert.equal(terminated, true)
})

test('服务器启动失败时不启动桌面进程', async () => {
  let closed = false
  await assert.rejects(startDesktopDevelopment({
    createDevelopmentServer: async () => ({
      listen: async () => { throw new Error('端口占用') },
      close: async () => { closed = true },
    }),
    launch: () => { assert.fail('不能启动桌面进程') },
  }), /端口占用/)
  assert.equal(closed, true)
})
