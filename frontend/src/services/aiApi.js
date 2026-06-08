import api from './api';

const STYLE_PRESETS = {
    floral: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=70',
    anime: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=70',
    luxury: 'https://images.unsplash.com/photo-1551918120-9739cb430c6d?auto=format&fit=crop&w=800&q=70',
    minimal: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=800&q=70',
    abstract: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=70',
    nature: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=70',
    space: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=800&q=70',
    geometric: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=800&q=70',
    sunset: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=800&q=70',
    ocean: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=70',
    mountain: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=70',
    pastel: 'https://images.unsplash.com/photo-1552083375-1447ce886485?auto=format&fit=crop&w=800&q=70'
};

const detectStyle = (prompt) => {
    if (!prompt) return STYLE_PRESETS.floral;
    const p = prompt.toLowerCase();
    for (const key of Object.keys(STYLE_PRESETS)) {
        if (p.includes(key)) return STYLE_PRESETS[key];
    }
    if (p.match(/flower|bloom|rose|cherry|peony|tulip/)) return STYLE_PRESETS.floral;
    if (p.match(/anime|manga|japan|kawaii|cartoon/)) return STYLE_PRESETS.anime;
    if (p.match(/gold|marble|luxury|premium|elegant|royal/)) return STYLE_PRESETS.luxury;
    if (p.match(/simple|clean|minimal|white|empty|basic/)) return STYLE_PRESETS.minimal;
    if (p.match(/paint|color|abstract|gradient|watercolor/)) return STYLE_PRESETS.abstract;
    if (p.match(/forest|tree|leaf|plant|botanical/)) return STYLE_PRESETS.nature;
    if (p.match(/star|galaxy|space|moon|cosmic|nebula/)) return STYLE_PRESETS.space;
    if (p.match(/shape|geometric|triangle|hexagon|line/)) return STYLE_PRESETS.geometric;
    if (p.match(/sunset|sun|dawn|orange/)) return STYLE_PRESETS.sunset;
    if (p.match(/sea|beach|wave|water|ocean/)) return STYLE_PRESETS.ocean;
    if (p.match(/mountain|peak|alpine|hill/)) return STYLE_PRESETS.mountain;
    if (p.match(/soft|pastel|candy|baby|kid/)) return STYLE_PRESETS.pastel;
    return STYLE_PRESETS.abstract;
};

export const generateDesign = async (prompt) => {
    await new Promise((r) => setTimeout(r, 1200));
    const url = detectStyle(prompt);
    const variants = Object.values(STYLE_PRESETS).slice(0, 6);
    return {
        prompt: prompt || 'Custom design',
        primary: url,
        variants: variants.map((v, i) => ({ id: `v${i}`, url: v }))
    };
};

export const enhancePhoto = async (imageUrl) => {
    await new Promise((r) => setTimeout(r, 800));
    return {
        url: imageUrl,
        backgroundRemoved: true,
        colorEnhanced: true
    };
};

export const getStyleSuggestions = (prompt) => {
    const list = ['Floral', 'Minimal', 'Anime', 'Luxury', 'Abstract', 'Geometric'];
    return list;
};
