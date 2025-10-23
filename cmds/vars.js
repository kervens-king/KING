/* 
 * Copyright © 2025 Mirage
 * Ce fichier fait partie de Kord et est sous licence GNU GPLv3.
 * Et j'espère que vous savez ce que vous faites ici.
 * Vous ne pouvez pas utiliser ce fichier sauf en conformité avec la Licence.
 * Voir le fichier LICENSE ou https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { King, wtype, updateConfig, prefix, updateEnv, updateEnvSudo, addEnvSudo, removeEnvSudo, replaceEnvSudo, getEnvValue, envExists, listEnvKeys, toBoolean, getPlatformInfo, setVar, updateVar, delVar, getVars, config, myMods, getAdmins 
  } = require("../core")
const fs = require("fs")

// ==================== GESTION DES VARIABLES ====================

King({
  cmd: "setvar",
  desc: "⚙️ Définir une variable de configuration",
  fromMe: true,
  type: "config",
  category: "administration"
}, async (m, text) => {
  try {
    if (!text) {
      return await m.send(`❌ *Paramètres manquants* \n_Format: ${prefix}setvar NOM_VAR=valeur_\n_Exemple: ${prefix}setvar SESSION_ID=kord-ai_321`)
    }
    
    const [key, ...args] = text.split("=")
    const nomVar = key.toUpperCase()
    const valeur = args.join("=").trim()
    
    if (!nomVar || !valeur) {
      return await m.send(`❌ *Paramètres incomplets* \n_Format: ${prefix}setvar NOM_VAR=valeur_`)
    }
    
    const infoPlateforme = getPlatformInfo()
    
    if (infoPlateforme.platform === "render") {
      try {
        await m.send(`✅ *Variable définie!* \n_${nomVar} = ${valeur}_\n🔄 _Redémarrage en cours..._`)
        await setVar(nomVar, valeur)
      } catch (error) {
        await m.send(`❌ *Erreur définition:* ${error.message}`)
      }
    } else {
      const existeEnv = await envExists()
      if (existeEnv) {
        if (!process.env[nomVar]) {
          await updateEnv(nomVar, valeur)
          return await m.send(`✅ *Variable créée!* \n_${nomVar} = ${valeur}_`)
        } else {
          await updateEnv(nomVar, valeur)
          return await m.send(`✅ *Variable mise à jour!* \n_${nomVar} = ${valeur}_`)
        }
      } else {
        await updateConfig(nomVar, valeur)
        return await m.send(`✅ *Configuration mise à jour!* \n_${nomVar} = ${valeur}_`)
      }
    }
  } catch (e) {
    console.error("❌ Erreur setvar:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "getvar",
  desc: "🔍 Obtenir une variable de configuration",
  fromMe: true,
  type: "config",
  category: "administration"
}, async (m, text) => {
  try {
    if (!text) return m.reply("❌ *Nom variable manquant* \n_Exemple: .getvar SUDO_")
    
    const nomVar = text.trim().toUpperCase()
    
    if (typeof nomVar !== 'string' || !nomVar.trim()) {
      await m.reply("❌ *Nom de variable invalide*")
    } else if (await envExists()) {
      return await m.send(`🔍 *${nomVar}:* \n\`${process.env[nomVar] || "Non définie"}\``)
    } else if (config()[nomVar]) {
      return await m.send(`🔍 *${nomVar}:* \n\`${config()[nomVar]}\``)
    } else {
      await m.reply(`❌ *Variable '${nomVar}' non trouvée*`)
    }
  } catch (e) {
    console.error("❌ Erreur getvar:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: 'delvar',
  desc: "🗑️ Supprimer une variable",
  fromMe: true,
  type: "config",
  category: "administration"
}, async (m, text) => {
  try {
    const nomVar = text.trim().toUpperCase()
    if (!nomVar) return await m.send("❌ *Nom variable manquant*")
    
    const infoPlateforme = getPlatformInfo()
    
    if (infoPlateforme.platform === "render") {
      try {
        await m.send(`🗑️ *Variable supprimée!* \n_${nomVar}_\n🔄 _Redémarrage..._`)
        await delVar(nomVar)
      } catch (error) {
        await m.send(`❌ *Erreur suppression:* ${error.message}`)
      }
    } else {
      const existeEnv = await envExists()
      if (existeEnv) {
        await updateEnv(nomVar, null, { remove: true })
      } else {
        await updateConfig(nomVar, null, { remove: true })
      }
      await m.send(`🗑️ *Variable supprimée!* \n_${nomVar}_`)
    }
  } catch (e) {
    console.error("❌ Erreur delvar:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "allvar",
  desc: "📋 Lister toutes les variables",
  fromMe: true,
  type: "config",
  category: "administration"
}, async (m, text) => {
  try {
    const infoPlateforme = getPlatformInfo()
    
    if (infoPlateforme.platform === "render") {
      try {
        const resultat = await getVars()
        if (resultat.success) {
          let donnees = '🌐 *VARIABLES (RENDER)*\n\n'
          for (let item of resultat.data) {
            const variable = item.envVar
            donnees += `• *${variable.key}*: \`${variable.value}\`\n`
          }
          return await m.send(donnees)
        }
      } catch (error) {
        await m.send(`❌ *Erreur lecture variables:* ${error.message}`)
        return
      }
    }
    
    if (await envExists()) {
      const cles = await listEnvKeys()
      let donnees = '🌐 *VARIABLES*\n\n'
      for (let cle of cles) {
        donnees += `• *${cle}*: \`${process.env[cle]}\`\n`
      }
      return await m.send(donnees)
    } else {
      const donnees = '🌐 *VARIABLES*\n\n' + Object.keys(config())
        .map(cle => `• *${cle}:* \`${config()[cle]}\``)
        .join('\n')
      return await m.send(donnees)
    }
  } catch (e) {
    console.error("❌ Erreur allvar:", e)
    return await m.sendErr(e)
  }
})

// ==================== FONCTIONS UTILITAIRES ====================

async function mettreAJourConfig(nomVar, valeur, m) {
  const infoPlateforme = getPlatformInfo()
  
  if (infoPlateforme.platform === "render") {
    try {
      await m.send(`✅ *${nomVar} = ${valeur}*\n🔄 _Redémarrage..._`)
      await setVar(nomVar, valeur)
    } catch (error) {
      await m.send(`❌ *Erreur mise à jour:* ${error.message}`)
    }
  } else {
    const existeEnv = await envExists()
    if (existeEnv) {
      if (!process.env[nomVar]) {
        await updateEnv(nomVar, valeur)
        return await m.send(`✅ *${nomVar} = ${valeur}*`)
      } else {
        await updateEnv(nomVar, valeur)
        return await m.send(`✅ *${nomVar} = ${valeur}*`)
      }
    } else {
      await updateConfig(nomVar, valeur)
      return await m.send(`✅ *${nomVar} = ${valeur}*`)
    }
  }
}

function creerToggle(nomCommande, varEnv, nomAffichage) {
  return async (m, text, cmd) => {
    try {
      const autorises = [...myMods().map(x => x + '@s.whatsapp.net'), m.ownerJid]
      const option = text.split(" ")[0]?.toLowerCase()
      const optionsValides = ['on', 'off', 'true', 'false']

      if (option && !optionsValides.includes(option)) {
        return await m.send(`❌ *Option invalide:* _${option}_\n_Utilisez: 'on', 'off', 'true' ou 'false'_`)
      }

      if (!option) {
        if (config().RES_TYPE.toLowerCase() === "button") {
          return await m.btnText(`⚙️ *${nomAffichage}*`, {
            [`${cmd} on`]: "🟢 ACTIVER",
            [`${cmd} off`]: "🔴 DÉSACTIVER",
          })
        } else if (config().RES_TYPE.toLowerCase() === "poll") {
          return await m.send({
            name: `⚙️ *${nomAffichage}*`,
            values: [
              { name: "🟢 Activer", id: `${nomCommande} on` },
              { name: "🔴 Désactiver", id: `${nomCommande} off` }
            ],
            withPrefix: true,
            onlyOnce: true,
            participates: autorises,
            selectableCount: true,
          }, {}, "poll")
        } else {
          return await m.send(`⚙️ *${nomAffichage}*\n_Utilisez: ${cmd} on/off_`)
        }
      }
      
      const valeurBool = toBoolean(option)
      const valeurEnv = process.env[varEnv]
      const valeurConfig = config()[varEnv]
      
      if ((valeurEnv !== undefined && toBoolean(valeurEnv) == valeurBool) || 
          (valeurConfig !== undefined && toBoolean(valeurConfig) == valeurBool)) {
        return await m.send(`ℹ️ *${nomAffichage} déjà sur ${option}*`)
      }
      
      await mettreAJourConfig(varEnv, option, m)
    } catch (e) {
      console.error(`❌ Erreur ${nomCommande}:`, e)
      return m.sendErr(e)
    }
  }
}

function creerToggleAntiDelete() {
  return async (m, text, cmd) => {
    try {
      const autorises = [...myMods().map(x => x + '@s.whatsapp.net'), m.ownerJid]
      const option = text.split(" ")[0]?.toLowerCase()
      const optionsValides = ['on', 'p', 'chat', 'g', 'off']

      if (option && !optionsValides.includes(option) && !option.match(/^\d+$/)) {
        return await m.send(`❌ *Option invalide:* _${option}_\n_Utilisez: 'on/p' (propriétaire), 'chat/g' (dans le chat), 'off' (désactiver), ou un numéro_`)
      }

      if (!option) {
        if (config().RES_TYPE.toLowerCase() === "button") {
          return await m.btnText("🛡️ *ANTI-SUPPRESSION*", {
            [`${cmd} on`]: "👑 AU PROPRIÉTAIRE",
            [`${cmd} chat`]: "💬 DANS LE CHAT",
            [`${cmd} off`]: "🚫 DÉSACTIVER",
          })
        } else if (config().RES_TYPE.toLowerCase() === "poll") {
          return await m.send({
            name: "🛡️ *ANTI-SUPPRESSION*",
            values: [
              { name: "👑 Au propriétaire", id: `${cmd} on` },
              { name: "💬 Dans le chat", id: `${cmd} chat` },
              { name: "🚫 Désactiver", id: `${cmd} off` }
            ],
            withPrefix: true,
            onlyOnce: true,
            participates: autorises,
            selectableCount: true,
          }, {}, "poll")
        } else {
          return await m.send(`🛡️ *ANTI-SUPPRESSION*\n\n_Options:_\n• on/p - Envoyer au propriétaire\n• chat/g - Envoyer dans le chat\n• off - Désactiver\n• [numéro] - Envoyer à un numéro spécifique`)
        }
      }

      let valeurFinale = option
      if (option.match(/^\d+$/)) {
        valeurFinale = option
      }

      const valeurEnv = process.env.ANTIDELETE
      const valeurConfig = config().ANTIDELETE
      
      if ((valeurEnv !== undefined && valeurEnv === valeurFinale) || 
          (valeurConfig !== undefined && valeurConfig === valeurFinale)) {
        return await m.send(`ℹ️ *Anti-suppression déjà sur ${option}*`)
      }

      await mettreAJourConfig('ANTIDELETE', valeurFinale, m)
    } catch (e) {
      console.error("❌ Erreur antidelete:", e)
      return m.sendErr(e)
    }
  }
}

// ==================== COMMANDES DE CONFIGURATION ====================

King({
  cmd: "readstatus",
  desc: "👀 Lecture des statuts",
  fromMe: true,
  type: "config",
  category: "fonctionnalités"
}, creerToggle("readstatus", "STATUS_VIEW", "Lecture des statuts"))

King({
  cmd: "likestatus",
  desc: "❤️ Likes des statuts",
  fromMe: true,
  type: "config",
  category: "fonctionnalités"
}, creerToggle("likestatus", "LIKE_STATUS", "Likes des statuts"))

King({
  cmd: "startupmsg",
  desc: "🚀 Message de démarrage",
  fromMe: true,
  type: "config",
  category: "fonctionnalités"
}, creerToggle("startupmsg", "STARTUP_MSG", "Message de démarrage"))

King({
  cmd: "alwaysonline",
  desc: "🟢 Toujours en ligne",
  fromMe: true,
  type: "config",
  category: "fonctionnalités"
}, creerToggle("alwaysonline", "ALWAYS_ONLINE", "Toujours en ligne"))

King({
  cmd: "antidelete",
  desc: "🛡️ Anti-suppression",
  fromMe: true,
  type: "config",
  category: "sécurité"
}, creerToggleAntiDelete())

King({
  cmd: "antiedit",
  desc: "✏️ Anti-modification",
  fromMe: true,
  type: "config",
  category: "sécurité"
}, creerToggle("antiedit", "ANTI_EDIT", "Anti-modification"))

King({
  cmd: "antieditchat",
  desc: "💬 Anti-modification dans le chat",
  fromMe: true,
  type: "config",
  category: "sécurité"
}, creerToggle("antieditchat", "ANTI_EDIT_IN_CHAT", "Anti-modification dans le chat"))

King({
  cmd: "savestatus",
  desc: "💾 Sauvegarde des statuts",
  fromMe: true,
  type: "config",
  category: "fonctionnalités"
}, creerToggle("savestatus", "SAVE_STATUS", "Sauvegarde des statuts"))

King({
  cmd: "cmdreact",
  desc: "⚡ Réactions aux commandes",
  fromMe: true,
  type: "config",
  category: "fonctionnalités"
}, creerToggle("cmdreact", "CMD_REACT", "Réactions aux commandes"))

King({
  cmd: "readmsg|read",
  desc: "📖 Lecture des messages",
  fromMe: true,
  type: "config",
  category: "fonctionnalités"
}, creerToggle("readmsg", "READ_MESSAGE", "Lecture des messages"))

King({
  cmd: "rejectcall",
  desc: "📞 Rejet des appels",
  fromMe: true,
  type: "config",
  category: "sécurité"
}, creerToggle("rejectcall", "REJECT_CALL", "Rejet des appels"))

// ==================== GESTION DES SUDO ====================

King({
  cmd: "setsudo",
  desc: "👑 Ajouter un utilisateur Sudo",
  fromMe: true,
  type: "config",
  category: "administration"
}, async (m, text) => {
  try {
    let utilisateurs = []

    if (!text && !m.quoted) {
      return await m.send("❌ *Utilisateur manquant* \n_Répondez, mentionnez ou fournissez un utilisateur, ou tapez 'admins'_")
    }

    if (text.trim().toLowerCase() === 'admins') {
      if (!m.isGroup) return await m.send("❌ *'admins' utilisable uniquement en groupe*")
      const admins = await getAdmins(m.client, m.chat)
      utilisateurs = admins.map(j => j.split('@')[0])
    } else {
      const u = m.mentionedJid?.[0] || m.quoted?.sender || (text || '').trim()
      if (!u) return await m.send("❌ *Utilisateur manquant*")
      utilisateurs = [u.split('@')[0]]
    }

    const sudoActuel = config().SUDO || ""
    const numerosActuels = sudoActuel.split(',').map(n => n.trim()).filter(n => n)
    const existants = new Set(numerosActuels)
    const aAjouter = utilisateurs.filter(u => !existants.has(u))
    
    if (aAjouter.length === 0) {
      return await m.send("ℹ️ *Utilisateur(s) déjà Sudo*")
    }
    
    const nouveauSudo = [...existants, ...aAjouter].join(",")

    if (m.client.platform === "render") {
      try {
        await m.send(`👑 *${aAjouter.join(', ')} ajouté(s) aux Sudo*\n🔄 _Redémarrage..._`)
        await setVar("SUDO", nouveauSudo)
      } catch (er) {
        console.error(er)
        return await m.send(`❌ *Erreur:* ${er}`)
      }
    }

    const existeEnv = await envExists()
    if (existeEnv) {
      await updateEnv("SUDO", nouveauSudo)
      return await m.send(`👑 *${aAjouter.join(', ')} ajouté(s) aux Sudo*`)
    } else {
      await updateConfig("SUDO", nouveauSudo, { replace: true })
      return await m.send(`👑 *${aAjouter.join(', ')} ajouté(s) aux Sudo*`)
    }
  } catch (e) {
    console.error("❌ Erreur setsudo:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "delsudo",
  desc: "🗑️ Retirer un utilisateur Sudo",
  fromMe: true,
  type: "config",
  category: "administration"
}, async (m, text) => {
  try {
    let utilisateurs = []

    if (!text && !m.quoted) {
      return await m.send("❌ *Utilisateur manquant* \n_Répondez, mentionnez ou fournissez un utilisateur, ou tapez 'admins'_")
    }

    if (text.trim().toLowerCase() === 'admins') {
      if (!m.isGroup) return await m.send("❌ *'admins' utilisable uniquement en groupe*")
      const admins = await getAdmins(m.client, m.chat)
      utilisateurs = admins.map(j => j.split('@')[0])
    } else {
      const u = m.mentionedJid?.[0] || m.quoted?.sender || (text || '').trim()
      if (!u) return await m.send("❌ *Utilisateur manquant*")
      utilisateurs = [u.split('@')[0]]
    }

    const sudoActuel = config().SUDO || ""
    const numerosActuels = sudoActuel.split(',').map(n => n.trim()).filter(n => n)
    const filtres = numerosActuels.filter(n => !utilisateurs.includes(n))
    
    if (filtres.length === numerosActuels.length) {
      return await m.send("❌ *Utilisateur(s) non trouvé(s) dans les Sudo*")
    }
    
    const nouveauSudo = filtres.length ? filtres.join(",") : "false"

    if (m.client.platform === "render") {
      try {
        await m.send(`🗑️ *${utilisateurs.join(', ')} retiré(s) des Sudo*\n🔄 _Redémarrage..._`)
        await setVar("SUDO", nouveauSudo)
      } catch (er) {
        console.error(er)
        return await m.send(`❌ *Erreur:* ${er}`)
      }
    }

    const existeEnv = await envExists()
    if (existeEnv) {
      await updateEnv("SUDO", nouveauSudo)
      return await m.send(`🗑️ *${utilisateurs.join(', ')} retiré(s) des Sudo*`)
    } else {
      await updateConfig("SUDO", nouveauSudo, { replace: true })
      return await m.send(`🗑️ *${utilisateurs.join(', ')} retiré(s) des Sudo*`)
    }
  } catch (e) {
    console.error("❌ Erreur delsudo:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "getsudo|allsudo",
  desc: "📋 Liste des utilisateurs Sudo",
  fromMe: true,
  type: "config",
  category: "administration"
}, async (m, text) => {
  try {
    const sudo = (config().SUDO || "")
      .split(",")
      .map(n => n.trim())
      .filter(n => n)
      
    if (sudo.length === 0) {
      return await m.send("📭 *Liste Sudo vide*")
    }
    
    let message = "👑 *LISTE SUDO*\n\n"
    const mentions = []
    
    for (let s of sudo) {
      const jid = s.trim() + '@s.whatsapp.net'
      message += `• @${s}\n`
      mentions.push(jid)
    }
    
    return await m.send(message, { mentions: mentions })
  } catch (e) {
    console.error("❌ Erreur getsudo:", e)
    return await m.sendErr(e)
  }
})

// ==================== GESTION DES MODS ====================

King({
  cmd: "setmod|addmod",
  desc: "🛠️ Ajouter un modérateur",
  fromMe: true,
  type: "config",
  category: "administration"
}, async (m, text) => {
  try {
    let utilisateurs = []

    if (!text && !m.quoted) {
      return await m.send("❌ *Utilisateur manquant* \n_Répondez, mentionnez ou fournissez un utilisateur, ou tapez 'admins'_")
    }

    if (text.trim().toLowerCase() === 'admins') {
      if (!m.isGroup) return await m.send("❌ *'admins' utilisable uniquement en groupe*")
      const admins = await getAdmins(m.client, m.chat)
      utilisateurs = admins.map(j => j.split('@')[0])
    } else {
      const u = m.mentionedJid?.[0] || m.quoted?.sender || (text || '').trim()
      if (!u) return await m.send("❌ *Utilisateur manquant*")
      utilisateurs = [u.split('@')[0]]
    }

    const modsActuels = config().MODS || ""
    const numerosActuels = modsActuels.split(',').map(n => n.trim()).filter(n => n)
    const existants = new Set(numerosActuels)
    const aAjouter = utilisateurs.filter(u => !existants.has(u))
    
    if (aAjouter.length === 0) {
      return await m.send("ℹ️ *Utilisateur(s) déjà modérateur(s)*")
    }
    
    const nouveauMods = [...existants, ...aAjouter].join(",")

    if (m.client.platform === "render") {
      try {
        await m.send(`🛠️ *${aAjouter.join(', ')} ajouté(s) aux modérateurs*\n🔄 _Redémarrage..._`)
        await setVar("MODS", nouveauMods)
      } catch (er) {
        console.error(er)
        return await m.send(`❌ *Erreur:* ${er}`)
      }
    }

    const existeEnv = await envExists()
    if (existeEnv) {
      await updateEnv("MODS", nouveauMods)
      return await m.send(`🛠️ *${aAjouter.join(', ')} ajouté(s) aux modérateurs*`)
    } else {
      await updateConfig("MODS", nouveauMods, { replace: true })
      return await m.send(`🛠️ *${aAjouter.join(', ')} ajouté(s) aux modérateurs*`)
    }
  } catch (e) {
    console.error("❌ Erreur setmod:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "delmod",
  desc: "🗑️ Retirer un modérateur",
  fromMe: true,
  type: "config",
  category: "administration"
}, async (m, text) => {
  try {
    let utilisateurs = []

    if (!text && !m.quoted) {
      return await m.send("❌ *Utilisateur manquant* \n_Répondez, mentionnez ou fournissez un utilisateur, ou tapez 'admins'_")
    }

    if (text.trim().toLowerCase() === 'admins') {
      if (!m.isGroup) return await m.send("❌ *'admins' utilisable uniquement en groupe*")
      const admins = await getAdmins(m.client, m.chat)
      utilisateurs = admins.map(j => j.split('@')[0])
    } else {
      const u = m.mentionedJid?.[0] || m.quoted?.sender || (text || '').trim()
      if (!u) return await m.send("❌ *Utilisateur manquant*")
      utilisateurs = [u.split('@')[0]]
    }

    const modsActuels = config().MODS || ""
    const numerosActuels = modsActuels.split(',').map(n => n.trim()).filter(n => n)
    const filtres = numerosActuels.filter(n => !utilisateurs.includes(n))
    
    if (filtres.length === numerosActuels.length) {
      return await m.send("❌ *Utilisateur(s) non trouvé(s) dans les modérateurs*")
    }
    
    const nouveauMods = filtres.length ? filtres.join(",") : "false"

    if (m.client.platform === "render") {
      try {
        await m.send(`🗑️ *${utilisateurs.join(', ')} retiré(s) des modérateurs*\n🔄 _Redémarrage..._`)
        await setVar("MODS", nouveauMods)
      } catch (er) {
        console.error(er)
        return await m.send(`❌ *Erreur:* ${er}`)
      }
    }

    const existeEnv = await envExists()
    if (existeEnv) {
      await updateEnv("MODS", nouveauMods)
      return await m.send(`🗑️ *${utilisateurs.join(', ')} retiré(s) des modérateurs*`)
    } else {
      await updateConfig("MODS", nouveauMods, { replace: true })
      return await m.send(`🗑️ *${utilisateurs.join(', ')} retiré(s) des modérateurs*`)
    }
  } catch (e) {
    console.error("❌ Erreur delmod:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "getmods",
  desc: "📋 Liste des modérateurs",
  fromMe: true,
  type: "config",
  category: "administration"
}, async (m, text) => {
  try {
    const mods = (config().MODS || "")
      .split(",")
      .map(n => n.trim())
      .filter(n => n)
    
    if (mods.length === 0) {
      return await m.send("📭 *Liste modérateurs vide*")
    }
    
    let message = "🛠️ *LISTE MODÉRATEURS*\n\n"
    const mentions = []
    
    for (let u of mods) {
      message += `• @${u}\n`
      mentions.push(u + '@s.whatsapp.net')
    }
    
    return await m.send(message, { mentions: mentions })
  } catch (e) {
    console.error("❌ Erreur getmods:", e)
    return await m.sendErr(e)
  }
})

// ==================== CONFIGURATIONS DIVERSES ====================

King({
  cmd: "mode",
  desc: "🌐 Mode public/privé",
  fromMe: true,
  type: "config",
  category: "administration"
}, async (m, text) => {
  try {
    const autorises = [...myMods().map(x => x + '@s.whatsapp.net'), m.ownerJid]
    const nomCommande = "mode"
    
    if (!text) {
      if (config().RES_TYPE.toLowerCase() === "poll") {
        return await m.send({
          name: "🌐 *Mode du Bot*",
          values: [
            { name: "🔒 Privé", id: `${nomCommande} private` },
            { name: "🌍 Public", id: `${nomCommande} public` }
          ],
          withPrefix: true,
          onlyOnce: true,
          participates: autorises,
          selectableCount: true,
        }, {}, "poll")
      } else {
        return await m.send("🌐 *Mode du Bot*\n_Utilisez: public ou private_")
      }
    }
    
    if (text.toLowerCase() === "private") {
      if (config().WORKTYPE.toLowerCase() === "private") {
        return await m.send("ℹ️ *Bot déjà en mode privé*")
      } else {
        await mettreAJourConfig("WORKTYPE", "private", m)
      }
    } else if (text.toLowerCase() === "public") {
      if (config().WORKTYPE.toLowerCase() === "public") {
        return await m.send("ℹ️ *Bot déjà en mode public*")
      } else {
        await mettreAJourConfig("WORKTYPE", "public", m)
      }
    } else {
      if (config().RES_TYPE.toLowerCase() === "poll") {
        return await m.send({
          name: "🌐 *Mode du Bot*",
          values: [
            { name: "🔒 Privé", id: `${nomCommande} private` },
            { name: "🌍 Public", id: `${nomCommande} public` }
          ],
          withPrefix: true,
          onlyOnce: true,
          participates: autorises,
          selectableCount: true,
        }, {}, "poll")
      } else {
        return await m.send("❌ *Option invalide*\n_Utilisez: public ou private_")
      }
    }
  } catch (e) {
    console.error("❌ Erreur mode:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "statusemoji",
  desc: "😊 Emoji des statuts",
  fromMe: true,
  type: "config",
  category: "personnalisation"
}, async (m, text) => {
  try {
    if (!text) {
      return await m.send("❌ *Emoji manquant* \n_Exemple: .statusemoji 🤍 ou .statusemoji 🤍,🥏_")
    }
    await mettreAJourConfig("STATUS_EMOJI", text, m)
  } catch (e) {
    console.error("❌ Erreur statusemoji:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "savecmd",
  desc: "💾 Emoji de sauvegarde",
  fromMe: true,
  type: "config",
  category: "personnalisation"
}, async (m, text) => {
  try {
    if (!text) {
      return await m.send("❌ *Emoji manquant* \n_Exemple: .savecmd 🤍_")
    }
    await mettreAJourConfig("SAVE_CMD", text, m)
  } catch (e) {
    console.error("❌ Erreur savecmd:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "vvcmd",
  desc: "🔓 Emoji vue unique",
  fromMe: true,
  type: "config",
  category: "personnalisation"
}, async (m, text) => {
  try {
    if (!text) {
      return await m.send("❌ *Emoji manquant* \n_Exemple: .vvcmd 🤍_")
    }
    await mettreAJourConfig("VV_CMD", text, m)
  } catch (e) {
    console.error("❌ Erreur vvcmd:", e)
    return await m.sendErr(e)
  }
})

console.log("✅ Module configuration chargé avec succès")
