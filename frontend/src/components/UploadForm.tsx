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
