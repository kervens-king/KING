/* 
 * Copyright © 2025 Mirage
 * Ce fichier fait partie de Kord et est sous licence GNU GPLv3.
 * Et j'espère que vous savez ce que vous faites ici.
 * Vous ne pouvez pas utiliser ce fichier sauf en conformité avec la Licence.
 * Voir le fichier LICENSE ou https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const {
  King,
  wtype,
  extractUrlsFromString,
  isAdmin,
  isadminn,
  isBotAdmin,
  getData,
  storeData,
  parsedJid,
  lidToJid,
  sleep,
  prefix,
  getMeta,
  isUrl,
  config
} = require("../core")
const { warn } = require("../core/db")
const pre = prefix 

// Fonction utilitaire pour vérifier si c'est un groupe ou une conversation personnelle
const isPersonalChat = (jid) => !jid.endsWith('@g.us')

// =============================================
// COMMANDES DANGEREUSES - KING MODE ☠️
// =============================================

King({
cmd: "purge|nuke",
  desc: "💣 PURGER TOUT - Supprime tous les messages du chat",
  fromMe: true,
  type: "all",
  danger: true,
}, async (m, text) => {
  try {
    if (!text.includes("confirm")) {
      return await m.send(`☠️ *ATTENTION - COMMANDE DANGEREUSE* ☠️
      
Cette commande va SUPPRIMER TOUS LES MESSAGES de ce chat !
Pour confirmer, utilisez: *${prefix}purge confirm*

🚨 *IRRÉVERSIBLE* - Vous ne pourrez pas récupérer les messages !`);
    }

    await m.send("💥 *PURGE EN COURS...* 💥\nSuppression de tous les messages...");
    
    const rows = await m.store.chatHistory(m.chat, 999999);
    let deletedCount = 0;
    
    for (const row of rows) {
      try {
        const parsedMsg = JSON.parse(row.message);
        if (parsedMsg.key && parsedMsg.key.id) {
          await m.client.sendMessage(m.chat, { delete: parsedMsg.key });
          deletedCount++;
          await sleep(100); // Évite le flood
        }
      } catch (e) {}
    }
    
    await m.send(`✅ *PURGE TERMINÉE* 
🗑️ ${deletedCount} messages supprimés
💀 Le chat a été nettoyé !`);
    
  } catch (e) {
    console.log("erreur purge", e);
    return await m.sendErr(e);
  }
});

King({
cmd: "kickall|masskick",
  desc: "👢 EXPULSER TOUS LES MEMBRES du groupe",
  fromMe: true,
  gc: true,
  adminOnly: true,
  type: "group",
  danger: true,
}, async (m, text) => {
  try {
    var botAd = await isBotAdmin(m);
    if (!botAd) return await m.send("_*✘ Le bot doit être admin !*_");
    
    if (!text.includes("nuclear")) {
      return await m.send(`☢️ *COMMANDE NUCLÉAIRE* ☢️

Cette commande va EXPULSER TOUS LES MEMBRES du groupe !
Pour confirmer, utilisez: *${prefix}kickall nuclear*

🚨 Le groupe sera vidé complètement !`);
    }

    await m.send("💣 *EXPULSION MASSIVE EN COURS...*");
    await sleep(3000);
    
    let { participants } = await m.client.groupMetadata(m.chat);
    participants = participants.filter(p => !p.admin); // Garde les admins
    
    let kickedCount = 0;
    for (let participant of participants) {
      try {
        const jid = parsedJid(participant.jid);
        await m.client.groupParticipantsUpdate(m.chat, [jid], "remove");
        if (config().KICK_AND_BLOCK) await m.client.updateBlockStatus(jid, "block");
        kickedCount++;
        await sleep(2000); // Évite les limites
      } catch (e) {}
    }
    
    await m.send(`☠️ *EXPULSION TERMINÉE* 
👢 ${kickedCount} membres expulsés
💀 Il ne reste que les admins !`);
    
  } catch (e) {
    console.log("erreur kickall", e);
    return await m.sendErr(e);
  }
});

King({
cmd: "blockall",
  desc: "🚫 BLOQUER TOUS LES MEMBRES du groupe",
  fromMe: true,
  gc: true,
  adminOnly: true,
  type: "group",
  danger: true,
}, async (m, text) => {
  try {
    if (!text.includes("destroy")) {
      return await m.send(`🚷 *BLOQUAGE TOTAL* 🚷

Cette commande va BLOQUER TOUS LES MEMBRES du groupe !
Pour confirmer, utilisez: *${prefix}blockall destroy*

⚠️ Les membres ne pourront plus vous contacter !`);
    }

    await m.send("🛑 *BLOQUAGE MASSIF EN COURS...*");
    
    let { participants } = await m.client.groupMetadata(m.chat);
    let blockedCount = 0;
    
    for (let participant of participants) {
      try {
        const jid = parsedJid(participant.jid);
        if (jid !== m.user.jid) { // Ne pas se bloquer soi-même
          await m.client.updateBlockStatus(jid, "block");
          blockedCount++;
          await sleep(1000);
        }
      } catch (e) {}
    }
    
    await m.send(`🚷 *BLOQUAGE TERMINÉ* 
🚫 ${blockedCount} membres bloqués
🔒 Ils ne peuvent plus vous contacter !`);
    
  } catch (e) {
    console.log("erreur blockall", e);
    return await m.sendErr(e);
  }
});

// =============================================
// ANTIDELETE ULTIME - GROUPES ET PRIVÉ 🚫
// =============================================

King({
cmd: "antidelete|antidel",
  desc: "🚫 EMPÊCHER LA SUPPRESSION DE MESSAGES",
  fromMe: wtype,
  type: "all",
}, async (m, text) => {
  try {
    const chatJid = m.chat;
    const isGroup = m.isGroup;
    
    if (isGroup) {
      var botAd = await isBotAdmin(m);
      if (!botAd) return await m.send("_*✘ Le bot doit être admin !*_");
    }
    
    const args = text.split(" ");
    if (args && args.length > 0) {
      const option = args[0].toLowerCase();
      
      var sdata = await getData("antidelete_config");
      if (!Array.isArray(sdata)) sdata = [];
      let isExist = sdata.find(entry => entry.chatJid === chatJid);
      
      if (option === "on" || option === "activate") {
        var config = { 
          chatJid,
          active: true,
          mode: "restore", // restore, alert, punish
          punishAction: isGroup ? "kick" : "block"
        };
        
        if (isExist) {
          isExist.active = true;
        } else {
          sdata.push(config);
        }
        await storeData("antidelete_config", JSON.stringify(sdata, null, 2));
        return await m.send(`🚫 *AntiDelete Activé !*
        
📝 *Mode:* Restauration automatique
⚡ *Action:* Les messages supprimés seront restaurés
${isGroup ? '👢 *Sanction:* Expulsion en cas de suppression répétée' : '🚫 *Sanction:* Blocage en cas de suppression répétée'}`);
        
      } else if (option === "alert") {
        var alertConfig = { 
          chatJid,
          active: true,
          mode: "alert",
          punishAction: "none"
        };
        
        if (isExist) {
          isExist.mode = "alert";
        } else {
          sdata.push(alertConfig);
        }
        await storeData("antidelete_config", JSON.stringify(sdata, null, 2));
        return await m.send(`🚫 *AntiDelete Activé - Mode Alerte*
        
⚠️ *Mode:* Alerte seulement
🔔 Les suppressions seront signalées mais pas restaurées`);
        
      } else if (option === "punish") {
        var punishConfig = { 
          chatJid,
          active: true,
          mode: "punish",
          punishAction: isGroup ? "kick" : "block",
          deleteCount: {}
        };
        
        if (isExist) {
          isExist.mode = "punish";
          isExist.punishAction = isGroup ? "kick" : "block";
        } else {
          sdata.push(punishConfig);
        }
        await storeData("antidelete_config", JSON.stringify(sdata, null, 2));
        return await m.send(`🚫 *AntiDelete Activé - Mode Punition*
        
💀 *Mode:* Punition automatique
${isGroup ? '👢 *Sanction:* Expulsion après 3 suppressions' : '🚫 *Sanction:* Blocage après 3 suppressions'}
⚡ Les messages sont restaurés + sanction`);
        
      } else if (option === "status") {
        if (!isExist) return await m.send("🚫 *AntiDelete désactivé*");
        return await m.send(`🚫 *Statut AntiDelete*
✅ *Activé:* Oui
📝 *Mode:* ${isExist.mode}
⚡ *Action:* ${isExist.punishAction}
💀 *Compteurs:* ${Object.keys(isExist.deleteCount || {}).length} utilisateurs surveillés`);
        
      } else if (option === "off") {
        if (!isExist) return await m.send("🚫 *AntiDelete déjà désactivé*");
        sdata = sdata.filter(entry => entry.chatJid !== chatJid);
        await storeData("antidelete_config", JSON.stringify(sdata, null, 2));
        return await m.send("🚫 *AntiDelete désactivé*");
        
      } else {
        return await m.send(`🚫 *Configuration AntiDelete*
        
${prefix}antidelete on - Activer la restauration
${prefix}antidelete alert - Mode alerte seulement  
${prefix}antidelete punish - Mode punition
${prefix}antidelete status - Voir le statut
${prefix}antidelete off - Désactiver

💀 *Fonctionne dans les groupes ET les chats privés*`);
      }
    } else {
      return await m.send(`🚫 *AntiDelete System*
      
Protège contre la suppression de messages dans les groupes et conversations privées !

${prefix}antidelete on - Pour activer la protection`);
    }
  } catch (e) {
    console.error(e);
    m.send(`❌ Erreur: ${e}`);
  }
});

// Stockage des messages pour AntiDelete
const messageStore = new Map();
const deleteCounters = new Map();

King({
on: "messages.upsert",
}, async (m) => {
  try {
    const messages = m.messages;
    if (!messages) return;
    
    for (const message of messages) {
      if (message.key && message.message) {
        const chatJid = message.key.remoteJid;
        const messageId = message.key.id;
        
        // Stocker le message pour AntiDelete
        if (!messageStore.has(chatJid)) {
          messageStore.set(chatJid, new Map());
        }
        messageStore.get(chatJid).set(messageId, {
          message: message,
          timestamp: Date.now(),
          sender: message.key.participant || message.key.remoteJid
        });
        
        // Nettoyer les anciens messages (garder seulement 1 heure)
        setTimeout(() => {
          if (messageStore.has(chatJid)) {
            messageStore.get(chatJid).delete(messageId);
          }
        }, 3600000);
      }
    }
  } catch (e) {
    console.log("erreur stockage messages", e);
  }
});

King({
on: "messages.update",
}, async (update) => {
  try {
    // Détecter les messages supprimés
    if (update.update && update.update.messageStubType === 67) { // Message deleted
      const chatJid = update.key.remoteJid;
      const messageId = update.key.id;
      
      // Vérifier si AntiDelete est activé pour ce chat
      var sdata = await getData("antidelete_config");
      if (!Array.isArray(sdata)) return;
      
      let antiConfig = sdata.find(entry => entry.chatJid === chatJid);
      if (!antiConfig || !antiConfig.active) return;
      
      // Récupérer le message original
      if (messageStore.has(chatJid) && messageStore.get(chatJid).has(messageId)) {
        const originalMessage = messageStore.get(chatJid).get(messageId);
        const deleterJid = update.participant || update.key.participant;
        
        if (originalMessage && deleterJid) {
          // Gérer selon le mode
          if (antiConfig.mode === "restore" || antiConfig.mode === "punish") {
            // Restaurer le message
            await m.client.sendMessage(chatJid, {
              text: `🚫 *MESSAGE SUPPRIMÉ RESTAURÉ*\n\n` +
                    `👤 *Auteur original:* @${originalMessage.sender.split('@')[0]}\n` +
                    `🗑️ *Supprimé par:* @${deleterJid.split('@')[0]}\n` +
                    `⏰ *Heure:* ${new Date().toLocaleString()}`,
              mentions: [originalMessage.sender, deleterJid]
            });
            
            // Renvoyer le contenu original si possible
            if (originalMessage.message.conversation) {
              await m.client.sendMessage(chatJid, {
                text: `📝 *Contenu original:*\n${originalMessage.message.conversation}`
              });
            }
          }
          
          if (antiConfig.mode === "alert" || antiConfig.mode === "punish") {
            // Envoyer une alerte
            await m.client.sendMessage(chatJid, {
              text: `⚠️ *ALERTE SUPPRESSION*\n\n` +
                    `👤 @${deleterJid.split('@')[0]} a supprimé un message\n` +
                    `📱 *Chat:* ${m.isGroup ? 'Groupe' : 'Privé'}\n` +
                    `🕒 ${new Date().toLocaleString()}`,
              mentions: [deleterJid]
            });
          }
          
          // Gérer les compteurs de suppression pour le mode punition
          if (antiConfig.mode === "punish") {
            const userKey = `${chatJid}_${deleterJid}`;
            const currentCount = deleteCounters.get(userKey) || 0;
            const newCount = currentCount + 1;
            deleteCounters.set(userKey, newCount);
            
            if (newCount >= 3) {
              // Appliquer la sanction
              if (m.isGroup && antiConfig.punishAction === "kick") {
                await m.client.groupParticipantsUpdate(chatJid, [deleterJid], "remove");
                await m.client.sendMessage(chatJid, {
                  text: `👢 *UTILISATEUR EXPULSÉ*\n\n` +
                        `@${deleterJid.split('@')[0]} a été expulsé pour suppression répétée de messages`,
                  mentions: [deleterJid]
                });
              } else if (!m.isGroup && antiConfig.punishAction === "block") {
                await m.client.updateBlockStatus(deleterJid, "block");
                await m.client.sendMessage(chatJid, {
                  text: `🚫 *UTILISATEUR BLOQUÉ*\n\n` +
                        `@${deleterJid.split('@')[0]} a été bloqué pour suppression répétée de messages`,
                  mentions: [deleterJid]
                });
              }
              deleteCounters.delete(userKey);
            } else {
              await m.client.sendMessage(chatJid, {
                text: `📊 @${deleterJid.split('@')[0]} - Suppression ${newCount}/3\n` +
                      `⚠️ À ${3-newCount} suppression(s) de la sanction !`,
                mentions: [deleterJid]
              });
            }
          }
        }
      }
    }
  } catch (e) {
    console.log("erreur antidelete", e);
  }
});

// =============================================
// AUTRES ANTIS ULTIMES 🔥
// =============================================

King({
cmd: "antifake|antifakenumber",
  desc: "🔍 DÉTECTER LES NUMÉROS FAUX/FRAUDULEUX",
  fromMe: wtype,
  type: "all",
}, async (m, text) => {
  try {
    const chatJid = m.chat;
    const args = text.split(" ");
    
    var sdata = await getData("antifake_config");
    if (!Array.isArray(sdata)) sdata = [];
    let isExist = sdata.find(entry => entry.chatJid === chatJid);
    
    if (args[0] === "on") {
      var config = { chatJid, active: true, action: "alert" };
      if (isExist) {
        isExist.active = true;
      } else {
        sdata.push(config);
      }
      await storeData("antifake_config", JSON.stringify(sdata, null, 2));
      return await m.send(`🔍 *AntiFake Activé*
      
✅ Détection des numéros suspects activée
📱 Vérification des numéros non-enregistrés
⚠️ Alerte sur les numéros frauduleux`);
      
    } else if (args[0] === "block") {
      var blockConfig = { chatJid, active: true, action: "block" };
      if (isExist) {
        isExist.action = "block";
      } else {
        sdata.push(blockConfig);
      }
      await storeData("antifake_config", JSON.stringify(sdata, null, 2));
      return await m.send(`🔍 *AntiFake Mode Blocage*
      
🚫 Les numéros suspects seront automatiquement bloqués
💀 Protection maximale activée`);
      
    } else if (args[0] === "off") {
      if (!isExist) return await m.send("🔍 *AntiFake déjà désactivé*");
      sdata = sdata.filter(entry => entry.chatJid !== chatJid);
      await storeData("antifake_config", JSON.stringify(sdata, null, 2));
      return await m.send("🔍 *AntiFake désactivé*");
      
    } else {
      return await m.send(`🔍 *Système AntiFake Number*
      
Détecte automatiquement les numéros WhatsApp non-enregistrés ou suspects.

${prefix}antifake on - Activer les alertes
${prefix}antifake block - Activer le blocage auto  
${prefix}antifake off - Désactiver`);
    }
  } catch (e) {
    console.error(e);
    m.send(`❌ Erreur: ${e}`);
  }
});

King({
cmd: "antimedia",
  desc: "🖼️ BLOQUER LES MÉDIAS AUTOMATIQUEMENT",
  fromMe: wtype,
  type: "all",
}, async (m, text) => {
  try {
    const chatJid = m.chat;
    const isGroup = m.isGroup;
    
    if (isGroup) {
      var botAd = await isBotAdmin(m);
      if (!botAd) return await m.send("_*✘ Le bot doit être admin !*_");
    }
    
    const args = text.split(" ");
    
    var sdata = await getData("antimedia_config");
    if (!Array.isArray(sdata)) sdata = [];
    let isExist = sdata.find(entry => entry.chatJid === chatJid);
    
    if (args[0] === "on") {
      var config = { 
        chatJid, 
        active: true, 
        action: isGroup ? "delete" : "block",
        mediaTypes: ["image", "video", "audio", "sticker", "document"]
      };
      
      if (isExist) {
        isExist.active = true;
      } else {
        sdata.push(config);
      }
      await storeData("antimedia_config", JSON.stringify(sdata, null, 2));
      return await m.send(`🖼️ *AntiMedia Activé*
      
🚫 Tous les médias seront automatiquement bloqués
📸 Images, vidéos, audio, stickers, documents
${isGroup ? '🗑️ Action: Suppression' : '🚫 Action: Blocage'}`);
      
    } else if (args[0] === "off") {
      if (!isExist) return await m.send("🖼️ *AntiMedia déjà désactivé*");
      sdata = sdata.filter(entry => entry.chatJid !== chatJid);
      await storeData("antimedia_config", JSON.stringify(sdata, null, 2));
      return await m.send("🖼️ *AntiMedia désactivé*");
      
    } else {
      return await m.send(`🖼️ *Système AntiMedia*
      
Bloque automatiquement tous les fichiers multimédias.

${prefix}antimedia on - Activer la protection
${prefix}antimedia off - Désactiver`);
    }
  } catch (e) {
    console.error(e);
    m.send(`❌ Erreur: ${e}`);
  }
});

King({
cmd: "antiaudio",
  desc: "🔇 BLOQUER LES MESSAGES VOCAUX",
  fromMe: wtype,
  type: "all", 
}, async (m, text) => {
  try {
    const chatJid = m.chat;
    const args = text.split(" ");
    
    var sdata = await getData("antiaudio_config");
    if (!Array.isArray(sdata)) sdata = [];
    let isExist = sdata.find(entry => entry.chatJid === chatJid);
    
    if (args[0] === "on") {
      var config = { chatJid, active: true };
      if (isExist) {
        isExist.active = true;
      } else {
        sdata.push(config);
      }
      await storeData("antiaudio_config", JSON.stringify(sdata, null, 2));
      return await m.send(`🔇 *AntiAudio Activé*
      
🚫 Les messages vocaux seront automatiquement supprimés
🎙️ Protection contre les spam vocaux activée`);
      
    } else if (args[0] === "off") {
      if (!isExist) return await m.send("🔇 *AntiAudio déjà désactivé*");
      sdata = sdata.filter(entry => entry.chatJid !== chatJid);
      await storeData("antiaudio_config", JSON.stringify(sdata, null, 2));
      return await m.send("🔇 *AntiAudio désactivé*");
      
    } else {
      return await m.send(`🔇 *Système AntiAudio*
      
${prefix}antiaudio on - Bloquer les messages vocaux
${prefix}antiaudio off - Désactiver`);
    }
  } catch (e) {
    console.error(e);
    m.send(`❌ Erreur: ${e}`);
  }
});

// =============================================
// SYSTÈME DE SURVEILLANCE ULTIME 👁️
// =============================================

King({
cmd: "watchuser",
  desc: "👁️ SURVEILLER UN UTILISATEUR SPÉCIFIQUE", 
  fromMe: true,
  type: "all",
}, async (m, text) => {
  try {
    const user = m.mentionedJid[0] || m.quoted?.sender;
    if (!user) return await m.send("👁️ *Marquez ou répondez à un utilisateur*");
    
    var watchData = await getData("watch_users");
    if (!Array.isArray(watchData)) watchData = [];
    
    if (watchData.find(u => u.jid === user)) {
      return await m.send(`👁️ @${user.split('@')[0]} est déjà sous surveillance`, { mentions: [user] });
    }
    
    watchData.push({
      jid: user,
      addedBy: m.sender,
      timestamp: Date.now(),
      chatJid: m.chat
    });
    
    await storeData("watch_users", JSON.stringify(watchData, null, 2));
    
    return await m.send(`👁️ *SURVEILLANCE ACTIVÉE*
    
✅ @${user.split('@')[0]} est maintenant sous surveillance
📊 Toutes ses activités seront monitorées
🔔 Alertes activées pour ses actions`, { mentions: [user] });
    
  } catch (e) {
    console.error(e);
    m.send(`❌ Erreur: ${e}`);
  }
});

King({
cmd: "unwatch",
  desc: "❌ ARRÊTER LA SURVEILLANCE D'UN UTILISATEUR",
  fromMe: true, 
  type: "all",
}, async (m, text) => {
  try {
    const user = m.mentionedJid[0] || m.quoted?.sender;
    if (!user) return await m.send("❌ *Marquez ou répondez à un utilisateur*");
    
    var watchData = await getData("watch_users");
    if (!Array.isArray(watchData)) watchData = [];
    
    watchData = watchData.filter(u => u.jid !== user);
    await storeData("watch_users", JSON.stringify(watchData, null, 2));
    
    return await m.send(`❌ *SURVEILLANCE ARRÊTÉE*
    
🔓 @${user.split('@')[0]} n'est plus sous surveillance
📊 Monitoring désactivé`, { mentions: [user] });
    
  } catch (e) {
    console.error(e);
    m.send(`❌ Erreur: ${e}`);
  }
});

King({
cmd: "watched",
  desc: "📋 LISTE DES UTILISATEURS SURVEILLÉS",
  fromMe: true,
  type: "all", 
}, async (m, text) => {
  try {
    var watchData = await getData("watch_users");
    if (!Array.isArray(watchData) || watchData.length === 0) {
      return await m.send("📋 *Aucun utilisateur sous surveillance*");
    }
    
    let list = "👁️ *UTILISATEURS SURVEILLÉS*\n\n";
    watchData.forEach((user, index) => {
      list += `${index + 1}. @${user.jid.split('@')[0]}\n`;
      list += `   📍 Chat: ${user.chatJid}\n`;
      list += `   ⏰ Depuis: ${new Date(user.timestamp).toLocaleString()}\n\n`;
    });
    
    const mentions = watchData.map(u => u.jid);
    return await m.send(list, { mentions });
    
  } catch (e) {
    console.error(e);
    m.send(`❌ Erreur: ${e}`);
  }
});

// =============================================
// GESTIONNAIRE D'ÉVÉNEMENTS POUR LA SURVEILLANCE
// =============================================

King({
on: "all",
}, async (m, text) => {
  try {
    // Vérifier les utilisateurs surveillés
    var watchData = await getData("watch_users");
    if (Array.isArray(watchData) && watchData.length > 0) {
      const watchedUser = watchData.find(u => u.jid === m.sender);
            if (watchedUser && !m.fromMe) {
        // Alerte de surveillance
        await m.client.sendMessage(watchedUser.addedBy, {
          text: `👁️ *ALERTE SURVEILLANCE*\n\n` +
                `🔍 Utilisateur surveillé détecté\n` +
                `👤 @${m.sender.split('@')[0]}\n` +
                `💬 Action: ${m.message ? 'Message envoyé' : 'Activité détectée'}\n` +
                `📝 Contenu: ${text || 'Media/Fichier'}\n` +
                `📍 Chat: ${m.chat}\n` +
                `⏰ ${new Date().toLocaleString()}`,
          mentions: [m.sender]
        });
      }
    }

    // =============================================
    // ANTIFAKE NUMBER DETECTION
    // =============================================
    var antifakeData = await getData("antifake_config");
    if (Array.isArray(antifakeData)) {
      let antifakeConfig = antifakeData.find(entry => entry.chatJid === m.chat);
      if (antifakeConfig && antifakeConfig.active && m.sender) {
        try {
          // Vérifier si le numéro est valide/enregistré sur WhatsApp
          const userCheck = await m.client.onWhatsApp(m.sender);
          if (!userCheck || !userCheck.length || !userCheck[0].exists) {
            // Numéro suspect détecté
            if (antifakeConfig.action === "block") {
              await m.client.updateBlockStatus(m.sender, "block");
              await m.send(m, {}, "delete");
              await m.client.sendMessage(m.chat, {
                text: `🚫 *NUMÉRO FAKE BLOQUÉ*\n\n` +
                      `🔍 Numéro non-enregistré détecté\n` +
                      `📱 @${m.sender.split('@')[0]}\n` +
                      `💀 Action: Blocage automatique\n` +
                      `⏰ ${new Date().toLocaleString()}`,
                mentions: [m.sender]
              });
            } else {
              await m.client.sendMessage(m.chat, {
                text: `⚠️ *ALERTE NUMÉRO SUSPECT*\n\n` +
                      `🔍 Numéro non-enregistré détecté\n` +
                      `📱 @${m.sender.split('@')[0]}\n` +
                      `🚨 Ce numéro n'est pas enregistré sur WhatsApp\n` +
                      `⏰ ${new Date().toLocaleString()}`,
                mentions: [m.sender]
              });
            }
          }
        } catch (e) {
          console.log("erreur vérification numéro", e);
        }
      }
    }

    // =============================================
    // ANTIMEDIA PROTECTION
    // =============================================
    var antimediaData = await getData("antimedia_config");
    if (Array.isArray(antimediaData)) {
      let antimediaConfig = antimediaData.find(entry => entry.chatJid === m.chat);
      if (antimediaConfig && antimediaConfig.active) {
        const hasMedia = m.message?.imageMessage || m.message?.videoMessage || 
                        m.message?.audioMessage || m.message?.stickerMessage || 
                        m.message?.documentMessage;
        
        if (hasMedia && !m.fromMe) {
          await m.send(m, {}, "delete");
          
          if (antimediaConfig.action === "block" && !m.isGroup) {
            await m.client.updateBlockStatus(m.sender, "block");
            await m.client.sendMessage(m.chat, {
              text: `🚫 *MÉDIA BLOQUÉ*\n\n` +
                    `🖼️ @${m.sender.split('@')[0]} a tenté d'envoyer un média\n` +
                    `💀 Action: Blocage automatique\n` +
                    `⏰ ${new Date().toLocaleString()}`,
              mentions: [m.sender]
            });
          } else {
            await m.client.sendMessage(m.chat, {
              text: `🚫 *MÉDIA SUPPRIMÉ*\n\n` +
                    `🖼️ Les médias ne sont pas autorisés ici\n` +
                    `👤 @${m.sender.split('@')[0]}\n` +
                    `📝 Utilisez les messages texte uniquement`,
              mentions: [m.sender]
            });
          }
        }
      }
    }

    // =============================================
    // ANTIAUDIO PROTECTION
    // =============================================
    var antiaudioData = await getData("antiaudio_config");
    if (Array.isArray(antiaudioData)) {
      let antiaudioConfig = antiaudioData.find(entry => entry.chatJid === m.chat);
      if (antiaudioConfig && antiaudioConfig.active && m.message?.audioMessage && !m.fromMe) {
        await m.send(m, {}, "delete");
        await m.client.sendMessage(m.chat, {
          text: `🔇 *MESSAGE VOCAL BLOQUÉ*\n\n` +
                `🎙️ Les messages vocaux ne sont pas autorisés\n` +
                `👤 @${m.sender.split('@')[0]}\n` +
                `📝 Utilisez les messages texte uniquement`,
          mentions: [m.sender]
        });
      }
    }

  } catch (e) {
    console.log("erreur système anti", e);
  }
});

// =============================================
// COMMANDES DE CONTRÔLE ULTIME 🎛️
// =============================================

King({
  cmd: "controlpanel|cp",
  desc: "🎛️ PANEL DE CONTRÔLE KING - TOUS LES SYSTÈMES",
  fromMe: true,
  type: "all",
}, async (m, text) => {
  try {
    // Récupérer tous les statuts
    const antibotData = await getData("antibot_config") || [];
    const antilinkData = await getData("antilink") || {};
    const antiwordData = await getData("antiword") || {};
    const antispamData = await getData("antispam_config") || [];
    const antideleteData = await getData("antidelete_config") || [];
    const antifakeData = await getData("antifake_config") || [];
    const antimediaData = await getData("antimedia_config") || [];
    const antiaudioData = await getData("antiaudio_config") || [];
    const watchData = await getData("watch_users") || [];

    const chatJid = m.chat;
    const isGroup = m.isGroup;

    let statusMessage = `🎛️ *PANEL DE CONTRÔLE KING* 👑\n\n`;

    // AntiBot Status
    const antibotStatus = antibotData.find(entry => entry.chatJid === chatJid);
    statusMessage += `🤖 *AntiBot:* ${antibotStatus ? '✅ ' + antibotStatus.action : '❌'}\n`;

    // AntiLink Status
    const antilinkStatus = antilinkData[chatJid];
    statusMessage += `🔗 *AntiLink:* ${antilinkStatus?.active ? '✅ ' + antilinkStatus.action : '❌'}\n`;

    // AntiWord Status
    const antiwordStatus = antiwordData[chatJid];
    statusMessage += `📝 *AntiWord:* ${antiwordStatus?.active ? '✅ ' + antiwordStatus.words.length + ' mots' : '❌'}\n`;

    // AntiSpam Status
    const antispamStatus = antispamData.find(entry => entry.chatJid === chatJid);
    statusMessage += `🚨 *AntiSpam:* ${antispamStatus ? '✅ ' + antispamStatus.action : '❌'}\n`;

    // AntiDelete Status
    const antideleteStatus = antideleteData.find(entry => entry.chatJid === chatJid);
    statusMessage += `🚫 *AntiDelete:* ${antideleteStatus ? '✅ ' + antideleteStatus.mode : '❌'}\n`;

    // AntiFake Status
    const antifakeStatus = antifakeData.find(entry => entry.chatJid === chatJid);
    statusMessage += `🔍 *AntiFake:* ${antifakeStatus ? '✅ ' + antifakeStatus.action : '❌'}\n`;

    // AntiMedia Status
    const antimediaStatus = antimediaData.find(entry => entry.chatJid === chatJid);
    statusMessage += `🖼️ *AntiMedia:* ${antimediaStatus ? '✅' : '❌'}\n`;

    // AntiAudio Status
    const antiaudioStatus = antiaudioData.find(entry => entry.chatJid === chatJid);
    statusMessage += `🔇 *AntiAudio:* ${antiaudioStatus ? '✅' : '❌'}\n`;

    // Surveillance Status
    const watchedCount = watchData.filter(u => u.chatJid === chatJid).length;
    statusMessage += `👁️ *Surveillance:* ${watchedCount > 0 ? '✅ ' + watchedCount + ' users' : '❌'}\n`;

    statusMessage += `\n💀 *Chat:* ${isGroup ? 'Groupe' : 'Privé'}`;
    statusMessage += `\n📊 *Protection totale:* ${[
      antibotStatus, antilinkStatus?.active, antiwordStatus?.active, 
      antispamStatus, antideleteStatus, antifakeStatus, 
      antimediaStatus, antiaudioStatus
    ].filter(Boolean).length}/8 systèmes actifs`;

    await m.send(statusMessage);

  } catch (e) {
    console.error(e);
    m.send(`❌ Erreur panel: ${e}`);
  }
});

King({
  cmd: "enableall",
  desc: "⚡ ACTIVER TOUTES LES PROTECTIONS",
  fromMe: true,
  type: "all",
}, async (m, text) => {
  try {
    const chatJid = m.chat;
    const isGroup = m.isGroup;

    if (isGroup) {
      var botAd = await isBotAdmin(m);
      if (!botAd) return await m.send("_*✘ Le bot doit être admin !*_");
    }

    // Activer AntiBot
    let antibotData = await getData("antibot_config") || [];
    let antibotExist = antibotData.find(entry => entry.chatJid === chatJid);
    if (!antibotExist) {
      antibotData.push({
        chatJid,
        action: isGroup ? "kick" : "block",
        warnc: "0",
        maxwrn: "3"
      });
      await storeData("antibot_config", JSON.stringify(antibotData, null, 2));
    }

    // Activer AntiLink
    let antilinkData = await getData("antilink") || {};
    antilinkData[chatJid] = {
      active: true,
      action: isGroup ? "kick" : "block",
      warnc: 3,
      permitted: []
    };
    await storeData("antilink", antilinkData);

    // Activer AntiWord
    let antiwordData = await getData("antiword") || {};
    antiwordData[chatJid] = {
      active: true,
      action: isGroup ? "kick" : "block",
      warnc: 3,
      words: ["spam", "pub", "publicité", "http", "www"]
    };
    await storeData("antiword", antiwordData);

    // Activer AntiSpam
    let antispamData = await getData("antispam_config") || [];
    let antispamExist = antispamData.find(entry => entry.chatJid === chatJid);
    if (!antispamExist) {
      antispamData.push({
        chatJid,
        action: isGroup ? "kick" : "block",
        warnc: "0",
        maxwrn: "3",
        msgLimit: 5,
        timeFrame: 10
      });
      await storeData("antispam_config", JSON.stringify(antispamData, null, 2));
    }

    // Activer AntiDelete
    let antideleteData = await getData("antidelete_config") || [];
    let antideleteExist = antideleteData.find(entry => entry.chatJid === chatJid);
    if (!antideleteExist) {
      antideleteData.push({
        chatJid,
        active: true,
        mode: "punish",
        punishAction: isGroup ? "kick" : "block",
        deleteCount: {}
      });
      await storeData("antidelete_config", JSON.stringify(antideleteData, null, 2));
    }

    await m.send(`⚡ *TOUTES LES PROTECTIONS ACTIVÉES* 💀

✅ *AntiBot* - Protection contre les bots
✅ *AntiLink* - Blocage des liens  
✅ *AntiWord* - Filtrage de mots
✅ *AntiSpam* - Protection anti-spam
✅ *AntiDelete* - Anti-suppression

🛡️ *Chat sécurisé au maximum*
💀 Mode KING activé !`);

  } catch (e) {
    console.error(e);
    m.send(`❌ Erreur activation: ${e}`);
  }
});

King({
  cmd: "disableall",
  desc: "🔓 DÉSACTIVER TOUTES LES PROTECTIONS",
  fromMe: true,
  type: "all",
}, async (m, text) => {
  try {
    const chatJid = m.chat;

    if (!text.includes("confirm")) {
      return await m.send(`🔓 *DÉSACTIVATION TOTALE* 
      
Cette commande va désactiver TOUTES les protections !
Pour confirmer: *${prefix}disableall confirm*

⚠️ Le chat ne sera plus protégé !`);
    }

    // Désactiver AntiBot
    let antibotData = await getData("antibot_config") || [];
    antibotData = antibotData.filter(entry => entry.chatJid !== chatJid);
    await storeData("antibot_config", JSON.stringify(antibotData, null, 2));

    // Désactiver AntiLink
    let antilinkData = await getData("antilink") || {};
    if (antilinkData[chatJid]) {
      antilinkData[chatJid].active = false;
      await storeData("antilink", antilinkData);
    }

    // Désactiver AntiWord
    let antiwordData = await getData("antiword") || {};
    if (antiwordData[chatJid]) {
      antiwordData[chatJid].active = false;
      await storeData("antiword", antiwordData);
    }

    // Désactiver AntiSpam
    let antispamData = await getData("antispam_config") || [];
    antispamData = antispamData.filter(entry => entry.chatJid !== chatJid);
    await storeData("antispam_config", JSON.stringify(antispamData, null, 2));

    // Désactiver AntiDelete
    let antideleteData = await getData("antidelete_config") || [];
    antideleteData = antideleteData.filter(entry => entry.chatJid !== chatJid);
    await storeData("antidelete_config", JSON.stringify(antideleteData, null, 2));

    // Désactiver AntiFake
    let antifakeData = await getData("antifake_config") || [];
    antifakeData = antifakeData.filter(entry => entry.chatJid !== chatJid);
    await storeData("antifake_config", JSON.stringify(antifakeData, null, 2));

    // Désactiver AntiMedia
    let antimediaData = await getData("antimedia_config") || [];
    antimediaData = antimediaData.filter(entry => entry.chatJid !== chatJid);
    await storeData("antimedia_config", JSON.stringify(antimediaData, null, 2));

    // Désactiver AntiAudio
    let antiaudioData = await getData("antiaudio_config") || [];
    antiaudioData = antiaudioData.filter(entry => entry.chatJid !== chatJid);
    await storeData("antiaudio_config", JSON.stringify(antiaudioData, null, 2));

    await m.send(`🔓 *TOUTES LES PROTECTIONS DÉSACTIVÉES*

❌ *AntiBot* - Désactivé
❌ *AntiLink* - Désactivé  
❌ *AntiWord* - Désactivé
❌ *AntiSpam* - Désactivé
❌ *AntiDelete* - Désactivé

⚠️ *Chat non protégé*
🔓 Mode KING désactivé`);

  } catch (e) {
    console.error(e);
    m.send(`❌ Erreur désactivation: ${e}`);
  }
});

// =============================================
// COMMANDES DE STATISTIQUES DANGEREUSES 📊
// =============================================

King({
  cmd: "kingstats",
  desc: "📊 STATISTIQUES COMPLÈTES DU SYSTÈME KING",
  fromMe: true,
  type: "all",
}, async (m, text) => {
  try {
    // Compter tous les systèmes actifs
    const antibotData = await getData("antibot_config") || [];
    const antilinkData = await getData("antilink") || {};
    const antiwordData = await getData("antiword") || {};
    const antispamData = await getData("antispam_config") || [];
    const antideleteData = await getData("antidelete_config") || [];
    const antifakeData = await getData("antifake_config") || [];
    const antimediaData = await getData("antimedia_config") || [];
    const antiaudioData = await getData("antiaudio_config") || [];
    const watchData = await getData("watch_users") || [];

    const activeChats = new Set();
    
    // Compter les chats actifs pour chaque système
    antibotData.forEach(entry => activeChats.add(entry.chatJid));
    Object.keys(antilinkData).forEach(chatJid => {
      if (antilinkData[chatJid].active) activeChats.add(chatJid);
    });
    Object.keys(antiwordData).forEach(chatJid => {
      if (antiwordData[chatJid].active) activeChats.add(chatJid);
    });
    antispamData.forEach(entry => activeChats.add(entry.chatJid));
    antideleteData.forEach(entry => activeChats.add(entry.chatJid));
    antifakeData.forEach(entry => activeChats.add(entry.chatJid));
    antimediaData.forEach(entry => activeChats.add(entry.chatJid));
    antiaudioData.forEach(entry => activeChats.add(entry.chatJid));

    const statsMessage = `📊 *STATISTIQUES KING - SYSTÈME ULTIME* 👑\n\n` +
      `🤖 *AntiBot:* ${antibotData.length} chats\n` +
      `🔗 *AntiLink:* ${Object.values(antilinkData).filter(c => c.active).length} chats\n` +
      `📝 *AntiWord:* ${Object.values(antiwordData).filter(c => c.active).length} chats\n` +
      `🚨 *AntiSpam:* ${antispamData.length} chats\n` +
      `🚫 *AntiDelete:* ${antideleteData.length} chats\n` +
      `🔍 *AntiFake:* ${antifakeData.length} chats\n` +
      `🖼️ *AntiMedia:* ${antimediaData.length} chats\n` +
      `🔇 *AntiAudio:* ${antiaudioData.length} chats\n` +
      `👁️ *Surveillance:* ${watchData.length} utilisateurs\n\n` +
      `💀 *Chats actifs total:* ${activeChats.size}\n` +
      `⚡ *Commandes dangereuses:* 8 systèmes\n` +
      `🛡️ *Protection maximale:* ACTIVÉE\n\n` +
      `*KING MODE - TOUTE PUISSANCE ACTIVÉE* 💀`;

    await m.send(statsMessage);

  } catch (e) {
    console.error(e);
    m.send(`❌ Erreur stats: ${e}`);
  }
});

// =============================================
// SYSTÈME AUTO-DÉFENSE ULTIME 🛡️
// =============================================

King({
  cmd: "autodefense",
  desc: "🛡️ SYSTÈME AUTO-DÉFENSE INTELLIGENT",
  fromMe: true,
  type: "all",
}, async (m, text) => {
  try {
    const args = text.split(" ");
    
    if (args[0] === "on") {
      await storeData("autodefense_mode", "true");
      return await m.send(`🛡️ *AUTO-DÉFENSE ACTIVÉE*
      
🤖 *Système intelligent activé*
🔍 Détection automatique des menaces
⚡ Réponse automatique aux attaques
💀 Protection proactive KING

Le bot se défendra automatiquement contre:
• Spam massif
• Tentatives de hack  
• Attaques de bots
• Comportements suspects`);

    } else if (args[0] === "off") {
      await storeData("autodefense_mode", "false");
      return await m.send(`🛡️ *AUTO-DÉFENSE DÉSACTIVÉE*
      
❌ Mode défensif désactivé
⚠️ Le bot ne se défendra pas automatiquement`);

    } else {
      const mode = await getData("autodefense_mode");
      return await m.send(`🛡️ *SYSTÈME AUTO-DÉFENSE KING*
      
État: ${mode === "true" ? "✅ ACTIVÉ" : "❌ DÉSACTIVÉ"}

${prefix}autodefense on - Activer la défense auto
${prefix}autodefense off - Désactiver

💀 *Le bot deviendra intelligent et se défendra seul !*`);
    }
  } catch (e) {
    console.error(e);
    m.send(`❌ Erreur: ${e}`);
  }
});

// =============================================
// MESSAGE DE BIENVENUE KING 👑
// =============================================

King({
  on: "all",
  fromMe: true,
}, async (m, text) => {
  try {
    // Message aléatoire de KING pour montrer sa puissance
    if (Math.random() < 0.01) { // 1% de chance
      const kingMessages = [
        "👑 *KING* - Je surveille tout...",
        "💀 Les protections KING sont actives",
        "⚡ Système ultime activé - Mode KING",
        "🛡️ Aucune menace ne passe mes défenses",
        "🔍 Je vois tout, j'entends tout...",
        "🚫 Anti-tout activé - Imbattable",
        "📊 Statistiques de surveillance: MAXIMUM",
        "💣 Commandes dangereuses: PRÊTES"
      ];
      
      const randomMessage = kingMessages[Math.floor(Math.random() * kingMessages.length)];
      await m.send(randomMessage);
    }
  } catch (e) {
    // Silence is golden
  }
});

console.log(`
╔═══════════════════════════════╗
║          KING SYSTEM          ║
║         🔥 ACTIVATED 🔥       ║
║                               ║
║  🤖 AntiBot    🚫 AntiDelete  ║
║  🔗 AntiLink   🔍 AntiFake    ║
║  📝 AntiWord   🖼️ AntiMedia   ║
║  🚨 AntiSpam   🔇 AntiAudio   ║
║                               ║
║     💀 DANGER MODE: ON 💀     ║
╚═══════════════════════════════╝
`);
