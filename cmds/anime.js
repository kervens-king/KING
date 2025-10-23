/* 
 * 👑 KING ANIME UNIVERSE 2025
 * Module Anime Royal par Kervens
 * Sous licence GNU GPLv3
 * -------------------------------------------------------------------------------
 */

const { King, extractUrlsFromString, fetchWaifu, getJson, prefix, wtype, ss } = require("../core");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

// 🔹 Cache pour optimiser les performances
const animeCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// 🔹 Fonction de cache intelligente
function getCachedData(key) {
    const cached = animeCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCachedData(key, data) {
    animeCache.set(key, { data, timestamp: Date.now() });
}

// 🔹 Gestionnaire d'erreur amélioré
async function handleAnimeError(m, error, commandName) {
    console.error(`[ANIME ERROR] ${commandName}:`, error);
    
    const errorMessages = [
        "🌙 *La lune anime est cachée...* Réessayez !",
        "⚡ *L'énergie anime est faible...* Patientez !",
        "🎌 *Les esprits anime sont occupés...* Réessayez plus tard !",
        "💫 *La magie anime a échoué...* Nouvel essai ?"
    ];
    
    const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    await m.send(`${randomError}\n\n_Erreur technique: ${error.message}_`);
}

// 🔹 Fonction de formatage de temps
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

// 🔹 Système de watchlist avancé
class AnimeWatchlist {
    constructor() {
        this.watchlistFile = path.join(__dirname, "../data/anime_watchlist.json");
        this.watchlists = this.loadWatchlists();
    }

    loadWatchlists() {
        try {
            if (fs.existsSync(this.watchlistFile)) {
                return JSON.parse(fs.readFileSync(this.watchlistFile, 'utf8'));
            }
        } catch (error) {
            console.error("Erreur chargement watchlist:", error);
        }
        return {};
    }

    saveWatchlists() {
        try {
            fs.writeFileSync(this.watchlistFile, JSON.stringify(this.watchlists, null, 2));
            return true;
        } catch (error) {
            console.error("Erreur sauvegarde watchlist:", error);
            return false;
        }
    }

    getUserWatchlist(userId) {
        if (!this.watchlists[userId]) {
            this.watchlists[userId] = [];
        }
        return this.watchlists[userId];
    }

    addAnime(userId, animeName, episode = 1, status = "Watching") {
        const watchlist = this.getUserWatchlist(userId);
        const existingIndex = watchlist.findIndex(a => a.title.toLowerCase() === animeName.toLowerCase());
        
        if (existingIndex !== -1) {
            watchlist[existingIndex].episode = episode;
            watchlist[existingIndex].status = status;
            watchlist[existingIndex].updated = new Date().toISOString();
        } else {
            watchlist.push({
                title: animeName,
                episode: episode,
                status: status,
                added: new Date().toISOString(),
                updated: new Date().toISOString()
            });
        }
        
        return this.saveWatchlists();
    }

    removeAnime(userId, animeName) {
        const watchlist = this.getUserWatchlist(userId);
        this.watchlists[userId] = watchlist.filter(a => a.title.toLowerCase() !== animeName.toLowerCase());
        return this.saveWatchlists();
    }

    clearWatchlist(userId) {
        this.watchlists[userId] = [];
        return this.saveWatchlists();
    }
}

const animeWatchlist = new AnimeWatchlist();

// 🎌 COMMANDES ANIME PRINCIPALES

King({
    cmd: "anime",
    desc: "Rechercher des informations détaillées sur un anime",
    fromMe: wtype,
    react: "🔍",
    type: "anime",
}, async (m, text) => {
    try {
        if (!text) return m.send("🎌 *Veuillez fournir un nom d'anime à rechercher !*");
        
        m.react("⏳");
        const cacheKey = `anime_search_${text}`;
        const cached = getCachedData(cacheKey);
        
        let json;
        if (cached) {
            json = cached;
        } else {
            const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(text)}&limit=1`);
            json = await res.json();
            setCachedData(cacheKey, json);
        }
        
        if (!json.data || json.data.length < 1) {
            return m.send("❌ *Aucun anime trouvé avec ce nom !*");
        }
        
        const anime = json.data[0];
        let caption = `🎬 *${anime.title}* ${anime.title_japanese ? `(${anime.title_japanese})` : ''}\n\n`;
        caption += `🔖 *Type:* ${anime.type || 'N/A'}\n`;
        caption += `⭐ *Score:* ${anime.score || 'N/A'}/10\n`;
        caption += `🎯 *Épisodes:* ${anime.episodes || 'Inconnu'}\n`;
        caption += `📅 *Diffusion:* ${anime.aired?.string || 'Inconnu'}\n`;
        caption += `🔞 *Classification:* ${anime.rating || 'N/A'}\n`;
        caption += `💫 *Statut:* ${anime.status || 'N/A'}\n`;
        caption += `🎭 *Genres:* ${anime.genres?.map(g => g.name).join(', ') || 'Aucun'}\n\n`;
        
        if (anime.synopsis) {
            const synopsis = anime.synopsis.length > 500 ? 
                anime.synopsis.substring(0, 500) + "..." : anime.synopsis;
            caption += `📝 *Synopsis:* ${synopsis}`;
        }
        
        return m.send(anime.images.jpg.large_image_url, { caption }, "image");
        
    } catch (e) {
        await handleAnimeError(m, e, "anime");
    }
});

King({
    cmd: "waifu|animegirl",
    desc: "Obtenir une image de waifu aléatoire par catégorie",
    fromMe: wtype,
    react: "💕",
    type: "anime"
}, async (m, text) => {
    try {
        m.react("⌛");
        const categories = ["waifu", "neko", "shinobu", "megumin", "bully", "cuddle", "cry", "hug", "kiss", "pat", "smug", "highfive"];
        let category = text?.toLowerCase() || categories[Math.floor(Math.random() * categories.length)];
        
        if (!categories.includes(category)) {
            category = "waifu";
        }
        
        const cacheKey = `waifu_${category}`;
        const cached = getCachedData(cacheKey);
        
        let json;
        if (cached) {
            json = cached;
        } else {
            const res = await fetch(`https://api.waifu.pics/sfw/${category}`);
            json = await res.json();
            setCachedData(cacheKey, json);
        }
        
        const caption = `💖 *Voici votre ${category} !*\n\n✨ Catégorie: ${category}\n🎨 Source: Waifu.pics`;
        return m.send(json.url, { caption }, "image");
        
    } catch (e) {
        await handleAnimeError(m, e, "waifu");
    }
});

King({
    cmd: "manga",
    desc: "Rechercher des informations détaillées sur un manga",
    fromMe: wtype,
    react: "📚",
    type: "anime",
}, async (m, text) => {
    try {
        if (!text) return m.send("📚 *Veuillez fournir un nom de manga à rechercher !*");
        m.react("🔎");

        const cacheKey = `manga_search_${text}`;
        const cached = getCachedData(cacheKey);
        
        let data;
        if (cached) {
            data = cached;
        } else {
            const resp = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(text)}&limit=1`);
            data = await resp.json();
            setCachedData(cacheKey, data);
        }

        if (!data.data || data.data.length < 1) {
            return m.send("❌ *Aucun manga trouvé avec ce nom !*");
        }

        const manga = data.data[0];
        let txt = `📕 *${manga.title}* ${manga.title_japanese ? `(${manga.title_japanese})` : ''}\n\n`;
        txt += `🔖 *Type:* ${manga.type || 'N/A'}\n`;
        txt += `⭐ *Score:* ${manga.score || 'N/A'}/10\n`;
        txt += `📑 *Chapitres:* ${manga.chapters || "Inconnu"}\n`;
        txt += `📚 *Volumes:* ${manga.volumes || "Inconnu"}\n`;
        txt += `📅 *Publication:* ${manga.published?.string || "Inconnu"}\n`;
        txt += `💫 *Statut:* ${manga.status || 'N/A'}\n`;
        txt += `🎭 *Genres:* ${manga.genres?.map(g => g.name).join(', ') || 'Aucun'}\n\n`;

        if (manga.synopsis) {
            const synopsis = manga.synopsis.length > 400 ? 
                manga.synopsis.substring(0, 400) + "..." : manga.synopsis;
            txt += `📝 *Synopsis:* ${synopsis}`;
        }

        return m.send(manga.images.jpg.large_image_url, { caption: txt }, "image");
        
    } catch (e) {
        await handleAnimeError(m, e, "manga");
    }
});

King({
    cmd: "animequote",
    desc: "Obtenir une citation d'anime aléatoire et inspirante",
    type: "anime",
    fromMe: wtype,
    react: "💭"
}, async (m) => {
    try {
        m.react("✨");
        const cacheKey = "anime_quote";
        const cached = getCachedData(cacheKey);
        
        let quot;
        if (cached) {
            quot = cached;
        } else {
            const res = await fetch("https://animechan.xyz/api/random");
            quot = await res.json();
            setCachedData(cacheKey, quot);
        }

        const msg = `💫 *Citation Anime*\n\n"${quot.quote}"\n\n👤 *Personnage:* ${quot.character}\n📺 *Anime:* ${quot.anime}`;
        return m.send(msg);
        
    } catch (e) {
        await handleAnimeError(m, e, "animequote");
    }
});

King({
    cmd: "animenews",
    desc: "Dernières nouvelles et tendances du monde anime",
    fromMe: wtype,
    type: "anime",
    react: "📰"
}, async (m, text) => {
    try {
        m.react("🔄");
        const cacheKey = "anime_news";
        const cached = getCachedData(cacheKey);
        
        let data;
        if (cached) {
            data = cached;
        } else {
            const res = await fetch("https://api.jikan.moe/v4/top/anime?filter=airing&limit=8");
            data = await res.json();
            setCachedData(cacheKey, data);
        }

        if (!data.data || data.data.length < 1) {
            return m.send("❌ *Aucun anime tendance trouvé pour le moment !*");
        }

        let msg = "🌟 *ANIME TENDANCE EN CE MOMENT* 🌟\n\n";
        data.data.forEach((anime, index) => {
            msg += `🎯 *${index + 1}. ${anime.title}*\n`;
            msg += `   ⭐ Score: ${anime.score || "N/A"}\n`;
            msg += `   📺 Épisodes: ${anime.episodes || "En cours"}\n`;
            msg += `   🎭 Type: ${anime.type}\n\n`;
        });

        msg += "💫 *Restez à l'affût des dernières sorties !*";
        return m.send(msg);
        
    } catch (e) {
        await handleAnimeError(m, e, "animenews");
    }
});

King({
    cmd: "character|animechar",
    desc: "Rechercher des informations sur un personnage d'anime",
    fromMe: wtype,
    type: "anime",
    react: "👤"
}, async (m, text) => {
    try {
        if (!text) return m.send("👤 *Veuillez fournir un nom de personnage à rechercher !*");
        m.react("🔍");
        
        const cacheKey = `character_${text}`;
        const cached = getCachedData(cacheKey);
        
        let json;
        if (cached) {
            json = cached;
        } else {
            const res = await fetch(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(text)}&limit=1`);
            json = await res.json();
            setCachedData(cacheKey, json);
        }

        if (!json.data || json.data.length < 1) {
            return m.send("❌ *Aucun personnage trouvé avec ce nom !*");
        }

        const char = json.data[0];
        let info = `👤 *${char.name}* ${char.name_kanji ? `(${char.name_kanji})` : ''}\n\n`;
        
        if (char.nicknames && char.nicknames.length > 0) {
            info += `✨ *Surnoms:* ${char.nicknames.join(", ")}\n\n`;
        }
        
        info += `🎭 *Rôle favori:* ${char.favorites || 0} favoris\n\n`;
        
        if (char.about) {
            const about = char.about.length > 600 ? 
                char.about.substring(0, 600) + "..." : char.about;
            info += `📝 *À propos:* ${about}`;
        } else {
            info += `📝 *À propos:* Aucune information disponible`;
        }

        return m.send(char.images.jpg.image_url, { caption: info }, "image");
        
    } catch (e) {
        await handleAnimeError(m, e, "character");
    }
});

King({
    cmd: "animesearch|animeinfo",
    desc: "Rechercher un anime à partir d'une image (répondre à une image)",
    fromMe: wtype,
    react: "🔍",
    type: "anime"
}, async (m) => {
    try {
        if (!m.quoted || !m.quoted.media) {
            return m.send("🎌 *Veuillez répondre à une image d'anime pour la recherche !*");
        }
        
        m.react("⏳");
        const mediaPath = await m.client.dlandsave(m.quoted);
        const mediaUrl = await m.upload(mediaPath, "temp");
        
        const trace = await fetch(`https://api.trace.moe/search?url=${encodeURIComponent(mediaUrl)}`);
        const result = await trace.json();

        if (!result.result || result.result.length < 1) {
            await fs.promises.unlink(mediaPath);
            return m.send("❌ *Impossible d'identifier l'anime à partir de cette image !*");
        }

        const match = result.result[0];
        const similarity = (match.similarity * 100).toFixed(2);
        
        if (similarity < 70) {
            await fs.promises.unlink(mediaPath);
            return m.send(`⚠️ *Correspondance faible (${similarity}%). Essayez avec une image plus claire !*`);
        }

        let text = `🎯 *ANIME IDENTIFIÉ !*\n\n`;
        text += `📺 *Titre:* ${match.filename}\n`;
        text += `⏰ *Timecode:* ${formatTime(match.from)} - ${formatTime(match.to)}\n`;
        text += `🔍 *Similarité:* ${similarity}%\n`;
        text += `🎬 *Épisode:* ${match.episode || "Inconnu"}\n`;
        text += `🎞️ *Anilist ID:* ${match.anilist}`;

        // Essayer d'obtenir un aperçu vidéo
        try {
            const preview = await fetch(`https://media.trace.moe/video/${match.anilist}/${encodeURIComponent(match.filename)}?t=${match.from}&token=${match.video}`);
            const buffer = await preview.buffer();
            await m.send(buffer, { caption: text, gifPlayback: true }, "video");
        } catch (previewError) {
            // Si l'aperçu échoue, envoyer juste les informations
            await m.send(text);
        }

        await fs.promises.unlink(mediaPath);
        
    } catch (e) {
        await handleAnimeError(m, e, "animesearch");
    }
});

King({
    cmd: "animewatch|watching",
    desc: "Gérer votre liste d'anime en cours de visionnage",
    fromMe: wtype,
    type: "anime",
    react: "📝"
}, async (m, text) => {
    try {
        const userId = m.sender;

        if (!text) {
            const watchlist = animeWatchlist.getUserWatchlist(userId);
            if (watchlist.length === 0) {
                return m.send("📺 *Votre liste de visionnage est vide !*\n\nUtilisez :\n• `.animewatch <anime> | <épisode>` pour ajouter\n• `.animewatch list` pour voir votre liste\n• `.animewatch clear` pour vider la liste");
            }

            let list = "📺 *VOTRE LISTE DE VISIONNAGE* 📺\n\n";
            watchlist.forEach((anime, i) => {
                list += `${i+1}. *${anime.title}*\n`;
                list += `   📍 Épisode: ${anime.episode}\n`;
                list += `   🎯 Statut: ${anime.status}\n`;
                list += `   📅 Mis à jour: ${new Date(anime.updated).toLocaleDateString()}\n\n`;
            });
            
            list += `💫 Total: ${watchlist.length} anime(s)`;
            return m.send(list);
        }

        const args = text.toLowerCase();
        
        if (args === "clear") {
            animeWatchlist.clearWatchlist(userId);
            return m.send("✅ *Liste de visionnage vidée avec succès !*");
        }
        
        if (args === "list") {
            const watchlist = animeWatchlist.getUserWatchlist(userId);
            if (watchlist.length === 0) {
                return m.send("📺 *Votre liste de visionnage est vide !*");
            }
            
            let list = "📺 *VOTRE LISTE DE VISIONNAGE* 📺\n\n";
            watchlist.forEach((anime, i) => {
                list += `${i+1}. *${anime.title}* (Ép. ${anime.episode})\n`;
            });
            return m.send(list);
        }

        const parts = text.split("|").map(p => p.trim());
        if (parts.length < 2) {
            return m.send("🎌 *Format incorrect !*\n\nUtilisez : `.animewatch <nom anime> | <épisode>`\nExemple : `.animewatch Attack on Titan | 25`");
        }

        const animeName = parts[0];
        const episode = parseInt(parts[1]);

        if (isNaN(episode) || episode < 1) {
            return m.send("❌ *Veuillez spécifier un numéro d'épisode valide !*");
        }

        const success = animeWatchlist.addAnime(userId, animeName, episode, "En cours");
        
        if (success) {
            await m.send(`✅ *${animeName} ajouté à votre liste !*\n📺 Épisode: ${episode}\n🎯 Statut: En cours de visionnage`);
        } else {
            await m.send("❌ *Erreur lors de l'ajout à la liste !*");
        }
        
    } catch (e) {
        await handleAnimeError(m, e, "animewatch");
    }
});

King({
    cmd: "animegif|animatedgif",
    desc: "Envoyer un GIF anime aléatoire par catégorie",
    fromMe: wtype,
    type: "anime",
    react: "🎬"
}, async (m, text) => {
    try {
        m.react("⏳");
        const categories = ["happy", "sad", "angry", "dance", "hug", "kiss", "punch", "slap", "wave", "blush"];
        let category = text?.toLowerCase();
        
        if (!text || !categories.includes(category)) {
            category = categories[Math.floor(Math.random() * categories.length)];
        }

        const cacheKey = `anime_gif_${category}`;
        const cached = getCachedData(cacheKey);
        
        let json;
        if (cached) {
            json = cached;
        } else {
            const res = await fetch(`https://nekos.best/api/v2/${category}`);
            json = await res.json();
            setCachedData(cacheKey, json);
        }

        if (!json.results || json.results.length < 1) {
            return m.send("❌ *Aucun GIF trouvé pour cette catégorie !*");
        }

        const gifData = json.results[0];
        const caption = `🎬 *GIF Anime - ${category.toUpperCase()}*\n\n💫 Catégorie: ${category}\n✨ Source: Nekos.best`;

        return m.send(gifData.url, { caption, gifPlayback: true }, "video");
        
    } catch (e) {
        await handleAnimeError(m, e, "animegif");
    }
});

King({
    cmd: "season|animeseason",
    desc: "Obtenir les anime d'une saison spécifique",
    fromMe: wtype,
    type: "anime",
    react: "🗓️"
}, async (m, text) => {
    try {
        if (!text) {
            return m.send("🗓️ *Veuillez spécifier une saison !*\n\nFormat: `.season <année> <saison>`\n\nSaisons disponibles:\n• winter (hiver)\n• spring (printemps)\n• summer (été)\n• fall (automne)\n\nExemple: `.season 2024 spring`");
        }

        m.react("🔍");
        const args = text.split(" ");
        if (args.length < 2) {
            return m.send("❌ *Format incorrect !*\nUtilisez: `.season <année> <saison>`");
        }

        const year = args[0];
        const season = args[1].toLowerCase();
        const validSeasons = ["winter", "spring", "summer", "fall"];

        if (!validSeasons.includes(season)) {
            return m.send("❌ *Saison invalide !*\nChoisissez parmi: winter, spring, summer, fall");
        }

        if (isNaN(year) || year < 1990 || year > 2030) {
            return m.send("❌ *Année invalide !*\nVeuillez spécifier une année entre 1990 et 2030");
        }

        const cacheKey = `season_${year}_${season}`;
        const cached = getCachedData(cacheKey);
        
        let json;
        if (cached) {
            json = cached;
        } else {
            const res = await fetch(`https://api.jikan.moe/v4/seasons/${year}/${season}?limit=12`);
            json = await res.json();
            setCachedData(cacheKey, json);
        }

        if (!json.data || json.data.length < 1) {
            return m.send(`❌ *Aucun anime trouvé pour ${season} ${year} !*`);
        }

        let msg = `📺 *ANIME DE ${season.toUpperCase()} ${year}* 📺\n\n`;
        json.data.forEach((anime, i) => {
            msg += `${i+1}. *${anime.title}*\n`;
            msg += `   🎭 Type: ${anime.type} | ⭐ Score: ${anime.score || "N/A"}\n`;
            msg += `   📅 Sortie: ${anime.aired?.string?.split(" to ")[0] || "Inconnue"}\n\n`;
        });

        msg += `💫 Total: ${json.data.length} anime(s) trouvés`;
        return m.send(msg);
        
    } catch (e) {
        await handleAnimeError(m, e, "season");
    }
});

King({
    cmd: "animerec|recommend",
    desc: "Obtenir des recommandations d'anime personnalisées",
    fromMe: wtype,
    type: "anime",
    react: "🎯"
}, async (m, text) => {
    try {
        m.react("⏳");
        let url = "https://api.jikan.moe/v4/recommendations/anime";
        let limit = 6;
        let title = "ANIME RECOMMANDÉS";

        if (text) {
            const searchRes = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(text)}&limit=1`);
            const searchJson = await searchRes.json();
            
            if (searchJson.data && searchJson.data.length > 0) {
                url = `https://api.jikan.moe/v4/anime/${searchJson.data[0].mal_id}/recommendations`;
                title = `RECOMMANDATIONS POUR "${text.toUpperCase()}"`;
                limit = 5;
            }
        }

        const cacheKey = `recommendations_${text || 'general'}`;
        const cached = getCachedData(cacheKey);
        
        let json;
        if (cached) {
            json = cached;
        } else {
            const res = await fetch(url);
            json = await res.json();
            setCachedData(cacheKey, json);
        }

        if (!json.data || json.data.length < 1) {
            return m.send("❌ *Aucune recommandation trouvée !*");
        }

        let msg = `🎬 *${title}* 🎬\n\n`;
        const recommendations = text ? json.data : json.data.slice(0, limit);

        recommendations.forEach((rec, i) => {
            const anime = text ? rec.entry : rec.entry[0];
            msg += `${i+1}. *${anime.title}*\n`;
            if (text) {
                msg += `   👍 Votes: ${rec.votes || 0}\n`;
            }
            msg += `   🎭 Type: ${anime.type}\n\n`;
        });

        msg += "💫 *Bon visionnage !*";
        return m.send(msg);
        
    } catch (e) {
        await handleAnimeError(m, e, "animerec");
    }
});

King({
    cmd: "airing|nextep",
    desc: "Vérifier quand le prochain épisode d'un anime est diffusé",
    fromMe: wtype,
    type: "anime",
    react: "📅"
}, async (m, text) => {
    try {
        if (!text) {
            return m.send("📅 *Veuillez spécifier un nom d'anime !*\n\nExemple: `.airing One Piece`");
        }

        m.react("🕒");
        const cacheKey = `airing_${text}`;
        const cached = getCachedData(cacheKey);
        
        let json;
        if (cached) {
            json = cached;
        } else {
            const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(text)}&status=airing&limit=1`);
            json = await res.json();
            setCachedData(cacheKey, json);
        }

        if (!json.data || json.data.length < 1) {
            return m.send(`❌ *Aucune information de diffusion trouvée pour "${text}" !*`);
        }

        const anime = json.data[0];
        if (anime.status !== "Currently Airing") {
            return m.send(`📺 *${anime.title}* n'est pas en cours de diffusion actuellement.\n\nStatut: ${anime.status}`);
        }

        const scheduleRes = await fetch(`https://api.jikan.moe/v4/anime/${anime.mal_id}/schedule`);
        const scheduleJson = await scheduleRes.json();

        if (!scheduleJson.data || Object.keys(scheduleJson.data).length === 0) {
            return m.send(`❌ *Aucune information d'horaire disponible pour ${anime.title} !*`);
        }

        const now = new Date();
        let nextEpisode = null;
        let nextDate = null;

        // Parcourir les jours pour trouver le prochain épisode
        for (const day in scheduleJson.data) {
            if (scheduleJson.data[day]?.length > 0) {
                for (const episode of scheduleJson.data[day]) {
                    const epDate = new Date(episode.aired);
                    if (epDate > now && (!nextDate || epDate < nextDate)) {
                        nextDate = epDate;
                        nextEpisode = episode;
                    }
                }
            }
        }

        if (!nextEpisode) {
            return m.send(`📺 *${anime.title}*\n\nAucun prochain épisode programmé pour le moment.`);
        }

        const timeUntil = getTimeDifference(now, nextDate);
        const msg = `📺 *${anime.title}*\n\n`;
        msg += `⏰ *Prochain épisode:* ${nextEpisode.episode || "Inconnu"}\n`;
        msg += `🕒 *Dans:* ${timeUntil}\n`;
        msg += `📅 *Date:* ${nextDate.toLocaleDateString()}\n`;
        msg += `⏰ *Heure:* ${nextDate.toLocaleTimeString()}`;

        return m.send(msg);
        
    } catch (e) {
        await handleAnimeError(m, e, "airing");
    }
});

// 🔹 Fonction utilitaire pour la différence de temps
function getTimeDifference(current, future) {
    const diff = future - current;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    let result = "";
    if (days > 0) result += `${days} jour${days > 1 ? 's' : ''} `;
    if (hours > 0) result += `${hours} heure${hours > 1 ? 's' : ''} `;
    result += `${minutes} minute${minutes > 1 ? 's' : ''}`;
    
    return result.trim();
}

// 🎭 COMMANDES WAIFU INTERACTIVES AVEC MENTIONS

const waifuInteractions = [
    { cmd: "slap", desc: "Donner une claque à quelqu'un", action: "a claqué" },
    { cmd: "hug", desc: "Faire un câlin à quelqu'un", action: "a fait un câlin à" },
    { cmd: "kiss", desc: "Faire un bisou à quelqu'un", action: "a embrassé" },
    { cmd: "pat", desc: "Faire une caresse à quelqu'un", action: "a caressé" },
    { cmd: "cuddle", desc: "Faire un câlin à quelqu'un", action: "a câliné" },
    { cmd: "poke", desc: "Taper quelqu'un", action: "a tapoté" },
    { cmd: "tickle", desc: "Chatouiller quelqu'un", action: "a chatouillé" },
    { cmd: "feed", desc: "Nourrir quelqu'un", action: "a nourri" },
    { cmd: "wave", desc: "Saluer quelqu'un", action: "a salué" },
    { cmd: "handhold", desc: "Tenir la main de quelqu'un", action: "a tenu la main de" },
    { cmd: "lick", desc: "Lécher quelqu'un", action: "a léché" },
    { cmd: "bite", desc: "Mordre quelqu'un", action: "a mordu" },
    { cmd: "kick", desc: "Donner un coup de pied à quelqu'un", action: "a donné un coup de pied à" },
    { cmd: "punch", desc: "Donner un coup de poing à quelqu'un", action: "a frappé" },
    { cmd: "stab", desc: "Poignarder quelqu'un", action: "a poignardé" },
    { cmd: "shoot", desc: "Tirer sur quelqu'un", action: "a tiré sur" },
    { cmd: "yeet", desc: "Jeter quelqu'un", action: "a jeté" },
    { cmd: "highfive", desc: "Taper la main de quelqu'un", action: "a tapé la main de" },
    { cmd: "glomp", desc: "Sauter sur quelqu'un", action: "a sauté sur" },
    { cmd: "kill", desc: "Tuer quelqu'un", action: "a tué" },
    { cmd: "cry", desc: "Pleurer avec quelqu'un", action: "a pleuré avec" },
    { cmd: "dance", desc: "Danser avec quelqu'un", action: "a dansé avec" },
    { cmd: "bonk", desc: "Donner un coup sur la tête à quelqu'un", action: "a donné un coup sur la tête à" },
    { cmd: "smug", desc: "Faire un sourire narquois à quelqu'un", action: "a souri narquoisement à" },
    { cmd: "nom", desc: "Manger avec quelqu'un", action: "a mangé avec" },
    { cmd: "throw", desc: "Lancer quelqu'un", action: "a lancé" },
    { cmd: "run", desc: "Courir avec quelqu'un", action: "a couru avec" },
    { cmd: "sleep", desc: "Dormir avec quelqu'un", action: "a dormi avec" },
    { cmd: "blush", desc: "Rougir à cause de quelqu'un", action: "a fait rougir" },
    { cmd: "smile", desc: "Sourire à quelqu'un", action: "a souri à" }
];

// Génération automatique des commandes waifu interactives
waifuInteractions.forEach(({ cmd, desc, action }) => {
    King({
        cmd,
        desc,
        fromMe: wtype,
        type: "fun",
        react: "🎭"
    }, async (m, text) => {
        try {
            let target = m.mentionedJid[0] || m.quoted?.sender;
            let pic;
            
            try {
                pic = await fetchWaifu(cmd);
            } catch (waifuError) {
                // Fallback vers l'API waifu.pics
                const categories = ["waifu", "neko", "bully", "cuddle", "cry", "hug", "kiss", "lick", "pat", "smug", "bonk", "yeet", "blush", "smile", "wave", "highfive", "handhold", "nom", "bite", "glomp", "kill", "kick", "happy", "wink", "poke", "dance", "cringe"];
                const fallbackCategory = categories.includes(cmd) ? cmd : "waifu";
                
                const res = await fetch(`https://api.waifu.pics/sfw/${fallbackCategory}`);
                const json = await res.json();
                pic = { buff: json.url, gif: json.url.includes('.gif') };
            }

            if (!target) {
                // Si aucune cible, envoyer juste l'image
                const caption = `🎭 *${cmd.toUpperCase()}*\n\n✨ Action: ${action}`;
                if (pic.gif) {
                    return await m.send(pic.buff, { caption, gifPlayback: true }, "video");
                }
                return await m.send(pic.buff, { caption }, "image");
            }

            // Avec cible
            const senderName = m.pushName || m.sender.split("@")[0];
            const targetName = target.split("@")[0];
            const caption = `@${senderName} ${action} @${targetName}`;

            if (pic.gif) {
                return await m.send(pic.buff, {
                    caption,
                    gifPlayback: true,
                    mentions: [m.sender, target]
                }, "video");
            }
            
            return await m.send(pic.buff, {
                caption,
                mentions: [m.sender, target]
            }, "image");
            
        } catch (e) {
            await handleAnimeError(m, e, cmd);
        }
    });
});

// 🔹 COMMANDE D'AIDE ANIME
King({
    cmd: "animehelp",
    desc: "Afficher l'aide complète des commandes anime",
    fromMe: wtype,
    type: "anime",
    react: "❓"
}, async (m) => {
    const helpMessage = `
👑 *KING ANIME UNIVERSE - AIDE COMPLÈTE* 👑

🎌 *RECHERCHE & INFORMATION*
• .anime <nom> - Infos détaillées sur un anime
• .manga <nom> - Infos détaillées sur un manga  
• .character <nom> - Infos sur un personnage
• .animesearch (répondre à image) - Trouver un anime par image
• .animenews - Dernières tendances anime

💫 *DIVERTISSEMENT*
• .waifu [catégorie] - Image de waifu aléatoire
• .animegif [catégorie] - GIF anime aléatoire
• .animequote - Citation d'anime aléatoire

📺 *GESTION & PLANNING*
• .animewatch <anime> | <épisode> - Gérer sa watchlist
• .season <année> <saison> - Anime par saison
• .airing <anime> - Prochain épisode
• .animerec [anime] - Recommandations

🎭 *INTERACTIONS SOCIALES*
${waifuInteractions.slice(0, 10).map(i => `• .${i.cmd} [@mention] - ${i.desc}`).join('\n')}
• ...et ${waifuInteractions.length - 10} autres interactions !

💡 *Astuces:*
• Utilisez .animewatch sans argument pour voir votre liste
• Les commandes avec @mention fonctionnent en répondant aussi
• Le cache est activé pour des résultats plus rapides

👑 *KING TEAM 2025 - Votre univers anime préféré !*
    `.trim();

    await m.send(helpMessage);
});

module.exports = {
    animeWatchlist,
    handleAnimeError,
    getCachedData,
    setCachedData
};
