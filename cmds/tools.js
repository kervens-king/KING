/* 
 * Copyright © 2025 Mirage
 * Ce fichier fait partie de Kord et est sous licence GNU GPLv3.
 * Et j'espère que vous savez ce que vous faites ici.
 * Vous ne pouvez pas utiliser ce fichier sauf en conformité avec la Licence.
 * Voir le fichier LICENSE ou https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { King, commands, wtype, prefix, getData, storeData, changeFont, formatTime, config } = require("../core/")
const path = require("path")
const fs = require("fs")

class GestionnaireCommandes {
  constructor() {
    this.pre = prefix
    this.initialiserDonnees()
  }

  async initialiserDonnees() {
    // Initialisation des données par défaut
    const areactParDefaut = {
      active: false,
      global: false,
      activeChats: []
    }
    
    if (!await getData("areact_config")) {
      await storeData("areact_config", JSON.stringify(areactParDefaut, null, 2))
    }
  }

  // Méthodes utilitaires
  async obtenirDonneesStickers() {
    try {
      const data = await getData("stk_cmd")
      return data || {}
    } catch (error) {
      console.error("Erreur données stickers:", error)
      return {}
    }
  }

  async sauvegarderDonneesStickers(donnees) {
    try {
      await storeData("stk_cmd", JSON.stringify(donnees, null, 2))
      return true
    } catch (error) {
      console.error("Erreur sauvegarde stickers:", error)
      return false
    }
  }
}

const gestionnaire = new GestionnaireCommandes()

// ==================== COMMANDES AUTOCCOLLANTS ====================

King({
  cmd: "setcmd",
  desc: "🔗 Lier une commande à un autocollant",
  fromMe: true,
  type: "tools",
  category: "autocollants"
}, async (m, text) => {
  try {
    if (!m.quoted?.sticker) {
      return await m.send(`🎴 *Répondez à un autocollant* \n_Format : ${prefix}setcmd [commande]_ \n_Exemple : ${prefix}setcmd ping_`)
    }
    
    if (!text) {
      return await m.send(`❌ *Commande manquante* \n_Spécifiez la commande à lier_`)
    }
    
    const commande = text.trim().split(/\s+/)[0]
    const hash = m.quoted.fileSha256 ? Buffer.from(m.quoted.fileSha256).toString('hex') : null
    
    if (!hash) {
      return await m.send("❌ *Hash introuvable* \n_Impossible d'identifier l'autocollant_")
    }
    
    const stk_cmd = await gestionnaire.obtenirDonneesStickers()
    stk_cmd[hash] = text
    
    if (await gestionnaire.sauvegarderDonneesStickers(stk_cmd)) {
      return await m.send(`✅ *Autocollant lié !* \n📌 Commande : *${commande}* \n🔗 Hash : \`${hash.slice(0, 12)}...\``)
    } else {
      return await m.send("❌ *Erreur sauvegarde* \n_Impossible de sauvegarder la liaison_")
    }
  } catch (e) {
    console.error("❌ Erreur setcmd:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "delcmd",
  desc: "🗑️ Supprimer une liaison d'autocollant",
  fromMe: true,
  type: "tools",
  category: "autocollants"
}, async (m) => {
  try {
    if (!m.quoted?.sticker) {
      return await m.send(`🎴 *Répondez à un autocollant* \n_Pour supprimer sa commande liée_`)
    }
    
    const hash = m.quoted.fileSha256 ? Buffer.from(m.quoted.fileSha256).toString("hex") : null
    if (!hash) return await m.send("❌ *Hash introuvable*")
    
    const stk_cmd = await gestionnaire.obtenirDonneesStickers()
    
    if (!stk_cmd[hash]) {
      return await m.send("❌ *Aucune commande* \n_Cet autocollant n'a pas de commande liée_")
    }
    
    const ancienneCommande = stk_cmd[hash]
    delete stk_cmd[hash]
    
    if (await gestionnaire.sauvegarderDonneesStickers(stk_cmd)) {
      return await m.send(`✅ *Commande supprimée !* \n🗑️ Ancienne : *${ancienneCommande}*`)
    }
  } catch (e) {
    console.error("❌ Erreur delcmd:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "listcmd|listcmds",
  desc: "📋 Lister les commandes d'autocollants",
  fromMe: true,
  type: "tools",
  category: "autocollants"
}, async (m) => {
  try {
    const stk_cmd = await gestionnaire.obtenirDonneesStickers()
    const entrees = Object.entries(stk_cmd)
    
    if (entrees.length === 0) {
      return await m.send("📭 *Aucune liaison* \n_Aucun autocollant n'a de commande liée_")
    }
    
    let texte = `📋 *COMMANDES AUTOCCOLLANTS (${entrees.length})*\n\n`
    
    entrees.forEach(([hash, cmd], index) => {
      texte += `${index + 1}. *${cmd}*\n   🔗 \`${hash.slice(0, 16)}...\`\n\n`
    })
    
    return await m.send(texte.trim())
  } catch (e) {
    console.error("❌ Erreur listcmd:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "delallcmds",
  desc: "💥 Supprimer toutes les liaisons",
  fromMe: true,
  type: "tools",
  category: "autocollants"
}, async (m) => {
  try {
    const stk_cmd = await gestionnaire.obtenirDonneesStickers()
    const nombre = Object.keys(stk_cmd).length
    
    if (nombre === 0) {
      return await m.send("📭 *Déjà vide* \n_Aucune commande à supprimer_")
    }
    
    if (await gestionnaire.sauvegarderDonneesStickers({})) {
      return await m.send(`💥 *Tout supprimé !* \n🗑️ ${nombre} commande(s) effacée(s)`)
    }
  } catch (e) {
    console.error("❌ Erreur delallcmds:", e)
    return await m.sendErr(e)
  }
})

// ==================== SYSTÈME DE PERMISSIONS ====================

King({
  cmd: "permit",
  desc: "🔓 Gérer les permissions de commandes",
  fromMe: true,
  type: "tools",
  category: "sécurité"
}, async (m, text) => {
  try {
    const args = text.split(" ")
    const chatJid = m.chat

    if (!args[0]) {
      return await m.send(this.genererAidePermissions())
    }

    const option = args[0].toLowerCase()
    const valeur = args.slice(1).join(" ")
    let pmdata = await this.obtenirPermissions()
    
    return await this.traiterOptionPermissions(m, option, valeur, chatJid, pmdata)
  } catch (err) {
    console.error("❌ Erreur permit:", err)
    await m.send(`❌ *Erreur* \n\`\`\`${err.message}\`\`\``)
  }
})

// ==================== SYSTÈME MENTION ====================

King({
  cmd: "mention",
  desc: "👑 Actions lors de la mention du propriétaire",
  fromMe: true,
  type: "tools",
  category: "personnalisation"
}, async (m, text) => {
  try {
    let mData = await getData("mention_config") || {
      active: false,
      action: "",
      emoji: "👑",
      text: ""
    }
    
    const args = text.split(" ")
    
    if (!args[0]) {
      return await this.afficherAideMention(m)
    }

    const option = args[0].toLowerCase()
    const valeur = args[1]
    const texteComplet = args.slice(1).join(" ")

    switch (option) {
      case "off":
        mData.active = false
        await storeData('mention_config', JSON.stringify(mData, null, 2))
        return await m.send("🔇 *Mention désactivée* \n_Les mentions ne déclencheront plus d'actions_")

      case "status":
        return await this.afficherStatutMention(m)

      case "react":
        const emoji = valeur || "👑"
        mData = { active: true, action: "react", emoji, text: "" }
        await storeData('mention_config', JSON.stringify(mData, null, 2))
        return await m.send(`✅ *Réaction activée* \nRéagira avec : ${emoji}`)

      case "text":
        if (!texteComplet) return await m.send("❌ *Texte manquant* \n_Spécifiez le message à envoyer_")
        mData = { active: true, action: "text", emoji: "", text: texteComplet }
        await storeData('mention_config', JSON.stringify(mData, null, 2))
        return await m.send(`✅ *Message configuré* \n\"${texteComplet}\"`)

      default:
        return await this.afficherAideMention(m)
    }
  } catch (e) {
    console.error("❌ Erreur mention:", e)
    await m.send(`❌ *Erreur* \n\`\`\`${e.message}\`\`\``)
  }
})

// ==================== SYSTÈME AFK ====================

class GestionnaireAFK {
  static async chargerDonnees() {
    try {
      const data = await getData("afk_config")
      return data || { users: {}, owner: { active: false, message: "", lastseen: "" } }
    } catch (err) {
      console.error("❌ Erreur chargement AFK:", err)
      return { users: {}, owner: { active: false, message: "", lastseen: "" } }
    }
  }

  static async sauvegarderDonnees(data) {
    try {
      await storeData("afk_config", JSON.stringify(data, null, 2))
      return true
    } catch (err) {
      console.error("❌ Erreur sauvegarde AFK:", err)
      return false
    }
  }
}

King({
  cmd: "afk",
  desc: "⏸️ Mode absent",
  fromMe: true,
  type: "tools",
  category: "utilitaire"
}, async (m, text) => {
  try {
    const messageAFK = text || "Je suis absent pour le moment"
    const afkData = await GestionnaireAFK.chargerDonnees()
    const tempsActuel = Math.round(Date.now() / 1000)

    // Désactivation AFK
    if (text?.toLowerCase() === "off") {
      if (m.sender === m.ownerJid) {
        afkData.owner.active = false
        await GestionnaireAFK.sauvegarderDonnees(afkData)
        return await m.send("✅ *De retour !* \n_Mode AFK désactivé_")
      } else {
        if (afkData.users[m.sender]) {
          afkData.users[m.sender].active = false
          await GestionnaireAFK.sauvegarderDonnees(afkData)
          return await m.send(`✅ *Bienvenue !* \n@${m.sender.split("@")[0]} est de retour`, { mentions: [m.sender] })
        }
      }
      return await m.send("❌ *Non AFK* \n_Vous n'étiez pas en mode AFK_")
    }

    // Activation AFK
    if (m.sender === m.ownerJid) {
      afkData.owner = { active: true, message: messageAFK, lastseen: tempsActuel }
      await GestionnaireAFK.sauvegarderDonnees(afkData)
      return await m.send(`⏸️ *Mode AFK activé* \n_Message :_ ${messageAFK}`)
    } else {
      if (!afkData.users) afkData.users = {}
      afkData.users[m.sender] = { active: true, message: messageAFK, lastseen: tempsActuel }
      await GestionnaireAFK.sauvegarderDonnees(afkData)
      return await m.send(`⏸️ *AFK activé* \n@${m.sender.split("@")[0]} est maintenant AFK\n_Raison :_ ${messageAFK}`, { mentions: [m.sender] })
    }
  } catch (e) {
    console.error("❌ Erreur AFK:", e)
    return await m.sendErr(e)
  }
})

// ==================== RÉACTIONS AUTOMATIQUES ====================

King({
  cmd: "areact|autoreact",
  desc: "🤖 Réactions automatiques",
  fromMe: true,
  type: "tools",
  category: "fun"
}, async (m, text) => {
  try {
    const args = text.split(" ")
    const option = args[0]?.toLowerCase()
    const valeur = args[1]?.toLowerCase()

    if (!option) {
      return await this.afficherAideAreact(m)
    }

    const areactData = await getData("areact_config") || { active: false, global: false, activeChats: [] }

    switch (option) {
      case "on":
        if (valeur === "global") {
          areactData.global = true
          await storeData('areact_config', JSON.stringify(areactData, null, 2))
          return await m.send("🌍 *Réactions globales activées* \n_Tous les chats seront concernés_")
        } else {
          areactData.active = true
          if (!areactData.activeChats.includes(m.chat)) {
            areactData.activeChats.push(m.chat)
          }
          await storeData('areact_config', JSON.stringify(areactData, null, 2))
          return await m.send("✅ *Réactions activées* \n_Ce chat recevra des réactions automatiques_")
        }

      case "off":
        if (valeur === "global") {
          areactData.global = false
          await storeData('areact_config', JSON.stringify(areactData, null, 2))
          return await m.send("🌍 *Réactions globales désactivées*")
        } else {
          areactData.activeChats = areactData.activeChats.filter(jid => jid !== m.chat)
          await storeData('areact_config', JSON.stringify(areactData, null, 2))
          return await m.send("✅ *Réactions désactivées* \n_Pour ce chat uniquement_")
        }

      case "status":
        const estActif = areactData.activeChats.includes(m.chat)
        return await m.send(
          `🤖 *STATUT RÉACTIONS AUTO*\n\n` +
          `📍 **Ce chat:** ${estActif ? '✅ Actif' : '❌ Inactif'}\n` +
          `🌍 **Global:** ${areactData.global ? '✅ Activé' : '❌ Désactivé'}\n` +
          `📊 **Chats actifs:** ${areactData.activeChats.length}`
        )

      default:
        return await this.afficherAideAreact(m)
    }
  } catch (e) {
    console.error("❌ Erreur areact:", e)
    await m.send(`❌ *Erreur* \n\`\`\`${e.message}\`\`\``)
  }
})

// ==================== GESTION BOT ====================

King({
  cmd: "ignore",
  desc: "🚫 Ignorer ce chat",
  fromMe: true,
  type: "bot",
  category: "administration"
}, async (m) => {
  try {
    let ignores = await getData("ignored") || []
    if (!Array.isArray(ignores)) ignores = []

    if (ignores.includes(m.chat)) {
      return await m.send("⚠️ *Déjà ignoré* \n_Ce chat est déjà dans la liste d'ignorés_")
    }

    ignores.push(m.chat)
    await storeData("ignored", JSON.stringify(ignores, null, 2))
    return await m.send("🚫 *Chat ignoré* \n_Le bot ne répondra plus ici_")
  } catch (e) {
    console.error("❌ Erreur ignore:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "allow",
  desc: "✅ Autoriser ce chat",
  fromMe: true,
  type: "bot",
  category: "administration"
}, async (m) => {
  try {
    let ignores = await getData("ignored") || []
    if (!Array.isArray(ignores)) ignores = []

    if (!ignores.includes(m.chat)) {
      return await m.send("ℹ️ *Déjà autorisé* \n_Ce chat n'est pas ignoré_")
    }

    ignores = ignores.filter(jid => jid !== m.chat)
    await storeData("ignored", JSON.stringify(ignores, null, 2))
    return await m.send("✅ *Chat autorisé* \n_Le bot répondra à nouveau ici_")
  } catch (e) {
    console.error("❌ Erreur allow:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "bot",
  desc: "⚙️ Contrôle du bot",
  fromMe: true,
  type: "bot",
  category: "administration"
}, async (m, text) => {
  try {
    let ignores = await getData("ignored") || []
    const estIgnore = ignores.includes(m.chat)

    if (text?.toLowerCase() === "on") {
      if (!estIgnore) {
        return await m.send("✅ *Déjà actif* \n_Le bot est déjà activé ici_")
      }
      ignores = ignores.filter(jid => jid !== m.chat)
      await storeData("ignored", JSON.stringify(ignores, null, 2))
      return await m.send("🟢 *Bot activé* \n_Fonctionnalités restaurées_")
    }

    if (text?.toLowerCase() === "off") {
      if (estIgnore) {
        return await m.send("✅ *Déjà désactivé* \n_Le bot est déjà inactif ici_")
      }
      ignores.push(m.chat)
      await storeData("ignored", JSON.stringify(ignores, null, 2))
      return await m.send("🔴 *Bot désactivé* \n_Le bot ne répondra plus_")
    }

    return await m.send(
      `⚙️ *CONTROLE BOT*\n\n` +
      `🟢 \`.bot on\` - Activer le bot\n` +
      `🔴 \`.bot off\` - Désactiver le bot\n` +
      `📊 Statut: ${estIgnore ? '🔴 Désactivé' : '🟢 Activé'}`
    )
  } catch (e) {
    console.error("❌ Erreur bot:", e)
    return await m.sendErr(e)
  }
})

// ==================== ÉVÉNEMENTS ====================

King({ on: "all" }, async (m, text) => {
  try {
    // Gestion des mentions
    const mentionData = await getData("mention_config") || {}
    if (mentionData.active && (text?.includes(config().OWNER_NUMBER) || m.mentionedJid?.includes(m.ownerJid))) {
      if (mentionData.action === "react") {
        await m.react(mentionData.emoji || "👑")
      } else if (mentionData.action === "text") {
        await m.send(mentionData.text, { quoted: m })
      }
    }

    // Gestion réactions automatiques
    const areactData = await getData("areact_config") || {}
    if (areactData.global || areactData.activeChats?.includes(m.chat)) {
      const emojis = ["👍", "❤️", "🔥", "👏", "🎉", "🤩", "💫", "✨"]
      const emojiAleatoire = emojis[Math.floor(Math.random() * emojis.length)]
      await m.react(emojiAleatoire)
    }
  } catch (e) {
    console.error("❌ Erreur événement:", e)
  }
})

// ==================== MÉTHODES D'AIDE ====================

GestionnaireCommandes.prototype.genererAidePermissions = function() {
  return `
🔓 *SYSTÈME DE PERMISSIONS*

📋 **Liste** 
\`.permit list\` - Voir les permissions

➕ **Ajouter**
\`.permit all\` - Toutes les commandes
\`.permit [type]\` - Par type (fun, tools, etc.)
\`.permit cmd [nom]\` - Commande spécifique

➖ **Retirer**  
\`.permit remove all\` - Tout supprimer
\`.permit remove [type]\` - Type spécifique
\`.permit remove cmd [nom]\` - Commande spécifique
  `.trim()
}

GestionnaireCommandes.prototype.afficherAideMention = async function(m) {
  await m.send(`
👑 *SYSTÈME DE MENTION*

🔧 **Options disponibles:**
\`.mention off\` - Désactiver
\`.mention status\` - Statut actuel  
\`.mention react 🎯\` - Réagir aux mentions
\`.mention text [message]\` - Répondre aux mentions

💡 **Exemples:**
\`.mention react ❤️\`
\`.mention text Je suis occupé !\`
  `.trim())
}

GestionnaireCommandes.prototype.afficherAideAreact = async function(m) {
  await m.send(`
🤖 *RÉACTIONS AUTOMATIQUES*

🔄 **Commandes:**
\`.areact on\` - Activer pour ce chat
\`.areact on global\` - Activer partout
\`.areact off\` - Désactiver pour ce chat  
\`.areact off global\` - Tout désactiver
\`.areact status\` - Voir le statut

⚡ Le bot réagira aléatoirement aux messages
  `.trim())
}

console.log("✅ Module commandes tools chargé avec succès")
