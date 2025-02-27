const rateLimit = new Map();

export function checkRateLimit(ip, limit = 10, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean up old entries
  for (const [key, data] of rateLimit.entries()) {
    if (data.timestamp < windowStart) {
      rateLimit.delete(key);
    }
  }
  
  // Get existing data for IP
  const data = rateLimit.get(ip) || { count: 0, timestamp: now };
  
  // Reset if outside window
  if (data.timestamp < windowStart) {
    data.count = 0;
    data.timestamp = now;
  }
  
  // Increment count
  data.count++;
  rateLimit.set(ip, data);
  
  // Check if over limit
  return data.count <= limit;
}

export function getRemainingLimit(ip, limit = 10) {
  const data = rateLimit.get(ip);
  if (!data) return limit;
  return Math.max(0, limit - data.count);
} 