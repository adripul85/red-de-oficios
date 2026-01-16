/**
 * DeOficios Pro - Performance Utilities
 * Lazy loading, caching, and optimization helpers
 */

/**
 * Lazy load a Firebase module only when needed
 * @param {string} moduleName - The Firebase module to load
 * @returns {Promise<any>} The loaded module
 */
export async function lazyLoadFirebaseModule(moduleName) {
    switch (moduleName) {
        case 'firestore':
            return import('firebase/firestore');
        case 'storage':
            return import('firebase/storage');
        case 'auth':
            return import('firebase/auth');
        case 'messaging':
            return import('firebase/messaging');
        default:
            throw new Error(`Unknown Firebase module: ${moduleName}`);
    }
}

/**
 * Debounce function to limit rapid fire events
 * @param {Function} func - The function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeoutId = null;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Throttle function to limit execution rate
 * @param {Function} func - The function to throttle
 * @param {number} limit - Minimum time between executions
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 300) {
    let inThrottle = false;
    return (...args) => {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Lazy load images when they enter the viewport
 * Uses Intersection Observer for efficiency
 */
export function setupLazyImages() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src) {
                        img.src = src;
                        img.removeAttribute('data-src');
                        img.classList.remove('lazy');
                    }
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px', // Load slightly before entering viewport
            threshold: 0.01
        });

        document.querySelectorAll('img.lazy, img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });

        return imageObserver;
    } else {
        // Fallback for older browsers
        document.querySelectorAll('img.lazy, img[data-src]').forEach(img => {
            const src = img.dataset.src;
            if (src) {
                img.src = src;
                img.removeAttribute('data-src');
            }
        });
        return null;
    }
}

/**
 * Cache data in memory with TTL
 */
class MemoryCache {
    constructor() {
        this.cache = new Map();
    }

    set(key, value, ttlSeconds = 300) {
        const expiry = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expiry });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }

    has(key) {
        return this.get(key) !== null;
    }

    clear() {
        this.cache.clear();
    }
}

export const memoryCache = new MemoryCache();

/**
 * Defer non-critical work until browser is idle
 * @param {Function} callback - Work to defer
 * @param {Object} options - requestIdleCallback options
 */
export function deferToIdle(callback, options = { timeout: 2000 }) {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, options);
    } else {
        setTimeout(callback, 100);
    }
}

/**
 * Prefetch a URL for faster future navigation
 * @param {string} url - URL to prefetch
 */
export function prefetchUrl(url) {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            link.as = 'document';
            document.head.appendChild(link);
        });
    }
}

/**
 * Preload critical resources
 * @param {Array} resources - Array of {url, type} objects
 */
export function preloadResources(resources) {
    resources.forEach(({ url, type }) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = type;
        if (type === 'font') {
            link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);
    });
}

/**
 * Check if user prefers reduced motion
 * @returns {boolean}
 */
export function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Optimize scroll event handling
 * Uses passive listeners and RAF
 */
export function optimizedScrollHandler(callback) {
    let ticking = false;

    const handler = () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                callback();
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
}

/**
 * Batch DOM reads and writes to avoid layout thrashing
 */
export const domBatcher = {
    reads: [],
    writes: [],
    scheduled: false,

    read(fn) {
        this.reads.push(fn);
        this.schedule();
    },

    write(fn) {
        this.writes.push(fn);
        this.schedule();
    },

    schedule() {
        if (!this.scheduled) {
            this.scheduled = true;
            requestAnimationFrame(() => this.flush());
        }
    },

    flush() {
        // Execute all reads first
        this.reads.forEach(fn => fn());
        this.reads = [];

        // Then all writes
        this.writes.forEach(fn => fn());
        this.writes = [];

        this.scheduled = false;
    }
};
