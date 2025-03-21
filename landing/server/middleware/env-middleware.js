// landing/server/middleware/env-middleware.js
// Middleware to inject environment variables into HTML

/**
 * Create a middleware that injects environment variables into HTML responses
 * This adds meta tags with the environment variables
 * @param {Object} options - Configuration options
 * @param {Object} options.env - Environment variables to inject
 * @returns {Function} Express middleware
 */
export function createEnvMiddleware(options = {}) {
    const { env = {} } = options;
    
    // Create a snippet with meta tags to inject
    const metaTags = Object.entries(env)
      .filter(([key]) => key.startsWith('TWITCH_') || key.startsWith('PUBLIC_'))
      .map(([key, value]) => {
        // Skip if the value is undefined or null
        if (value === undefined || value === null) {
          return '';
        }
        
        // Create a meta tag with the environment variable
        return `<meta name="env-${key}" content="${value}">`;
      })
      .filter(Boolean)
      .join('\n');
    
    // Return middleware function
    return function(req, res, next) {
      // Store original send function
      const originalSend = res.send;
      
      // Override send method to inject meta tags
      res.send = function(body) {
        // Only process HTML responses
        if (typeof body === 'string' && body.includes('<head>') && res.get('Content-Type')?.includes('text/html')) {
          // Insert meta tags after the head tag
          body = body.replace('<head>', `<head>\n${metaTags}`);
        }
        
        // Call original send method
        return originalSend.call(this, body);
      };
      
      next();
    };
  }
  
  export default createEnvMiddleware;
