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