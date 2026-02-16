/**
 * PROJECT: LEGAL FORENSICS V4 - MASTER DEPLOYMENT (Node.js Edition)
 * CONTEXT: Node v22 Environment
 * AUTHOR:  Mark Kibby / System
 * DATE:    2026-02-16
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// --- [ CONFIGURATION ] ---
const CONFIG = {
    projectId: "legal-forensics-v4",
    region: "us-central1",
    functionName: "dlp-forensic-v7",
    triggerBucket: "forensic-download-divorce-language-processor",
    runtime: "nodejs20", // GCloud supports 20, which works with 22 locally
    memory: "1GiB",
    timeout: "300s"
};

const DIRS = {
    base: process.cwd(),
    backend: path.join(process.cwd(), 'backend'),
    frontend: path.join(process.cwd(), 'frontend')
};

// --- [ UTILS ] ---

function log(msg, type = 'INFO') {
    const icons = { INFO: 'ℹ️ ', SUCCESS: '✅ ', ERROR: '❌ ', WARN: '⚠️ ', BUILD: '🏗️ ' };
    console.log(`${icons[type] || ''} ${msg}`);
}

function writeFile(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content.trim());
    log(`Wrote: ${path.basename(filePath)}`, 'INFO');
}

function runCmd(command, cwd) {
    try {
        log(`EXEC: ${command}`, 'BUILD');
        execSync(command, { cwd: cwd, stdio: 'inherit' });
        return true;
    } catch (error) {
        log(`Command failed: ${command}`, 'ERROR');
        return false;
    }
}

// --- [ PHASE 1: CLEANUP ] ---

function cleanEnvironment() {
    log("CLEANING ENVIRONMENT...", 'WARN');
    [DIRS.backend, DIRS.frontend].forEach(dir => {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
        }
        fs.mkdirSync(dir, { recursive: true });
    });
}

// --- [ PHASE 2: BACKEND GENERATION ] ---

function buildBackend() {
    log("GENERATING BACKEND (Node.js/TypeScript)...", 'BUILD');

    // 1. package.json (FIXED: Correct package name and version)
    const pkgJson = {
        name: "legal-forensics-backend",
        version: "4.0.0",
        main: "dist/index.js",
        scripts: {
            "build": "tsc",
            "gcp-build": "npm run build",
            "start": "functions-framework --target=processDocument",
            "dev": "npm run build && functions-framework --target=processDocument"
        },
        dependencies: {
            "@google-cloud/functions-framework": "^3.3.0", // CORRECT PACKAGE
            "@google-cloud/storage": "^7.7.0",
            "@google-cloud/documentai": "^8.0.0",
            "@google-cloud/firestore": "^7.3.0",
            "@google-cloud/vision": "^4.0.0"
        },
        devDependencies: {
            "typescript": "^5.3.3",
            "@types/node": "^20.11.0",
            "gts": "^5.2.0"
        },
        engines: {
            "node": ">=20.0.0"
        }
    };
    writeFile(path.join(DIRS.backend, 'package.json'), JSON.stringify(pkgJson, null, 2));

    // 2. tsconfig.json
    const tsConfig = {
        compilerOptions: {
            module: "commonjs",
            target: "es2022",
            rootDir: "src",
            outDir: "dist",
            sourceMap: true,
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true
        },
        include: ["src/**/*"]
    };
    writeFile(path.join(DIRS.backend, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));

    // 3. src/index.ts (Application Logic)
    const indexTs = `
import { cloudEvent } from '@google-cloud/functions-framework';
import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';
import * as path from 'path';

const storage = new Storage();
const firestore = new Firestore();
const COLLECTION = 'forensic_cases';

cloudEvent('processDocument', async (cloudEvent: any) => {
    const fileData = cloudEvent.data;
    const bucketName = fileData.bucket;
    const fileName = fileData.name;

    console.log(\`🚀 PROCESSING: \${fileName}\`);

    if (!fileName) return;

    try {
        // 1. Database Entry
        const docRef = firestore.collection(COLLECTION).doc(fileName.replace(/\\//g, '_'));
        await docRef.set({
            fileName,
            bucket: bucketName,
            status: 'INGESTED',
            timestamp: new Date().toISOString(),
            metadata: {
                processedBy: 'Node22_Forensic_Engine',
                version: 'v7'
            }
        }, { merge: true });

        console.log(\`✅ Fact Base Updated.\`);

    } catch (err) {
        console.error(\`🔥 ERROR: \${err}\`);
        throw err;
    }
});
`;
    writeFile(path.join(DIRS.backend, 'src', 'index.ts'), indexTs);
}

// --- [ PHASE 3: FRONTEND GENERATION ] ---

function buildFrontend() {
    log("GENERATING FRONTEND (React/Vite)...", 'BUILD');

    // 1. package.json
    const pkgFront = {
        name: "legal-forensics-dashboard",
        private: true,
        version: "1.0.0",
        type: "module",
        scripts: {
            "dev": "vite",
            "build": "vite build",
            "preview": "vite preview"
        },
        dependencies: {
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
        },
        devDependencies: {
            "@vitejs/plugin-react": "^4.2.1",
            "vite": "^5.0.0"
        }
    };
    writeFile(path.join(DIRS.frontend, 'package.json'), JSON.stringify(pkgFront, null, 2));

    // 2. Vite Config
    const viteConfig = `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })
`;
    writeFile(path.join(DIRS.frontend, 'vite.config.js'), viteConfig);

    // 3. App.jsx
    const appJsx = `
import React from 'react';
export default function App() {
  return (
    <div style={{padding: '50px'}}>
      <h1>⚖️ Forensic Dashboard v7</h1>
      <p>System Status: <span style={{color: 'green'}}>ONLINE</span></p>
    </div>
  )
}
`;
    writeFile(path.join(DIRS.frontend, 'src', 'App.jsx'), appJsx);

    // 4. Entry Files
    writeFile(path.join(DIRS.frontend, 'index.html'), `
<!doctype html>
<html>
  <body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>
</html>`);
    
    writeFile(path.join(DIRS.frontend, 'src', 'main.jsx'), `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
`);
}

// --- [ PHASE 4: DEPLOYMENT ] ---

function deploy() {
    log("INSTALLING BACKEND DEPENDENCIES...", 'BUILD');
    
    // Install
    if (!runCmd("npm install", DIRS.backend)) return;
    
    // Build
    log("COMPILING TYPESCRIPT...", 'BUILD');
    if (!runCmd("npm run build", DIRS.backend)) return;

    log("READY TO DEPLOY?", 'WARN');
    console.log(`
    Run the following command manually to deploy to Google Cloud:
    
    cd backend
    gcloud functions deploy ${CONFIG.functionName} \\
      --gen2 \\
      --runtime=${CONFIG.runtime} \\
      --region=${CONFIG.region} \\
      --source=. \\
      --entry-point=processDocument \\
      --trigger-bucket=${CONFIG.triggerBucket} \\
      --memory=${CONFIG.memory} \\
      --allow-unauthenticated
    `);
}

// --- [ MAIN ] ---
(function main() {
    console.clear();
    log("STARTING MASTER DEPLOY v7 (Node.js Edition)", 'INFO');
    cleanEnvironment();
    buildBackend();
    buildFrontend();
    deploy();
})();