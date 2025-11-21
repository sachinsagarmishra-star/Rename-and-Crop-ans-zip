import React, { useMemo } from 'react';
import { generateNewFilename } from '../utils/stringUtils';
import { ImageIcon, TrashIcon } from './Icons';

interface ImageCardProps {
  file: File;
  index: number;
  baseTitle: string;
  onRemove: (index: number) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ file, index, baseTitle, onRemove }) => {
  // Create a preview URL. Remember to revoke this in a real app if list changes frequently,
  // but for this scope, relying on garbage collection or browser handling is acceptable for simplicity.
  // A better approach is useEffect to create and cleanup.
  
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const newName = generateNewFilename(baseTitle, index, file.name);

  React.useEffect(() => {
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-3 transition-all hover:shadow-md">
      <div className="relative aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden group">
        {file.type.startsWith('image/') ? (
          <img 
            src={previewUrl} 
            alt="preview" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           <button 
            onClick={() => onRemove(index)}
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transform hover:scale-110 transition-transform"
            title="Remove image"
           >
             <TrashIcon />
           </button>
        </div>
        
        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-md">
          #{ (index + 1).toString().padStart(2, '0') }
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between items-center text-slate-500">
           <span className="text-xs font-medium uppercase tracking-wider">Original</span>
        </div>
        <div className="truncate text-slate-600 font-mono text-xs bg-slate-50 p-1 rounded border border-slate-100" title={file.name}>
          {file.name}
        </div>

        <div className="flex justify-between items-center text-indigo-600 mt-1">
           <span className="text-xs font-medium uppercase tracking-wider">Renamed</span>
        </div>
        <div className="truncate font-medium text-slate-800 font-mono text-xs bg-indigo-50 p-1 rounded border border-indigo-100 border-l-2 border-l-indigo-500" title={newName}>
          {newName}
        </div>
      </div>
    </div>
  );
};

export default ImageCard;