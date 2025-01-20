const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const timestamp = () => new Date().toISOString().replace(/T/, '-').replace(/:/g, '-').split('.')[0] + '-' + Date.now() % 1000;

class CrxPackPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tap('CrxPackPlugin', () => {
      const { browser, manifestVersion, keyVersion, outputPath, keyPath, tempDir } = this.options;
      console.log(`${timestamp()} CrxPackPlugin:: start - browser: ${browser}, manifestVersion: ${manifestVersion}, keyVersion: ${keyVersion}, outputPath: ${outputPath}, keyPath: ${keyPath}, tempDir: ${tempDir}`);
      
      const packedDir = path.join(outputPath, 'packed');
      const tempTaskDir = path.join(tempDir, 'Extension');
      
      if (fs.existsSync(packedDir)) {
        console.log(`${timestamp()} CrxPackPlugin:: deleting existing output directory - ${packedDir}`);
        fse.removeSync(packedDir);
      }
      
      console.log(`${timestamp()} CrxPackPlugin:: creating directory - ${packedDir}`);
      fs.mkdirSync(packedDir, { recursive: true });
      
      const manifestPath = path.join(tempTaskDir, 'manifest.json');
      console.log(`${timestamp()} CrxPackPlugin:: checking manifest - ${manifestPath}`);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.key) {
        console.log(`${timestamp()} CrxPackPlugin:: removing key field from manifest`);
        delete manifest.key;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      }
      
      const crxOutput = path.join(packedDir, `Extension.crx`);
      console.log(`${timestamp()} CrxPackPlugin:: crx pack into - ${crxOutput}`);
      execSync(`crx pack "${tempTaskDir}" -o "${crxOutput}" -p "${keyPath}"`, { stdio: 'inherit' });
      
      console.log(`${timestamp()} CrxPackPlugin:: end`);
    });
  }
}

module.exports = CrxPackPlugin;