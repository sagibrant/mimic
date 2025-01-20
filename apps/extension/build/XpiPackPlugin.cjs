const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

const timestamp = () => new Date().toISOString().replace(/T/, '-').replace(/:/g, '-').split('.')[0] + '-' + Date.now() % 1000;

class XpiPackPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tap('XpiPackPlugin', () => {
      const { outputPath, apiKeyPath, apiSecretPath, tempDir } = this.options;
      console.log(`${timestamp()} XpiPackPlugin:: start - outputPath: ${outputPath}, apiKeyPath: ${apiKeyPath}, apiSecretPath: ${apiSecretPath}, tempDir: ${tempDir}`);
      
      const packedDir = path.join(outputPath, 'packed');
      const tempTaskDir = path.join(tempDir, 'Extension');
      
      if (fs.existsSync(packedDir)) {
        console.log(`${timestamp()} XpiPackPlugin:: deleting existing output directory - ${packedDir}`);
        fse.removeSync(packedDir);
      }
      
      console.log(`${timestamp()} XpiPackPlugin:: creating directory - ${packedDir}`);
      fs.mkdirSync(packedDir, { recursive: true });
      
      console.log(`${timestamp()} XpiPackPlugin:: reading API keys`);
      const apiKey = fs.readFileSync(apiKeyPath, 'utf8').trim();
      const apiSecret = fs.readFileSync(apiSecretPath, 'utf8').trim();
      
      console.log(`${timestamp()} XpiPackPlugin:: signing extension into - ${packedDir}`);
      execSync(
        `web-ext sign --source-dir "${tempTaskDir}" --artifacts-dir "${packedDir}" --api-key "${apiKey}" --api-secret "${apiSecret}"`,
        { stdio: 'inherit' }
      );
      
      console.log(`${timestamp()} XpiPackPlugin:: end`);
    });
  }
}

module.exports = XpiPackPlugin;