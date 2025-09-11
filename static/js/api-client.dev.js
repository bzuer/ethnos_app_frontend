/**
 * ethnos_app API Client - Development Version
 * Handles all communication with the ethnos_app API backend
 */
class ethnos_appAPI {
    constructor() {
        this.baseURL = '/api/v2';
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        this.requestTimeout = 15000; // 15 seconds
    }

    /**
     * Generate cache key from endpoint and params
     */
    _getCacheKey(endpoint, params) {
        return endpoint + '_' + JSON.stringify(params || {});
    }

    /**
     * Check if cache entry is still valid
     */
    _isValidCacheEntry(entry) {
        return entry && (Date.now() - entry.timestamp) < this.cacheTimeout;
    }

    /**
     * Main fetch method with caching, retries, and error handling
     */
    async _fetch(endpoint, options = {}, retryCount = 2) {
        const cacheKey = this._getCacheKey(endpoint, options);
        const cachedEntry = this.cache.get(cacheKey);

        // Return cached data if valid
        if (this._isValidCacheEntry(cachedEntry)) {
            return cachedEntry.data;
        }

        let lastError;
        const maxAttempts = retryCount + 1;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                // Setup abort controller for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

                const fetchOptions = {
                    ...options,
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                };

                // Make the request
                const response = await fetch(`${this.baseURL}${endpoint}`, fetchOptions);
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`API Error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                // Check for API-level errors
                if (data.status === 'error') {
                    throw new Error(data.error || 'API returned error status');
                }

                // Cache successful response
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });

                // Clean cache if it gets too large
                if (this.cache.size > 100) {
                    this._cleanCache();
                }

                return data;

            } catch (error) {
                lastError = error;

                if (error.name === 'AbortError') {
                    console.warn(`Request timeout (attempt ${attempt}/${maxAttempts}):`, endpoint);
                } else {
                    console.warn(`API fetch error (attempt ${attempt}/${maxAttempts}):`, error.message);
                }

                // If this isn't the last attempt, wait and retry
                if (attempt < maxAttempts) {
                    const delay = 1000 * attempt; // Exponential backoff
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    // All attempts failed
                    if (error.name === 'AbortError') {
                        throw new Error('Timeout ao carregar dados. Tente recarregar a página.');
                    }
                    console.error('All retry attempts failed:', error);
                    throw error;
                }
            }
        }

        throw lastError;
    }

    /**
     * Clean expired entries from cache
     */
    _cleanCache() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.cacheTimeout) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache
     */
    clearCache() {
        this.cache.clear();
    }

    // API Methods

    /**
     * Get analytics overview
     */
    async getAnalytics() {
        return this._fetch('/analytics/overview');
    }

    /**
     * Get annual production data
     */
    async getAnnualProduction() {
        return this._fetch('/analytics/annual-production');
    }

    /**
     * Search works with parameters
     */
    async searchWorks(params = {}) {
        const queryParams = new URLSearchParams();
        
        if (params.q) queryParams.append('q', params.q);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.cursor) queryParams.append('cursor', params.cursor);
        if (params.sort) queryParams.append('sort', params.sort);

        const queryString = queryParams.toString();
        return this._fetch('/works/' + (queryString ? '?' + queryString : ''));
    }

    /**
     * Get specific work by ID
     */
    async getWork(id) {
        return this._fetch(`/works/${id}`);
    }

    /**
     * Search authors by name
     */
    async searchAuthors(name, limit = 25) {
        const queryParams = new URLSearchParams({
            name: name,
            limit: limit.toString()
        });
        return this._fetch(`/authors/search?${queryParams}`);
    }

    /**
     * Get specific author by ID
     */
    async getAuthor(id) {
        return this._fetch(`/authors/${id}`);
    }

    /**
     * Get works by author
     */
    async getAuthorWorks(authorId, limit = 25, cursor = null) {
        const queryParams = new URLSearchParams({
            limit: limit.toString()
        });
        if (cursor) queryParams.append('cursor', cursor);
        
        return this._fetch(`/authors/${authorId}/works?${queryParams}`);
    }

    /**
     * Get venues list
     */
    async getVenues(params = {}) {
        const queryParams = new URLSearchParams();
        
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.offset) queryParams.append('offset', params.offset);

        const queryString = queryParams.toString();
        return this._fetch('/venues/' + (queryString ? '?' + queryString : ''));
    }

    /**
     * Get specific venue by ID
     */
    async getVenue(id) {
        return this._fetch(`/venues/${id}`);
    }

    /**
     * Get works by venue
     */
    async getVenueWorks(venueId, limit = 25, cursor = null) {
        const queryParams = new URLSearchParams({
            limit: limit.toString()
        });
        if (cursor) queryParams.append('cursor', cursor);
        
        return this._fetch(`/venues/${venueId}/works?${queryParams}`);
    }

    /**
     * Get work metrics
     */
    async getWorkMetrics(workId) {
        return this._fetch(`/metrics/work/${workId}`);
    }

    /**
     * Get recent works
     */
    async getRecentWorks(limit = 10) {
        return this.searchWorks({ q: '*', limit: limit, sort: 'recent' });
    }

    /**
     * Get top venues
     */
    async getTopVenues(limit = 10) {
        return this.getVenues({ limit: limit, offset: 0 });
    }
}

// Create global instance
let api = new ethnos_appAPI();