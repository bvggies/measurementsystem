/**
 * Cache utility functions for forcing cache refresh
 */

/**
 * Clear all caches and reload the page
 */
export const clearCacheAndReload = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName.startsWith('fittrack-')) {
          return caches.delete(cacheName);
        }
        return Promise.resolve();
      })
    );
  }
  
  // Unregister service worker
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      registrations.map((registration) => registration.unregister())
    );
  }
  
  // Reload the page
  window.location.reload();
};

/**
 * Check for service worker updates and prompt user to reload
 */
export const checkForUpdates = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              return true;
            }
          });
        }
      });
    }
  }
  return false;
};

/**
 * Force refresh by adding cache-busting query parameter
 */
export const forceRefresh = (url: string) => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_t=${Date.now()}`;
};

