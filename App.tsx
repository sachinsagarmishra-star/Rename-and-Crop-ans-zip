
import React, { useState, useCallback } from 'react';
import { UploadIcon, DownloadIcon, RefreshIcon, CropIcon } from './components/Icons';
import ImageCard from './components/ImageCard';
import { createAndDownloadZip } from './services/zipService';
import SimpleCropper from './components/SimpleCropper';
import { CropArea } from './utils/cropUtils';

const App: React.FC = () => {
  const [title, setTitle] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  
  // Cropping State
  const [isCropperOpen, setIsCropperOpen] = useState<boolean>(false);
  const [activeCrop, setActiveCrop] = useState<CropArea | null>(null);

  // DnD State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(event.target.files!)]);
      event.target.value = "";
    }
  };

  // File Input Drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type.startsWith('image/'));
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Image Reordering Logic
  const handleCardDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Set a transparent drag image or default
  };

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleCardDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newFiles = [...files];
    const [removed] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(dropIndex, 0, removed);
    
    setFiles(newFiles);
    setDraggedIndex(null);
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
    if (files.length <= 1) {
        setActiveCrop(null);
    }
  };

  const clearAll = () => {
    if(window.confirm("Are you sure you want to clear all images?")) {
      setFiles([]);
      setTitle("");
      setActiveCrop(null);
    }
  };

  const handleDownload = async () => {
    if (files.length === 0) return;
    if (!title.trim()) {
      alert("Please enter a title for the tour/album first.");
      return;
    }
    await createAndDownloadZip(files, title, activeCrop, setIsZipping);
  };

  const openCropper = () => {
      if (files.length === 0) {
          alert("Upload images first.");
          return;
      }
      setIsCropperOpen(true);
  };

  const saveCrop = (crop: CropArea) => {
      setActiveCrop(crop);
      setIsCropperOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              R
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Rename & Zip</h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Batch rename, sequence & crop images.
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Configuration Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 transition-all">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* 1. Title Input */}
            <div className="space-y-4">
              <label htmlFor="tourTitle" className="block text-sm font-semibold text-slate-700">
                1. Enter Tour / Album Title
              </label>
              <div className="relative">
                <input
                  id="tourTitle"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 5-Day Nyerere & Mikumi National Park from Dar"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm text-lg"
                />
                {title && (
                  <div className="mt-2 text-xs text-slate-500">
                    Preview example: <span className="font-mono text-indigo-600 bg-indigo-50 px-1 rounded">{title.replace(/[^\w\s]/g, '').replace(/\s+/g, '-')}-01.jpg</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. File Upload Area */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                2. Upload Images
              </label>
              <div 
                className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer
                  ${isDragging 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                  }
                `}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <input 
                  type="file" 
                  id="fileInput" 
                  multiple 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
                <UploadIcon />
                <p className="mt-2 text-sm font-medium text-slate-700">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  JPG, PNG, GIF supported
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Batch Actions Bar */}
        {files.length > 0 && (
          <section className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  Preview <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">{files.length} files</span>
                </h2>
                <p className="text-xs text-slate-500">Drag images to reorder sequence</p>
             </div>
             
             <div className="flex gap-3">
                 {/* Crop Button */}
                 <button 
                    onClick={openCropper}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all text-sm font-medium
                        ${activeCrop 
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }
                    `}
                 >
                     <CropIcon />
                     {activeCrop ? 'Edit Crop' : 'Batch Crop'}
                 </button>

                 <button 
                    onClick={clearAll}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium"
                  >
                    <RefreshIcon /> Reset
                  </button>
             </div>
          </section>
        )}

        {/* Preview Grid */}
        {files.length > 0 && (
          <section className="animate-fade-in">
             {activeCrop && (
                 <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>All images will be cropped to <strong>{activeCrop.width}x{activeCrop.height}px</strong> starting at {activeCrop.x},{activeCrop.y}.</span>
                    <button onClick={() => setActiveCrop(null)} className="ml-auto text-xs font-bold hover:text-blue-600 underline">Remove Crop</button>
                 </div>
             )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map((file, index) => (
                <div 
                  key={`${file.name}-${index}`} 
                  className={`relative transition-transform ${draggedIndex === index ? 'opacity-40 scale-95' : ''}`}
                  draggable
                  onDragStart={(e) => handleCardDragStart(e, index)}
                  onDragOver={(e) => handleCardDragOver(e, index)}
                  onDrop={(e) => handleCardDrop(e, index)}
                >
                    <div className="cursor-move">
                      <ImageCard 
                        file={file}
                        index={index}
                        baseTitle={title}
                        onRemove={removeFile}
                      />
                    </div>
                    {activeCrop && (
                        <div className="absolute top-2 right-2 z-10 pointer-events-none">
                            <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                Cropped
                            </div>
                        </div>
                    )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State Guide */}
        {files.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <div className="inline-block p-4 rounded-full bg-slate-100 mb-4">
              <UploadIcon />
            </div>
            <h3 className="text-lg font-medium text-slate-600">No images added yet</h3>
            <p className="max-w-md mx-auto mt-2">Start by typing a title for your album and selecting your photos. <br/> Drag images to reorder them.</p>
          </div>
        )}

      </main>

      {/* Sticky Footer Action */}
      <div className="sticky bottom-0 border-t border-slate-200 bg-white/90 backdrop-blur-lg p-4 sm:px-8 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-sm text-slate-600 hidden sm:block">
            {files.length > 0 
              ? `Ready to rename ${activeCrop ? '& crop ' : ''}${files.length} images.` 
              : "Waiting for images..."}
          </div>
          <button
            onClick={handleDownload}
            disabled={files.length === 0 || !title || isZipping}
            className={`w-full sm:w-auto flex items-center justify-center px-6 py-3 rounded-xl font-bold shadow-lg transition-all transform active:scale-95
              ${files.length > 0 && title 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }
            `}
          >
            {isZipping ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              <>
                <DownloadIcon />
                Download ZIP
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cropper Modal */}
      {isCropperOpen && files.length > 0 && (
        <SimpleCropper 
            file={files[0]} 
            onSave={saveCrop} 
            onCancel={() => setIsCropperOpen(false)} 
        />
      )}

    </div>
  );
};

export default App;
