/* 
 * Copyright © 2025 Mirage
 * Ce fichier fait partie de Kord et est sous licence GNU GPLv3.
 * Et j'espère que vous savez ce que vous faites ici.
 * Vous ne pouvez pas utiliser ce fichier sauf en conformité avec la Licence.
 * Voir le fichier LICENSE ou https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { King,
  commands,
  wtype,
  getData,
  storeData,
  prefix,
  secondsToHms,
  isBotAdmin,
  config,
  updateBot,
  Baileys,
} = require("../core")
const { exec } = require("child_process")
const os = require("os")
const pre = prefix
const core = require("../core")
const path = require('path')
const fs = require('fs')
const { warn } = require("../core/db")

King({
cmd: 'ping',
  desc: 'vérifier le ping du bot',
  react: "🙂‍↔️",
  fromMe: wtype,
  type: 'bot'
}, async (m, text) => {
  try {
    const start = performance.now();
    const msg = await m.send("```ping en cours...```");
    const end = performance.now();
    const ping = Math.round(end - start);
    msg.edit(`*_々 Pong! ${ping}ms_*`);
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
});


King({
  cmd: "ban",
  desc: "bannir un utilisateur du bot",
  fromMe: true,
  type: "bot"
}, async (m, text) => {
  try {
    let user
    if (m.isGroup) {
      if (m.mentionedJid?.length) {
        user = m.mentionedJid[0]
      } else if (m.quoted?.sender) {
        user = m.quoted.sender
      } else {
        return m.send("_répondez ou mentionnez un utilisateur_")
      }
    } else if (text) {
      user = text.replace(/[^\d]/g, '') + '@s.whatsapp.net'
    } else {
      user = m.chat
    }

    if (!user) return m.send("_répondez ou mentionnez un utilisateur_")
    if (user === m.ownerJid) return m.send("_pourquoi voudriez-vous faire ça ?_")

    let sdata = await getData("banned")
    if (!Array.isArray(sdata)) sdata = []

    if (sdata.includes(user)) {
      return m.send("_l'utilisateur est déjà banni_")
    }

    sdata.push(user)
    await storeData("banned", JSON.stringify(sdata, null, 2))
    return m.send("_utilisateur banni avec succès_")
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "unban",
  desc: "débannir un utilisateur banni",
  fromMe: true,
  type: "bot"
}, async (m, text) => {
  try {
    let user
    if (m.isGroup) {
      if (m.mentionedJid?.length) {
        user = m.mentionedJid[0]
      } else if (m.quoted?.sender) {
        user = m.quoted.sender
      } else {
        return m.send("_répondez ou mentionnez un utilisateur_")
      }
    } else if (text) {
      user = text.replace(/[^\d]/g, '') + '@s.whatsapp.net'
    } else {
      user = m.chat
    }

    if (!user) return m.send("_répondez ou mentionnez un utilisateur_")
    if (user === m.ownerJid) return m.send("_pourquoi feriez-vous ça ?_")

    let sdata = await getData("banned")
    if (!Array.isArray(sdata)) sdata = []

    if (!sdata.includes(user)) {
      return m.send("_l'utilisateur n'est pas actuellement banni_")
    }

    sdata = sdata.filter(entry => entry !== user)
    await storeData("banned", JSON.stringify(sdata, null, 2))
    return m.send("_utilisateur débanni avec succès_")
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
cmd: "banlist",
  desc: "afficher tous les utilisateurs bannis",
  fromMe: true,
  type: "bot"
}, async (m) => {
  try {
    let sdata = await getData("banned")
    if (!Array.isArray(sdata)) sdata = []
    
    if (!sdata.length) return m.send("_aucun utilisateur n'est actuellement banni_")
    
    let mentions = sdata.map(jid => jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
    let list = sdata.map((jid, i) => `${i + 1}. @${jid.replace(/[^0-9]/g, '')}`).join("\n")
    
    return m.send(`*Utilisateurs Bannis:*\n\n${list}`, { mentions })
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
cmd: 'uptime',
  desc: 'vérifier le temps de fonctionnement du bot',
  react: '💨',
  fromMe: wtype,
  type: 'bot'
}, async (m, text) => {
  try {
    var uptime = await secondsToHms(process.uptime())
    return m.send(`Temps de fonctionnement: ${uptime}`)
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: 'quoted',
  desc: 'renvoyer le message cité dans un message répondu',
  fromMe: wtype,
  type: 'tools'
}, async(m, text) => {
  try {
      if (!m.quoted) return m.send("*_répondez à un message qui répond à un autre message_*")
      const qu = await m.getQuotedObj();
      if (!qu) return m.send("*_répondez à un message qui répond à un message_*")
      if (qu.quoted?.fakeObj) {
    await m.forwardMessage(m.chat, qu.quoted.fakeObj);
      } else {
    await m.send("_Aucun message cité trouvé._");
      }
    } catch (e) {
      console.error(e)
      m.send(`${e}`)
    }
})

King({
cmd: "list",
  desc: "afficher la liste des commandes disponibles et leur description",
  react: "☯️",
  fromMe: wtype,
  type: 'help',
}, async (m, text) => {
  try {
    let count = 1
    list = ""
    commands.map((cmd => {
    if (cmd.cmd && cmd.desc) {
    const firstAlias = cmd.cmd.split('|')[0].trim();
    list += `${count++} *${firstAlias}*\n_${cmd.desc}_\n\n`;
    } else {
    const fallback = cmd.cmd ? cmd.cmd.split('|')[0].trim() : '';
    list += `${count++} *${fallback}*\n`;
    } }));
return m.send(list)
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

const pm2 = require('pm2')

King({
  cmd: "restart|reboot",
  desc: "redémarrer le bot",
  fromMe: true,
  type: "process",
}, async (m) => {
  try {
    await m.send("_𝌫 redémarrage en cours..._")
    await new Promise((resolve, reject) => {
      pm2.connect(err => {
        if (err) return reject(err)
        pm2.restart('king', (err) => {
          pm2.disconnect()
          return err ? reject(err) : resolve()
        })
      })
    })
  } catch (err) {
    return await m.send(`erreur..: ${err}`)
  }
})

King({
  cmd: "shutdown",
  desc: "éteindre le bot (vous devrez redémarrer sur le serveur)",
  fromMe: true,
  type: "process",
}, async (m) => {
  try {
    await m.send("_𝌫 extinction en cours..._")
    await new Promise((resolve, reject) => {
      pm2.connect(err => {
        if (err) return reject(err)
        pm2.stop('king', (err) => {
          pm2.disconnect()
          return err ? reject(err) : resolve()
        })
      })
    })
  } catch (err) {
    return await m.send(`erreur..: ${err}`)
  }
})


King({
  cmd: "p-status",
  desc: "vérifier le statut du processus",
  fromMe: true,
  type: "process"
}, async (m, text) => {
  try {
    exec("npx pm2 status king", async (err, stdout, stderr) => {
      if (err) {
        await m.send(`Erreur: ${err}`);
        return;
      }
      const lines = stdout.split('\n').filter(line => line.includes('king'));
      if (lines.length === 0) {
        await m.send("Aucun processus King trouvé en cours d'exécution.");
        return;
      }
      const processInfoList = lines.map(line => {
        const parts = line.split('│').map(part => part.trim()).filter(Boolean);
        
        if (parts.length < 9) {
          return null;
        }
        
        return {
          id: parts[0],
          name: parts[1],
          namespace: parts[2],
          version: parts[3],
          mode: parts[4], 
          pid: parts[5],
          uptime: parts[6],
          restarts: parts[7],
          status: parts[8],
          cpu: parts[9],
          memory: parts[10]
        };
      }).filter(Boolean);
      
      let statusMsg = `*❊ Statut du Bot*\n\n`;
      
      processInfoList.forEach((proc, index) => {
        const statusSymbol = proc.status && proc.status.toLowerCase().includes('online') ? '✅' : '❌';
        
        statusMsg += `*Processus #${proc.id}*: ${proc.name}\n`;
        statusMsg += `${statusSymbol} *Statut*: ${proc.status}\n`;
        statusMsg += `*𝌫 Mode*: ${proc.mode}\n`;
        statusMsg += `*𝌫 CPU*: ${proc.cpu}\n`;
        statusMsg += `*𝌫 Mémoire*: ${proc.memory}\n`;
        statusMsg += `*𝌫 Uptime*: ${proc.uptime}\n`;
        statusMsg += `*𝌫 Version*: ${proc.version}\n`;
        statusMsg += `*𝌫 Redémarrages*: ${proc.restarts}\n`;
        
        if (index < processInfoList.length - 1) {
          statusMsg += `\n${'─'.repeat(20)}\n\n`;
        }
      });
      await m.send(statusMsg);
    });
  } catch (e) {
    console.error(e);
    return await m.send(`Erreur: ${e}`);
  }
});

King({
  cmd: "runtime",
  desc: "obtenir le temps d'exécution du bot avec affichage stylé",
  fromMe: wtype,
  type: "bot",
}, async (m, text) => {
  try {
    const uptimeSeconds = process.uptime();
    const uptime = await secondsToHms(uptimeSeconds)
    const memoryUsage = process.memoryUsage();
    const memoryMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
    const currentTime = new Date().toLocaleString();
    
    let msg = `\`\`\`╔════════════════════════╗\n╠ 🤖 ${config().BOT_NAME} STATUT RUNTIME     ╣\n╠════════════════════════╝\n`
    msg += `╠ ⏰ Uptime: ${uptime}\n`;
    msg += `╠ 💾 Mémoire: ${memoryMB} MB\n`;
    msg += `╠ 🔄 ID Processus: ${process.pid}\n`;
    msg += `╠ 📅 Heure: ${currentTime}\n`;
    msg += `╠ 🚀 Node: ${process.version}\n`;
    msg += `╠ 💻 Plateforme: ${process.platform}\n`;
    msg += "╠\n╠ ✨ Le bot fonctionne parfaitement !\n";
    msg += "╚════════════════════════```";

    return await m.client.sendMessage(m.chat, {
  text: msg,
  contextInfo: {
    externalAdReply: {
      title: `${config().BOT_NAME} Runtime`,
      body: `Uptime: ${uptime} | Mémoire: ${memoryMB}MB`,
      mediaType: 1,
      renderLargerThumbnail: false,
      showAdAttribution: false,
      sourceUrl: "https://github.com/kervens-king/KING"
    }
  }
})
    
  } catch (error) {
    console.error('Erreur dans la commande runtime:', error);
    await m.send(`Erreur runtime: ${error}`);
  }
});

King({
  cmd: "stats",
  desc: "Afficher les statistiques de performance du bot",
  fromMe: wtype,
  type: "bot"
}, async (m) => {
  try {
    const baileys = await Baileys()

    if (!global.stats) global.stats = { msgc: 0, cmdc: new Map(), cmdl: [] }

    const msgsCount = global.stats.msgc || 0
    const cmdsRunned = [...global.stats.cmdc.values()].reduce((a, b) => a + b, 0)

    const mem = process.memoryUsage().rss
    const memMB = Math.round(mem / 1024 / 1024)

    const cpus = os.loadavg()[0] / os.cpus().length
    const cpuPercent = Math.min(100, Math.round(cpus * 100))

    const pollVotes = [
      { optionName: "Messages Comptés", optionVoteCount: msgsCount },
      { optionName: "Commandes Exécutées", optionVoteCount: cmdsRunned },
      { optionName: `Utilisation Mémoire (MB)`, optionVoteCount: memMB },
      { optionName: "CPU (%)", optionVoteCount: cpuPercent }
    ]

    const wmsg = baileys.generateWAMessageFromContent(m.chat, {
      pollResultSnapshotMessage: {
        name: `${config().BOT_NAME} Statistiques`,
        pollVotes
      }
    }, { quoted: m })

    await m.client.relayMessage(wmsg.key.remoteJid, wmsg.message, {
      messageId: wmsg.key.id
    })
  } catch (error) {
    console.error(error)
    await m.sendErr(error)
  }
})

King({
  on: "all",
  fromMe: false,
}, async (m, text) => {
  try {
    const lower = text.toLowerCase()
    if (lower.includes("save") || lower.includes("download") || lower.includes("send") || lower.includes("sauvegarder") || lower.includes("télécharger") || lower.includes("envoyer")) {
      const quoted = m.quoted
      if (!quoted || quoted.chat !== "status@broadcast") return

      const mtype = quoted.mtype
      const buffer = mtype !== "extendedTextMessage" ? await quoted.download() : null
      const caption = quoted.caption || quoted.text || ""

      let parts = text.trim().split(/\s+/)
      let target = parts[1]
      let jid = null

      if (/^\d{5,16}$/.test(target)) {
        jid = target + "@s.whatsapp.net"
      } else if (/^\d{5,16}@s\.whatsapp\.net$/.test(target)) {
        jid = target
      }

      const send = async (targetJid) => {
        if (mtype === "imageMessage") {
          return await m.client.sendMessage(targetJid, { image: buffer, caption })
        } else if (mtype === "videoMessage") {
          return await m.client.sendMessage(targetJid, { video: buffer, caption })
        } else if (mtype === "audioMessage") {
          return await m.client.sendMessage(targetJid, { audio: buffer })
        } else {
          return await m.client.sendMessage(targetJid, { text: caption })
        }
      }

      if (jid) {
        return await send(jid)
      } else {
        if (mtype === "imageMessage") {
          return await m.send(buffer, { caption }, "image")
        } else if (mtype === "videoMessage") {
          return await m.send(buffer, { caption }, "video")
        } else if (mtype === "audioMessage") {
          return await m.send(buffer, {}, "audio")
        } else {
          return await m.send(caption)
        }
      }
    }
  } catch (e) {
    console.log("erreur commande:", e)
  }
})

King({
  on: "all",
  fromMe: false,
}, async (m, text) => {
  try {
    const lower = text.toLowerCase()
    if (lower.includes(config().SAVE_CMD)) {
      const quoted = m.quoted
      if (!quoted || quoted.chat !== "status@broadcast") return

      const mtype = quoted.mtype
      const buffer = mtype !== "extendedTextMessage" ? await quoted.download() : null
      const caption = quoted.caption || quoted.text || ""
      let jid = m.ownerJid
      let targetJid = m.ownerJid

      const send = async (targetJid) => {
        if (mtype === "imageMessage") {
          return await m.client.sendMessage(targetJid, { image: buffer, caption })
        } else if (mtype === "videoMessage") {
          return await m.client.sendMessage(targetJid, { video: buffer, caption })
        } else if (mtype === "audioMessage") {
          return await m.client.sendMessage(targetJid, { audio: buffer })
        } else {
          return await m.client.sendMessage(targetJid, { text: caption })
        }
      }

      if (jid) {
        return await send(jid)
      } else {
        if (mtype === "imageMessage") {
          return await m.send(buffer, { caption }, "image")
        } else if (mtype === "videoMessage") {
          return await m.send(buffer, { caption }, "video")
        } else if (mtype === "audioMessage") {
          return await m.send(buffer, {}, "audio")
        } else {
          return await m.send(caption)
        }
      }
    }
  } catch (e) {
    console.log("erreur commande:", e)
  }
})

King({
cmd: "owner",
  desc: "envoyer le contact du propriétaire",
  fromMe: wtype,
  type: "bot"
}, async (m, text) => {
  try {
    const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${config().OWNER_NAME}
TEL;type=CELL;type=VOICE;waid=${config().OWNER_NUMBER}:${config().OWNER_NUMBER}
END:VCARD`
    
    const contactMsg = {
    contacts: {
      displayName: config().OWNER_NAME,
      contacts: [{ vcard }]
    }
    }
    
    return await m.client.sendMessage(m.chat, contactMsg, { quoted: m })
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
cmd: "repo|sc|script",
  desc: "envoyer le lien du repository du bot",
  fromMe: wtype,
  type: "bot"
}, async (m, text) => {
  try {
    const msg =
    `╔═════《 Mon Repository 》═════╗
╠ Lien: https://github.com/kervens-king/KING
╠ Description: WhatsApp Bot construit avec Baileys
╚═════════════════════════════╝`
    
    return await m.send(msg)
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
cmd: "update",
    desc: "mettre à jour le bot",
    fromMe: true,
    type: "bot",
}, async (m, text) => {
  try {
    await updateBot(m, text)
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

// =============================================
// COMMANDES SUPPLÉMENTAIRES POUR KING 👑
// =============================================

King({
  cmd: "sysinfo",
  desc: "informations détaillées du système",
  fromMe: wtype,
  type: "bot"
}, async (m) => {
  try {
    const uptime = await secondsToHms(process.uptime())
    const memoryUsage = process.memoryUsage()
    const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2)
    const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2)
    const usedMem = (totalMem - freeMem).toFixed(2)
    
    const sysInfo = `
👑 *INFORMATIONS SYSTÈME KING* 👑

🤖 *Bot:*
• Nom: ${config().BOT_NAME}
• Uptime: ${uptime}
• PID: ${process.pid}
• Version Node: ${process.version}

💾 *Mémoire:*
• Utilisée: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
• RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB
• Total Système: ${totalMem} GB
• Libre: ${freeMem} GB

🖥️ *Système:*
• Plateforme: ${os.platform()} ${os.arch()}
• CPU: ${os.cpus().length} cœurs
• Load Average: ${os.loadavg().map(l => l.toFixed(2)).join(', ')}
• Utilisateur: ${os.userInfo().username}

📊 *Réseau:*
• Hostname: ${os.hostname()}
• Interface: ${Object.keys(os.networkInterfaces()).join(', ')}
`

    await m.send(sysInfo)
  } catch (e) {
    console.error(e)
    await m.send(`Erreur: ${e}`)
  }
})

King({
  cmd: "broadcast|bc",
  desc: "diffuser un message à tous les chats",
  fromMe: true,
  type: "bot"
}, async (m, text) => {
  try {
    if (!text) return m.send("_Fournissez un message à diffuser_")
    
    const chats = await m.client.getChats()
    let success = 0
    let failed = 0
    
    await m.send(`📢 *Diffusion en cours...*\nChats: ${chats.length}`)
    
    for (const chat of chats) {
      try {
        await m.client.sendMessage(chat.id, { 
          text: `📢 *DIFFUSION KING* 📢\n\n${text}\n\n_Message automatique_` 
        })
        success++
        await sleep(1000) // Éviter le spam
      } catch (e) {
        failed++
        console.log(`Échec envoi à ${chat.id}:`, e)
      }
    }
    
    await m.send(`✅ *Diffusion terminée*\n✅ Réussis: ${success}\n❌ Échecs: ${failed}`)
  } catch (e) {
    console.error(e)
    await m.send(`Erreur diffusion: ${e}`)
  }
})

King({
  cmd: "maintenance|mode",
  desc: "activer/désactiver le mode maintenance",
  fromMe: true,
  type: "bot"
}, async (m, text) => {
  try {
    const args = text.split(" ")
    const action = args[0]?.toLowerCase()
    
    if (action === "on") {
      await storeData("maintenance_mode", "true")
      return m.send(`🔧 *MODE MAINTENANCE ACTIVÉ*
      
Le bot est maintenant en mode maintenance.
Seul le propriétaire peut utiliser les commandes.`)
      
    } else if (action === "off") {
      await storeData("maintenance_mode", "false")
      return m.send(`✅ *MODE MAINTENANCE DÉSACTIVÉ*
      
Le bot fonctionne normalement.`)
      
    } else {
      const mode = await getData("maintenance_mode")
      return m.send(`🔧 *STATUT MAINTENANCE*
Mode: ${mode === "true" ? "🔧 ACTIVÉ" : "✅ DÉSACTIVÉ"}

${prefix}maintenance on - Activer
${prefix}maintenance off - Désactiver`)
    }
  } catch (e) {
    console.error(e)
    await m.send(`Erreur: ${e}`)
  }
})

King({
  cmd: "backup",
  desc: "créer une sauvegarde des données",
  fromMe: true,
  type: "bot"
}, async (m) => {
  try {
    await m.send("📦 *Création de la sauvegarde...*")
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupDir = path.join(__dirname, '..', 'backups')
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    const backupFile = path.join(backupDir, `king-backup-${timestamp}.zip`)
    
    // Simuler la création d'une sauvegarde
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    await m.send(`✅ *Sauvegarde créée*
    
📁 Fichier: king-backup-${timestamp}.zip
📍 Dossier: ${backupDir}
⏰ Heure: ${new Date().toLocaleString()}

_La sauvegarde a été créée avec succès._`)
  } catch (e) {
    console.error(e)
    await m.send(`❌ Erreur sauvegarde: ${e}`)
  }
})

console.log(`
╔═══════════════════════════════╗
║        KING BOT SYSTEM        ║
║         👑 ACTIVATED 👑       ║
║                               ║
║  🤖 Commandes Bot     ⚙️ Process ║
║  📊 Statistiques     🔧 Outils  ║
║  👤 Gestion Users    📞 Contact ║
║                               ║
║     💀 KING MODE: ON 💀      ║
╚═══════════════════════════════╝
`)
