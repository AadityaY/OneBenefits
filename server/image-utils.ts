import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Resize settings
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 600;
const QUALITY = 80;
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Resize and optimize an image from a base64 string
 * @param base64Image Base64 encoded image string (with or without data URL prefix)
 * @param options Options for resizing
 * @returns Optimized base64 string of the resized image
 */
export async function resizeImageFromBase64(
  base64Image: string, 
  options: { 
    maxWidth?: number, 
    maxHeight?: number, 
    quality?: number 
  } = {}
): Promise<string> {
  try {
    // Extract the base64 data part (remove the data URL prefix if present)
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Get image dimensions
    const metadata = await sharp(buffer).metadata();
    
    // Set default options
    const maxWidth = options.maxWidth || MAX_WIDTH;
    const maxHeight = options.maxHeight || MAX_HEIGHT;
    const quality = options.quality || QUALITY;
    
    // Calculate new dimensions while preserving aspect ratio
    let width = metadata.width;
    let height = metadata.height;
    
    if (width && height) {
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
    }
    
    // Resize and optimize the image
    const resizedBuffer = await sharp(buffer)
      .resize({
        width, 
        height,
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toBuffer();
    
    // Convert back to base64 with the correct data URL prefix
    return `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Image resize error:', error);
    return base64Image; // Return original if there's an error
  }
}

/**
 * Save an image from a base64 string to the file system
 * @param base64Image Base64 encoded image string
 * @param options Options for resizing
 * @returns The file path of the saved image
 */
export async function saveImageFromBase64(
  base64Image: string,
  options: {
    maxWidth?: number,
    maxHeight?: number,
    quality?: number,
    filename?: string
  } = {}
): Promise<string> {
  try {
    // Resize the image first
    const resizedBase64 = await resizeImageFromBase64(base64Image, options);
    const base64Data = resizedBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate a unique filename or use the provided one
    const filename = options.filename || `${uuidv4()}.jpg`;
    const filePath = path.join(UPLOADS_DIR, filename);
    
    // Save the file
    fs.writeFileSync(filePath, buffer);
    
    return filename;
  } catch (error) {
    console.error('Error saving image:', error);
    throw error;
  }
}

/**
 * Get the file size of a base64 image in kilobytes
 * @param base64Image Base64 encoded image string
 * @returns Size in KB
 */
export function getBase64ImageSize(base64Image: string): number {
  // Remove the data URL prefix if present
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  // Calculate size: base64 string length * 3/4 (base64 encoding uses 4 chars to represent 3 bytes)
  const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);
  // Convert to KB
  return Math.round(sizeInBytes / 1024);
}

/**
 * Check if the image is too large
 * @param base64Image Base64 encoded image string
 * @param maxSizeKB Maximum allowed size in KB
 * @returns Boolean indicating if the image is too large
 */
export function isImageTooLarge(base64Image: string, maxSizeKB = 5120): boolean {
  const sizeInKB = getBase64ImageSize(base64Image);
  return sizeInKB > maxSizeKB;
}