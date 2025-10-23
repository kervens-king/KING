/* 
 * 👑 KING TEXTMAKER UNIVERSE 2025
 * Module Créateur de Textes Royal par Kervens
 * Sous licence GNU GPLv3
 * -------------------------------------------------------------------------------
 */

const { King, config, prefix, wtype, textMaker } = require("../core");
const fetch = require('node-fetch');

// 🔹 Cache pour optimiser les performances
const textmakerCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// 🔹 Gestionnaire d'erreur amélioré
async function handleTextmakerError(m, error, commandName) {
    console.error(`[TEXTMAKER ERROR] ${commandName}:`, error);
    
    const errorMessages = [
        "🎨 *La création a échoué...* Réessayez !",
        "✨ *La magie des effets a échoué...* Nouvel essai ?",
        "💫 *Problème de génération...* Vérifiez votre texte !",
        "🔧 *Erreur technique...* Service temporairement indisponible"
    ];
    
    const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    await m.send(`${randomError}\n\n_Erreur: ${error.message}_`);
}

// 🔹 Fonctions utilitaires de cache
function getCachedData(key) {
    const cached = textmakerCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCachedData(key, data) {
    textmakerCache.set(key, { data, timestamp: Date.now() });
}

// 🔹 Fonction de création de commandes améliorée
const createCmd = (name, effectUrl, emoji, description, options = {}) => {
    King({
        cmd: name.toLowerCase(),
        desc: `Crée ${description} avec effet visuel`,
        type: "textmaker",
        fromMe: wtype,
        react: emoji
    }, async (m, text) => {
        try {
            const joinedText = text || "";
            const hasSemicolon = joinedText.includes(';');
            let textInputs = [];
            let radioOption = null;
            
            // Traitement des arguments
            if (hasSemicolon) {
                const splitInputs = joinedText.split(';').map(item => item.trim()).filter(item => item !== '');
                
                if (options.hasRadio && splitInputs.length > 0) {
                    const lastItem = splitInputs[splitInputs.length - 1];
                    if (/^\d+$/.test(lastItem)) {
                        radioOption = lastItem;
                        textInputs = splitInputs.slice(0, splitInputs.length - 1);
                    } else {
                        textInputs = splitInputs;
                    }
                } else {
                    textInputs = splitInputs;
                }
            } else {
                textInputs = joinedText ? [joinedText] : [];
            }
            
            // Validation des arguments
            if (options.needsMultipleTexts && textInputs.length < options.numTexts) {
                let radioOptionsList = "";
                if (options.hasRadio) {
                    radioOptionsList = "\n🎯 *Options disponibles:*\n" +
                        options.radioOptions.map((ro, index) => `• *${index + 1}* - ${ro.dataTitle}`).join("\n");
                }
                
                const exampleTexts = Array.from({length: options.numTexts}, (_, i) => `texte${i+1}`).join(';');
                const example = `${prefix}${name} ${exampleTexts}${options.hasRadio ? ';1' : ''}`;
                
                await m.send(
                    `📝 *Arguments manquants pour ${emoji} ${name}*\n\n` +
                    `ℹ️ *Description:* ${description}\n\n` +
                    `🔧 *Utilisation:*\n\`\`\`${example}\`\`\`\n` +
                    `📋 *Textes requis:* ${options.numTexts} texte(s)${radioOptionsList}\n\n` +
                    `💡 *Exemple complet:*\n\`\`\`${prefix}${name} KING;BOT${options.numTexts > 2 ? ';TEAM' : ''}${options.hasRadio ? ';1' : ''}\`\`\``
                );
                return;
                
            } else if (!options.needsMultipleTexts && textInputs.length === 0 && !options.hasRadio) {
                await m.send(
                    `📝 *Texte manquant pour ${emoji} ${name}*\n\n` +
                    `ℹ️ *Description:* ${description}\n\n` +
                    `🔧 *Utilisation:*\n\`\`\`${prefix}${name} Votre Texte\`\`\`\n\n` +
                    `💡 *Exemple:*\n\`\`\`${prefix}${name} KING BOT\`\`\``
                );
                return;
            }
            
            // Validation des options radio
            if (options.hasRadio) {
                if (!radioOption) {
                    let radioOptionsList = "\n🎯 *Options disponibles:*\n" +
                        options.radioOptions.map((ro, index) => `• *${index + 1}* - ${ro.dataTitle}`).join("\n");
                    
                    const exampleTexts = options.needsMultipleTexts ? 
                        Array.from({length: options.numTexts}, (_, i) => `texte${i+1}`).join(';') : "Votre Texte";
                    
                    await m.send(
                        `⚙️ *Option manquante pour ${emoji} ${name}*\n\n` +
                        `🔧 *Utilisation correcte:*\n\`\`\`${prefix}${name} ${exampleTexts};1\`\`\`\n` +
                        `${radioOptionsList}\n\n` +
                        `💡 *Choisissez un numéro de style*`
                    );
                    return;
                }
                
                const radioIndex = parseInt(radioOption);
                if (isNaN(radioIndex) || radioIndex < 1 || radioIndex > options.radioOptions.length) {
                    await m.send(
                        `❌ *Option invalide pour ${emoji} ${name}*\n\n` +
                        `📋 *Options valides:* 1 à ${options.radioOptions.length}\n\n` +
                        `🎯 *Styles disponibles:*\n` +
                        options.radioOptions.map((ro, index) => `• *${index + 1}* - ${ro.dataTitle}`).join("\n")
                    );
                    return;
                }
            }
            
            // Génération de l'effet
            await m.react("⏳");
            
            const cacheKey = `${name}_${textInputs.join('_')}_${radioOption || ''}`;
            const cached = getCachedData(cacheKey);
            
            let result;
            if (cached) {
                result = cached;
            } else {
                try {
                    if (options.hasRadio) {
                        const radioIndex = parseInt(radioOption);
                        const selectedOption = options.radioOptions[radioIndex - 1];
                        
                        const radioParams = {
                            [options.radioName]: selectedOption.dataTitle.toLowerCase()
                        };
                        
                        result = await textMaker(
                            effectUrl, 
                            options.needsMultipleTexts ? textInputs : [textInputs[0]], 
                            radioParams
                        );
                    } else {
                        result = await textMaker(
                            effectUrl, 
                            options.needsMultipleTexts ? textInputs : [textInputs[0]]
                        );
                    }
                    
                    if (!result.status || !result.url) {
                        throw new Error('Échec de la génération de l\'effet');
                    }
                    
                    setCachedData(cacheKey, result);
                    
                } catch (apiError) {
                    await handleTextmakerError(m, apiError, name);
                    return;
                }
            }
            
            await m.react("✅");
            
            const caption = `🎨 *${name.toUpperCase()}* - ${description}\n` +
                          `✨ Généré par KING TextMaker\n\n` +
                          `${config().CAPTION || "👑 KING BOT 2025"}`;
            
            await m.send(result.url, { caption }, "image");
            
        } catch (error) {
            await handleTextmakerError(m, error, name);
        }
    });
};

// 🎨 CATÉGORIE : EFFETS DE LUMIÈRE ET NÉON
createCmd("neonlight", "https://en.ephoto360.com/create-light-effects-green-neon-online-429.html", "💡", "effet texte néon vert lumineux", {
    needsMultipleTexts: false,
    numTexts: 1
});

createCmd("neontext", "https://en.ephoto360.com/neon-text-effect-online-78.html", "💡", "effet texte néon double", {
    needsMultipleTexts: true,
    numTexts: 2
});

createCmd("glow", "https://en.ephoto360.com/create-multicolored-neon-light-signatures-591.html", "✨", "signature lumineuse néon multicolore", {
    hasRadio: true,
    radioName: "radio0",
    radioOptions: [
        { name: "radio0[radio]", value: "188eb364-5a04-446e-a779-0e2f427b7bc3", dataTitle: "Style 1" },
        { name: "radio0[radio]", value: "a35d8b0d-bb89-4718-8723-71c5a9e9de4a", dataTitle: "Style 2" },
        { name: "radio0[radio]", value: "3938db27-c48c-4d96-ab60-f1bd1e312abf", dataTitle: "Style 3" }
    ],
    needsMultipleTexts: false,
    numTexts: 1,
});

createCmd("light", "https://en.ephoto360.com/light-text-effect-futuristic-technology-style-648.html", "🤖", "effet texte technologie futuriste", {
    hasRadio: true,
    radioName: "radio0",
    radioOptions: [
        { name: "radio0[radio]", value: "05acf523-6deb-4b9d-bb28-abc4354d0858", dataTitle: "Style Futuriste 1" },
        { name: "radio0[radio]", value: "843a4fc2-059c-4283-87e4-c851c013073b", dataTitle: "Style Futuriste 2" },
        { name: "radio0[radio]", value: "d951e4be-450e-4658-9e73-0f7c82c63ee3", dataTitle: "Style Futuriste 3" },
        { name: "radio0[radio]", value: "a5b374f3-2f29-4da4-ae15-32dec01198e2", dataTitle: "Style Futuriste 4" }
    ],
    needsMultipleTexts: false,
    numTexts: 1,
});

createCmd("lightb", "https://en.ephoto360.com/create-realistic-vintage-3d-light-bulb-608.html", "💡", "ampoule 3D vintage réaliste", {
    needsMultipleTexts: true,
    numTexts: 2
});

createCmd("glow2", "https://en.ephoto360.com/advanced-glow-effects-74.html", "✨", "effet lueur avancé", {
    needsMultipleTexts: false,
    numTexts: 1,
});

createCmd("slight", "https://en.ephoto360.com/create-sunset-light-text-effects-online-807.html", "🌆", "effet lumière coucher de soleil", {
    needsMultipleTexts: false,
    numTexts: 1,
});

// 🎮 CATÉGORIE : JEUX VIDÉO
createCmd("pubgtext", "https://en.ephoto360.com/pubg-mascot-logo-maker-for-an-esports-team-612.html", "🎮", "logo mascotte PUBG esport", { 
    needsMultipleTexts: true, 
    numTexts: 2 
});

createCmd("pubglogo", "https://en.ephoto360.com/pubg-logo-maker-cute-character-online-617.html", "🎮", "logo PUBG avec personnage mignon", {
    hasRadio: true,
    radioName: "radio0",
    radioOptions: [
        { name: "radio0[radio]", value: "c566c68d-f8b9-4e0f-bb07-011da043d677", dataTitle: "Poulet" },
        { name: "radio0[radio]", value: "d4401b94-41d7-434c-af20-1ffca1aea281", dataTitle: "Soldat" }
    ],
    needsMultipleTexts: false,
    numTexts: 1,
});

createCmd("valorant", "https://en.ephoto360.com/create-valorant-banner-youtube-online-588.html", "🎮", "bannière YouTube Valorant", {
    needsMultipleTexts: true,
    numTexts: 3,
    hasRadio: true,
    radioName: "radio0",
    radioOptions: [
        { name: "radio0[radio]", value: "072dd1a0-db7d-4b87-b3e7-b142c2e8cad6", dataTitle: "Brimstone" },
        { name: "radio0[radio]", value: "784a10c2-660e-4955-901a-a1b57881df42", dataTitle: "Cypher" },
        { name: "radio0[radio]", value: "00251bca-e044-42bd-8dd7-f536ac0c42b4", dataTitle: "Jett" },
        { name: "radio0[radio]", value: "882898c0-054d-450a-bbc1-f5671d77c8a7", dataTitle: "Killjoy" },
        { name: "radio0[radio]", value: "4f51675f-4ad4-42a4-ad1e-1eb8792dfad6", dataTitle: "Omen" },
        { name: "radio0[radio]", value: "90d9209e-0739-4079-81f7-959fd12f3bbe", dataTitle: "Phoenix" },
        { name: "radio0[radio]", value: "dbd319cf-a529-4958-b43e-7f2e19f05853", dataTitle: "Raze" },
        { name: "radio0[radio]", value: "71b52833-5560-46b4-ac88-92054c6d1f5a", dataTitle: "Reyna" },
        { name: "radio0[radio]", value: "acc7c093-9937-4a3d-85da-d66c02c92751", dataTitle: "Sage" },
        { name: "radio0[radio]", value: "48ab2129-3543-4fa9-ad1e-1eb8792dfad6", dataTitle: "Viper" },
    ]
});

createCmd("codtext", "https://en.ephoto360.com/create-call-of-duty-warzone-youtube-banner-online-548.html", "🎮", "bannière YouTube Call of Duty Warzone", {
    needsMultipleTexts: true,
    numTexts: 2,
    hasRadio: true,
    radioName: "radio0",
    radioOptions: [
        { name: "radio0[radio]", value: "182a06fa-03e0-4c26-b1eb-fb9e46f3255a", dataTitle: "Bannière 1" },
        { name: "radio0[radio]", value: "8b1be550-f6f4-43d8-bb23-58403fc079db", dataTitle: "Bannière 2" },
        { name: "radio0[radio]", value: "23f570de-58c9-4cbb-9349-d1a06cd5fa1c", dataTitle: "Bannière 3" },
    ]
});

createCmd("lolwlp", "https://en.ephoto360.com/make-your-own-league-of-legends-wallpaper-full-hd-442.html", "🎮", "fond d'écran League of Legends", {
    needsMultipleTexts: false,
    numTexts: 1,
    hasRadio: true,
    radioName: "radio0",
    radioOptions: [
        { name: "radio0[radio]", value: "e5fd2f91-fa40-4569-b9b1-12f489f3a308", dataTitle: "Aphelios" },
        { name: "radio0[radio]", value: "f8cd6994-d4de-4d2e-aabd-bfadd08762f5", dataTitle: "Karma" },
        { name: "radio0[radio]", value: "2e4f5c59-7ace-4cc4-9f53-7ac3ef6c365f", dataTitle: "Lee Sin" },
        { name: "radio0[radio]", value: "e6a67c50-5d6d-4bde-8dab-f182a5f6efc0", dataTitle: "Nidalee" },
        { name: "radio0[radio]", value: "74703d89-b9b3-4d0d-bc0a-7dc9a0839381", dataTitle: "Soraka" },
    ]
});

createCmd("amongus", "https://en.ephoto360.com/create-a-banner-game-among-us-with-your-name-763.html", "🎮", "bannière avatar Among Us", {
    needsMultipleTexts: true,
    numTexts: 2
});

createCmd("gaming", "https://en.ephoto360.com/create-a-gaming-mascot-logo-free-560.html", "🎮", "logo mascotte gaming", {
    needsMultipleTexts: false,
    numTexts: 1,
    hasRadio: true,
    radioName: "radio0",
    radioOptions: [
        { name: "radio0[radio]", value: "a04d53f2-1449-4491-9f96-041e7ea7c47d", dataTitle: "Lion" },
        { name: "radio0[radio]", value: "ad7ec525-b2c4-4560-9a25-a36fb3da3b5f", dataTitle: "Tigre" },
        { name: "radio0[radio]", value: "200c1bb0-cb27-4838-80c8-d140867c1739", dataTitle: "Requin" },
        { name: "radio0[radio]", value: "7e8d1d6b-1b72-481a-bc38-a9d26513a803", dataTitle: "Loup" },
        { name: "radio0[radio]", value: "e6e37e54-4fc3-473b-b930-4a75ef065c88", dataTitle: "Hibou" },
    ]
});

// 🌟 CATÉGORIE : EFFETS SPÉCIAUX
createCmd("typography", "https://en.ephoto360.com/create-online-typography-art-effects-with-multiple-layers-811.html", "✨", "effet typographique artistique", {
    needsMultipleTexts: false,
    numTexts: 1
});

createCmd("wetglass", "https://en.ephoto360.com/write-text-on-wet-glass-online-589.html", "💧", "effet texte sur verre humide", {
    needsMultipleTexts: false,
    numTexts: 1
});

createCmd("glitter", "https://en.ephoto360.com/free-glitter-text-effect-maker-online-656.html", "✨", "effet texte pailleté", {
    needsMultipleTexts: true,
    numTexts: 2,
    hasRadio: true,
    radioName: "radio0",
    radioOptions: [
        { name: "radio0[radio]", value: "1ad3c6ed-ba1e-4582-95cf-b5e2d7d1a125", dataTitle: "Bleu" },
        { name: "radio0[radio]", value: "9a0f8a8a-d4b0-42bf-945f-06e75a2ac6a4", dataTitle: "Or" },
        { name: "radio0[radio]", value: "83d9bd14-0ebe-470b-a2c7-bdda4f37ef17", dataTitle: "Vert" }
    ]
});

createCmd("watercolor", "https://en.ephoto360.com/create-a-watercolor-text-effect-online-655.html", "🎨", "effet texte aquarelle", {
    needsMultipleTexts: false,
    numTexts: 1,
});

createCmd("paper", "https://en.ephoto360.com/multicolor-3d-paper-cut-style-text-effect-658.html", "✂️", "effet texte 3D papier découpé", {
    needsMultipleTexts: false,
    numTexts: 1,
});

createCmd("glitch", "https://en.ephoto360.com/tik-tok-text-effects-online-generator-485.html", "📹", "effet texte TikTok glitch", {
    needsMultipleTexts: true,
    numTexts: 2
});

createCmd("metal", "https://en.ephoto360.com/metal-mascots-logo-maker-486.html", "🏆", "logo mascotte métallique", {
    hasRadio: true,
    radioName: "radio0",
    radioOptions: [
        { name: "radio0[radio]", value: "206bc58d-00cc-4442-bc00-dcf221b40aa0", dataTitle: "Serpent & Lion" },
        { name: "radio0[radio]", value: "de5f4f9c-95f0-411d-9ac9-5086409ad09a", dataTitle: "Dragon" },
        { name: "radio0[radio]", value: "657a0d32-84f6-4d6b-aab3-0b6768d27d0e", dataTitle: "Dragon 2" }
    ],
    needsMultipleTexts: false,
    numTexts: 1,
});

// 🎭 CATÉGORIE : AVATARS ET PERSONNALISATION
createCmd("angel", "https://en.ephoto360.com/create-colorful-angel-wing-avatars-731.html", "👼", "avatar ailes d'ange colorées", {
    needsMultipleTexts: false,
    numTexts: 1,
    hasRadio: true,
    radioName: "radio0",
    radioOptions: [
        { name: "radio0[radio]", value: "fed58002-b0fe-4193-885e-5cb7b5214305", dataTitle: "Bleu" },
        { name: "radio0[radio]", value: "19c58774-962d-4a12-8b75-769b2e188ad1", dataTitle: "Cyan" },
        { name: "radio0[radio]", value: "6ac134d1-f593-499d-8641-e7ce45af680e", dataTitle: "Or" },
        { name: "radio0[radio]", value: "20fb811f-d9c2-42c9-a1fa-1fcee791c22c", dataTitle: "Vert" },
        { name: "radio0[radio]", value: "4d1e64fd-6601-4fd1-acfd-dbdad36c401a", dataTitle: "Rose" },
    ]
});

createCmd("hacker", "https://en.ephoto360.com/create-anonymous-hacker-avatars-cyan-neon-677.html", "🕵️", "avatar hacker néon cyan", {
    needsMultipleTexts: false,
    numTexts: 1,
    hasRadio: true,
    radioName: "radio0",
    radioOptions: [
        { name: "radio0[radio]", value: "984dd03e-220d-4335-a6ba-7ac56b092240", dataTitle: "Style 1" },
        { name: "radio0[radio]", value: "71074346-5cb3-4b7d-9b8b-a84e4f142ba4", dataTitle: "Style 2" },
        { name: "radio0[radio]", value: "88bacc38-e755-450a-bbc1-f5671d77c8a7", dataTitle: "Style 3" }
    ]
});

// 🌌 CATÉGORIE : EFFETS NATURE ET COSMOS
createCmd("galaxy", "https://en.ephoto360.com/making-neon-light-text-effect-with-galaxy-style-521.html", "🌌", "effet texte néon style galaxie", {
    needsMultipleTexts: false,
    numTexts: 1,
});

createCmd("galaxyw", "https://en.ephoto360.com/create-galaxy-wallpaper-mobile-online-528.html", "🌌", "fond d'écran galaxie mobile", {
    needsMultipleTexts: false,
    numTexts: 1,
});

createCmd("zodiac", "https://en.ephoto360.com/create-star-zodiac-wallpaper-mobile-online-604.html", "🌟", "fond d'écran zodiaque étoilé", {
    hasRadio: true,
    radioName: "radio0",
    radioOptions: [
        { name: "radio0[radio]", value: "a57c8514-b6e6-4507-be7d-f9929bdbdbb0", dataTitle: "Verseau" },
        { name: "radio0[radio]", value: "60fb40f8-c477-4e69-a5cd-2662e455924e", dataTitle: "Bélier" },
        { name: "radio0[radio]", value: "3088de9c-f86b-4a63-92d8-65dc36b3b783", dataTitle: "Cancer" }
    ],
    needsMultipleTexts: false,
    numTexts: 1,
});

// 🎯 CATÉGORIE : LOGOS ET BRANDING
createCmd("floral", "https://en.ephoto360.com/floral-luxury-logo-collection-for-branding-616.html", "🌺", "logo luxueux floral pour branding", {
    needsMultipleTexts: true,
    numTexts: 2,
    hasRadio: true,
    radioName: "radio0",
    radioOptions: [
        { name: "radio0[radio]", value: "d4764301-5311-47c6-82aa-5aa36e9e9500", dataTitle: "Style Élégant" },
        { name: "radio0[radio]", value: "483b9b2a-2c87-4714-a7a7-6d0cc7b70d26", dataTitle: "Style Moderne" },
        { name: "radio0[radio]", value: "f6b48e3f-9481-40ae-a47e-56ba5471b892", dataTitle: "Style Classique" }
    ]
});

createCmd("letter", "https://en.ephoto360.com/create-letter-logos-online-for-free-545.html", "🔤", "logo lettre personnalisé", {
    needsMultipleTexts: true,
    numTexts: 2,
    hasRadio: true,
    radioName: "radio0",
    radioOptions: [
        { name: "radio0[radio]", value: "b5843159-7265-445a-8890-bbde408fab8e", dataTitle: "Lettre A" },
        { name: "radio0[radio]", value: "4925f62e-1446-4496-aa17-bafea9d7fc2c", dataTitle: "Lettre B" },
        { name: "radio0[radio]", value: "e6191f22-07e0-478c-9d1e-7d021395f7aa", dataTitle: "Lettre C" }
    ]
});

// 🆘 COMMANDE D'AIDE TEXTMAKER
King({
    cmd: "textmaker|texteffects|effets",
    desc: "Aide complète pour les effets de texte",
    fromMe: wtype,
    type: "textmaker",
    react: "❓"
}, async (m, text) => {
    const categories = {
        "💡 LUMIÈRE & NÉON": ["neonlight", "neontext", "glow", "light", "lightb", "glow2", "slight"],
        "🎮 JEUX VIDÉO": ["pubgtext", "pubglogo", "valorant", "codtext", "lolwlp", "amongus", "gaming"],
        "✨ EFFETS SPÉCIAUX": ["typography", "wetglass", "glitter", "watercolor", "paper", "glitch", "metal"],
        "🎭 AVATARS": ["angel", "hacker"],
        "🌌 NATURE & COSMOS": ["galaxy", "galaxyw", "zodiac"],
        "🎯 LOGOS": ["floral", "letter"]
    };

    let helpMessage = `👑 *KING TEXTMAKER UNIVERSE - AIDE COMPLÈTE* 👑\n\n`;

    Object.entries(categories).forEach(([category, commands]) => {
        helpMessage += `*${category}*\n`;
        commands.forEach(cmd => {
            helpMessage += `• .${cmd}\n`;
        });
        helpMessage += '\n';
    });

    helpMessage += `💡 *UTILISATION GÉNÉRALE:*\n`;
    helpMessage += `• *.commande texte* - Pour un texte simple\n`;
    helpMessage += `• *.commande texte1;texte2* - Pour plusieurs textes\n`;
    helpMessage += `• *.commande texte;1* - Avec option de style\n\n`;
    helpMessage += `👑 *KING TEAM 2025 - Création royale !*`;

    await m.send(helpMessage);
});

module.exports = {
    handleTextmakerError,
    getCachedData,
    setCachedData
};
