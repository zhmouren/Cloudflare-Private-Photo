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
