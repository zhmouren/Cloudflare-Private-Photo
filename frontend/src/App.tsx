import React, { useState, useEffect } from 'react';

// 确保 App.css 文件被正确导入
import './App.css';

// 定义照片数据类型
interface Photo {
  key: string;
  uploaded: string;
  size: number;
}

// 模拟 API 调用（实际项目中应替换为你的 Worker API）
const fetchPhotos = async (): Promise<Photo[]> => {
  // 这里的 fetch 请求应该指向你的 Cloudflare Worker API
  // return fetch('/api/list').then(res => res.json());
  
  // 模拟数据
  return [
    { key: 'photo1.jpg', uploaded: new Date().toISOString(), size: 100000 },
    { key: 'photo2.jpg', uploaded: new Date().toISOString(), size: 120000 },
    { key: 'photo3.jpg', uploaded: new Date().toISOString(), size: 90000 },
    { key: 'photo4.jpg', uploaded: new Date().toISOString(), size: 150000 },
    { key: 'photo5.jpg', uploaded: new Date().toISOString(), size: 85000 },
  ];
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'standard' | 'compact'>('standard');

  useEffect(() => {
    if (isLoggedIn) {
      setLoading(true);
      fetchPhotos()
        .then(data => {
          setPhotos(data);
          setLoading(false);
        })
        .catch(err => {
          setError('Failed to fetch photos.');
          setLoading(false);
        });
    }
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password === 'mysecretpassword') { // 请在实际项目中替换为你的密钥逻辑
      setIsLoggedIn(true);
    } else {
      setError('密码错误');
    }
  };

  const PhotoGallery = () => (
    <div className="p-4 md:p-8 bg-gray-900 min-h-screen text-gray-100 font-inter">
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">私人照片库</h1>
        <p className="text-gray-400">欢迎，管理员。</p>
      </header>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">所有照片</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('standard')}
            className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'standard' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-indigo-700'}`}
          >
            标准视图
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`px-4 py-2 rounded-md transition-colors ${viewMode === 'compact' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-indigo-700'}`}
          >
            紧凑视图
          </button>
        </div>
      </div>

      {loading && <p className="text-center text-gray-400">加载中...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && (
        <div className={`grid gap-4 ${viewMode === 'standard' ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'}`}>
          {photos.map(photo => (
            <div key={photo.key} className="relative aspect-square overflow-hidden rounded-lg shadow-lg cursor-pointer transform transition-transform hover:scale-105 hover:shadow-xl group">
              <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400 p-2 text-xs font-mono break-all">
                {photo.key}
              </div>
              {/* 这里应该显示图片，但在没有真实图片URL的情况下，我们只显示一个占位符 */}
              {/* <img src={`/api/photo/${photo.key}`} alt={photo.key} className="object-cover w-full h-full" /> */}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const LoginScreen = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 font-inter">
      <div className="p-8 max-w-sm w-full bg-gray-800 rounded-lg shadow-xl text-gray-200">
        <h1 className="text-3xl font-bold mb-2 text-center text-white">私人照片库</h1>
        <p className="text-center text-gray-400 mb-6">请输入密码以访问</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <svg
              className="w-6 h-6 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type="password"
              placeholder="输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-gray-600 transition-colors"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {isLoggedIn ? <PhotoGallery /> : <LoginScreen />}
    </>
  );
};

export default App;
