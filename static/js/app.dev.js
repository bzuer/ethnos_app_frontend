class ClientCache {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000;
        this.storageKey = 'ethnos_app_cache';
        this.loadFromStorage();
    }

    _getCacheKey(key) {
        return key;
    }

    _isValidCacheEntry(entry) {
        return entry && (Date.now() - entry.timestamp < this.cacheTimeout);
    }

    get(key) {
        const cacheKey = this._getCacheKey(key);
        const entry = this.cache.get(cacheKey);
        
        if (this._isValidCacheEntry(entry)) {
            return entry.data;
        }
        
        if (entry) {
            this.cache.delete(cacheKey);
        }
        
        return null;
    }

    set(key, data) {
        const cacheKey = this._getCacheKey(key);
        const entry = {
            data: data,
            timestamp: Date.now()
        };
        
        this.cache.set(cacheKey, entry);
        this.saveToStorage();
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                const now = Date.now();
                
                for (const [key, entry] of Object.entries(parsed)) {
                    if (now - entry.timestamp < this.cacheTimeout) {
                        this.cache.set(key, entry);
                    }
                }
            }
        } catch (e) {
            console.warn('Failed to load cache from storage:', e);
        }
    }

    saveToStorage() {
        try {
            const toStore = {};
            for (const [key, entry] of this.cache.entries()) {
                if (this._isValidCacheEntry(entry)) {
                    toStore[key] = entry;
                }
            }
            localStorage.setItem(this.storageKey, JSON.stringify(toStore));
        } catch (e) {
            console.warn('Failed to save cache to storage:', e);
        }
    }

    clear() {
        this.cache.clear();
        localStorage.removeItem(this.storageKey);
    }
}

const clientCache = new ClientCache();

async function preloadEssentialData() {
    try {
        if (window.INITIAL_DATA) {
            clientCache.set('homepage_data', window.INITIAL_DATA);
            delete window.INITIAL_DATA;
            return;
        }

        const homepageData = clientCache.get('homepage_data');
        if (!homepageData && window.location.pathname === '/') {
            fetch('/api/preload/homepage')
                .then(response => response.json())
                .then(data => {
                    if (data && data.status === 'success') {
                        clientCache.set('homepage_data', data.data);
                    }
                })
                .catch(e => console.debug('Background preload failed:', e));
        }
    } catch (e) {
        console.debug('Preload error:', e);
    }
}

function loadMyListScript(){var e=document.createElement("script");e.src="/static/js/my-list.min.js",e.onload=function(){console.log("MyList module loaded"),updateReadingListCounter()},e.onerror=function(){console.error("Failed to load MyList module")},document.head.appendChild(e)}function updateReadingListCounter(){var e,t=document.getElementById("reading-list-counter");t&&window.MyList&&(e=(e=window.MyList.getPersonalList())?e.length:0,t.textContent=e,t.style.display=0<e?"inline":"none")}function loadScript(o){return new Promise((e,t)=>{var n=document.createElement("script");n.src=o,n.onload=e,n.onerror=t,document.head.appendChild(n)})}document.addEventListener("DOMContentLoaded",function(){var e=document.getElementById("search-form");let t=document.getElementById("search-input");e&&e.addEventListener("submit",function(e){e.preventDefault();e=t.value.trim();e&&(window.location.href="/results?q="+encodeURIComponent(e))}),window.MyList||loadMyListScript(),updateReadingListCounter(),preloadEssentialData()}),window.updateReadingListCounter=updateReadingListCounter;