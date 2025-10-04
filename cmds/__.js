/*   
 * 👑 KING BOT ROYAL EDITION
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

// 🔹 Fonction format mémoire
const format = (bytes) => {
  const sizes = ["B", "KB", "MB", "GB"];
  if (bytes === 0) return "0 B";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + " " + sizes[i];
};

// 🔹 Police stylée aléatoire
const getRandomFont = () => "sansItalic";

// 🔹 Images royales aléatoires
const royalImages = [
  "https://files.catbox.moe/nf3k3r.jpg",
  "https://files.catbox.moe/y10w7b.jpg",
  "https://files.catbox.moe/x6w6fp.jpg",
  "https://files.catbox.moe/6xptam.jpg",
  "https://files.catbox.moe/5vhq8a.jpg",
  "https://files.catbox.moe/mmg841.jpg"
];

// 🔹 Commande principale : .menu / .help
king({
  cmd: "menu|help",
  desc: "Affiche le menu royal animé du KING BOT 👑",
  react: "👑",
  fromMe: wtype,
  type: "help",
}, async (m) => {
  try {
    // 💫 Étape 1 : Message d’intro royal
    await m.send("👑 *Chargement du Trône Royal...*");
    await new Promise((r) => setTimeout(r, 1200));
    await m.send("🏰 *Préparation du menu majestueux...*");
    await new Promise((r) => setTimeout(r, 1200));
    await m.send("💫 *Entrée dans le Royaume KING...*");

    // 💎 Étape 2 : Préparation du menu
    const types = {};
    commands.forEach(({ cmd, type }) => {
      if (!cmd) return;
      const main = cmd.split("|")[0].trim();
      const cat = type || "Autres";
      if (!types[cat]) types[cat] = [];
      types[cat].push(main);
    });

    const readmore = String.fromCharCode(8206).repeat(4001);
    const uptime = await secondsToHms(process.uptime());
    const memoryUsage = format(os.totalmem() - os.freemem());
    const totalRam = format(os.totalmem());
    const cpu = os.cpus()[0].model.split(" @ ")[0];
    const platform = `${m.client.platform()} ${os.type()}`;
    const date = moment().tz("Africa/Port-au-Prince").format("DD/MM/YYYY");
    const time = moment().tz("Africa/Port-au-Prince").format("HH:mm");
    const day = moment().tz("Africa/Port-au-Prince").format("dddd");
    const moods = ["🌅", "🌇", "🌙", "⚡", "🔥", "🌈", "💫", "🌀"];
    const mood = moods[Math.floor(Math.random() * moods.length)];
    const randomImage = royalImages[Math.floor(Math.random() * royalImages.length)];

    let menu = `
╭──❏ *⌜ 👑 𝐊𝐈𝐍𝐆 𝐁𝐎𝐓 ⌟* ❏──✦
│
│ 👑 *Propriétaire* : ${config().OWNER_NAME || "Inconnu"}
│ 💬 *Utilisateur* : ${m.pushName || "Anonyme"}
│ ⚙️ *Version* : v${version}
│ 💻 *Plateforme* : ${platform}
│ ⏰ *Heure* : ${time} 🇭🇹
│ 📅 *Date* : ${day}, ${date}
│ 🕒 *Uptime* : ${uptime}
│ 💾 *RAM* : ${memoryUsage} / ${totalRam}
│ ⚡ *CPU* : ${cpu}
│ 🔮 *Préfixe* : ${prefix}
│ 🧠 *Commandes* : ${commands.length}
│ 🚀 *Mode* : Public
│ 🌈 *Mood* : ${mood}
│
╰───────────────────────────────✦
${readmore}
`;

    // 🔸 Liste des commandes par catégorie
    const categoryList = Object.keys(types).map(async (type) => {
      const tty = await changeFont(type.toUpperCase(), "monospace");
      const cmdList = types[type].map(cmd =>
        `│ 💎 ${prefix}${cmd.replace(/[^a-zA-Z0-9-+]/g, "")}`
      ).join("\n");
      const formattedCmds = await changeFont(cmdList, getRandomFont());

      return `
╭──❏ *${tty}* ❏──✦
${formattedCmds}
╰──────────────────────✦`;
    });

    const resolvedCategoryList = await Promise.all(categoryList);
    menu += resolvedCategoryList.join("\n\n");
    menu += `\n\n✨ *Astuce :* Tape ${prefix}menu [catégorie] pour voir les commandes spécifiques.\n👑 *Développé avec honneur par KING TEAM*`;

    // 💫 Étape 3 : Envoi final avec image royale
    await new Promise((r) => setTimeout(r, 1500));
    await m.send(randomImage, { caption: menu.trim() }, "image");

  } catch (e) {
    console.error("Erreur menu:", e);
    await m.sendErr(e);
  }
});
