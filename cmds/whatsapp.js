/* 
 * Copyright © 2025 Mirage
 * Ce fichier fait partie de Kord et est sous licence GNU GPLv3.
 * Et j'espère que vous savez ce que vous faites ici.
 * Vous ne pouvez pas utiliser ce fichier sauf en conformité avec la Licence.
 * Voir le fichier LICENSE ou https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { King, wtype, isAdmin, isadminn, saveFilter, listFilters, removeFilter, prefix, getData, storeData, isBotAdmin } = require("../core")

// ==================== GESTION DES MESSAGES ====================

King({
  cmd: "delete|del|dlt",
  desc: "🗑️ Supprimer un message",
  fromMe: wtype,
  type: "user",
  category: "messages"
}, async (m, text) => {
  try {
    if (!m.quoted) return await m.send("❌ *Message manquant* \n_Répondez à un message à supprimer_")
    
    if (m.isGroup) {
      // Si le message est du bot et que l'utilisateur est le créateur
      if (m.quoted.fromMe && m.isCreator) {
        await m.send(m.quoted, {}, "delete")
        return await m.send(m, {}, "delete")
      }
      
      // Vérification des permissions admin
      const estAdmin = await isAdmin(m)
      const botEstAdmin = await isBotAdmin(m)
      
      if (!botEstAdmin) return await m.send("❌ *Je ne suis pas administrateur*")
      if (!estAdmin) return await m.send("❌ *Vous n'êtes pas administrateur*")
      
      await m.send(m.quoted, {}, "delete")
      return await m.send(m, {}, "delete")
    }
    
    // En conversation privée
    if (!m.isCreator) return await m.send("❌ *Accès refusé*")
    await m.send(m.quoted, {}, "delete")
    
    if (m.fromMe) {
      return await m.send(m, {}, "delete")
    }
  } catch (e) {
    console.error("❌ Erreur delete:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "forward|fwrd",
  desc: "↪️ Transférer un message",
  fromMe: true,
  type: "user",
  category: "messages"
}, async (m, text, cmd, store) => {
  try {
    if (!m.quoted) return await m.send("❌ *Message manquant* \n_Répondez au message à transférer_")
    if (!text) return await m.send(`❌ *Destination manquante* \n_Format: ${cmd} [numéro/jid]_\n_Exemple: ${cmd} 33612345678_\n_${cmd} 33612345678@s.whatsapp.net_\n\nUtilisez ${prefix}jid pour obtenir le JID d'un chat`)

    let destination
    if (text.includes("@g.us") || text.includes("@s.whatsapp.net") || text.includes("newsletter")) {
      destination = text
    } else {
      destination = `${text}@s.whatsapp.net`
    }
    
    await m.forwardMessage(destination, await store.loadMessage(m.chat, m.quoted))
    await m.send("✅ *Message transféré*")
  } catch (e) {
    console.error("❌ Erreur forward:", e)
    return await m.sendErr(e)
  }
})

// ==================== GESTION DES CHATS ====================

King({
  cmd: "archive",
  desc: "📁 Archiver un chat",
  fromMe: true,
  type: "user",
  category: "chats"
}, async (m, text) => {
  try {
    const dernierMessage = {
      message: m.message,
      key: m.key,
      messageTimestamp: m.timestamp
    }
    
    await m.client.chatModify({
      archive: true,
      lastMessages: [dernierMessage]
    }, m.chat)
    
    return await m.send('✅ *Chat archivé*')
  } catch (e) {
    console.error("❌ Erreur archive:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "unarchive",
  desc: "📂 Désarchiver un chat",
  fromMe: true,
  type: "user",
  category: "chats"
}, async (m, text) => {
  try {
    const dernierMessage = {
      message: m.message,
      key: m.key,
      messageTimestamp: m.timestamp
    }
    
    await m.client.chatModify({
      archive: false,
      lastMessages: [dernierMessage]
    }, m.chat)
    
    return await m.send('✅ *Chat désarchivé*')
  } catch (e) {
    console.error("❌ Erreur unarchive:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "clear",
  desc: "🧹 Effacer un chat",
  fromMe: true,
  type: "user",
  category: "chats"
}, async (m, text) => {
  try {
    await m.client.chatModify({
      delete: true,
      lastMessages: [{
        key: m.key,
        messageTimestamp: m.messageTimestamp
      }]
    }, m.chat)
    
    await m.send('✅ *Chat effacé*')
  } catch (e) {
    console.error("❌ Erreur clear:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "pinchat|chatpin",
  desc: "📌 Épingler un chat",
  fromMe: true,
  type: "user",
  category: "chats"
}, async (m, text) => {
  try {
    await m.client.chatModify({
      pin: true
    }, m.chat)
    
    await m.send('✅ *Chat épinglé*')
  } catch (e) {
    console.error("❌ Erreur pinchat:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "unpinchat|unchatpin",
  desc: "📌 Désépingler un chat",
  fromMe: true,
  type: "user",
  category: "chats"
}, async (m, text) => {
  try {
    await m.client.chatModify({
      pin: false
    }, m.chat)
    
    await m.send('✅ *Chat désépinglé*')
  } catch (e) {
    console.error("❌ Erreur unpinchat:", e)
    return await m.sendErr(e)
  }
})

// ==================== GESTION DU PROFIL ====================

King({
  cmd: "jid",
  desc: "🆔 Obtenir le JID",
  fromMe: wtype,
  type: "user",
  category: "profil"
}, async (m) => {
  try {
    if (m.quoted?.sender) {
      return await m.send(`🆔 *JID de l'utilisateur:*\n\`${m.quoted.sender}\``)
    } else {
      return await m.send(`🆔 *JID du chat:*\n\`${m.chat}\``)
    }
  } catch (e) {
    console.error("❌ Erreur jid:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "pp|setpp",
  desc: "🖼️ Changer la photo de profil",
  fromMe: true,
  type: "user",
  category: "profil"
}, async (m, text) => {
  try {
    if (!m.quoted?.image && !m.image) {
      return await m.send("❌ *Photo manquante* \n_Répondez à une photo_")
    }
    
    let cheminPhoto
    if (m.quoted?.image) {
      cheminPhoto = await m.quoted.download()
    } else {
      cheminPhoto = await m.client.downloadMediaMessage(m)
    }
    
    await m.client.updateProfilePicture(m.user.jid, cheminPhoto)
    return await m.send("✅ *Photo de profil changée*")
  } catch (e) {
    console.error("❌ Erreur setpp:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "removepp",
  desc: "🗑️ Supprimer la photo de profil",
  fromMe: true,
  type: "user",
  category: "profil"
}, async (m, text) => {
  try {
    await m.client.removeProfilePicture(m.user.jid)
    return await m.send("✅ *Photo de profil supprimée*")
  } catch (e) {
    console.error("❌ Erreur removepp:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "getpp",
  desc: "👤 Obtenir la photo de profil",
  fromMe: true,
  type: "user",
  category: "profil"
}, async (m, text) => {
  try {
    let urlPhoto
    
    if (m.isGroup && !m.quoted?.sender) {
      // Photo du groupe
      urlPhoto = await m.client.profilePictureUrl(m.chat, 'image')
    } else if (m.isGroup && m.quoted?.sender) {
      // Photo de l'utilisateur cité dans le groupe
      urlPhoto = await m.client.profilePictureUrl(m.quoted.sender, 'image')
    } else if (m.quoted?.sender) {
      // Photo de l'utilisateur cité
      urlPhoto = await m.client.profilePictureUrl(m.quoted.sender, 'image')
    } else {
      // Photo du chat actuel
      urlPhoto = await m.client.profilePictureUrl(m.chat, 'image')
    }
    
    return await m.send(urlPhoto, {}, "image")
  } catch (e) {
    console.error("❌ Erreur getpp:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "setname",
  desc: "✏️ Changer le nom du profil",
  fromMe: true,
  type: "user",
  category: "profil"
}, async (m, text) => {
  try {
    if (!text) {
      return await m.send(`❌ *Nom manquant* \n_Format: ${prefix}setname [votre nom]_\n_Exemple: ${prefix}setname Mirage_`)
    }
    
    await m.client.updateProfileName(text)
    await m.reply(`✅ *Nom du profil mis à jour:* ${text}`)
  } catch (e) {
    console.error("❌ Erreur setname:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "bio|setbio",
  desc: "📝 Changer la bio",
  fromMe: true,
  type: "user",
  category: "profil"
}, async (m, text) => {
  try {
    if (!text) {
      return await m.send(`❌ *Bio manquante* \n_Format: ${prefix}setbio [votre bio]_\n_Exemple: ${prefix}setbio Appelez-moi en cas d'urgence uniquement._`)
    }
    
    await m.client.updateProfileStatus(text)
    await m.send('✅ *Bio mise à jour*')
  } catch (e) {
    console.error("❌ Erreur setbio:", e)
    return await m.sendErr(e)
  }
})

// ==================== GESTION DES CONTACTS ====================

King({
  cmd: "block",
  desc: "🚫 Bloquer un utilisateur",
  fromMe: true,
  type: "user",
  category: "contacts"
}, async (m, text) => {
  try {
    let utilisateur
    
    if (m.isGroup && m.quoted?.sender) {
      utilisateur = m.quoted.sender
    } else {
      utilisateur = m.chat
    }
    
    await m.client.updateBlockStatus(utilisateur, "block")
    await m.send(`✅ *Utilisateur bloqué*`)
  } catch (e) {
    console.error("❌ Erreur block:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "unblock",
  desc: "✅ Débloquer un utilisateur",
  fromMe: true,
  type: "user",
  category: "contacts"
}, async (m, text) => {
  try {
    let utilisateur
    
    if (m.isGroup && m.quoted?.sender) {
      utilisateur = m.quoted.sender
    } else {
      utilisateur = m.chat
    }
    
    await m.client.updateBlockStatus(utilisateur, "unblock")
    await m.send(`✅ *Utilisateur débloqué*`)
  } catch (e) {
    console.error("❌ Erreur unblock:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "blocklist",
  desc: "📋 Liste des utilisateurs bloqués",
  fromMe: true,
  type: "user",
  category: "contacts"
}, async (m, text) => {
  try {
    const numerosBloques = await m.client.fetchBlocklist()
    
    if (!numerosBloques?.length) {
      return await m.send("📭 *Aucun utilisateur bloqué*")
    }
    
    const listeBlocs = `🚫 *LISTE DES BLOQUÉS*\n\n${numerosBloques.map(n => `• +${n.replace('@s.whatsapp.net', '')}`).join('\n')}`
    return await m.send(listeBlocs)
  } catch (e) {
    console.error("❌ Erreur blocklist:", e)
    return await m.sendErr(e)
  }
})

// ==================== PARAMÈTRES DE CONFIDENTIALITÉ ====================

King({
  cmd: 'lastseen',
  fromMe: true,
  desc: '👀 Confidentialité de la dernière connexion',
  type: 'privacy',
  category: 'confidentialité'
}, async (message, match, cmd) => {
  try {
    if (!match) {
      return await message.send(`❌ *Paramètre manquant* \n_Format: ${cmd} [valeur]_\n_Valeurs: all, contacts, contact_blacklist, none_`)
    }
    
    const optionsValides = ['all', 'contacts', 'contact_blacklist', 'none']
    if (!optionsValides.includes(match)) {
      return await message.send(`❌ *Valeur invalide* \n_Options: ${optionsValides.join(', ')}_`)
    }
    
    await message.client.updateLastSeenPrivacy(match)
    await message.send(`✅ *Confidentialité "dernière connexion" mise à jour:* ${match}`)
  } catch (e) {
    console.error("❌ Erreur lastseen:", e)
    return await message.sendErr(e)
  }
})

King({
  cmd: 'online',
  fromMe: true,
  desc: '🟢 Confidentialité du statut en ligne',
  type: 'privacy',
  category: 'confidentialité'
}, async (message, match, cmd) => {
  try {
    if (!match) {
      return await message.send(`❌ *Paramètre manquant* \n_Format: ${cmd} [valeur]_\n_Valeurs: all, match_last_seen_`)
    }
    
    const optionsValides = ['all', 'match_last_seen']
    if (!optionsValides.includes(match)) {
      return await message.send(`❌ *Valeur invalide* \n_Options: ${optionsValides.join(', ')}_`)
    }
    
    await message.client.updateOnlinePrivacy(match)
    await message.send(`✅ *Confidentialité "en ligne" mise à jour:* ${match}`)
  } catch (e) {
    console.error("❌ Erreur online:", e)
    return await message.sendErr(e)
  }
})

King({
  cmd: 'mypp',
  fromMe: true,
  desc: '🖼️ Confidentialité de la photo de profil',
  type: 'privacy',
  category: 'confidentialité'
}, async (message, match, cmd) => {
  try {
    if (!match) {
      return await message.send(`❌ *Paramètre manquant* \n_Format: ${cmd} [valeur]_\n_Valeurs: all, contacts, contact_blacklist, none_`)
    }
    
    const optionsValides = ['all', 'contacts', 'contact_blacklist', 'none']
    if (!optionsValides.includes(match)) {
      return await message.send(`❌ *Valeur invalide* \n_Options: ${optionsValides.join(', ')}_`)
    }
    
    await message.client.updateProfilePicturePrivacy(match)
    await message.send(`✅ *Confidentialité "photo de profil" mise à jour:* ${match}`)
  } catch (e) {
    console.error("❌ Erreur mypp:", e)
    return await message.sendErr(e)
  }
})

King({
  cmd: 'mystatus',
  fromMe: true,
  desc: '📝 Confidentialité du statut',
  type: 'privacy',
  category: 'confidentialité'
}, async (message, match, cmd) => {
  try {
    if (!match) {
      return await message.send(`❌ *Paramètre manquant* \n_Format: ${cmd} [valeur]_\n_Valeurs: all, contacts, contact_blacklist, none_`)
    }
    
    const optionsValides = ['all', 'contacts', 'contact_blacklist', 'none']
    if (!optionsValides.includes(match)) {
      return await message.send(`❌ *Valeur invalide* \n_Options: ${optionsValides.join(', ')}_`)
    }
    
    await message.client.updateStatusPrivacy(match)
    await message.send(`✅ *Confidentialité "statut" mise à jour:* ${match}`)
  } catch (e) {
    console.error("❌ Erreur mystatus:", e)
    return await message.sendErr(e)
  }
})

King({
  cmd: 'read',
  fromMe: true,
  desc: '✓ Confidentialité des accusés de lecture',
  type: 'privacy',
  category: 'confidentialité'
}, async (message, match, cmd) => {
  try {
    if (!match) {
      return await message.send(`❌ *Paramètre manquant* \n_Format: ${cmd} [valeur]_\n_Valeurs: all, none_`)
    }
    
    const optionsValides = ['all', 'none']
    if (!optionsValides.includes(match)) {
      return await message.send(`❌ *Valeur invalide* \n_Options: ${optionsValides.join(', ')}_`)
    }
    
    await message.client.updateReadReceiptsPrivacy(match)
    await message.send(`✅ *Confidentialité "accusés de lecture" mise à jour:* ${match}`)
  } catch (e) {
    console.error("❌ Erreur read:", e)
    return await message.sendErr(e)
  }
})

King({
  cmd: 'allow-gcadd|groupadd',
  fromMe: true,
  desc: '👥 Confidentialité des ajouts de groupe',
  type: 'privacy',
  category: 'confidentialité'
}, async (message, match, cmd) => {
  try {
    if (!match) {
      return await message.send(`❌ *Paramètre manquant* \n_Format: ${cmd} [valeur]_\n_Valeurs: all, contacts, contact_blacklist, none_`)
    }
    
    const optionsValides = ['all', 'contacts', 'contact_blacklist', 'none']
    if (!optionsValides.includes(match)) {
      return await message.send(`❌ *Valeur invalide* \n_Options: ${optionsValides.join(', ')}_`)
    }
    
    await message.client.updateGroupsAddPrivacy(match)
    await message.send(`✅ *Confidentialité "ajouts de groupe" mise à jour:* ${match}`)
  } catch (e) {
    console.error("❌ Erreur groupadd:", e)
    return await message.sendErr(e)
  }
})

// ==================== SYSTÈME DE FILTRES ====================

King({
  cmd: "pfilter",
  desc: "🤖 Définir un filtre MP",
  fromMe: true,
  pm: true,
  type: "autoreply",
  category: "automatisation"
}, async (m, text) => {
  try {
    if (text.toLowerCase() === "list") {
      return await listFilters(m, "pfilter")
    }
    await saveFilter(m, text, "pfilter")
  } catch (e) {
    console.error("❌ Erreur pfilter:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "pstop",
  desc: "🗑️ Supprimer un filtre MP",
  fromMe: true,
  pm: true,
  type: "autoreply",
  category: "automatisation"
}, async (m, text) => {
  try {
    if (!text) return await m.send("❌ *Mot-clé manquant* \n_Spécifiez le mot-clé à supprimer_")
    await removeFilter(m, text, "pfilter")
  } catch (e) {
    console.error("❌ Erreur pstop:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "gfilter",
  desc: "🤖 Définir un filtre de groupe",
  fromMe: true,
  type: "autoreply",
  gc: true,
  adminOnly: true,
  category: "automatisation"
}, async (m, text) => {
  try {
    if (text.toLowerCase() === "list") {
      return await listFilters(m, "gfilter")
    }
    await saveFilter(m, text, "gfilter")
  } catch (e) {
    console.error("❌ Erreur gfilter:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "gstop",
  desc: "🗑️ Supprimer un filtre de groupe",
  fromMe: true,
  type: "autoreply",
  gc: true,
  adminOnly: true,
  category: "automatisation"
}, async (m, text) => {
  try {
    if (!text) return await m.send("❌ *Mot-clé manquant* \n_Spécifiez le mot-clé à supprimer_")
    await removeFilter(m, text, "gfilter")
  } catch (e) {
    console.error("❌ Erreur gstop:", e)
    return await m.sendErr(e)
  }
})

// ==================== GESTION DES RESTRICTIONS ====================

King({
  cmd: "mute-user",
  desc: "🔇 Rendre muet un utilisateur/autocollant",
  fromMe: true,
  type: "bot",
  gc: true,
  adminOnly: true,
  category: "modération"
}, async (m, text) => {
  try {
    const botEstAdmin = await isBotAdmin(m)
    if (!botEstAdmin) return await m.send("❌ *Le bot doit être administrateur*")

    const donneesNoir = await getData("blacklisted") || {}
    if (!donneesNoir[m.chat]) donneesNoir[m.chat] = { users: [], stk: [] }

    const listeNoire = donneesNoir[m.chat]

    // Gestion des autocollants
    if (text.includes("-s")) {
      if (!m.quoted?.sticker) return await m.send("❌ *Autocollant manquant* \n_Répondez à l'autocollant à rendre muet_")
      
      const hash = m.quoted.fileSha256 ? Buffer.from(m.quoted.fileSha256).toString('hex') : null
      if (listeNoire.stk.includes(hash)) return await m.send("ℹ️ *Autocollant déjà muet*")
      
      listeNoire.stk.push(hash)
      await storeData("blacklisted", donneesNoir)
      return await m.send("✅ *Autocollant rendu muet*")
    }

    // Gestion des utilisateurs
    const input = m.mentionedJid?.[0] || m.quoted?.sender || text
    if (!input) return await m.send('❌ *Utilisateur manquant*')
    
    const utilisateur = (input.includes('@') ? input.split('@')[0] : input).replace(/\D/g, '') + '@s.whatsapp.net'
    
    if (await isadminn(m, utilisateur)) return await m.send("❌ *L'utilisateur est administrateur*")
    if (listeNoire.users.includes(utilisateur)) return await m.send("ℹ️ *Utilisateur déjà muet*")
    
    listeNoire.users.push(utilisateur)
    await storeData("blacklisted", donneesNoir)
    return await m.send(`✅ @${utilisateur.split("@")[0]} a été rendu muet`, { mentions: [utilisateur] })
  } catch (e) {
    console.error("❌ Erreur mute-user:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "unmute-user",
  desc: "🔊 Rendre la parole à un utilisateur/autocollant",
  fromMe: true,
  type: "bot",
  gc: true,
  adminOnly: true,
  category: "modération"
}, async (m, text) => {
  try {
    const botEstAdmin = await isBotAdmin(m)
    if (!botEstAdmin) return await m.send("❌ *Le bot doit être administrateur*")

    const donneesNoir = await getData("blacklisted") || {}
    if (!donneesNoir[m.chat]) return await m.send("ℹ️ *Personne n'est muet ici*")

    const listeNoire = donneesNoir[m.chat]

    // Gestion des autocollants
    if (text.includes("-s")) {
      if (!m.quoted?.sticker) return await m.send("❌ *Autocollant manquant* \n_Répondez à l'autocollant à rendre la parole_")
      
      const hash = m.quoted.fileSha256 ? Buffer.from(m.quoted.fileSha256).toString('hex') : null
      if (!listeNoire.stk.includes(hash)) return await m.send("ℹ️ *Autocollant n'est pas muet*")
      
      listeNoire.stk = listeNoire.stk.filter(h => h !== hash)
      await storeData("blacklisted", donneesNoir)
      return await m.send("✅ *Autocollant a retrouvé la parole*")
    }

    // Gestion des utilisateurs
    const input = m.mentionedJid?.[0] || m.quoted?.sender || text
    if (!input) return await m.send('❌ *Utilisateur manquant*')
    
    const utilisateur = (input.includes('@') ? input.split('@')[0] : input).replace(/\D/g, '') + '@s.whatsapp.net'
    
    if (await isadminn(m, utilisateur)) return await m.send("❌ *L'utilisateur est administrateur*")
    if (!listeNoire.users.includes(utilisateur)) return await m.send("ℹ️ *Utilisateur n'est pas muet*")
    
    listeNoire.users = listeNoire.users.filter(u => u !== utilisateur)
    await storeData("blacklisted", donneesNoir)
    return await m.send(`✅ @${utilisateur.split("@")[0]} a retrouvé la parole`, { mentions: [utilisateur] })
  } catch (e) {
    console.error("❌ Erreur unmute-user:", e)
    return await m.sendErr(e)
  }
})

// ==================== ÉCOUTEURS D'ÉVÉNEMENTS ====================

King({
  on: "text",
  fromMe: false,
}, async (m) => {
  try {
    // Ignorer les messages du propriétaire
    if (m.sender === m.ownerJid) return

    // Filtres MP
    if (!m.isGroup) {
      const filtresGlobaux = await getData("pfilter") || {}
      const correspondance = filtresGlobaux["pm"]?.[m.body?.toLowerCase()]
      
      if (correspondance) {
        if (correspondance.type && correspondance.file) {
          const buffer = Buffer.from(correspondance.file, "base64")
          return await m.send(buffer, { 
            caption: correspondance.caption, 
            mimetype: correspondance.mimetype 
          }, correspondance.type.replace("Message", ""))
        } else {
          return await m.send(correspondance.msg)
        }
      }
      return
    }

    // Filtres de groupe
    const filtresLocaux = await getData("gfilter") || {}
    const reponse = filtresLocaux[m.chat]?.[m.body?.toLowerCase()]
    
    if (reponse) {
      if (reponse.type && reponse.file) {
        const buffer = Buffer.from(reponse.file, "base64")
        return await m.send(buffer, { 
          caption: reponse.caption, 
          mimetype: reponse.mimetype 
        }, reponse.type.replace("Message", ""))
      } else {
        return await m.send(reponse.msg)
      }
    }
  } catch (e) {
    console.error("❌ Erreur écouteur filtres:", e)
  }
})

King({
  on: "all",
  fromMe: false
}, async (m) => {
  try {
    if (!m.isGroup) return

    const botEstAdmin = await isBotAdmin(m)
    if (!botEstAdmin) return

    const donnees = await getData("blacklisted")
    if (!donnees || !donnees[m.chat]) return

    const listeNoire = donnees[m.chat]

    // Vérifier les utilisateurs muets
    if (listeNoire.users.includes(m.sender)) {
      return await m.send(m, {}, "delete")
    }

    // Vérifier les autocollants muets
    if (m.mtype === "stickerMessage" && m.msg?.fileSha256) {
      const hash = Buffer.from(m.msg.fileSha256).toString("hex")
      if (listeNoire.stk.includes(hash)) {
        return await m.send(m, {}, "delete")
      }
    }
  } catch (e) {
    console.error("❌ Erreur écouteur restrictions:", e)
  }
})

console.log("✅ Module utilisateur chargé avec succès")
