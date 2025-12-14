
import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  currentImage: string | null;
  onImageChange: (base64: string | null) => void;
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImage, onImageChange, label = "Profile Photo" }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) { // 500KB limit for localstorage sanity
      setError("Image must be under 500KB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onImageChange(reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    onImageChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center space-x-4">
        <div className="relative w-24 h-24 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg overflow-hidden flex items-center justify-center group">
          {currentImage ? (
            <>
              <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={removeImage}
                className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </>
          ) : (
            <ImageIcon className="text-slate-400" size={32} />
          )}
        </div>
        
        <div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Upload size={16} /> Choose Image
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          <p className="text-xs text-slate-500 mt-1">Max size: 500KB</p>
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
