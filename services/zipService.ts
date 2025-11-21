
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { generateNewFilename } from '../utils/stringUtils';
import { processCroppedImage, CropArea } from '../utils/cropUtils';

export const createAndDownloadZip = async (
  files: File[], 
  title: string,
  crop: CropArea | null,
  setLoading: (loading: boolean) => void
): Promise<void> => {
  try {
    setLoading(true);
    const zip = new JSZip();
    
    // Use Promise.all to handle async cropping in parallel (or sequence if preferred, but parallel is faster)
    await Promise.all(files.map(async (file, index) => {
      const newName = generateNewFilename(title, index, file.name);
      
      if (crop) {
        try {
          const croppedBlob = await processCroppedImage(file, crop);
          zip.file(newName, croppedBlob);
        } catch (e) {
          console.error(`Failed to crop image ${file.name}`, e);
          // Fallback to original file if crop fails
          zip.file(newName, file);
        }
      } else {
        zip.file(newName, file);
      }
    }));

    // Generate the zip file
    const content = await zip.generateAsync({ type: 'blob' });
    
    // Create filename for the zip itself
    const zipName = `${sanitizeZipName(title) || 'images'}.zip`;
    
    // Trigger download
    // Handle scenario where FileSaver is the function itself or an object containing saveAs
    const saveAs = (FileSaver as any).saveAs || FileSaver;
    saveAs(content, zipName);
  } catch (error) {
    console.error("Failed to zip files", error);
    alert("An error occurred while creating the zip file.");
  } finally {
    setLoading(false);
  }
};

const sanitizeZipName = (str: string) => {
  return str.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};
