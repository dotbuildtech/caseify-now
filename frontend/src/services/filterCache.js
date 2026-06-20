import { fetchFilters } from './productApi';

const cache = new Map();
const inflight = new Map();
const TTL = 5 * 60 * 1000;
const STALE_TTL = 10 * 60 * 1000;

function key(params) {
    const p = { ...params };
    Object.keys(p).forEach((k) => { if (p[k] == null || p[k] === '') delete p[k]; });
    return JSON.stringify(p, Object.keys(p).sort());
}

export function getCachedFilters(params) {
    const k = key(params);
    const entry = cache.get(k);
    if (!entry) return null;
    if (Date.now() - entry.ts < TTL) return entry.data;
    if (Date.now() - entry.ts < STALE_TTL) {
        refresh(params, k);
        return entry.data;
    }
    cache.delete(k);
    return null;
}

function refresh(params, k) {
    if (inflight.has(k)) return;
    const prom = fetchFilters(params).then((data) => {
        cache.set(k, { data, ts: Date.now() });
        inflight.delete(k);
        return data;
    }).catch((err) => {
        inflight.delete(k);
        throw err;
    });
    inflight.set(k, prom);
}

export function fetchCachedFilters(params) {
    const k = key(params);
    const existing = getCachedFilters(params);
    if (existing) return Promise.resolve(existing);

    if (inflight.has(k)) return inflight.get(k);

    const prom = fetchFilters(params).then((data) => {
        cache.set(k, { data, ts: Date.now() });
        inflight.delete(k);
        return data;
    }).catch((err) => {
        inflight.delete(k);
        throw err;
    });
    inflight.set(k, prom);
    return prom;
}

export function clearFilterCache() {
    cache.clear();
    inflight.clear();
}
