# Step to build the extensions

> Use npm & webpack to build the web agents (`extension` & `agent.js` files)

---

## Getting Start

Please follow these instructions on how to setup the environment on your local machine and build the agents.

### Prerequisites

> Install [node](https://nodejs.org/en/)

```bat
    // Update npm
    C:\xxx\agentjs> npm update -g npm 
```

> Install required node modules in the `agentjs` folder

```bat
    C:\xxx\agentjs> npm install
```

> suggest to open the `packages\drivers\web\agentjs` folder with [VSCode](https://code.visualstudio.com/)

## Project Structure 
* 
  <details>
    <summary>Project Structure</summary>
```
agentjs/
├── src/
│   ├── background.js
│   ├── background/
│   │   ├── *.js
│   ├── content.js
│   ├── content/
│   │   ├── *.js
│   ├── common/
│   │   ├── *.js
│   ├── resources/
│   │   ├── *.*
│   ├── thirdparty/
│   │   ├── *.*
├── build/
│   ├── chrome/
│   │   ├── manifest/
│   │   │   ├── v2/
│   │   │   │   ├── manifest.json
│   │   │   ├── v3/
│   │   │   │   ├── manifest.json
│   │   ├── version/
│   │   │   ├── default/
│   │   │   │   ├── privateKey.pem
│   │   │   │   ├── publicKey.txt
│   │   │   ├── 2025/
│   │   │   │   ├── privateKey.pem
│   │   │   │   ├── publicKey.txt
│   ├── edge/
│   │   ├── manifest/
│   │   │   ├── v2/
│   │   │   │   ├── manifest.json
│   │   │   ├── v3/
│   │   │   │   ├── manifest.json
│   │   ├── version/
│   │   │   ├── default/
│   │   │   │   ├── privateKey.pem
│   │   │   │   ├── publicKey.txt
│   │   │   ├── 2025/
│   │   │   │   ├── privateKey.pem
│   │   │   │   ├── publicKey.txt
│   ├── firefox/
│   │   ├── manifest/
│   │   │   ├── v2/
│   │   │   │   ├── manifest.json
│   │   │   ├── v3/
│   │   │   │   ├── manifest.json
│   │   ├── version/
│   │   │   ├── default/
│   │   │   │   ├── apiKey.txt
│   │   │   │   ├── apiSecret.txt
│   │   │   ├── 2025/
│   │   │   │   ├── apiKey.txt
│   │   │   │   ├── apiSecret.txt
│   ├── webpack.config.js
│   ├── UnpackedExtensionPlugin.js
│   ├── CrxPackPlugin.js
│   ├── XpiPackPlugin.js
│   ├── ZipStorePlugin.js
├── package.json

```
</details>
* 

## Build tasks

> build for `dev` (extensions & agentjs)

```bat
    C:\xxx\agentjs> npm run build::dev -- version=2025.04.11.1 
```

> build for `chrome`

```bat
    C:\xxx\agentjs> npm run build::chrome -- version=2025.04.11.1 
```

> build for `edge`

```bat
    C:\xxx\agentjs> npm run build::edge -- version=2025.04.11.1 
```

> build for `firefox` (packed version can be only triggered in product mode as it will reserve the build number)

```bat
    C:\xxx\agentjs> npm run build::firefox -- version=2025.04.11.1 
```

> build for `agentjs`

```bat
    C:\xxx\agentjs> npm run build::agentjs -- version=2025.04.11.1 
```

> build for `product` (should only triggered by pipleline as it will reserve the build number)

```bat
    C:\xxx\agentjs> npm run build::product -- version=2025.04.11.1 
```
