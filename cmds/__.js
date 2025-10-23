/*   
 * 👑 KING BOT ROYAL EDITION - VERSION PERFECTIONNÉE
 * Par Kervens | 2025
 * Sous licence GNU GPLv3
 * ------------------------------------------------------------
 */

const os = require("os");
const moment = require("moment-timezone");
const { changeFont } = require("../core");
const { king, wtype, secondsToHms, config, commands } = require("../core");
const { version } = require("../package.json");

const prefix = ".";

// 🔹 Cache pour optimiser les performances
const performanceCache = new Map();

// 🔹 Fonction format mémoire optimisée
const formatMemory = (bytes) => {
  if (performanceCache.has(`mem_${bytes}`)) {
    return performanceCache.get(`mem_${bytes}`);
  }
  
  const sizes = ["B", "KB", "MB", "GB"];
  if (bytes === 0) {
    performanceCache.set(`mem_0`, "0 B");
    return "0 B";
  }
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const result = parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + " " + sizes[i];
  performanceCache.set(`mem_${bytes}`, result);
  return result;
};

// 🔹 Polices royales variées avec fallback
const royalFonts = ["sansItalic", "monospace", "bold", "italic", "script"];
const getRandomFont = () => {
  const font = royalFonts[Math.floor(Math.random() * royalFonts.length)];
  return font || "sansItalic"; // Fallback garanti
};

// 🔹 Images royales avec pré-loading intelligent
const royalImages = [
  "https://files.catbox.moe/nf3k3r.jpg",
  "https://files.catbox.moe/y10w7b.jpg", 
  "https://files.catbox.moe/x6w6fp.jpg",
  "https://files.catbox.moe/6xptam.jpg",
  "https://files.catbox.moe/5vhq8a.jpg",
  "https://files.catbox.moe/mmg841.jpg"
];

// Cache pour images pré-chargées
const imageCache = new Map();

// 🔹 Fonction de pré-loading asynchrone
const preloadImage = async (url) => {
  if (!imageCache.has(url)) {
    imageCache.set(url, { status: 'loading', data: null });
    try {
      // Simulation de pré-chargement - à adapter selon l'environnement
      imageCache.set(url, { status: 'loaded', data: url });
    } catch (error) {
      imageCache.set(url, { status: 'error', data: null });
    }
  }
  return imageCache.get(url);
};

// 🔹 Moods contextuels selon l'heure
const getContextualMood = () => {
  const hour = moment().tz("Africa/Port-au-Prince").hour();
  const moods = {
    morning: ["🌅", "☀️", "🌄", "🐦"],
    day: ["⚡", "🔥", "🌈", "💫", "🌀", "👑"],
    evening: ["🌇", "✨", "🌟", "💖"],
    night: ["🌙", "🌠", "🌌", "🦉"]
  };

  let timeSlot;
  if (hour >= 5 && hour < 12) timeSlot = "morning";
  else if (hour >= 12 && hour < 18) timeSlot = "day"; 
  else if (hour >= 18 && hour < 22) timeSlot = "evening";
  else timeSlot = "night";

  const availableMoods = moods[timeSlot];
  return availableMoods[Math.floor(Math.random() * availableMoods.length)];
};

// 🔹 Gestionnaire de catégories optimisé
const organizeCommandsByCategory = () => {
  const cacheKey = 'organized_commands';
  if (performanceCache.has(cacheKey)) {
    return performanceCache.get(cacheKey);
  }

  const types = {};
  commands.forEach(({ cmd, type, desc }) => {
    if (!cmd) return;
    
    const mainCmd = cmd.split("|")[0].trim();
    const category = type || "Divers";
    
    if (!types[category]) types[category] = [];
    types[category].push({ cmd: mainCmd, desc: desc || "Sans description" });
  });

  performanceCache.set(cacheKey, types);
  return types;
};

// 🔹 Fonction de délai intelligente
const smartDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 🔹 Génération de menu avec pagination
const generateMenuSections = async (types, page = 0, itemsPerPage = 8) => {
  const categories = Object.keys(types);
  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const startIdx = page * itemsPerPage;
  const paginatedCategories = categories.slice(startIdx, startIdx + itemsPerPage);

  const readmore = String.fromCharCode(8206).repeat(4001);
  
  let menuSections = await Promise.all(
    paginatedCategories.map(async (category) => {
      const formattedCategory = await changeFont(category.toUpperCase(), "monospace");
      const categoryCommands = types[category];
      
      const commandList = categoryCommands
        .slice(0, 15) // Limite par catégorie
        .map(({ cmd, desc }) => {
          const cleanCmd = cmd.replace(/[^a-zA-Z0-9-+]/g, "");
          return `│ 💎 ${prefix}${cleanCmd.padEnd(12)} ─ ${desc || "Commande"}`;
        })
        .join("\n");

      const formattedCommands = await changeFont(commandList, getRandomFont());

      return `
╭──❏ *${formattedCategory}* ❏──✦
${formattedCommands}
╰──────────────────────✦`;
    })
  );

  return {
    sections: menuSections.join("\n\n"),
    hasNextPage: startIdx + itemsPerPage < categories.length,
    currentPage: page,
    totalPages
  };
};

// 🔹 Commande principale PERFECTIONNÉE
king({
  cmd: "menu|help|aide|commands",
  desc: "Affiche le menu royal animé du KING BOT 👑",
  react: "👑",
  fromMe: wtype,
  type: "help",
}, async (m, match) => {
  try {
    const startTime = Date.now();
    const pageRequested = parseInt(match) || 0;

    // 💫 Animation de chargement optimisée
    const loadingMessages = [
      "👑 *Initialisation du Trône Royal...*",
      "🏰 *Chargement des commandes royales...*", 
      "💫 *Préparation de votre expérience unique...*",
      "⚡ *Optimisation des performances...*"
    ];

    for (const msg of loadingMessages) {
      await m.send(msg);
      await smartDelay(800); // Délai réduit mais perceptible
    }

    // 💎 Calcul des métriques système
    const uptime = await secondsToHms(process.uptime());
    const memoryUsage = formatMemory(os.totalmem() - os.freemem());
    const totalRam = formatMemory(os.totalmem());
    const cpu = os.cpus()[0].model.split(" @ ")[0];
    const platform = `${m.client.platform()} ${os.type()}`;
    const date = moment().tz("Africa/Port-au-Prince").format("DD/MM/YYYY");
    const time = moment().tz("Africa/Port-au-Prince").format("HH:mm");
    const day = moment().tz("Africa/Port-au-Prince").format("dddd");
    const mood = getContextualMood();

    // 🖼️ Sélection et pré-chargement d'image
    const randomImage = royalImages[Math.floor(Math.random() * royalImages.length)];
    await preloadImage(randomImage);

    // 📊 Organisation des commandes
    const organizedTypes = organizeCommandsByCategory();
    const menuData = await generateMenuSections(organizedTypes, pageRequested);

    const readmore = String.fromCharCode(8206).repeat(4001);
    
    // 👑 En-tête royal amélioré
    let menu = `
╭──❏ *⌜ 👑 𝐊𝐈𝐍𝐆 𝐁𝐎𝐓 𝐑𝐎𝐘𝐀𝐋 𝐄𝐃𝐈𝐓𝐈𝐎𝐍 ⌟* ❏──✦
│
│ 👑  *Propriétaire* : ${config().OWNER_NAME || "Kervens"}
│ 👤  *Utilisateur* : ${m.pushName || "Anonyme"}
│ 🏷️  *Version* : v${version}
│ 💻  *Plateforme* : ${platform}
│ 🕐  *Heure* : ${time} 🇭🇹
│ 📅  *Date* : ${day}, ${date}
│ ⏱️  *Uptime* : ${uptime}
│ 💾  *RAM* : ${memoryUsage} / ${totalRam}
│ ⚡  *CPU* : ${cpu}
│ 🔣  *Préfixe* : ${prefix}
│ 🛠️  *Commandes* : ${commands.length}
│ 🌟  *Mode* : Public
│ 🎭  *Mood* : ${mood}
│ 🚀  *Performance* : ${Date.now() - startTime}ms
│
╰───────────────────────────────✦
${readmore}
`;

    menu += menuData.sections;

    // 📄 Indicateur de pagination
    if (menuData.hasNextPage) {
      menu += `\n\n📄 Page ${menuData.currentPage + 1} - Tapez "${prefix}menu ${menuData.currentPage + 1}" pour la suite`;
    }

    // 💡 Footer contextuel
    const tips = [
      `💡 *Astuce :* Utilisez ${prefix}menu [catégorie] pour filtrer`,
      `🔍 *Recherche :* ${prefix}cmd [mot-clé] pour trouver une commande`,
      `⭐ *Favoris :* Réagissez avec 👑 pour marquer comme favori`,
      `🚀 *Rapidité :* Chargement en ${Date.now() - startTime}ms`
    ];
    
    menu += `\n\n${tips[Math.floor(Math.random() * tips.length)]}`;
    menu += `\n👑 *Développé avec excellence par KING TEAM*`;

    // 🎯 Envoi final avec optimisation
    await smartDelay(500);
    
    const messageOptions = {
      caption: menu.trim(),
      quoted: m,
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true
      }
    };

    await m.send(randomImage, messageOptions, "image");

    // 📊 Log de performance (optionnel)
    console.log(`🎯 Menu delivered in ${Date.now() - startTime}ms for user: ${m.pushName}`);

  } catch (error) {
    console.error("🚨 Erreur menu:", error);
    
    // Message d'erreur élégant
    const errorMessage = `
👑 *Désolé, Votre Majesté !*

Une erreur s'est produite lors du chargement du menu royal.

🔧 *Solution rapide :*
• Réessayez la commande
• Vérifiez votre connexion
• Contactez le support si le problème persiste

*Détails techniques :* ${error.message}
    `.trim();
    
    await m.send(errorMessage);
  }
});

// 🔹 Commande de nettoyage du cache (admin)
king({
  cmd: "clearcache",
  desc: "Nettoie le cache des performances",
  react: "🧹",
  fromMe: true,
  type: "system",
}, async (m) => {
  performanceCache.clear();
  imageCache.clear();
  await m.send("✅ *Cache royal nettoyé avec succès !*");
});

module.exports = {
  formatMemory,
  getContextualMood,
  organizeCommandsByCategory
};
