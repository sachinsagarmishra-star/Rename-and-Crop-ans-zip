
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CropArea } from '../utils/cropUtils';

interface SimpleCropperProps {
  file: File;
  onSave: (crop: CropArea) => void;
  onCancel: () => void;
}

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'move' | null;

const SimpleCropper: React.FC<SimpleCropperProps> = ({ file, onSave, onCancel }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSrc, setImgSrc] = useState<string>("");
  
  // Crop state in display pixels
  const [crop, setCrop] = useState<{x: number, y: number, w: number, h: number} | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<HandlePosition>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startCrop, setStartCrop] = useState<{x: number, y: number, w: number, h: number} | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onImageLoad = () => {
    if (imgRef.current && containerRef.current) {
      // Initialize crop box to 80% of the image centered
      const { width, height } = imgRef.current;
      const w = width * 0.8;
      const h = height * 0.8;
      const x = (width - w) / 2;
      const y = (height - h) / 2;
      setCrop({ x, y, w, h });
    }
  };

  const getMousePos = (e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent, handle: HandlePosition) => {
    e.preventDefault();
    e.stopPropagation();
    if (!crop) return;

    setIsDragging(true);
    setDragHandle(handle);
    setStartPos(getMousePos(e));
    setStartCrop({ ...crop });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragHandle || !startCrop || !containerRef.current || !imgRef.current) return;

    const currentPos = getMousePos(e);
    const dx = currentPos.x - startPos.x;
    const dy = currentPos.y - startPos.y;
    const imgW = imgRef.current.width;
    const imgH = imgRef.current.height;

    let newCrop = { ...startCrop };

    // Helper to constrain value
    const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

    if (dragHandle === 'move') {
      newCrop.x = clamp(startCrop.x + dx, 0, imgW - startCrop.w);
      newCrop.y = clamp(startCrop.y + dy, 0, imgH - startCrop.h);
    } else {
      // Resize logic
      if (dragHandle.includes('w')) {
        const maxDelta = startCrop.w - 20; // min width 20
        const actualDx = Math.min(dx, maxDelta);
        newCrop.x = clamp(startCrop.x + actualDx, 0, startCrop.x + startCrop.w - 20);
        newCrop.w = startCrop.w - (newCrop.x - startCrop.x);
      }
      if (dragHandle.includes('e')) {
        newCrop.w = clamp(startCrop.w + dx, 20, imgW - startCrop.x);
      }
      if (dragHandle.includes('n')) {
        const maxDelta = startCrop.h - 20; // min height 20
        const actualDy = Math.min(dy, maxDelta);
        newCrop.y = clamp(startCrop.y + actualDy, 0, startCrop.y + startCrop.h - 20);
        newCrop.h = startCrop.h - (newCrop.y - startCrop.y);
      }
      if (dragHandle.includes('s')) {
        newCrop.h = clamp(startCrop.h + dy, 20, imgH - startCrop.y);
      }
    }

    setCrop(newCrop);
  }, [isDragging, dragHandle, startPos, startCrop]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragHandle(null);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSave = () => {
    if (!crop || !imgRef.current) return;

    const img = imgRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const finalCrop: CropArea = {
      x: Math.round(crop.x * scaleX),
      y: Math.round(crop.y * scaleY),
      width: Math.round(crop.w * scaleX),
      height: Math.round(crop.h * scaleY)
    };

    onSave(finalCrop);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <div>
             <h3 className="text-lg font-bold text-slate-800">Set Crop Area</h3>
             <p className="text-sm text-slate-500">Drag handles to resize. Move box to position.</p>
          </div>
          <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded text-xs font-mono">
             {crop && imgRef.current ? 
                `${Math.round(crop.w * (imgRef.current.naturalWidth/imgRef.current.width))} x ${Math.round(crop.h * (imgRef.current.naturalHeight/imgRef.current.height))} px` 
                : 'Loading...'}
          </div>
        </div>

        <div className="flex-grow overflow-auto bg-[#1a1a1a] flex items-center justify-center p-8 relative select-none pattern-grid">
          <div 
            ref={containerRef}
            className="relative inline-block shadow-2xl"
          >
            <img 
              ref={imgRef}
              src={imgSrc} 
              alt="Crop target" 
              className="max-w-full max-h-[60vh] object-contain block"
              onLoad={onImageLoad}
              draggable={false}
            />
            
            {/* Overlay Dimmer */}
            <div className="absolute inset-0 bg-black/50 pointer-events-none" />

            {/* Crop Box */}
            {crop && (
              <div 
                className="absolute cursor-move group"
                style={{
                  left: crop.x,
                  top: crop.y,
                  width: crop.w,
                  height: crop.h,
                  // Show the clear image inside the crop box
                  backgroundImage: `url(${imgSrc})`,
                  backgroundPosition: `-${crop.x}px -${crop.y}px`,
                  backgroundSize: `${imgRef.current?.width}px ${imgRef.current?.height}px`,
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5)'
                }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
              >
                {/* Grid Lines (Rule of Thirds) */}
                <div className="absolute inset-0 flex flex-col pointer-events-none opacity-40">
                    <div className="flex-1 border-b border-white/30"></div>
                    <div className="flex-1 border-b border-white/30"></div>
                    <div className="flex-1"></div>
                </div>
                <div className="absolute inset-0 flex pointer-events-none opacity-40">
                    <div className="flex-1 border-r border-white/30"></div>
                    <div className="flex-1 border-r border-white/30"></div>
                    <div className="flex-1"></div>
                </div>

                {/* Resize Handles */}
                {[
                  { p: 'nw', c: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize' },
                  { p: 'n', c: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-n-resize' },
                  { p: 'ne', c: 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize' },
                  { p: 'e', c: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-e-resize' },
                  { p: 'se', c: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize' },
                  { p: 's', c: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-s-resize' },
                  { p: 'sw', c: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize' },
                  { p: 'w', c: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-w-resize' },
                ].map(h => (
                    <div
                      key={h.p}
                      className={`absolute w-4 h-4 bg-white border border-slate-400 rounded-sm shadow-sm z-10 ${h.c}`}
                      onMouseDown={(e) => handleMouseDown(e, h.p as HandlePosition)}
                    />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button 
            onClick={onCancel}
            className="px-5 py-2 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            Apply Crop to All
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleCropper;
