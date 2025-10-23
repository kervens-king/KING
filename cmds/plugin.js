/* 
 * Copyright © 2025 Mirage
 * Ce fichier fait partie de Kord et est sous licence GNU GPLv3.
 * Et j'espère que vous savez ce que vous faites ici.
 * Vous ne pouvez pas utiliser ce fichier sauf en conformité avec la Licence.
 * Voir le fichier LICENSE ou https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const fs = require("fs")
const axios = require("axios")
const util = require("util")
const path = require("path")
const { King, wtype, storeData, getData, isUrl, extractUrlsFromString, sleep } = require("../core")

King({
  cmd: "plugin|install",
  desc: "installer un plugin depuis une URL",
  fromMe: true,
  type: "plugins"
}, async (m, match) => {
  
  const input = match || m.quoted?.text?.trim()
if (!input || !isUrl(input)) return await m.send("Envoyez une URL de plugin valide")
const arr = await extractUrlsFromString(input)

  for (const element of arr) {
    let rawUrl

    try {
      const parsed = new URL(element)

      if (parsed.host === "gist.github.com") {
        parsed.host = "gist.githubusercontent.com"
        rawUrl = parsed.toString() + "/raw"
      } else if (parsed.host === "plugins.kord-ai.web.id") {
        rawUrl = parsed.toString().includes("/raw")
          ? parsed.toString()
          : parsed.toString().replace("/plugin/", "/api/plugin/") + "/raw"
      } else {
        rawUrl = parsed.toString()
      }
    } catch {
      return await m.send("URL invalide")
    }

    try {
      const { data, status } = await axios.get(rawUrl)
      if (status !== 200) return await m.send("Échec de la récupération du plugin")

      const cmdMatch = data.match(/King\([\s\S]*?cmd:\s*["'](.*?)["']/)
      const pluginName = cmdMatch ? cmdMatch[1].trim().replace(/['"]/g, '') : null
      const file = (pluginName || "__" + Math.random().toString(36).substring(8)) + ".js"
      const filePath = __dirname + "/" + file

      fs.writeFileSync(filePath, data)

      try {
        require("./" + file)
      } catch (e) {
        fs.unlinkSync(filePath)
        return await m.send("Plugin invalide\n\n" + util.format(e))
      }

      const isEvent = data.includes("King({") && data.includes("on:")
      const pluginMeta = {
        name: pluginName || file.replace(".js", ""),
        url: rawUrl,
        type: isEvent ? "event" : "cmd"
      }

      const former = await getData("plugins") || []
      await storeData("plugins", [...former, pluginMeta])

      await m.send(pluginMeta.name === pluginName ? `Plugin "${pluginName}" installé` : "Plugin installé")
      await sleep(1500)
    } catch (er) {
      await m.send(`Échec de l'installation du plugin\n\n${er}`)
    }
  }
})

King({
  cmd: "remove|uninstall",
  desc: "supprimer un plugin externe par nom ou URL",
  fromMe: true,
  type: "plugins"
}, async (m, match) => {
  if (!match) return await m.send("Fournissez un nom de plugin ou une URL à supprimer")

  const plugins = await getData("plugins") || []
  if (!plugins.length) return await m.send("Aucun plugin externe installé")

  const input = match.trim()
  let norm = input
if (norm.includes("plugins.kord-ai.web.id") && !norm.includes("/raw")) {
  norm = norm.replace("/plugin/", "/api/plugin/") + "/raw"
}
let toRemove = plugins.find(p => p.name === input || p.url === norm)

  if (!toRemove) return await m.send("Plugin non trouvé ou non installé via URL")

  const file = toRemove.name + ".js"
  const filePath = path.join(__dirname, file)

  try {
    if (fs.existsSync(filePath)) {
      delete require.cache[require.resolve("./" + file)]
      fs.unlinkSync(filePath)
    }

    const filtered = plugins.filter(p => p.name !== toRemove.name)
    await storeData("plugins", filtered)

    await m.send(`Plugin "${toRemove.name}" supprimé`)
  } catch (e) {
    await m.send("Échec de la suppression\n\n" + util.format(e))
  }
})

King({
cmd: "plugins",
  desc: "lister les plugins installés",
  fromMe: true,
  type: "plugins"
}, async (m) => {
  try {
    const data = await getData("plugins") || []
    if (!data.length) return await m.send("Aucun plugin installé")
    
    const list = data.map((p, i) => {
    const mark = p.type === "event" ? " (événement)" : ""
    return `${i + 1}. ${p.name}${mark} → ${p.url}`
}).join("\n")
  await m.send("```" + list + "```")
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

// =============================================
// COMMANDES SUPPLÉMENTAIRES POUR LA GESTION DES PLUGINS KING 👑
// =============================================

King({
  cmd: "plugin-reload|reload",
  desc: "recharger tous les plugins sans redémarrer",
  fromMe: true,
  type: "plugins"
}, async (m) => {
  try {
    const plugins = await getData("plugins") || []
    if (!plugins.length) return await m.send("Aucun plugin à recharger")

    let reloaded = 0
    let failed = 0

    for (const plugin of plugins) {
      try {
        const filePath = path.join(__dirname, plugin.name + ".js")
        
        if (fs.existsSync(filePath)) {
          // Supprimer le cache du module
          delete require.cache[require.resolve("./" + plugin.name + ".js")]
          
          // Recharger le plugin
          require("./" + plugin.name + ".js")
          reloaded++
        }
      } catch (e) {
        console.error(`Erreur rechargement plugin ${plugin.name}:`, e)
        failed++
      }
    }

    await m.send(`♻️ *Rechargement des plugins terminé*\n✅ Réussis: ${reloaded}\n❌ Échecs: ${failed}`)
  } catch (e) {
    console.error("Erreur rechargement plugins:", e)
    await m.send(`Erreur rechargement: ${e}`)
  }
})

King({
  cmd: "plugin-info",
  desc: "obtenir des informations sur un plugin spécifique",
  fromMe: true,
  type: "plugins"
}, async (m, match) => {
  try {
    if (!match) return await m.send("Fournissez un nom de plugin")

    const plugins = await getData("plugins") || []
    const plugin = plugins.find(p => p.name === match.trim())

    if (!plugin) return await m.send("Plugin non trouvé")

    const filePath = path.join(__dirname, plugin.name + ".js")
    
    if (!fs.existsSync(filePath)) {
      return await m.send("Fichier plugin non trouvé sur le disque")
    }

    const fileStats = fs.statSync(filePath)
    const fileContent = fs.readFileSync(filePath, 'utf8')
    
    // Extraire les métadonnées du plugin
    const descMatch = fileContent.match(/desc:\s*["'](.*?)["']/)
    const fromMeMatch = fileContent.match(/fromMe:\s*(true|false|wtype)/)
    const typeMatch = fileContent.match(/type:\s*["'](.*?)["']/)

    const pluginInfo = `
👑 *INFORMATIONS DU PLUGIN* 👑

📝 *Nom:* ${plugin.name}
🔗 *URL:* ${plugin.url}
📂 *Type:* ${plugin.type}
📖 *Description:* ${descMatch ? descMatch[1] : 'Non spécifiée'}
👤 *FromMe:* ${fromMeMatch ? fromMeMatch[1] : 'Non spécifié'}
🎯 *Catégorie:* ${typeMatch ? typeMatch[1] : 'Non spécifiée'}
📊 *Taille:* ${(fileStats.size / 1024).toFixed(2)} KB
📅 *Modifié:* ${fileStats.mtime.toLocaleString()}
🆔 *Installé:* ${fileStats.birthtime.toLocaleString()}
`

    await m.send(pluginInfo)
  } catch (e) {
    console.error("Erreur info plugin:", e)
    await m.send(`Erreur: ${e}`)
  }
})

King({
  cmd: "plugin-search",
  desc: "rechercher des plugins dans le répertoire officiel",
  fromMe: true,
  type: "plugins"
}, async (m, match) => {
  try {
    if (!match) return await m.send("Fournissez un terme de recherche")

    await m.send(`🔍 *Recherche de plugins pour:* ${match}\n\n_Recherche en cours..._`)

    // Simulation de recherche (à remplacer par une vraie API)
    const searchResults = [
      {
        name: "weather-plugin",
        description: "Plugin météo avec prévisions détaillées",
        author: "King Team",
        url: "https://plugins.king-bot.web.id/plugin/weather/raw"
      },
      {
        name: "game-stats",
        description: "Statistiques de jeux vidéo",
        author: "GameDev",
        url: "https://plugins.king-bot.web.id/plugin/game-stats/raw"
      },
      {
        name: "ai-chat",
        description: "Chat IA avancé avec GPT",
        author: "AI Labs",
        url: "https://plugins.king-bot.web.id/plugin/ai-chat/raw"
      }
    ].filter(p => 
      p.name.toLowerCase().includes(match.toLowerCase()) || 
      p.description.toLowerCase().includes(match.toLowerCase())
    )

    if (!searchResults.length) {
      return await m.send(`❌ Aucun plugin trouvé pour: "${match}"`)
    }

    const resultsList = searchResults.map((p, i) => 
      `${i + 1}. *${p.name}*\n   📝 ${p.description}\n   👤 ${p.author}\n   🔗 ${p.url}`
    ).join('\n\n')

    await m.send(`🔍 *Résultats de recherche pour:* "${match}"\n\n${resultsList}\n\n_Utilisez_ \`${prefix}install <url>\` _pour installer_`)
  } catch (e) {
    console.error("Erreur recherche plugins:", e)
    await m.send(`Erreur recherche: ${e}`)
  }
})

King({
  cmd: "plugin-backup",
  desc: "créer une sauvegarde de tous les plugins installés",
  fromMe: true,
  type: "plugins"
}, async (m) => {
  try {
    const plugins = await getData("plugins") || []
    if (!plugins.length) return await m.send("Aucun plugin à sauvegarder")

    const backupDir = path.join(__dirname, '..', 'backups', 'plugins')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupFile = path.join(backupDir, `plugins-backup-${timestamp}.json`)

    const backupData = {
      timestamp: new Date().toISOString(),
      totalPlugins: plugins.length,
      plugins: plugins
    }

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2))

    await m.send(`📦 *Sauvegarde des plugins créée*\n\n✅ Plugins sauvegardés: ${plugins.length}\n📁 Fichier: ${path.basename(backupFile)}\n📍 Dossier: ${backupDir}`)
  } catch (e) {
    console.error("Erreur sauvegarde plugins:", e)
    await m.send(`❌ Erreur sauvegarde: ${e}`)
  }
})

King({
  cmd: "plugin-update",
  desc: "mettre à jour tous les plugins depuis leurs URLs originales",
  fromMe: true,
  type: "plugins"
}, async (m) => {
  try {
    const plugins = await getData("plugins") || []
    if (!plugins.length) return await m.send("Aucun plugin à mettre à jour")

    await m.send(`🔄 *Mise à jour des plugins en cours...*\n\nPlugins à mettre à jour: ${plugins.length}`)

    let updated = 0
    let failed = 0

    for (const plugin of plugins) {
      try {
        const { data, status } = await axios.get(plugin.url)
        if (status !== 200) {
          failed++
          continue
        }

        const filePath = path.join(__dirname, plugin.name + ".js")
        
        // Sauvegarder l'ancienne version
        const backupPath = path.join(__dirname, '..', 'backups', 'plugins', `${plugin.name}-backup-${Date.now()}.js`)
        if (fs.existsSync(filePath)) {
          fs.copyFileSync(filePath, backupPath)
        }

        // Écrire la nouvelle version
        fs.writeFileSync(filePath, data)

        // Recharger le plugin
        delete require.cache[require.resolve("./" + plugin.name + ".js")]
        require("./" + plugin.name + ".js")

        updated++
        await sleep(1000) // Éviter le rate limiting

      } catch (e) {
        console.error(`Erreur mise à jour plugin ${plugin.name}:`, e)
        failed++
      }
    }

    await m.send(`✅ *Mise à jour terminée*\n✅ Mis à jour: ${updated}\n❌ Échecs: ${failed}\n\n_Les anciennes versions ont été sauvegardées._`)
  } catch (e) {
    console.error("Erreur mise à jour plugins:", e)
    await m.send(`❌ Erreur mise à jour: ${e}`)
  }
})

King({
  cmd: "plugin-create",
  desc: "créer un template de plugin personnalisé",
  fromMe: true,
  type: "plugins"
}, async (m, match) => {
  try {
    if (!match) return await m.send("Fournissez un nom pour le nouveau plugin")

    const pluginName = match.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')
    const template = `
/* 
 * Plugin: ${pluginName}
 * Créé avec King Bot Plugin System
 */

const { King, wtype, prefix } = require("../core")

King({
  cmd: "${pluginName}",
  desc: "Description de votre plugin ${pluginName}",
  fromMe: wtype,
  type: "misc",
}, async (m, text) => {
  try {
    // Votre code ici
    await m.send("👑 Plugin ${pluginName} fonctionne !")
  } catch (e) {
    console.error("Erreur plugin ${pluginName}:", e)
    return await m.sendErr(e)
  }
})

// Événement optionnel
King({
  on: "all",
  fromMe: false,
}, async (m, text) => {
  // Gestion des événements
})

console.log("✅ Plugin ${pluginName} chargé avec succès")
`

    const filePath = path.join(__dirname, `${pluginName}.js`)
    fs.writeFileSync(filePath, template)

    await m.send(`📝 *Template de plugin créé*\n\n✅ Nom: ${pluginName}.js\n📍 Emplacement: ${filePath}\n\n_Modifiez le fichier pour personnaliser votre plugin._`)
  } catch (e) {
    console.error("Erreur création template plugin:", e)
    await m.send(`❌ Erreur création: ${e}`)
  }
})

console.log(`
╔═══════════════════════════════╗
║      KING PLUGIN SYSTEM       ║
║         🔌 ACTIVATED 🔌       ║
║                               ║
║  📥 Installation    📤 Suppression ║
║  🔄 Mise à jour     📋 Liste      ║
║  🔍 Recherche       📦 Sauvegarde ║
║  🛠️  Création       ℹ️  Informations ║
║                               ║
║     👑 KING MODE: ON 👑      ║
╚═══════════════════════════════╝
`)
