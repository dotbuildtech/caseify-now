let invalidateFilterCache = () => {};
let invalidatePriceCache = () => {};
let invalidateCategoryCache = () => {};

module.exports = {
    registerInvalidators: (fns) => {
        if (fns.invalidateFilterCache) invalidateFilterCache = fns.invalidateFilterCache;
        if (fns.invalidatePriceCache) invalidatePriceCache = fns.invalidatePriceCache;
        if (fns.invalidateCategoryCache) invalidateCategoryCache = fns.invalidateCategoryCache;
    },
    invalidateFilterCache: () => invalidateFilterCache(),
    invalidatePriceCache: () => invalidatePriceCache(),
    invalidateCategoryCache: () => invalidateCategoryCache(),
    invalidateAll: () => {
        invalidateFilterCache();
        invalidatePriceCache();
        invalidateCategoryCache();
    }
};
