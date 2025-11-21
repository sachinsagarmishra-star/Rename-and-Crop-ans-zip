/**
 * Sanitizes a title string to be safe for filenames.
 * Replaces spaces with hyphens, removes special characters, and keeps alphanumeric.
 */
export const sanitizeTitle = (title: string): string => {
  if (!title) return "untitled";
  
  let sanitized = title.trim();
  
  // Replace & with 'and' for better readability
  sanitized = sanitized.replace(/\s*&\s*/g, '-and-');
  
  // Replace spaces and underscores with hyphens
  sanitized = sanitized.replace(/[\s_]+/g, '-');
  
  // Remove any characters that aren't alphanumeric or hyphens
  sanitized = sanitized.replace(/[^a-zA-Z0-9-]/g, '');
  
  // Remove multiple consecutive hyphens
  sanitized = sanitized.replace(/-+/g, '-');
  
  // Remove leading/trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, '');

  return sanitized || "image";
};

/**
 * Generates a sequential filename.
 * e.g., "My-Tour-01.jpg"
 */
export const generateNewFilename = (
  baseTitle: string, 
  index: number, 
  originalFilename: string
): string => {
  const extension = originalFilename.substring(originalFilename.lastIndexOf('.'));
  const sanitizedBase = sanitizeTitle(baseTitle);
  const sequenceNumber = (index + 1).toString().padStart(2, '0');
  
  return `${sanitizedBase}-${sequenceNumber}${extension}`;
};