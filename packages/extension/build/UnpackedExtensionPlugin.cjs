const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const timestamp = () => new Date().toISOString().replace(/T/, '-').replace(/:/g, '-').split('.')[0] + '-' + Date.now() % 1000;

class UnpackedExtensionPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tap('UnpackedExtensionPlugin', () => {
      const { outputPath, tempDir, publicKeyPath } = this.options;
      console.log(`${timestamp()} UnpackedExtensionPlugin:: start - outputPath: ${outputPath}, tempDir: ${tempDir}, publicKeyPath: ${publicKeyPath || 'none'}`);
      
      const unpackedDir = path.join(outputPath, 'unpacked');
      const tempTaskDir = path.join(tempDir, 'Extension');
      
      if (fs.existsSync(unpackedDir)) {
        console.log(`${timestamp()} UnpackedExtensionPlugin:: deleting existing output directory - ${unpackedDir}`);
        fse.removeSync(unpackedDir);
      }
      
      console.log(`${timestamp()} UnpackedExtensionPlugin:: creating directory - ${unpackedDir}`);
      fs.mkdirSync(unpackedDir, { recursive: true });
      
      const manifestPath = path.join(tempTaskDir, 'manifest.json');
      console.log(`${timestamp()} UnpackedExtensionPlugin:: reading manifest - ${manifestPath}`);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      if (publicKeyPath && fs.existsSync(publicKeyPath)) {
        console.log(`${timestamp()} UnpackedExtensionPlugin:: adding public key - ${publicKeyPath}`);
        const publicKey = fs.readFileSync(publicKeyPath, 'utf8').replace(/-----(BEGIN|END) PUBLIC KEY-----/g, '').trim();
        manifest.key = publicKey;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      }
      
      console.log(`${timestamp()} UnpackedExtensionPlugin:: copying to unpacked - from: ${tempTaskDir} to: ${unpackedDir}`);
      fse.copySync(tempTaskDir, path.join(unpackedDir, 'Extension'));
      
      console.log(`${timestamp()} UnpackedExtensionPlugin:: end`);
    });
  }
}

module.exports = UnpackedExtensionPlugin;