const archiver = require('archiver');
const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

const timestamp = () => new Date().toISOString().replace(/T/, '-').replace(/:/g, '-').split('.')[0] + '-' + Date.now() % 1000;

class ZipStorePlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapPromise('ZipStorePlugin', async () => {
      const { browser, manifestVersion, keyVersion, outputPath, privateKeyPath, tempDir } = this.options;
      console.log(`${timestamp()} ZipStorePlugin:: start - browser: ${browser}, manifestVersion: ${manifestVersion}, keyVersion: ${keyVersion}, outputPath: ${outputPath}, privateKeyPath: ${privateKeyPath || 'none'}, tempDir: ${tempDir}`);
      
      const storeDir = path.join(outputPath, 'store');
      const tempTaskDir = path.join(tempDir, 'Extension');
      
      if (fs.existsSync(storeDir)) {
        console.log(`${timestamp()} ZipStorePlugin:: deleting existing output directory - ${storeDir}`);
        fse.removeSync(storeDir);
      }
      
      console.log(`${timestamp()} ZipStorePlugin:: creating directory - ${storeDir}`);
      await fs.promises.mkdir(storeDir, { recursive: true });
      
      const manifestPath = path.join(tempTaskDir, 'manifest.json');
      console.log(`${timestamp()} ZipStorePlugin:: checking manifest - ${manifestPath}`);
      const manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf8'));
      if (manifest.key) {
        console.log(`${timestamp()} ZipStorePlugin:: removing key field from manifest`);
        delete manifest.key;
        await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      }
      
      const zipOutput = path.join(storeDir, 'Extension.zip');
      console.log(`${timestamp()} ZipStorePlugin:: zipping into - ${zipOutput}`);
      const archive = archiver('zip', { zlib: { level: 9 } });
      const output = fs.createWriteStream(zipOutput);
      archive.pipe(output);

      console.log(`${timestamp()} ZipStorePlugin:: adding directory - Extension`);
      archive.directory(tempTaskDir, 'Extension');
      
      if (privateKeyPath) {
        console.log(`${timestamp()} ZipStorePlugin:: adding private key - ${privateKeyPath}`);
        archive.file(privateKeyPath, { name: 'Extension/key.pem' });
      }
      
      console.log(`${timestamp()} ZipStorePlugin:: finalizing archive`);
      await archive.finalize();
      
      console.log(`${timestamp()} ZipStorePlugin:: end`);
    });
  }
}

module.exports = ZipStorePlugin;