// Renders build/icon.svg to build/icon.png (1024×1024, transparent) and resources/icon.png
// (window icon, 512×512), plus build/icons/<size>x<size>.png for Linux desktops, with Electron's
// offscreen renderer. Run with: pnpm icon:render
const { app, BrowserWindow } = require('electron')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const SIZE = 1024

app.disableHardwareAcceleration()
app.whenReady().then(async () => {
  const svg = fs.readFileSync(path.join(root, 'build/icon.svg'), 'utf8')
  const window = new BrowserWindow({
    width: SIZE,
    height: SIZE,
    show: false,
    transparent: true,
    frame: false,
    webPreferences: { offscreen: true }
  })
  const html = `<html><body style="margin:0;background:transparent">${svg}</body></html>`
  await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  await new Promise((resolve) => setTimeout(resolve, 400))
  const image = await window.webContents.capturePage({ x: 0, y: 0, width: SIZE, height: SIZE })
  const full = image.resize({ width: SIZE, height: SIZE, quality: 'best' })
  fs.writeFileSync(path.join(root, 'build/icon.png'), full.toPNG())
  fs.writeFileSync(
    path.join(root, 'resources/icon.png'),
    full.resize({ width: 512, height: 512, quality: 'best' }).toPNG()
  )
  fs.mkdirSync(path.join(root, 'build/icons'), { recursive: true })
  for (const size of [16, 24, 32, 48, 64, 128, 256, 512]) {
    fs.writeFileSync(
      path.join(root, `build/icons/${size}x${size}.png`),
      full.resize({ width: size, height: size, quality: 'best' }).toPNG()
    )
  }
  console.log('Wrote build/icon.png, build/icons/ and resources/icon.png')
  app.quit()
})
