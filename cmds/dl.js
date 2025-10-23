/* 
 * 👑 KING DOWNLOADER UNIVERSE 2025
 * Module Téléchargeur Royal par Kervens
 * Sous licence GNU GPLv3
 * -------------------------------------------------------------------------------
 */

const { King, wtype, prefix, sleep, extractUrlsFromString, fb, ytaudio, config, ytvideo, xdl, tt, insta, mediaFire, rand, getBuffer } = require("../core");
const yts = require("yt-search");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 🔹 Cache pour optimiser les performances
const downloadCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// 🔹 Gestionnaire d'erreur amélioré
async function handleDownloadError(m, error, commandName) {
    console.error(`[DOWNLOAD ERROR] ${commandName}:`, error);
    
    const errorMessages = [
        "⚡ *Le téléchargement a échoué...* Réessayez !",
        "🌐 *Problème de connexion...* Vérifiez votre lien !",
        "💫 *Service temporairement indisponible...* Patientez !",
        "🔧 *Erreur technique...* Lien peut-être invalide !"
    ];
    
    const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    await m.send(`${randomError}\n\n_Erreur: ${error.message}_`);
}

// 🔹 Fonctions utilitaires de cache
function getCachedData(key) {
    const cached = downloadCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCachedData(key, data) {
    downloadCache.set(key, { data, timestamp: Date.now() });
}

// 🔹 Fonction de validation des URLs
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// 📱 COMMANDES APK

King({
    cmd: "apk",
    desc: "Télécharger une application Android",
    type: "downloader",
    fromMe: wtype,
    react: "📱"
}, async (m, text) => {
    try {
        if (!text) return await m.send("📱 *Veuillez fournir un nom d'application !*");
        
        await m.react("⏳");
        const cacheKey = `apk_${text}`;
        const cached = getCachedData(cacheKey);
        
        let data;
        if (cached) {
            data = cached;
        } else {
            data = await m.axios(`https://kord-api.vercel.app/apk?q=${text}`);
            setCachedData(cacheKey, data);
        }
        
        if (data.error) return await m.send("❌ *Application non trouvée !*");
        
        const cap = `📱 *DÉTAILS DE L'APPLICATION*\n\n` +
                   `🏷️ *Nom:* ${data.app_name}\n` +
                   `📦 *Package:* ${data.package_name}\n` +
                   `🔄 *Version:* ${data.version}\n` +
                   `📥 *Téléchargements:* ${data.downloads}\n\n` +
                   `${config().CAPTION || "👑 KING BOT 2025"}`;
        
        const buff = await getBuffer(data.download_url);
        await m.react("✅");
        await m.send(
            buff,
            {
                mimetype: "application/vnd.android.package-archive",
                fileName: `${data.app_name}.apk`,
                caption: cap,
                quoted: m
            },
            "document"
        );
        
    } catch (e) {
        await handleDownloadError(m, e, "apk");
    }
});

King({
    cmd: "apksearch",
    desc: "Rechercher et télécharger des applications Android",
    fromMe: wtype,
    type: "search",
    react: "🔍"
}, async (m, text) => {
    try {
        if (!text) return await m.send("🔍 *Veuillez fournir un nom d'application !*");
        
        if (text.startsWith("dl--")) {
            const q = text.replace("dl--", "");
            await m.send("📥 *Téléchargement de l'application...*");
            
            const data = await m.axios(`https://api.kordai.biz.id/apkdl?id=${q}`);
            if (data.error) return await m.send("❌ *Application non trouvée !*");
            
            const cap = `📱 *DÉTAILS DE L'APPLICATION*\n\n` +
                       `🏷️ *Nom:* ${data.name}\n` +
                       `📦 *Package:* ${data.package}\n` +
                       `🔄 *Version:* ${data.version}\n\n` +
                       `${config().CAPTION || "👑 KING BOT 2025"}`;
            
            const buff = await getBuffer(data.downloadUrl);
            await m.send(
                buff,
                {
                    mimetype: "application/vnd.android.package-archive",
                    fileName: `${data.name}.apk`,
                    caption: cap,
                    quoted: m
                },
                "document"
            );
        } else {
            const info = await m.axios(`https://api.kordai.biz.id/apksearch?query=${text}`);
            const formatted = info.splice(0, 10).map(app => ({
                name: app.name,
                id: `apksearch dl--${app.id}`
            }));

            return await m.send({
                name: `📱 Applications pour "${text}"`,
                values: formatted,
                onlyOnce: false,
                withPrefix: true,
                participates: [m.sender, m.ownerJid],
                selectableCount: true,
            }, { quoted: m }, "poll");
        }
    } catch (e) {
        await handleDownloadError(m, e, "apksearch");
    }
});

// 🎬 COMMANDES SOUS-TITRES

King({
    cmd: "subtitle",
    desc: "Télécharger des sous-titres anglais pour films",
    type: "downloader",
    fromMe: wtype,
    react: "🎬"
}, async (m, text) => {
    try {
        if (!text) return await m.send("🎬 *Veuillez fournir un nom de film !*");
        
        await m.react("⏳");
        const data = await m.axios(`https://kord-api.vercel.app/subtitle?q=${text}`);
        
        if (!data.downloadLinks || data.downloadLinks.length === 0 || 
            (data.title && data.title.toLowerCase().includes("tempête dans une tasse de thé"))) {
            return await m.send("❌ *API occupée ou sous-titre invalide. Réessayez plus tard.*");
        }
        
        const englishSub = data.downloadLinks.find(d => d.language.toLowerCase().includes("english"));
        if (!englishSub) return await m.send("❌ *Sous-titre anglais non trouvé !*");
        
        const caption = `🎬 *SOUS-TITRE ANGLAIS*\n\n` +
                       `📽️ *Titre:* ${data.title}\n` +
                       `🌐 *Langue:* Anglais\n\n` +
                       `${config().CAPTION || "👑 KING BOT 2025"}`;
        
        const buffer = await getBuffer(englishSub.url);
        await m.react("✅");
        await m.send(
            buffer,
            {
                mimetype: "application/x-subrip",
                fileName: `${data.title}-en.srt`,
                caption,
                quoted: m,
            },
            "document"
        );
    } catch (e) {
        await handleDownloadError(m, e, "subtitle");
    }
});

King({
    cmd: "subtitlesearch|subtitles",
    desc: "Rechercher des sous-titres sur SubtitleCat",
    fromMe: wtype,
    type: "search",
    react: "🔍"
}, async (m, text) => {
    try {
        if (!text) return await m.send("🔍 *Veuillez fournir un nom de film !*");
        
        if (text.startsWith("dl--")) {
            const pageUrl = decodeURIComponent(text.replace("d--", ""));
            
            if (pageUrl.toLowerCase().includes("tempête dans une tasse de thé")) {
                return await m.send("❌ *API occupée. Réessayez plus tard.*");
            }
            
            await m.send("🌐 *Recherche des langues disponibles...*");
            let data = await m.axios(`https://kord-api.vercel.app/subtiledl?q=${encodeURIComponent(pageUrl)}`);
            
            if (!Array.isArray(data) || data.length === 0) {
                return await m.send("❌ *Aucun sous-titre trouvé !*");
            }
            
            const english = data.find(d => d.language.toLowerCase().includes("english"));
            if (!english) return await m.send("❌ *Sous-titre anglais non disponible !*");
            
            const fileName = decodeURIComponent(pageUrl.split("/").pop().replace(".html", "-en.srt"));
            const buffer = await getBuffer(english.url);
            
            await m.send(
                buffer,
                {
                    mimetype: "application/x-subrip",
                    fileName: fileName,
                    caption: `🌐 *Langue:* Anglais\n\n${config().CAPTION || "👑 KING BOT 2025"}`,
                    quoted: m
                },
                "document"
            );
        } else {
            const info = await m.axios(`https://kord-api.vercel.app/subtitlepage?q=${text}`);
            
            if (!Array.isArray(info) || info.length === 0) {
                return await m.send("❌ *Aucun résultat trouvé !*");
            }
            
            const formatted = info.slice(0, 10).map(res => ({
                name: `${res.title} (${res.languagesSummary || "Multi-langues"})`,
                id: `apksearch dl--${encodeURIComponent(res.pageUrl)}`
            }));

            return await m.send({
                name: `🎬 Sous-titres pour "${text}"`,
                values: formatted,
                onlyOnce: false,
                withPrefix: true,
                participates: [m.sender, m.ownerJid],
                selectableCount: true,
            }, { quoted: m }, "poll");
        }
    } catch (e) {
        await handleDownloadError(m, e, "subtitlesearch");
    }
});

// 🎵 COMMANDES YOUTUBE

const youtubeCommands = [
    { cmd: "ytv|ytmp4", desc: "Télécharger vidéo YouTube par lien", type: "video" },
    { cmd: "yta|ytmp3", desc: "Télécharger audio YouTube par lien", type: "audio" },
    { cmd: "video|ytvideo", desc: "Télécharger vidéo YouTube par titre", type: "video" },
    { cmd: "play|music", desc: "Télécharger audio YouTube par titre", type: "audio" },
    { cmd: "videodoc|ytvideodoc", desc: "Télécharger vidéo YouTube en document", type: "video_doc" },
    { cmd: "playdoc|musicdoc", desc: "Télécharger audio YouTube en document", type: "audio_doc" },
    { cmd: "ytvdoc|ytmp4doc", desc: "Télécharger vidéo YouTube (lien) en document", type: "video_doc" },
    { cmd: "ytadoc|ytmp3doc", desc: "Télécharger audio YouTube (lien) en document", type: "audio_doc" }
];

youtubeCommands.forEach(({ cmd, desc, type }) => {
    King({
        cmd,
        desc,
        fromMe: wtype,
        type: "downloader",
        react: "🎵"
    }, async (m, text) => {
        try {
            let source = text || m.quoted?.text;
            if (!source) {
                return m.send(`🎵 *Format incorrect !*\n\n*Utilisation:* ${prefix}${cmd.split("|")[0]} <lien/texte>\n*Exemple:* ${prefix}${cmd.split("|")[0]} https://youtube.com/...`);
            }

            await m.react("⏳");
            
            // Extraction du lien YouTube
            let links = await extractUrlsFromString(source);
            const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
            let link = links.find(url => ytRegex.test(url));
            
            // Si pas de lien, recherche par texte
            if (!link) {
                let result = await yts(source);
                link = result.videos[0]?.url;
                if (!link) return m.send("❌ *Aucun résultat trouvé !*");
            }

            if (!ytRegex.test(link)) {
                return m.send("❌ *Lien YouTube invalide !*");
            }

            let data, caption, fileName;
            
            if (type.includes("video")) {
                data = await ytvideo(link);
                if (data.url.toLowerCase().includes("processing")) {
                    await sleep(1000);
                    data = await ytvideo(link);
                }
                
                if (type === "video") {
                    caption = `🎬 *${data.title}*\n\n${config().CAPTION || "👑 KING BOT 2025"}`;
                    await m.react("✅");
                    return await m.send(data.url, { caption, quoted: m }, "video");
                } else {
                    caption = `🎬 *${data.title}*\n\n${config().CAPTION || "👑 KING BOT 2025"}`;
                    fileName = `${data.title}.mp4`;
                    await m.react("✅");
                    return await m.send(data.url, { 
                        mimetype: "video/mp4", 
                        fileName, 
                        caption, 
                        quoted: m 
                    }, "document");
                }
            } else {
                data = await ytaudio(link);
                if (data.url.toLowerCase().includes("processing")) {
                    await sleep(1000);
                    data = await ytaudio(link);
                }
                
                if (type === "audio") {
                    await m.react("✅");
                    return await m.send(data.url, { 
                        ptt: false,
                        mimetype: 'audio/mpeg',
                        contextInfo: {
                            externalAdReply: {
                                title: data.title,
                                body: "🎵 Téléchargé via KING BOT",
                                mediaType: 1,
                                thumbnailUrl: data.thumbnail,
                                sourceUrl: link
                            }
                        }
                    }, "audio");
                } else {
                    await m.react("✅");
                    return await m.send(data.url, { 
                        ptt: false,
                        mimetype: 'audio/mpeg',
                        fileName: `${data.title}.mp3`,
                        caption: data.title,
                        contextInfo: {
                            externalAdReply: {
                                title: data.title,
                                body: "🎵 Téléchargé via KING BOT",
                                mediaType: 1,
                                thumbnailUrl: data.thumbnail,
                                sourceUrl: link
                            }
                        }
                    }, "document");
                }
            }
            
        } catch (e) {
            await handleDownloadError(m, e, cmd);
        }
    });
});

// 📱 COMMANDES RÉSEAUX SOCIAUX

const socialDownloaders = [
    { 
        cmd: "tt|tiktok", 
        desc: "Télécharger vidéos TikTok", 
        regex: /https:\/\/(?:www\.|vm\.|m\.|vt\.)?tiktok\.com\/(?:(@[\w.-]+\/(?:video|photo)\/\d+)|v\/\d+\.html|[\w-]+\/?)(?:\?.*)?$/,
        api: tt 
    },
    { 
        cmd: "tik-img|tt-img", 
        desc: "Télécharger images TikTok", 
        regex: /https:\/\/(?:www\.|vm\.|m\.|vt\.)?tiktok\.com\/(?:(@[\w.-]+\/(?:video|photo)\/\d+)|v\/\d+\.html|[\w-]+\/?)(?:\?.*)?$/,
        type: "image" 
    },
    { 
        cmd: "twitter|xdl", 
        desc: "Télécharger vidéos/images Twitter/X", 
        regex: /^(https?:\/\/)?(www\.)?(x\.com|twitter\.?com)\/.+$/,
        api: xdl 
    },
    { 
        cmd: "fb|facebook", 
        desc: "Télécharger vidéos Facebook", 
        regex: /^(https?:\/\/)?(www\.)?(fb\.com|facebook\.?com)\/.+$/,
        api: fb 
    },
    { 
        cmd: "insta|ig", 
        desc: "Télécharger vidéos/images Instagram", 
        regex: /^(https?:\/\/)?(www\.)?(ig\.com|instagram\.?com)\/.+$/,
        api: insta 
    }
];

socialDownloaders.forEach(({ cmd, desc, regex, api, type }) => {
    King({
        cmd,
        desc,
        fromMe: wtype,
        type: "downloader",
        react: "📱"
    }, async (m, text) => {
        try {
            let source = text || m.quoted?.text;
            if (!source) {
                return m.send(`📱 *Veuillez fournir un lien ${cmd.split("|")[0]} !*`);
            }

            await m.react("⏳");
            const links = await extractUrlsFromString(source);
            const link = links.find(url => regex.test(url));
            
            if (!link) return m.send("❌ *Lien invalide !*");

            if (type === "image") {
                // TikTok Images
                const response = await fetch(`https://kord-api.vercel.app/tik-img?url=${encodeURIComponent(link)}`);
                const data = await response.json();
                
                if (!data.downloadableImages || data.downloadableImages.length === 0) {
                    return m.send("❌ *Aucune image trouvée !*");
                }
                
                for (const imgUrl of data.downloadableImages) {
                    await m.send(imgUrl, { 
                        caption: `📸 ${config().CAPTION || "👑 KING BOT 2025"}` 
                    }, "image");
                }
                await m.react("✅");
                
            } else {
                // Autres réseaux sociaux
                const data = await api(link);
                
                if (cmd.includes("tiktok")) {
                    if (!data.success || !data.data) {
                        return m.send("❌ *Échec du téléchargement TikTok !*");
                    }
                    
                    const dlLink = data.data.downloadLinks[0]?.link;
                    if (!dlLink) return m.send("❌ *Lien de téléchargement non trouvé !*");
                    
                    await m.react("✅");
                    return await m.send(dlLink, {
                        caption: `🎵 ${data.data.title || "TikTok Video"}\n\n${config().CAPTION || "👑 KING BOT 2025"}`,
                        quoted: m
                    }, "video");
                    
                } else if (cmd.includes("twitter")) {
                    const dlUrl = data.links[0]?.url;
                    await m.react("✅");
                    return await m.client.sendFileUrl(m.chat, dlUrl, config().CAPTION || "👑 KING BOT 2025", m);
                    
                } else if (cmd.includes("facebook")) {
                    const video = data.data?.[0];
                    const dlUrl = video?.hdQualityLink || video?.normalQualityLink;
                    
                    if (!dlUrl) return m.send("❌ *Vidéo non trouvée !*");
                    
                    await m.react("✅");
                    return await m.send(dlUrl, { 
                        caption: config().CAPTION || "👑 KING BOT 2025" 
                    }, "video");
                    
                } else if (cmd.includes("insta")) {
                    const dlUrl = data.url || data.thumb;
                    await m.react("✅");
                    return await m.client.sendFileUrl(m.chat, dlUrl, config().CAPTION || "👑 KING BOT 2025", m);
                }
            }
            
        } catch (e) {
            await handleDownloadError(m, e, cmd);
        }
    });
});

// 📦 COMMANDES DIVERSES

King({
    cmd: "mediafire",
    desc: "Télécharger fichiers MediaFire",
    fromMe: wtype,
    type: "downloader",
    react: "📦"
}, async (m, text) => {
    try {
        let source = text || m.quoted?.text;
        if (!source) return m.send("📦 *Veuillez fournir un lien MediaFire !*");
        
        await m.react("⏳");
        const links = await extractUrlsFromString(source);
        const mfregex = /^(https?:\/\/)?(www\.)?(mediafire\.com)\/.+$/;
        const link = links.find(url => mfregex.test(url));
        
        if (!link) return m.send("❌ *Lien MediaFire invalide !*");
        
        const mfdl = await mediaFire(link);
        const caption = `📦 *MÉDIAFIRE DOWNLOADER*\n\n` +
                       `🏷️ *Nom:* ${mfdl.title}\n` +
                       `💾 *Taille:* ${mfdl.size}\n` +
                       `📅 *Date:* ${mfdl.time} - ${mfdl.date}\n\n` +
                       `${config().CAPTION || "👑 KING BOT 2025"}`;
        
        await m.react("✅");
        return await m.client.sendFileUrl(m.chat, mfdl.url, caption, m);
        
    } catch (e) {
        await handleDownloadError(m, e, "mediafire");
    }
});

King({
    cmd: "gitclone|gitdl",
    desc: "Télécharger dépôt GitHub",
    fromMe: wtype,
    type: "downloader",
    react: "💻"
}, async(m, text) => {
    try {
        let source = text || m.quoted?.text;
        if (!source) return await m.send("💻 *Veuillez fournir un lien GitHub !*");
        
        const links = await extractUrlsFromString(source);
        const gcregex = /^(https?:\/\/)?(www\.)?(github\.com)\/.+$/;
        const link = links.find(url => gcregex.test(url));
        
        if (!link) return await m.send("❌ *Lien GitHub invalide !*");
        
        const parts = link.split("/");
        const user = parts[3];
        const repo = parts[4];
        
        if (!user || !repo) return await m.send("❌ *Lien GitHub invalide !*");
        
        await m.react("⏳");
        await m.send(
            `https://api.github.com/repos/${user}/${repo}/zipball`,
            { 
                fileName: `${repo}-${rand()}.zip`,
                mimetype: "application/zip",
                quoted: m 
            },
            "document"
        );
        await m.react("✅");
        
    } catch(e) {
        await handleDownloadError(m, e, "gitclone");
    }
});

// 👤 COMMANDE PROFIL TÉLÉPHONE (NOUVELLE FONCTIONNALITÉ)

King({
    cmd: "getpp|getprofile",
    desc: "Récupérer photo de profil WhatsApp par numéro",
    fromMe: wtype,
    type: "tools",
    react: "👤"
}, async (m, text) => {
    try {
        if (!text) return await m.send("👤 *Veuillez fournir un numéro de téléphone !*\n\n*Format:* +33XXXXXXXXX ou 06XXXXXXXX");
        
        // Nettoyage du numéro
        let phoneNumber = text.trim().replace(/\s+/g, '');
        
        // Validation basique
        if (!phoneNumber.match(/^[\+]?[1-9][\d]{0,15}$/)) {
            return await m.send("❌ *Numéro de téléphone invalide !*\n\n*Formats acceptés:*\n• +33612345678\n• 0612345678\n• 33612345678");
        }

        await m.react("⏳");
        
        try {
            // Formatage pour l'ID WhatsApp
            let formattedNumber = phoneNumber;
            if (!formattedNumber.includes('@s.whatsapp.net')) {
                formattedNumber = formattedNumber.replace(/^0/, '33') + '@s.whatsapp.net';
                if (!formattedNumber.startsWith('+')) {
                    formattedNumber = '+' + formattedNumber;
                }
            }

            // Récupération du profil
            const profile = await m.client.profilePictureUrl(formattedNumber, 'image');
            
            if (!profile) {
                return await m.send("❌ *Photo de profil non trouvée ou compte privé !*");
            }

            const caption = `👤 *PROFIL WHATSAPP*\n\n` +
                           `📞 *Numéro:* ${phoneNumber}\n` +
                           `🖼️ *Photo de profil trouvée !*\n\n` +
                           `${config().CAPTION || "👑 KING BOT 2025"}`;

            await m.react("✅");
            return await m.send(profile, { caption }, "image");
            
        } catch (profileError) {
            if (profileError.message?.includes('404') || profileError.message?.includes('not found')) {
                return await m.send("❌ *Photo de profil non trouvée !*\n\n*Raisons possibles:*\n• Le compte n'existe pas\n• Photo de profil privée\n• Numéro invalide");
            }
            throw profileError;
        }
        
    } catch (e) {
        await handleDownloadError(m, e, "getpp");
    }
});

// 🆘 COMMANDE D'AIDE TÉLÉCHARGEUR

King({
    cmd: "downloadhelp|dlhelp",
    desc: "Aide complète pour les téléchargements",
    fromMe: wtype,
    type: "tools",
    react: "❓"
}, async (m) => {
    const helpMessage = `
👑 *KING DOWNLOADER UNIVERSE - AIDE COMPLÈTE* 👑

📱 **APPLICATIONS & FICHIERS**
• .apk <nom> - Télécharger application Android
• .apksearch <nom> - Rechercher applications
• .mediafire <lien> - Télécharger MediaFire
• .gitclone <lien> - Télécharger dépôt GitHub

🎬 **MÉDIAS & VIDÉOS**
• .ytv <lien/titre> - Vidéo YouTube
• .yta <lien/titre> - Audio YouTube
• .tt <lien> - Vidéo TikTok
• .fb <lien> - Vidéo Facebook
• .insta <lien> - Instagram
• .twitter <lien> - Twitter/X

🎵 **MUSIQUE & AUDIO**
• .play <titre> - Musique YouTube
• .playdoc <titre> - Musique en document
• Les commandes yta/ytmp3 pour liens

📄 **SOUS-TITRES**
• .subtitle <film> - Sous-titres anglais
• .subtitlesearch <film> - Rechercher sous-titres

👤 **OUTILS**
• .getpp <numéro> - Photo de profil WhatsApp

💡 **ASTUCES:**
• Répondez à un message contenant un lien
• Les recherches YouTube fonctionnent par titre
• Cache activé pour téléchargements rapides

👑 *KING TEAM 2025 - Téléchargement royal !*
    `.trim();

    await m.send(helpMessage);
});

module.exports = {
    handleDownloadError,
    getCachedData,
    setCachedData,
    isValidUrl
};
