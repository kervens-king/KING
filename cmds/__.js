/*   
 * Copyright © 2025 Mirage  
 * Ce fichier fait partie de Kord (modifié pour KING) et est sous licence GNU GPLv3.  
 * Vous ne pouvez utiliser ce fichier que conformément à la Licence.  
 * Voir le fichier LICENSE ou https://www.gnu.org/licenses/gpl-3.0.html  
 * -------------------------------------------------------------------------------  
 */

const os = require("os")
const { changeFont } = require("../core")
const { kord, wtype, secondsToHms, config, commands } = require("../core")
const { version } = require("../package.json")

// 🔹 Préfixe fixé à "."
const prefix = "."

const format = (bytes) => {
  const sizes = ["B", "KB", "MB", "GB"]
  if (bytes === 0) return "0 B"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(1)) + " " + sizes[i]
}

function clockString(ms) {
  let h = isNaN(ms) ? "--" : Math.floor(ms / 3600000)
  let m = isNaN(ms) ? "--" : Math.floor(ms % 3600000 / 60000)
  let s = isNaN(ms) ? "--" : Math.floor(ms % 60000 / 1000)
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(":")
}

const getRandomFont = () => {
  return "sansItalic"
}

kord({
  cmd: "menu|help",
  desc: "Liste des commandes",
  react: "👑",
  fromMe: wtype,
  type: "help",
}, async (m) => {
  try {
    const types = {}
    commands.forEach(({ cmd, type }) => {
      if (!cmd) return
      const main = cmd.split("|")[0].trim()
      const cat = type || "autres"
      if (!types[cat]) types[cat] = []
      types[cat].push(main)
    })

    const requestedType = m.text ? m.text.toLowerCase().trim() : null
    const availableTypes = Object.keys(types).map(t => t.toLowerCase())

    const more = String.fromCharCode(8206)
    const readmore = more.repeat(4001)

    // MENU PAR CATÉGORIE
    if (requestedType && availableTypes.includes(requestedType)) {
      const actualType = Object.keys(types).find(t => t.toLowerCase() === requestedType)

      const at = await changeFont(actualType.toUpperCase(), "monospace")
      const cmdList = types[actualType].map(cmd =>
        `│ 👑 ${prefix}${cmd.replace(/[^a-zA-Z0-9-+]/g, "")}`
      ).join('\n')
      const formattedCmds = await changeFont(cmdList, getRandomFont())

      const final = `\`\`\`
╔══✦═━─⌬『 👑 KING 👑 』⌬─━═✦══╗
   🔥 CATÉGORIE : ${actualType.toUpperCase()}
   📜 COMMANDES : ${types[actualType].length}
   👑 PRÉFIXE : ${prefix}
╚══✦═━─⌬✦⌬─━═✦══╝\`\`\`

${readmore}

   ┏ ${at} ┓
┍ ─┉─ • ─┉─ ┑
${formattedCmds}
┕ ─┉─ • ─┉─ ┙

✨ Astuce : Utilisez ${prefix}menu pour voir toutes les catégories`

      return m.send("https://files.catbox.moe/mmg841.jpg", { caption: final }, "image")
    }

    // MENU GLOBAL
    const uptime = await secondsToHms(process.uptime())
    const memoryUsage = format(os.totalmem() - os.freemem())

    let menu = `\`\`\`
╔══✦═━─⌬『 👑 KING BOT 👑 』⌬─━═✦══╗
   👑 Propriétaire : ${config().OWNER_NAME}
   🙋 Utilisateur : ${m.pushName}
   🔌 Plugins : ${commands.length}
   ⏳ Uptime : ${uptime}
   💾 Mémoire : ${memoryUsage}
   🛠 Version : v${version}
   📱 Plateforme : ${m.client.platform()}
╚══✦═━─⌬✦⌬─━═✦══╝\`\`\`

${readmore}
`

    const categoryList = Object.keys(types).map(async (type) => {
      const cmdList = types[type].map(cmd =>
        `│ 👑 ${prefix}${cmd.replace(/[^a-zA-Z0-9-+]/g, "")}`
      ).join('\n')
      const formattedCmds = await changeFont(cmdList, getRandomFont())
      const tty = await changeFont(type.toUpperCase(), "monospace")

      return ` ┏ ${tty} ┓
┍ ─┉─ • ─┉─ ┑
${formattedCmds}
┕ ─┉─ • ─┉─ ┙`
    })

    const resolvedCategoryList = await Promise.all(categoryList)
    menu += resolvedCategoryList.join('\n\n')

    menu += `\n\n✨ Astuce : Utilisez ${prefix}menu [catégorie] pour les commandes spécifiques`

    const final = menu.trim()

    return m.send("https://files.catbox.moe/mmg841.jpg", { caption: final }, "image")
  } catch (e) {
    console.log("Erreur commande menu:", e)
    return await m.sendErr(e)
  }
})
