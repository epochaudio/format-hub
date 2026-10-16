import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const { isAppEntryUrl, isExternalUrl } = createRequire(import.meta.url)('../electron/navigation.cjs')

test('主窗口只停留在应用入口，锚点和重新加载不算离开', () => {
  const devEntry = 'http://127.0.0.1:5173/'
  const fileEntry = 'file:///Applications/Format%20Hub.app/Contents/Resources/app.asar/dist/index.html'
  assert.equal(isAppEntryUrl('http://127.0.0.1:5173/#footnote-1', devEntry), true)
  assert.equal(isAppEntryUrl('http://127.0.0.1:5173/?t=1', devEntry), true)
  assert.equal(isAppEntryUrl(`${fileEntry}#heading-0`, fileEntry), true)
  assert.equal(isAppEntryUrl('https://example.com/', devEntry), false)
  assert.equal(isAppEntryUrl('http://127.0.0.1:5174/', devEntry), false)
  assert.equal(isAppEntryUrl('file:///etc/passwd', fileEntry), false)
  assert.equal(isAppEntryUrl('not a url', devEntry), false)
})

test('只把网页和邮件链接交给系统打开', () => {
  assert.equal(isExternalUrl('https://example.com/a'), true)
  assert.equal(isExternalUrl('http://example.com'), true)
  assert.equal(isExternalUrl('mailto:me@example.com'), true)
  assert.equal(isExternalUrl('file:///etc/passwd'), false)
  assert.equal(isExternalUrl('javascript:alert(1)'), false)
  assert.equal(isExternalUrl('/relative'), false)
})
