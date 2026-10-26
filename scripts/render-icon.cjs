// Renders the app icon set from build/icon-source.png (square PNG, at least 512×512):
// build/icon.png, build/icons/<size>x<size>.png for Linux desktops and resources/icon.png
// (window icon). Run with: pnpm icon:render
const { app, nativeImage } = require('electron')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const SIZES = [16, 24, 32, 48, 64, 128, 256, 512]

app.whenReady().then(() => {
  const source = nativeImage.createFromPath(path.join(root, 'build/icon-source.png'))
  const { width, height } = source.getSize()
  if (width !== height || width < 512) {
    console.error(
      `build/icon-source.png must be square and at least 512 px (got ${width}×${height})`
    )
    app.exit(1)
    return
  }
  const resize = (size) => source.resize({ width: size, height: size, quality: 'best' }).toPNG()

  fs.writeFileSync(path.join(root, 'build/icon.png'), resize(512))
  fs.writeFileSync(path.join(root, 'resources/icon.png'), resize(512))
  fs.mkdirSync(path.join(root, 'build/icons'), { recursive: true })
  for (const size of SIZES) {
    fs.writeFileSync(path.join(root, `build/icons/${size}x${size}.png`), resize(size))
  }
  console.log('Wrote build/icon.png, build/icons/ and resources/icon.png')
  app.quit()
})
