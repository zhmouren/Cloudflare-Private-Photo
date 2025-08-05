import React, { useState, useEffect, useCallback } from 'react';
import { Cloud, Upload, Download, Eye, X, Check, Loader2, Key, List, Grid2X2, Grid3X3, ArrowRightToLine } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// API 配置，根据你的 Cloudflare Worker URL 进行修改
// 请将这里的 'https://your-worker-url.workers.dev' 替换为你的 Worker URL
const WORKER_URL = 'https://your-worker-url.workers.dev';

// 自定义样式，这里使用了 Tailwind CSS
const App = () => {
  // UI状态
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [message, setMessage] = useState(null);

  // 应用数据
  const [password, setPassword] = useState('');
  const [photos, setPhotos] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [viewSize, setViewSize] = useState('medium'); // 'small', 'medium', 'large'

  // 动画变体
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const galleryVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  // 处理错误和消息
  const handleMessage = useCallback((text, type = 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  // 验证密码并获取照片列表
  const fetchPhotos = useCallback(async () => {
    if (!password) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`${WORKER_URL}/api/list-photos`, {
        method: 'GET',
        headers: { 'X-Secret-Key': password }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
        setIsAuthenticated(true);
        handleMessage('相册加载成功！', 'success');
      } else {
        setIsAuthenticated(false);
        setPhotos([]);
        handleMessage('密码错误或无法加载照片。', 'error');
      }
    } catch (error) {
      console.error('Fetch photos failed:', error);
      setIsAuthenticated(false);
      setPhotos([]);
      handleMessage('网络错误，请检查 Worker URL。', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [password, handleMessage]);

  // 下载照片
  const handleDownload = (photoKey) => {
    // 构建下载 URL，直接指向 Worker 的下载接口
    const downloadUrl = `${WORKER_URL}/api/download?key=${encodeURIComponent(photoKey)}`;
    
    // 创建一个临时的 a 标签来触发下载
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', photoKey.split('/').pop());
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 上传文件
  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      handleMessage('请选择至少一个文件。', 'error');
      return;
    }
    
    setIsUploading(true);
    const formData = new FormData();
    // 假设上传到根目录，如果需要定义路径，需要修改此处的逻辑
    selectedFiles.forEach(file => formData.append('files', file, file.name));
    
    try {
      const response = await fetch(`${WORKER_URL}/api/upload`, {
        method: 'POST',
        headers: { 'X-Secret-Key': password },
        body: formData
      });
      
      if (response.ok) {
        handleMessage('文件上传成功！', 'success');
        // 重新获取照片列表以更新 UI
        await fetchPhotos();
        setShowUploadModal(false);
        setSelectedFiles([]);
      } else {
        handleMessage('上传失败，请检查密码或权限。', 'error');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      handleMessage('网络错误，上传失败。', 'error');
    } finally {
      setIsUploading(false);
    }
  };
  
  // 页面加载时尝试获取照片
  useEffect(() => {
    const savedPassword = localStorage.getItem('photo-password');
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);
  
  // 密码更新时，尝试重新获取照片
  useEffect(() => {
    if (password) {
      fetchPhotos();
    }
  }, [password, fetchPhotos]);
  
  // 渲染相册照片卡片
  const renderPhotoCard = (photo, index) => {
    const sizeMap = {
      small: 'w-32 h-32',
      medium: 'w-48 h-48',
      large: 'w-64 h-64'
    };
    const imageUrl = `${WORKER_URL}/api/image?key=${encodeURIComponent(photo.key)}`;
    
    return (
      <motion.div
        key={photo.key}
        className={`relative flex flex-col items-center justify-center p-2 bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg transition-all duration-300 ${sizeMap[viewSize]}`}
        variants={itemVariants}
      >
        <div className="group relative w-full h-full overflow-hidden rounded-md cursor-pointer">
          <img
            src={imageUrl}
            alt={photo.key.split('/').pop()}
            className="w-full h-full object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => handleDownload(photo.key)}
              className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-200"
              aria-label="下载照片"
            >
              <Download size={20} />
            </button>
            <button
              onClick={() => window.open(imageUrl, '_blank')}
              className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-200"
              aria-label="查看照片"
            >
              <Eye size={20} />
            </button>
          </div>
        </div>
        <div className="w-full text-center mt-2 truncate text-sm text-gray-300">
          {photo.key.split('/').pop()}
        </div>
      </motion.div>
    );
  };

  // 渲染登录界面
  const renderLogin = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 p-8 rounded-2xl shadow-xl max-w-sm w-full border border-gray-700"
      >
        <h1 className="text-3xl font-bold text-center mb-4">私人照片库</h1>
        <p className="text-center text-gray-400 mb-6">请输入密码以访问</p>
        <form onSubmit={(e) => {
          e.preventDefault();
          localStorage.setItem('photo-password', password);
          fetchPhotos();
        }}>
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key size={20} className="text-gray-500" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="输入密码"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold transition-colors duration-200"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : '登录'}
          </button>
        </form>
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`mt-4 p-3 rounded-lg text-center font-medium ${message.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );

  // 渲染上传弹窗
  const renderUploadModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-700"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Cloud className="mr-2" /> 上传照片
          </h2>
          <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-white transition-colors duration-200" aria-label="关闭">
            <X size={24} />
          </button>
        </div>
        <div className="border border-dashed border-gray-600 rounded-lg p-6 text-center text-gray-400 mb-6 transition-colors duration-200 hover:border-gray-400">
          <input
            type="file"
            multiple
            onChange={(e) => setSelectedFiles([...e.target.files])}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center">
              <Upload className="mb-2" size={48} />
              <p className="font-semibold">点击这里选择文件</p>
              <p className="text-sm mt-1">或将文件拖放到这里</p>
            </div>
          </label>
        </div>
        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <p className="text-gray-400 font-medium mb-2">已选择文件 ({selectedFiles.length} 个):</p>
            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {selectedFiles.map((file, index) => (
                <li key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded-lg">
                  <span className="truncate text-sm text-gray-300">{file.name}</span>
                  <button onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-300">
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          onClick={handleUpload}
          disabled={isUploading || selectedFiles.length === 0}
          className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors duration-200 flex items-center justify-center disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <><Loader2 className="animate-spin h-5 w-5 mr-2" /> 正在上传...</>
          ) : (
            <><ArrowRightToLine className="mr-2" /> 立即上传</>
          )}
        </button>
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`mt-4 p-3 rounded-lg text-center font-medium ${message.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );

  // 如果未认证，显示登录界面
  if (!isAuthenticated) {
    return renderLogin();
  }

  // 渲染主相册界面
  return (
    <div className="bg-gray-900 min-h-screen text-white p-4 sm:p-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold mb-4 sm:mb-0 flex items-center">
          <Cloud className="mr-3 text-indigo-400" />
          私人照片库
        </h1>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center bg-gray-800 rounded-full p-1 shadow-lg">
            <button
              onClick={() => setViewSize('small')}
              className={`p-2 rounded-full transition-colors duration-200 ${viewSize === 'small' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
              aria-label="小图模式"
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewSize('medium')}
              className={`p-2 rounded-full transition-colors duration-200 ${viewSize === 'medium' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
              aria-label="中图模式"
            >
              <Grid2X2 size={18} />
            </button>
            <button
              onClick={() => setViewSize('large')}
              className={`p-2 rounded-full transition-colors duration-200 ${viewSize === 'large' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
              aria-label="大图模式"
            >
              <List size={18} />
            </button>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-full text-white font-semibold transition-colors duration-200 shadow-lg"
          >
            <Upload size={20} className="mr-2" /> 上传
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg z-50 text-center font-medium ${message.type === 'error' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[50vh] text-gray-400">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-500" />
            <span className="ml-4 text-xl">正在加载照片...</span>
          </div>
        ) : photos.length > 0 ? (
          <motion.div
            className={`grid gap-4 mt-8 transition-all duration-300
              ${viewSize === 'small' ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6' : ''}
              ${viewSize === 'medium' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : ''}
              ${viewSize === 'large' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : ''}
            `}
            variants={galleryVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {photos.map((photo, index) => renderPhotoCard(photo, index))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
            <Cloud className="h-24 w-24 mb-4 text-gray-600" />
            <h2 className="text-3xl font-bold mb-2">相册空空如也</h2>
            <p className="text-lg">没有找到任何照片。点击“上传”按钮添加一些吧！</p>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && renderUploadModal()}
      </AnimatePresence>
    </div>
  );
};

export default App;
