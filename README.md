Cloudflare 私人相册项目部署包
这个文档包含了所有你需要的文件和步骤，以便从零开始部署你的私人相册。请按照下面的指示在你的本地电脑上操作。

1. 项目文件和代码
请先在你的电脑上创建一个名为 my-photo-album 的项目根目录。然后，按照以下文件路径和内容创建每个文件。

文件: my-photo-album/.gitignore
这个文件用于告诉 Git 哪些文件应该被忽略。

# Dependency directories
/node_modules

# Build output directories
/dist
/build

# Cloudflare Wrangler and secrets
.dev.vars
.wrangler
/worker-build

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# OS and IDE files
.DS_Store
.env
.idea/
.vscode/


文件: my-photo-album/README.md
这是一个简单的项目说明文件。

# Cloudflare Private Photo Album

A private photo album solution built with Cloudflare Workers, Pages, and R2.

This project is a full-stack application with a React frontend and a Cloudflare Worker backend. It allows for password-protected photo uploads and viewing.


文件: my-photo-album/frontend/index.html
Vite 前端应用的 HTML 基础文件。

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Private Photo Album</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

文件: my-photo-album/frontend/package.json
前端应用的依赖配置文件。

{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "yet-another-react-lightbox": "^3.19.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@typescript-eslint/eslint-plugin": "^7.2.0",
    "@typescript-eslint/parser": "^7.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.6",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  }
}

文件: my-photo-album/frontend/vite.config.ts
Vite 构建工具的配置，包含了本地开发时用于代理 API 请求的设置。

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 代理 API 请求到本地运行的 Worker (默认端口 8787)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
})

文件: my-photo-album/frontend/src/App.css
前端的全局样式表。

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.App header {
  margin-bottom: 2rem;
}

.upload-form {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #444;
  border-radius: 8px;
  text-align: left;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.5rem;
  box-sizing: border-box;
}

.status-message {
  margin-top: 1rem;
  color: #a0a0a0;
}

.gallery-controls {
  margin-bottom: 1.5rem;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.gallery-controls button {
  background: none;
  border: 1px solid #666;
  color: #ccc;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.gallery-controls button.active,
.gallery-controls button:hover {
  background-color: #555;
  color: #fff;
  border-color: #aaa;
}

.gallery {
  display: grid;
  gap: 1rem;
}

/* 标准视图 */
.gallery.standard-view {
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

/* 紧凑视图 */
.gallery.compact-view {
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.photo-item {
  position: relative;
  aspect-ratio: 1 / 1;
  background-color: #333;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.photo-item:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease-in-out;
}

.photo-item .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #888;
    font-size: 0.8rem;
    padding: 10px;
    box-sizing: border-box;
    word-break: break-all;
}

文件: my-photo-album/frontend/src/App.tsx
前端应用的核心组件，处理密码校验和图片上传/展示。

import React, { useState, useEffect, useCallback } from 'react';
import PhotoGallery from './components/PhotoGallery';
import UploadForm from './components/UploadForm';
import './App.css';

export interface Photo {
  key: string;
  size: number;
}

// 在生产环境中，这个域名应该是你绑定到 R2 的域名
// 在本地开发中，我们先留空，因为图片无法直接预览
const R2_PUBLIC_URL = "https://your-r2-public-domain.com"; // 【重要】部署后替换成 R2 的公共访问域名

function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true);
      // 注意：这里我们使用相对路径 '/api/list'
      // Vite proxy 会在本地处理它，Cloudflare Pages 会在生产环境处理它
      const response = await fetch('/api/list');
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      const data: Photo[] = await response.json();
      setPhotos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return (
    <div className="App">
      <header>
        <h1>My Private Photo Album</h1>
      </header>
      <main>
        <UploadForm onUploadSuccess={fetchPhotos} />
        {loading ? <p>Loading photos...</p> : <PhotoGallery photos={photos} r2Host={R2_PUBLIC_URL} />}
      </main>
    </div>
  );
}

export default App;

文件: my-photo-album/frontend/src/components/PhotoGallery.tsx
用于展示图片列表和灯箱功能的组件。

import React, { useState } from 'react';
import { Photo } from '../App';
import Lightbox from "yet-another-react-lightbox";
import 'yet-another-react-lightbox/styles.css';

interface Props {
  photos: Photo[];
  r2Host: string;
}

const PhotoGallery: React.FC<Props> = ({ photos, r2Host }) => {
  const [index, setIndex] = useState(-1);
  const [viewMode, setViewMode] = useState<'compact' | 'standard'>('standard');

  if (!photos.length) {
    return <p>No photos yet. Try uploading some!</p>;
  }

  const isR2HostConfigured = r2Host && r2Host !== "https://your-r2-public-domain.com";

  return (
    <>
      <div className="gallery-controls">
        <button onClick={() => setViewMode('compact')} className={viewMode === 'compact' ? 'active' : ''}>Compact</button>
        <button onClick={() => setViewMode('standard')} className={viewMode === 'standard' ? 'active' : ''}>Standard</button>
      </div>
      
      <div className={`gallery ${viewMode === 'compact' ? 'compact-view' : 'standard-view'}`}>
        {photos.map((photo, idx) => (
          <div key={photo.key} className="photo-item" onClick={() => setIndex(idx)}>
            {isR2HostConfigured ? (
              <img
                src={`${r2Host}/cdn-cgi/image/width=${viewMode === 'compact' ? 200 : 400},height=${viewMode === 'compact' ? 200 : 400},fit=cover,quality=75/${photo.key}`}
                alt={photo.key}
                loading="lazy"
              />
            ) : (
              <div className="placeholder">{photo.key}</div>
            )}
          </div>
        ))}
      </div>

      {isR2HostConfigured && (
        <Lightbox
          open={index >= 0}
          close={() => setIndex(-1)}
          index={index}
          slides={photos.map(p => ({ 
            src: `${r2Host}/cdn-cgi/image/width=1600,quality=85/${p.key}` 
          }))}
        />
      )}
    </>
  );
};

export default PhotoGallery;

文件: my-photo-album/frontend/src/components/UploadForm.tsx
处理文件上传到 Worker 的组件。

import React, { useState, useRef } from 'react';

interface Props {
  onUploadSuccess: () => void;
}

// 【重要】请将这里的密钥替换成你设置的实际密钥。
// 在本地开发时，使用 .dev.vars 文件中的 SECRET_KEY。
// 在部署到生产环境后，请修改为你在 Cloudflare Pages 环境变量中设置的密钥。
const SECRET_KEY = "admin"; 

const UploadForm: React.FC<Props> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [customPath, setCustomPath] = useState<string>('photos');
  const [status, setStatus] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus('Please select a file.');
      return;
    }

    setIsUploading(true);
    setStatus('Getting upload URL...');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-Secret-Key': SECRET_KEY, // 在请求头中携带密钥
        },
        body: JSON.stringify({ filename: file.name, customPath }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const { signedUrl, objectKey } = await response.json();
      setStatus(`Uploading ${objectKey}...`);

      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (uploadResponse.ok) {
        setStatus(`Upload successful! Refreshing gallery...`);
        onUploadSuccess(); // 通知父组件刷新
        // 清理表单
        setFile(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      } else {
        throw new Error('Upload to R2 failed.');
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setStatus(''), 5000); // 5秒后清除状态信息
    }
  };

  return (
    <div className="upload-form">
      <h3>Upload a New Photo</h3>
      <form onSubmit={handleUpload}>
        <div className="form-group">
          <label>Category / Path (e.g., travel/japan_2025)</label>
          <input type="text" value={customPath} onChange={e => setCustomPath(e.target.value)} disabled={isUploading} />
        </div>
        <div className="form-group">
          <input type="file" ref={fileInputRef} onChange={e => setFile(e.target.files ? e.target.files[0] : null)} disabled={isUploading} />
        </div>
        <button type="submit" disabled={!file || isUploading}>
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {status && <p className="status-message">{status}</p>}
    </div>
  );
};

export default UploadForm;

文件: my-photo-album/frontend/src/main.tsx
前端应用的入口文件。

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import 'yet-another-react-lightbox/styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

文件: my-photo-album/worker/package.json
后端 Worker 的依赖配置文件，增加了 AWS SDK 以支持预签名 URL。

{
  "name": "worker",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "deploy": "wrangler deploy",
    "dev": "wrangler dev"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240405.0",
    "typescript": "^5.4.5",
    "wrangler": "^3.50.0"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.556.0",
    "@aws-sdk/s3-request-presigner": "^3.556.0"
  }
}

文件: my-photo-album/worker/tsconfig.json
Worker 的 TypeScript 配置文件。

{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "moduleResolution": "node",
    "lib": ["esnext"],
    "strict": true,
    "esModuleInterop": true,
    "outDir": "dist",
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}

文件: my-photo-album/worker/wrangler.toml
Worker 的 Wrangler 配置文件。注意：你需要将 bucket_name 替换为你的 R2 桶名称。

# 这是部署时的配置文件，也是本地开发的入口
name = "my-photo-worker" # 你的 Worker 名字
main = "src/index.ts"
compatibility_date = "2024-05-02"

# 告诉 Cloudflare Pages 如何构建和集成这个项目
# 这是 Monorepo 部署的关键
[pages_build]
# 前端项目的目录
build_dir = "../frontend"
# 前端项目的构建命令
build_command = "npm install && npm run build"
# 构建产物的输出目录
build_output_dir = "dist"

# 绑定 R2 存储桶，让 Worker 可以访问
[[r2_buckets]]
binding = "PHOTO_BUCKET" # 代码中通过 env.PHOTO_BUCKET 访问
bucket_name = "your-r2-bucket-name" # 【重要】替换成你创建的 R2 存储桶的真实名称

# 绑定环境变量，在部署后需要在 Cloudflare 仪表盘设置
[vars]
ALLOWED_ORIGINS = "https://your-pages-project.pages.dev" # 【重要】部署后替换成你的 Pages 域名

# 注意：密钥(Secrets)不能写在这里，需要通过命令行或仪表盘设置
# R2_ACCOUNT_ID
# R2_ACCESS_KEY_ID
# R2_SECRET_ACCESS_KEY

文件: my-photo-album/worker/src/index.ts
Worker 的核心代码，包含了预签名 URL 的生成逻辑和 API 列表。

import { S3Client, ListObjectsV2Command, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface Env {
    PHOTO_BUCKET: R2Bucket;

    // Vars from wrangler.toml
    ALLOWED_ORIGINS: string;

    // Secrets (set in .dev.vars for local, and in dashboard for production)
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    SECRET_KEY: string;
    R2_BUCKET_NAME: string; // 新增：用于本地开发
}

const getS3Client = (env: Env) => {
    return new S3Client({
        region: "auto",
        endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
            accessKeyId: env.R2_ACCESS_KEY_ID,
            secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
    });
};

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const corsHeaders = {
            "Access-Control-Allow-Origin": env.ALLOWED_ORIGINS,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-Secret-Key",
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);

        // --- 获取 R2 桶名称 ---
        // 在本地开发时，从 env.R2_BUCKET_NAME 获取
        // 在部署到生产环境时，从 env.PHOTO_BUCKET 的属性中获取
        // 使用 ?? 运算符，如果前者不存在就使用后者
        const bucketName = env.R2_BUCKET_NAME ?? (env.PHOTO_BUCKET as any).bucketName;
        if (!bucketName) {
            return new Response("R2 bucket name is not configured.", { status: 500, headers: corsHeaders });
        }

        const secretKey = request.headers.get("X-Secret-Key");
        if (url.pathname.startsWith('/api/') && request.method === 'POST') {
            if (!secretKey || secretKey !== env.SECRET_KEY) {
                return new Response("Unauthorized", { status: 401, headers: corsHeaders });
            }
        }

        // API: List all photos
        if (url.pathname === '/api/list' && request.method === 'GET') {
            const list = await env.PHOTO_BUCKET.list();
            const photos = list.objects.map(obj => ({
                key: obj.key,
                uploaded: obj.uploaded.toISOString(),
                size: obj.size,
            })).sort((a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime());

            return new Response(JSON.stringify(photos), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        
        // API: Get a presigned URL for upload
        if (url.pathname === '/api/upload' && request.method === 'POST') {
            try {
                const { filename, customPath } = await request.json<{ filename: string, customPath?: string }>();
                if (!filename) throw new Error('Filename is required');

                const finalPath = customPath ? customPath.trim().replace(/^\/|\/$/g, '') : 'uploads';
                const objectKey = `${finalPath}/${Date.now()}-${filename}`;

                const s3 = getS3Client(env);
                const command = new PutObjectCommand({ Bucket: bucketName, Key: objectKey });
                const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

                return new Response(JSON.stringify({ signedUrl, objectKey }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            } catch (error: any) {
                return new Response(error.message, { status: 400, headers: corsHeaders });
            }
        }

        return new Response('Not Found', { status: 404 });
    },
};

2. 部署步骤
完成了上述文件创建和代码复制后，请按照以下步骤进行部署。

第一步：GitHub 仓库
在项目根目录下打开终端，安装项目依赖：

npm install && cd frontend && npm install && cd ..


初始化 Git 仓库，并上传到 GitHub：

git init
git add .
git commit -m "Initial commit for the photo album project"
git branch -M main
git remote add origin https://github.com/your-username/your-repo-name.git
git push -u origin main


第二步：Cloudflare R2 配置
登录 Cloudflare 控制台，进入 R2 服务，创建一个新的存储桶并记住其名称。

在你的 R2 桶设置中，开启 公共访问（Public Access）。

在 CORS 策略中，添加你的 Pages 域名和 localhost 作为允许的来源。

第三步：Cloudflare Pages 部署
登录 Cloudflare 控制台，进入 Workers & Pages -> Pages。

连接你的 GitHub 仓库，选择你刚刚上传的仓库。

在配置页面，进行以下设置：

项目名称（Project name）：my-photo-album

框架预设（Framework preset）：Vite

构建命令（Build command）：npm install && npm run build

构建输出目录（Build output directory）：dist

根目录（Root directory）：frontend

在 Functions (函数) -> R2 存储桶绑定 中，绑定你的 R2 桶：

变量名称：PHOTO_BUCKET

R2 存储桶：选择你创建的 R2 桶。

在 环境变量（Environment Variables） 中，添加以下生产环境变量：

SECRET_KEY: 上传图片的密钥。

R2_ACCOUNT_ID: R2 账户 ID，可以在 Cloudflare 后台找到。

R2_ACCESS_KEY_ID: R2 访问密钥 ID。

R2_SECRET_ACCESS_KEY: R2 密钥。

点击 保存并部署。