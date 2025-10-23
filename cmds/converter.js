/* 
 * 👑 KING CONVERTER UNIVERSE 2025
 * Module Convertisseur Royal par Kervens
 * Sous licence GNU GPLv3
 * -------------------------------------------------------------------------------
 */

const { King, webp2png, webp2mp4, elevenlabs, rand, getBuffer, toAudio, config, processAudio, extractUrlsFromString, toPTT, isMediaURL, wtype } = require("../core");
const { Sticker, StickerTypes } = require("wa-sticker-formatter");
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const { Image } = require("node-webpmux");
const ff = require("fluent-ffmpeg");
const path = require('path');
const { read } = require('jimp');
const { fromBuffer } = require('file-type');

// 🔹 Cache pour optimiser les performances
const converterCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// 🔹 Gestionnaire d'erreur amélioré
async function handleConverterError(m, error, commandName) {
    console.error(`[CONVERTER ERROR] ${commandName}:`, error);
    
    const errorMessages = [
        "⚡ *La conversion a échoué...* Réessayez !",
        "🎨 *La magie des médias a échoué...* Nouvel essai ?",
        "💫 *Problème de conversion...* Patientez un instant !",
        "🔧 *Erreur technique...* Vérifiez le format du média !"
    ];
    
    const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    await m.send(`${randomError}\n\n_Erreur: ${error.message}_`);
}

// 🔹 Fonction utilitaire pour le cache
function getCachedData(key) {
    const cached = converterCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCachedData(key, data) {
    converterCache.set(key, { data, timestamp: Date.now() });
}

// 🎨 COMMANDES DE CONVERSION PRINCIPALES

King({
    cmd: "sticker|s|stk",
    desc: "Convertir un média en sticker personnalisé",
    fromMe: wtype,
    type: "converter",
    react: "🎨"
}, async (m, text) => {
    try {
        if (!(m.image || m.video || m.quoted?.video || m.quoted?.image)) {
            return await m.send("🎨 *Veuillez répondre à une photo ou une vidéo !*");
        }
        
        let buff = await m.client.downloadMediaMessage(
            (m.image || m.video) ? m : m.quoted ? m.quoted : null
        );
        
        let stkpack, stkauthor;
        
        if (text) {
            if (text.includes(',') || text.includes(';') || text.includes('|')) {
                const parts = text.split(/[,;|]/).map(s => s.trim());
                stkpack = parts[0] || config().STICKER_PACKNAME || "KING Pack";
                stkauthor = parts[1] || config().STICKER_AUTHOR || "KING Team";
            } else {
                stkpack = text.trim();
                stkauthor = "KING Team";
            }
        } else {
            stkpack = config().STICKER_PACKNAME || "KING Pack";
            stkauthor = config().STICKER_AUTHOR || "KING Team";
        }
        
        await m.react("✅");
        return await m.sendstk(buff, { 
            packname: stkpack, 
            author: stkauthor 
        });
        
    } catch (e) {
        await handleConverterError(m, e, "sticker");
    }
});

King({
    cmd: "photo|toimg",
    desc: "Convertir un sticker en image",
    fromMe: wtype,
    type: "converter",
    react: "🖼️"
}, async (m, text) => {
    try {
        if (!m.quoted?.sticker) {
            return await m.send("🖼️ *Veuillez répondre à un sticker !*");
        }
        if (m.quoted.isAnimated) {
            return await m.send("🎬 *Veuillez répondre à un sticker photo (non animé) !*");
        }
        
        await m.react("⏳");
        let buff = await m.quoted.download();
        await m.react("✅");
        return m.send(buff, {}, "image");
        
    } catch (e) {
        await handleConverterError(m, e, "photo");
    }
});

King({
    cmd: "mp4",
    desc: "Convertir un sticker animé en vidéo",
    fromMe: wtype,
    type: "converter",
    react: "🎬"
}, async (m, text) => {
    try {
        if (!m.quoted?.sticker) {
            return await m.send("🎬 *Veuillez répondre à un sticker animé !*");
        }
        if (!m.quoted.isAnimated) {
            return await m.send("🖼️ *Veuillez répondre à un sticker animé (vidéo) !*");
        }
        
        await m.react("⏳");
        let buffer = await webp2mp4(await m.quoted.download());
        await m.react("✅");
        return await m.send(buffer, {}, "video");
        
    } catch (e) {
        await handleConverterError(m, e, "mp4");
    }
});

King({
    cmd: "gif",
    desc: "Convertir un sticker animé en GIF",
    fromMe: wtype,
    type: "converter",
    react: "🌀"
}, async (m, text) => {
    try {
        if (!m.quoted?.sticker) {
            return await m.send("🌀 *Veuillez répondre à un sticker animé !*");
        }
        if (!m.quoted.isAnimated) {
            return await m.send("🖼️ *Veuillez répondre à un sticker animé !*");
        }
        
        await m.react("⏳");
        let buffer = await webp2mp4(await m.quoted.download());
        await m.react("✅");
        return await m.send(buffer, { gifPlayback: true }, "video");
        
    } catch (e) {
        await handleConverterError(m, e, "gif");
    }
});

King({
    cmd: "tomp3|toaudio",
    desc: "Convertir une vidéo en audio MP3",
    fromMe: wtype,
    type: "converter",
    react: "🎵"
}, async (m, text) => {
    try {
        if (!m.quoted?.video) {
            return await m.send("🎵 *Veuillez répondre à une vidéo !*");
        }
        
        await m.react("⏳");
        var au = await toAudio(await m.quoted.download(), "mp3");
        await m.react("✅");
        return await m.send(au, { ptt: false }, "audio");
        
    } catch (er) {
        await handleConverterError(m, er, "tomp3");
    }
});

King({
    cmd: "ptv",
    desc: "Convertir une vidéo en message PTV (Play Once)",
    fromMe: wtype,
    type: "converter",
    react: "📹"
}, async (m, text) => {
    try {
        if (!m.quoted?.video) {
            return await m.send("📹 *Veuillez répondre à une vidéo !*");
        }
        
        await m.react("⏳");
        var vid = await m.quoted.download();
        await m.react("✅");
        return await m.send(vid, { ptv: true }, 'video');
        
    } catch (e) {
        await handleConverterError(m, e, "ptv");
    }
});

// 🎵 COMMANDES AUDIO AVANCÉES

const audioEffects = [
    {
        cmd: "bass",
        desc: "Appliquer un effet basse puissant",
        filter: ["-af", "equalizer=f=54:width_type=o:width=2:g=20"]
    },
    {
        cmd: "deep",
        desc: "Rendre la voix plus grave",
        filter: ["-af", "atempo=4/4,asetrate=44500*2/3"]
    },
    {
        cmd: "fast",
        desc: "Accélérer l'audio",
        filter: ["-filter:a", "atempo=1.63,asetrate=44100"]
    },
    {
        cmd: "slow",
        desc: "Ralentir l'audio",
        filter: ["-filter:a", "atempo=0.7,asetrate=44100"]
    },
    {
        cmd: "chipmunk",
        desc: "Effet voix de chipmunk",
        filter: ["-filter:a", "atempo=0.8,asetrate=65100*1.3"]
    },
    {
        cmd: "robot",
        desc: "Effet voix robotique",
        filter: ["-af", "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75"]
    },
    {
        cmd: "echo",
        desc: "Ajouter un effet d'écho",
        filter: ["-af", "aecho=0.8:0.9:1000:0.3"]
    },
    {
        cmd: "reverse",
        desc: "Inverser l'audio",
        filter: ["-filter_complex", "areverse"]
    },
    {
        cmd: "nightcore",
        desc: "Effet nightcore",
        filter: ["-filter:a", "atempo=1.06,asetrate=44100*1.25"]
    },
    {
        cmd: "8d",
        desc: "Effet audio 8D surround",
        filter: ["-af", "apulsator=hz=0.125"]
    },
    {
        cmd: "vibrato",
        desc: "Effet vibrato",
        filter: ["-af", "vibrato=f=7:d=0.5"]
    },
    {
        cmd: "tremolo",
        desc: "Effet tremolo",
        filter: ["-af", "tremolo=f=6:d=0.5"]
    },
    {
        cmd: "flanger",
        desc: "Effet flanger",
        filter: ["-af", "flanger=delay=5:depth=2:regen=5:width=5:speed=2:shape=sine:phase=90:interp=linear"]
    },
    {
        cmd: "earrape",
        desc: "Effet volume extrême (attention!)",
        filter: ["-af", "volume=12"]
    },
    {
        cmd: "smooth",
        desc: "Effet audio lissé",
        filter: ["-af", "asubboost=dry=0:wet=1:decay=0.1:feedback=0.1:cutoff=100:slope=0.5:delay=20"]
    }
];

// Génération automatique des commandes d'effets audio
audioEffects.forEach(({ cmd, desc, filter }) => {
    King({
        cmd,
        desc,
        fromMe: wtype,
        type: "converter",
        react: "🎵"
    }, async (m, text) => {
        try {
            if (!m.quoted?.audio) {
                return await m.send(`🎵 *Veuillez répondre à un audio pour appliquer l'effet ${cmd} !*`);
            }
            
            await m.react("⏳");
            const outputPath = await processAudio(m, cmd, filter);
            
            await m.client.sendMessage(m.chat, {
                audio: fs.readFileSync(outputPath),
                mimetype: 'audio/mp4',
                ptt: false
            }, { quoted: m });
            
            fs.unlinkSync(outputPath);
            await m.react("✅");
            
        } catch (e) {
            await handleConverterError(m, e, cmd);
        }
    });
});

// 🎭 COMMANDES STICKERS SPÉCIALISÉS

King({
    cmd: "roundstk|round",
    desc: "Créer un sticker avec bordure arrondie",
    fromMe: wtype,
    type: "converter",
    react: "🔵"
}, async (m, text) => {
    try {
        if (!(m.image || m.quoted?.sticker || m.quoted?.image)) {
            return await m.send("🔵 *Veuillez répondre à une photo ou un sticker !*");
        }
        if (m.quoted?.isAnimated) {
            return await m.send("🎬 *Veuillez répondre à un sticker photo !*");
        }
        
        var media = await m.client.downloadMediaMessage(
            m.image ? m : m.quoted ? m.quoted : null
        );
        
        let stkpack, stkauthor;
        
        if (text) {
            if (text.includes(',') || text.includes(';') || text.includes('|')) {
                const parts = text.split(/[,;|]/).map(s => s.trim());
                stkpack = parts[0] || config().STICKER_PACKNAME || "KING Round";
                stkauthor = parts[1] || config().STICKER_AUTHOR || "KING Team";
            } else {
                stkpack = text.trim();
                stkauthor = "KING Team";
            }
        } else {
            stkpack = config().STICKER_PACKNAME || "KING Round";
            stkauthor = config().STICKER_AUTHOR || "KING Team";
        }
        
        await m.react("⏳");
        let sticker = new Sticker(media, {
            pack: stkpack,
            author: stkauthor,
            type: StickerTypes.ROUNDED,
            categories: ["🤩", "🎉"],
            id: "https://github.com/Kervens2023/KING-BOT",
            quality: 75,
        });
        
        const buffer = await sticker.toBuffer();
        await m.react("✅");
        await m.send(buffer, { packname: stkpack, author: stkauthor }, "sticker");
        
    } catch (e) {
        await handleConverterError(m, e, "roundstk");
    }
});

King({
    cmd: "circlestk|circle",
    desc: "Créer un sticker circulaire",
    fromMe: wtype,
    type: "converter",
    react: "⭕"
}, async (m, text) => {
    try {
        if (!(m.image || m.quoted?.sticker || m.quoted?.image)) {
            return await m.send("⭕ *Veuillez répondre à une photo ou un sticker !*");
        }
        if (m.quoted?.isAnimated) {
            return await m.send("🎬 *Veuillez répondre à un sticker photo !*");
        }
        
        var media = await m.client.downloadMediaMessage(
            m.image ? m : m.quoted ? m.quoted : null
        );
        
        let stkpack, stkauthor;
        
        if (text) {
            if (text.includes(',') || text.includes(';') || text.includes('|')) {
                const parts = text.split(/[,;|]/).map(s => s.trim());
                stkpack = parts[0] || config().STICKER_PACKNAME || "KING Circle";
                stkauthor = parts[1] || config().STICKER_AUTHOR || "KING Team";
            } else {
                stkpack = text.trim();
                stkauthor = "KING Team";
            }
        } else {
            stkpack = config().STICKER_PACKNAME || "KING Circle";
            stkauthor = config().STICKER_AUTHOR || "KING Team";
        }
        
        await m.react("⏳");
        let sticker = new Sticker(media, {
            pack: stkpack,
            author: stkauthor,
            type: StickerTypes.CIRCLE,
            categories: ["🤩", "🎉"],
            id: "https://github.com/Kervens2023/KING-BOT",
            quality: 75,
        });
        
        const buffer = await sticker.toBuffer();
        await m.react("✅");
        await m.send(buffer, { packname: stkpack, author: stkauthor }, "sticker");
        
    } catch (e) {
        await handleConverterError(m, e, "circlestk");
    }
});

// 🔧 COMMANDES DE MÉTADONNÉES ET VOLUME

King({
    cmd: "take|steal",
    desc: "Modifier les métadonnées d'un sticker ou audio",
    fromMe: wtype,
    type: "converter",
    react: "🎭"
}, async(m, text) => {
    try {
        if (!(m.quoted?.sticker || m.quoted?.audio)) {
            return await m.send("🎭 *Veuillez répondre à un sticker ou un audio !*");
        }
        
        if (m.quoted.sticker) {
            let stkpack, stkauthor;
            
            if (text) {
                if (text.includes(',') || text.includes(';') || text.includes('|')) {
                    const parts = text.split(/[,;|]/).map(s => s.trim());
                    stkpack = parts[0] || config().STICKER_PACKNAME || "KING Stolen";
                    stkauthor = parts[1] || config().STICKER_AUTHOR || "KING Team";
                } else {
                    stkpack = text.trim();
                    stkauthor = "KING Team";
                }
            } else {
                stkpack = config().STICKER_PACKNAME || "KING Stolen";
                stkauthor = config().STICKER_AUTHOR || "KING Team";
            }
            
            await m.react("⏳");
            await m.send(await m.quoted.download(), {packname: stkpack, author: stkauthor}, "sticker");
            await m.react("✅");
            
        } else if (m.quoted.audio) {
            let data;
            var buf = await m.quoted.download();
            const audioBuffer = Buffer.from(buf);
            const audioResult = await toAudio(audioBuffer, 'mp4');
            
            if (text) {
                data = text.split(";");
            } else {
                data = config().AUDIO_DATA?.split(";") || ["KING BOT", "v2", "https://cdn.kordai.biz.id/serve/tuNyPANPYD2v.png"];
            }
            
            const title = data[0] || "KING BOT";
            const artist = data[1] || "v2";
            const coverUrl = data[2] || "https://cdn.kordai.biz.id/serve/tuNyPANPYD2v.png";
            
            try {
                await m.react("⏳");
                const audioBase64 = audioResult.toString('base64');
                
                const response = await fetch('https://kord-api.vercel.app/add-mp3-meta', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        songUrl: `data:audio/mp4;base64,${audioBase64}`,
                        coverUrl: coverUrl,
                        title: title,
                        artist: artist
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Échec de la requête API');
                }
                
                const taggedAudio = await response.buffer();
                await m.react("✅");
                await m.send(taggedAudio, { mimetype: "audio/mp4" }, "audio");
            } catch (error) {
                console.error('Erreur API:', error);
                await m.send(audioResult, { mimetype: "audio/mp4" }, "audio");
            }
        }
        
    } catch (e) {
        await handleConverterError(m, e, "take");
    }
});

King({
    cmd: "exif",
    desc: "Afficher les métadonnées EXIF d'un sticker",
    fromMe: wtype,
    type: "converter",
    react: "📊"
}, async (m, text) => {
    try {
        if (!m.quoted?.sticker) {
            return await m.send("📊 *Veuillez répondre à un sticker !*");
        }
        
        await m.react("⏳");
        let img = new Image();
        await img.load(await m.quoted.download());
        const exif = JSON.parse(img.exif.slice(22).toString());
        const stickerPackId = exif['sticker-pack-id'];
        const stickerPackName = exif['sticker-pack-name'];
        const stickerPackPublisher = exif['sticker-pack-publisher'];
        
        const cap = `📊 *MÉTADONNÉES DU STICKER*\n\n` +
                   `🆔 *ID du Pack:* ${stickerPackId}\n` +
                   `📦 *Nom du Pack:* ${stickerPackName}\n` +
                   `👤 *Éditeur:* ${stickerPackPublisher}`;
        
        await m.react("✅");
        return m.send(cap);
        
    } catch (e) {
        await handleConverterError(m, e, "exif");
    }
});

// 🗣️ COMMANDES SYNTHÈSE VOCALE

King({
    cmd: "aitts|tts",
    desc: "Synthèse vocale IA avec différentes voix",
    fromMe: wtype,
    type: "converter",
    react: "🗣️"
}, async (m, text, cmd) => {
    try {
        if (text == 'list') {
            const voicesList = `
🗣️ *LISTE DES VOIX DISPONIBLES*

👩‍💼 **Voix Féminines:**
1. rachel | 2. domi | 3. bella | 4. emily
5. elli | 6. dorothy | 7. charlotte | 8. matilda
9. gigi | 10. freya | 11. grace | 12. serena
13. nicole | 14. jessie | 15. mimi | 16. glinda

👨‍💼 **Voix Masculines:**
17. clyde | 18. dave | 19. fin | 20. antoni
21. thomas | 22. charlie | 23. callum | 24. patrick
25. harry | 26. liam | 27. josh | 28. arnold
29. matthew | 30. james | 31. joseph | 32. jeremy
33. michael | 34. ethan | 35. daniel | 36. adam
37. ryan | 38. sam | 39. giovanni

💡 *Utilisation:* ${cmd} votre texte|nom_voix
*Exemple:* ${cmd} Bonjour le monde|jeremy
            `.trim();
            
            return await m.send(voicesList);
        }
        
        let [txt, id] = text.split("|");
        if (!txt) {
            return await m.send(`🗣️ *Format incorrect !*\n\n*Utilisation:* ${cmd} texte|voix\n*Exemple:* ${cmd} Bonjour tout le monde|jeremy\n\n📖 Pour voir la liste: *${cmd} list*`);
        }
        if (!id) id = "jeremy";
        
        await m.react("⏳");
        const stream = await elevenlabs(txt, id);
        
        if (!stream) {
            return await m.send(`🔑 *Clé API manquante ou invalide !*\n\nObtenez une clé sur: https://elevenlabs.io/app/settings/api-keys\nPuis configurez avec: .setting ELEVENLABS_APIKEY votre_clé`);
        }
        
        await m.react("✅");
        return await m.send(stream, { mimetype: 'audio/mpeg', ptt: true }, 'audio');
        
    } catch (e) {
        await handleConverterError(m, e, "aitts");
    }
});

// 📄 COMMANDES DE DOCUMENTS

King({
    cmd: "doc|document",
    desc: "Convertir un média en document",
    fromMe: wtype,
    type: "converter",
    react: "📄"
}, async (m, text) => {
    try {
        if (!(m.image || m.video || m.quoted?.image || m.quoted?.video || m.quoted?.audio)) {
            return await m.send("📄 *Veuillez répondre à une image, audio ou vidéo !*");
        }
        
        var name = (text || await rand()).replace(/[^A-Za-z0-9]/g,'-');
        var msg = (m.image || m.video) ? m : m.quoted ? m.quoted : null;
        var media = await m.client.downloadMediaMessage(msg);
        const { ext, mime } = await fromBuffer(media);
        
        await m.react("✅");
        return await m.send(media, { 
            mimetype: mime, 
            fileName: `king_${name}.${ext}` 
        }, "document");
        
    } catch (e) {
        await handleConverterError(m, e, "doc");
    }
});

King({
    cmd: "tovv|viewonce",
    desc: "Convertir un média en message à visualisation unique",
    fromMe: wtype,
    type: "converter",
    react: "👁️"
}, async (m, text) => {
    try {
        if (!(m.image || m.video || m.quoted?.image || m.quoted?.video || m.quoted?.audio)) {
            return await m.send("👁️ *Veuillez répondre à un média !*");
        }
        
        var media = (m.image || m.video) ? m : m.quoted ? m.quoted : null;
        var buf = await m.client.downloadMediaMessage(media);
        
        await m.react("⏳");
        
        if (m.image || m.quoted?.image) {
            await m.send(buf, { viewOnce: true }, "image");
        } else if (m.video || m.quoted?.video) {
            await m.send(buf, { viewOnce: true }, "video");
        } else if (m.quoted?.audio) {
            await m.send(buf, { viewOnce: true }, "audio");
        }
        
        await m.react("✅");
        
    } catch (e) {
        await handleConverterError(m, e, "tovv");
    }
});

// 🎨 COMMANDE BLACK (VIDÉO NOIRE AVEC AUDIO)

King({
    cmd: "black|blackvideo",
    desc: "Créer une vidéo noire avec audio",
    fromMe: wtype,
    type: "converter",
    react: "⬛"
}, async (m, text) => {
    try {
        if (!m.quoted?.audio) {
            return m.send("⬛ *Veuillez répondre à un audio !*");
        }
        
        const args = text?.trim()?.split(/\s+/);
        const ffmpegg = ff();
        let file = path.join(__dirname, '../core/store/black.jpg');
        
        // Créer l'image noire si elle n'existe pas
        if (!fs.existsSync(file)) {
            const blackImg = await getBuffer("https://cdn.kordai.biz.id/serve/n2BwUtItyeae.jpg");
            fs.writeFileSync(file, blackImg);
        }
        
        await m.react("⏳");
        
        if (args[0] && await isMediaURL(args[0])) {
            const buff = await getBuffer(extractUrlsFromString(args)[0]);
            const readed = await read(buff);
            
            if (readed.getWidth() != readed.getHeight()) {
                return await m.send('⬛ *La largeur et la hauteur de l\'image doivent être identiques !*');
            }
            
            const { mime } = await fromBuffer(buff);
            if (!['jpg', 'jpeg', 'png'].includes(mime.split('/')[1])) {
                return await m.send("⬛ *Veuillez fournir une URL d\'image valide !*");
            }
            
            file = '../core/store/' + mime.replace('/', '.');
            fs.writeFileSync(file, buff);
        }
        
        const audioFile = path.join(__dirname, '../core/store/audio.mp3');
        var buf = await m.quoted.download();
        fs.writeFileSync(audioFile, buf);
        
        const Opath = path.join(__dirname, '../core/store/videoMixed.mp4');
        
        ffmpegg.input(file)
              .input(audioFile)
              .output(Opath)
              .on('end', async () => {
                  await m.send(fs.readFileSync(Opath), {}, 'video');
                  fs.unlinkSync(audioFile);
                  fs.unlinkSync(Opath);
                  await m.react("✅");
              })
              .on('error', async (err) => {
                  await m.send(`❌ *Erreur de conversion:* ${err}`);
              })
              .run();
              
    } catch (e) {
        await handleConverterError(m, e, "black");
    }
});

// 🆘 COMMANDE D'AIDE CONVERTER

King({
    cmd: "converterhelp|conversion",
    desc: "Aide complète pour les commandes de conversion",
    fromMe: wtype,
    type: "converter",
    react: "❓"
}, async (m) => {
    const helpMessage = `
👑 *KING CONVERTER UNIVERSE - AIDE COMPLÈTE* 👑

🎨 **STICKERS & IMAGES**
• .sticker [texte] - Convertir en sticker
• .photo - Sticker vers image
• .mp4 - Sticker animé vers vidéo
• .gif - Sticker animé vers GIF
• .roundstk - Sticker bordure arrondie
• .circlestk - Sticker circulaire

🎵 **AUDIO & EFFETS**
• .tomp3 - Vidéo vers MP3
• .bass .deep .fast .slow - Effets audio
• .robot .chipmunk - Effets voix
• .echo .reverse .8d - Effets spéciaux
• .nightcore - Effet nightcore
• .aitts texte|voix - Synthèse vocale

📄 **DOCUMENTS & MÉDIAS**
• .doc [nom] - Convertir en document
• .tovv - Média à vue unique
• .ptv - Vidéo PTV (Play Once)
• .black - Vidéo noire avec audio

🔧 **OUTILS AVANCÉS**
• .take texte - Modifier métadonnées
• .exif - Voir infos sticker
• .aitts list - Liste des voix TTS

💡 **ASTUCES:**
• Utilisez , ou | pour séparer packname et auteur
• Les effets audio fonctionnent sur les messages vocaux
• Le cache est activé pour des conversions rapides

👑 *KING TEAM 2025 - Conversion royale !*
    `.trim();

    await m.send(helpMessage);
});

module.exports = {
    handleConverterError,
    getCachedData,
    setCachedData,
    audioEffects
};
