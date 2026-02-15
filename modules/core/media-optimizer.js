// modules/core/media-optimizer.js
// Client-side media optimization using Canvas API
// Images: resize + WebP conversion (70-90% size reduction)
// Videos: size validation only (browser transcoding is impractical)

// ============================================================================
// CONFIG
// ============================================================================

const IMAGE_DEFAULTS = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    skipThreshold: 200 * 1024, // Skip if already < 200KB
    outputType: 'image/webp'
};

const VIDEO_MAX_SIZE_MB = 50;

// ============================================================================
// IMAGE OPTIMIZATION
// ============================================================================

/**
 * Optimize an image file using Canvas API.
 * Resizes to maxWidth, converts to WebP at specified quality.
 * Skips GIFs (animated) and small files (<200KB).
 *
 * @param {File} file - Browser File object (image)
 * @param {object} [opts] - Options
 * @param {number} [opts.maxWidth=1920] - Maximum width in pixels
 * @param {number} [opts.maxHeight=1920] - Maximum height in pixels
 * @param {number} [opts.quality=0.8] - WebP quality (0-1)
 * @returns {Promise<File>} Optimized file (WebP) or original if skipped
 */
export async function optimizeImage(file, opts = {}) {
    if (!file || !file.type?.startsWith('image/')) {
        return file; // Not an image, return as-is
    }

    // Skip GIFs (Canvas destroys animation)
    if (file.type === 'image/gif') {
        console.log(`[Optimizer] Skip GIF (preserving animation): ${_formatSize(file.size)}`);
        return file;
    }

    // Skip small files
    const skipThreshold = opts.skipThreshold ?? IMAGE_DEFAULTS.skipThreshold;
    if (file.size < skipThreshold) {
        console.log(`[Optimizer] Skip small file: ${_formatSize(file.size)} < ${_formatSize(skipThreshold)}`);
        return file;
    }

    const maxWidth = opts.maxWidth ?? IMAGE_DEFAULTS.maxWidth;
    const maxHeight = opts.maxHeight ?? IMAGE_DEFAULTS.maxHeight;
    const quality = opts.quality ?? IMAGE_DEFAULTS.quality;
    const outputType = IMAGE_DEFAULTS.outputType;

    try {
        // Load image
        const img = await _loadImage(file);
        const origW = img.naturalWidth;
        const origH = img.naturalHeight;

        // Calculate new dimensions (maintain aspect ratio)
        let newW = origW;
        let newH = origH;

        if (newW > maxWidth) {
            newH = Math.round(newH * (maxWidth / newW));
            newW = maxWidth;
        }
        if (newH > maxHeight) {
            newW = Math.round(newW * (maxHeight / newH));
            newH = maxHeight;
        }

        // Draw to canvas
        const canvas = document.createElement('canvas');
        canvas.width = newW;
        canvas.height = newH;
        const ctx = canvas.getContext('2d');

        // Use high-quality downscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, newW, newH);

        // Export as WebP
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(
                (b) => b ? resolve(b) : reject(new Error('Canvas export failed')),
                outputType,
                quality
            );
        });

        // If WebP is somehow larger than original, keep original
        if (blob.size >= file.size) {
            console.log(`[Optimizer] WebP larger than original, keeping original: ${_formatSize(file.size)}`);
            return file;
        }

        // Create new File with .webp extension
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
        const optimized = new File([blob], `${baseName}.webp`, { type: outputType });

        const reduction = ((1 - optimized.size / file.size) * 100).toFixed(0);
        console.log(
            `[Optimizer] ${_formatSize(file.size)} ${file.type} → ${_formatSize(optimized.size)} WebP ` +
            `(${origW}x${origH} → ${newW}x${newH}, -${reduction}%)`
        );

        return optimized;
    } catch (e) {
        console.warn('[Optimizer] Image optimization failed, using original:', e.message);
        return file; // Return original on any error
    }
}

// ============================================================================
// VIDEO VALIDATION
// ============================================================================

/**
 * Validate video file size. Browser-based video transcoding is impractical
 * (runs at real-time speed), so we just enforce size limits.
 *
 * @param {File} file - Browser File object (video)
 * @param {object} [opts] - Options
 * @param {number} [opts.maxSizeMB=50] - Maximum size in MB
 * @returns {Promise<File>} Same file (or throws if too large)
 */
export async function validateVideo(file, opts = {}) {
    if (!file || !file.type?.startsWith('video/')) {
        return file;
    }

    const maxMB = opts.maxSizeMB ?? VIDEO_MAX_SIZE_MB;
    const sizeMB = file.size / (1024 * 1024);

    if (sizeMB > maxMB) {
        throw new Error(
            `Video too large: ${sizeMB.toFixed(1)}MB (max ${maxMB}MB). ` +
            `Try recording at lower resolution or shorter duration.`
        );
    }

    console.log(`[Optimizer] Video OK: ${sizeMB.toFixed(1)}MB ${file.type}`);
    return file;
}

/**
 * Optimize any media file (image or video).
 * Routes to the correct optimizer based on MIME type.
 *
 * @param {File} file - Browser File object
 * @param {object} [opts] - Options passed to the specific optimizer
 * @returns {Promise<File>} Optimized file
 */
export async function optimizeMedia(file, opts = {}) {
    if (!file) return file;

    if (file.type?.startsWith('image/')) {
        return optimizeImage(file, opts);
    }
    if (file.type?.startsWith('video/')) {
        return validateVideo(file, opts);
    }
    return file; // Unknown type, return as-is
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function _loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error('Failed to load image'));
        };
        img.src = URL.createObjectURL(file);
    });
}

function _formatSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
