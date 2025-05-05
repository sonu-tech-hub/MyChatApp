const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const IMAGE_QUALITY = 0.7;

// Compresses and resizes an image before uploading
export const optimizeImage = (file, quality = IMAGE_QUALITY) => {
    return new Promise((resolve, reject) => {
        // Skip optimization for non-image files
        if (!file.type.startsWith('image/')) {
            reject(new Error('File is not an image.'));
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Resize image while maintaining aspect ratio
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = Math.round(height * (MAX_WIDTH / width));
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = Math.round(width * (MAX_HEIGHT / height));
                        height = MAX_HEIGHT;
                    }
                }

                // Create canvas to draw the resized image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert canvas to blob with given quality
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image.'));
                            return;
                        }

                        // Create a new file from the blob
                        const optimizedFile = new File(
                            [blob],
                            file.name,
                            {
                                type: file.type,
                                lastModified: Date.now()
                            }
                        );
                        resolve(optimizedFile);
                    },
                    file.type,
                    quality
                );
            };

            img.onerror = () => {
                reject(new Error('Failed to load image.'));
            };
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file.'));
        };
    });
};

const imageOptimizationService = {
    optimizeImage
};

export default imageOptimizationService;
