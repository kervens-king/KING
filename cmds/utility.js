/* 
 * Copyright © 2025 Mirage
 * Ce fichier fait partie de Kord et est sous licence GNU GPLv3.
 * Et j'espère que vous savez ce que vous faites ici.
 * Vous ne pouvez pas utiliser ce fichier sauf en conformité avec la Licence.
 * Voir le fichier LICENSE ou https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { King, extractUrlsFromString, getJson, Baileys, talkNote, prefix, wtype, config, ss } = require("../core")
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit")
const fetch = require("node-fetch")
const { tiny, fancytext, listall } = require('../core/store/style-font');
const os = require('os');
const Jimp = require('jimp');
const { read } = require('jimp')
const ffmpeg = require('fluent-ffmpeg');
const http = require('http')

// ==================== CAPTURES D'ÉCRAN ====================

King({
  cmd: "ss",
  desc: "📸 Capture d'écran d'une page web en direct",
  fromMe: wtype,
  type: "utilities",
  category: "web"
}, async (m, text) => {
  try {
    let lien;
    if (!text) { 
      lien = m.quoted?.text
    } else {
      lien = text
    }
    if (!lien) return m.send("❌ *Lien manquant* \n_Répondez à un lien ou fournissez-en un_")
    
    m.react("⏰")
    const liens = await extractUrlsFromString(lien)
    const link = liens[0]

    const img = await fetch(`https://puppeteer-on-vercel-roan.vercel.app/ss?url=${encodeURIComponent(link)}&device=desktop`)
    const imgbuff = await img.buffer()
    return m.send(imgbuff, {caption: "🖼️ *Capture d'écran* \n_Version bureau_", quoted: m}, "image")
  } catch (err) {
    console.error("❌ Erreur ss:", err)
    return m.send("❌ *Erreur capture* \n_Lien invalide ou service indisponible_")
  }
})

King({
  cmd: "sstab",
  desc: "📱 Capture d'écran version tablette",
  fromMe: wtype,
  type: "utilities",
  category: "web"
}, async (m, text) => {
  try {
    let lien;
    if (!text) {
      lien = m.quoted?.text
    } else {
      lien = text
    }
    if (!lien) return m.send("❌ *Lien manquant* \n_Répondez à un lien ou fournissez-en un_")
    
    m.react("⏰")
    const liens = await extractUrlsFromString(lien)
    const link = liens[0]

    const img = await fetch(`https://puppeteer-on-vercel-roan.vercel.app/ss?url=${encodeURIComponent(link)}&device=tablet`)
    const imgbuff = await img.buffer()
    return m.send(imgbuff, {caption: "🖼️ *Capture d'écran* \n_Version tablette_", quoted: m}, "image")
  } catch (err) {
    console.error("❌ Erreur sstab:", err)
    return m.send("❌ *Erreur capture* \n_Lien invalide ou service indisponible_")
  }
})

King({
  cmd: "ssphone",
  desc: "📱 Capture d'écran version mobile",
  fromMe: wtype,
  type: "utilities",
  category: "web"
}, async (m, text) => {
  try {
    let lien;
    if (!text) {
      lien = m.quoted?.text
    } else {
      lien = text
    }
    if (!lien) return m.send("❌ *Lien manquant* \n_Répondez à un lien ou fournissez-en un_")
    
    m.react("⏰")
    const liens = await extractUrlsFromString(lien)
    const link = liens[0]

    const img = await fetch(`https://puppeteer-on-vercel-roan.vercel.app/ss?url=${encodeURIComponent(link)}&device=mobile`)
    const imgbuff = await img.buffer()
    return m.send(imgbuff, {caption: "🖼️ *Capture d'écran* \n_Version mobile_", quoted: m}, "image")
  } catch (err) {
    console.error("❌ Erreur ssphone:", err)
    return m.send("❌ *Erreur capture* \n_Lien invalide ou service indisponible_")
  }
})

// ==================== AUDIO & TEXTE ====================

King({
  cmd: "tts",
  desc: "🔊 Synthèse vocale (texte vers audio)",
  fromMe: wtype,
  type: "utilities",
  category: "audio"
}, async (m, text) => {
  try {
    if (!text) return m.send("❌ *Texte manquant* \n_Que voulez-vous que je dise ?_")
    
    const res = await m.axios(`https://ab-text-voice.abrahamdw882.workers.dev/?q=${encodeURIComponent(text)}&voicename=henry`)
    return await m.send(res.url, { mimetype: "audio/mpeg", ptt: true, quoted: m }, "audio")
  } catch(e) {
    console.error("❌ Erreur TTS:", e)
    return await m.send("❌ *Erreur synthèse vocale* \n_Service temporairement indisponible_")
  }
})

King({
  cmd: "audio2text|text",
  desc: "🎙️ Conversion audio/video vers texte",
  fromMe: wtype,
  type: "utilities",
  category: "audio"
}, async (m, text) => {
  try {
    if (!(m.quoted.audio || m.quoted.video)) {
      return await m.send("❌ *Audio/vidéo manquant* \n_Répondez à un audio ou une vidéo_")
    }
    
    const p = await m.client.dlandsave(m.quoted)
    const t = await talkNote(p)
    const c = t.text
    
    await m.send(`📝 *Texte extrait:*\n\n${c}`)
    await fs.promises.unlink(p)
  } catch (e) {
    console.error("❌ Erreur audio2text:", e)
    return await m.send("❌ *Erreur transcription* \n_Impossible d'extraire le texte_")
  }
})

// ==================== LIENS & URL ====================

King({
  cmd: "wm|walink",
  desc: "📞 Générer un lien WhatsApp",
  fromMe: wtype,
  type: "utilities",
  category: "contact"
}, async (m, text) => {
  try {
    let numero;
    
    if (m.mentionedJid && m.mentionedJid[0]) {
      numero = m.mentionedJid[0].replace(/[^0-9]/g, '')
    } else if (m.quoted) {
      numero = m.quoted.sender.replace(/[^0-9]/g, '')
    } else {
      if (m.chat.endsWith("@g.us")) {
        return m.send("❌ *Utilisateur manquant* \n_Répondez à un message ou mentionnez un utilisateur_")
      }
      numero = m.chat.split("@")[0]
    }
    
    const waLink = `https://wa.me/${numero}`
    return await m.send(`📞 *Lien WhatsApp:*\n${waLink}`)
  } catch (e) {
    console.error("❌ Erreur walink:", e)
    return m.send("❌ *Erreur génération lien*")
  }
})

King({
  cmd: "url|tourl|upload",
  desc: "☁️ Upload média vers CDN (permanent)",
  fromMe: wtype,
  react: "🔗",
  type: "utilities",
  category: "media"
}, async (m, text) => {
  try {
    if (!m.quoted.media) return m.send("❌ *Média manquant* \n_Répondez à un fichier média_")
    
    const path = await m.client.dlandsave(m.quoted)
    const url = await m.upload(path)
    
    await m.send(`🔗 *URL Permanent:*\n${url}`)
    await fs.promises.unlink(path)
  } catch (e) {
    console.error("❌ Erreur upload:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "temp-url|temp-upload",
  desc: "🕒 Upload média vers CDN (temporaire)",
  fromMe: wtype,
  react: "♻️",
  type: "utilities",
  category: "media"
}, async (m, text) => {
  try {
    if (!m.quoted.media) return m.send("❌ *Média manquant* \n_Répondez à un fichier média_")
    
    const path = await m.client.dlandsave(m.quoted)
    const url = await m.upload(path, "temp")
    
    await m.send(`🕒 *URL Temporaire:*\n${url}`)
    await fs.promises.unlink(path)
  } catch (e) {
    console.error("❌ Erreur temp-upload:", e)
    return await m.sendErr(e)
  }
})

// ==================== TEXTE & FORMATAGE ====================

King({
  cmd: "readmore",
  desc: "📖 Ajouter un 'Lire la suite'",
  fromMe: wtype,
  type: "utilities",
  category: "texte"
}, async (m, text) => {
  try {
    let txt = text || m.quoted?.text
    if (!txt) {
      return m.send(`❌ *Texte manquant* \n_Format: ${prefix}readmore Texte visible |readmore| Texte caché_`)
    }

    const readmoreChar = String.fromCharCode(8206).repeat(4001)
    const rtext = txt.replace(/(\|readmore\|)/i, readmoreChar)
    return await m.send(rtext)
  } catch (e) {
    console.error("❌ Erreur readmore:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "define|whatis",
  desc: "📚 Définition Urban Dictionary",
  react: "🧩",
  fromMe: wtype,
  type: "utilities",
  category: "recherche"
}, async (m, text) => {
  try {
    if (!text) return m.send("❌ *Mot manquant* \n_Quel mot voulez-vous définir ?_")
    
    const mot = text.trim().split(/\s+/)[0]
    const res = await m.axios(`http://api.urbandictionary.com/v0/define?term=${mot}`)
    
    if (!res.list || res.list.length === 0) {
      return m.send(`❌ *Aucune définition* \n_Pas de résultat pour: ${mot}_`)
    }
    
    const def = res.list[0]
    const reply = `
📚 *DÉFINITION: ${mot}*

📖 **Définition:**
${def.definition.replace(/\[/g, "").replace(/\]/g, "")}

💡 **Exemple:**
${def.example.replace(/\[/g, "").replace(/\]/g, "")}

⚠️ _Les définitions peuvent contenir du langage informel_
    `.trim()
    
    return await m.send(reply)
  } catch (e) {
    console.error("❌ Erreur define:", e)
    return await m.sendErr(e)
  }
})

// ==================== MÉTÉO & INFORMATIONS ====================

King({
  cmd: "weather",
  desc: "🌦️ Informations météorologiques",
  react: "🌦️",
  fromMe: wtype,
  type: "utilities",
  category: "info"
}, async (m, text) => {
  try {
    if (!text) return await m.send("❌ *Localisation manquante* \n_Indiquez une ville ou un pays_")
    
    const res = await m.axios(`https://api.openweathermap.org/data/2.5/weather?q=${text}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273&language=fr`)
    const w = res
    
    const sunrise = new Date(w.sys.sunrise * 1000).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', minute: '2-digit'
    })
    const sunset = new Date(w.sys.sunset * 1000).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', minute: '2-digit' 
    })
    
    const report = `
🌦️ *MÉTÉO - ${w.name} (${w.sys.country})*

📍 **Localisation:** ${w.name}, ${w.sys.country}
🌍 **Coordonnées:** ${w.coord.lat}°N, ${w.coord.lon}°E
☁️ **Conditions:** ${w.weather[0].main} - ${w.weather[0].description}

🌡️ **Température:** ${w.main.temp}°C (Ressenti ${w.main.feels_like}°C)
📊 **Min/Max:** ${w.main.temp_min}°C / ${w.main.temp_max}°C
💧 **Humidité:** ${w.main.humidity}%
📏 **Pression:** ${w.main.pressure} hPa

👁️ **Visibilité:** ${(w.visibility / 1000).toFixed(1)} km
💨 **Vent:** ${w.wind.speed} m/s - ${w.wind.deg}°
☁️ **Nuages:** ${w.clouds.all}%

🌅 **Lever du soleil:** ${sunrise}
🌇 **Coucher du soleil:** ${sunset}
    `.trim()
    
    return await m.send(report)
  } catch (e) {
    console.error("❌ Erreur weather:", e)
    return await m.send("❌ *Erreur météo* \n_Localisation introuvable ou service indisponible_")
  }
})

King({
  cmd: "tinyurl|shorten-url",
  desc: "🔗 Raccourcir une URL",
  fromMe: wtype,
  type: "utilities",
  category: "web"
}, async (m, text) => {
  try {
    if (!text) return m.send('❌ *URL manquante* \n_Fournissez un lien à raccourcir_')
    
    const link = text.split(" ")[0]
    const h = await m.axios(`https://tinyurl.com/api-create.php?url=${link}`)
    
    return await m.send(`🔗 *URL Raccourcie:*\n${h}`)
  } catch (e) {
    console.error("❌ Erreur tinyurl:", e)
    return m.send("❌ *Erreur raccourcissement* \n_URL invalide ou service indisponible_")
  }
})

// ==================== MÉDIAS & VUE UNIQUE ====================

function getMediaType(q) {
  if (q?.mtype === 'viewOnceMessageV2') {
    if (q?.message?.imageMessage) return 'image'
    if (q?.message?.videoMessage) return 'video'
    if (q?.message?.audioMessage) return 'audio'
  }

  if (q?.mtype === 'imageMessage') return 'image'
  if (q?.mtype === 'videoMessage') return 'video'  
  if (q?.mtype === 'audioMessage') return 'audio'

  const msg = q?.message || q
  
  if (msg?.imageMessage) return 'image'
  if (msg?.videoMessage) return 'video'
  if (msg?.audioMessage) return 'audio'
  
  return null
}

King({
  cmd: "vv",
  desc: "🔓 Convertir média 'vue unique' en normal",
  fromMe: wtype,
  react: "🔓",
  type: "utilities",
  category: "media"
}, async (m, text) => {
  try {
    if (
      !m.quoted?.viewOnce &&
      !m.quoted?.viewOnceMessageV2 &&
      m.quoted?.mtype !== 'viewOnceMessageV2Extension' &&
      m.quoted?.mtype !== 'viewOnceMessageV2'
    ) return await m.send("❌ *Média manquant* \n_Répondez à un média 'vue unique'_")

    let mediaObj
    const type = getMediaType(m.quoted)
    
    if (m.quoted?.mtype === 'viewOnceMessageV2') {
      if (type === 'image') mediaObj = m.quoted.message.imageMessage
      else if (type === 'video') mediaObj = m.quoted.message.videoMessage
      else if (type === 'audio') mediaObj = m.quoted.message.audioMessage
    }
    
    if (!mediaObj) {
      if (type === 'image') mediaObj = m.quoted.imageMessage || m.quoted.message?.imageMessage
      else if (type === 'video') mediaObj = m.quoted.videoMessage || m.quoted.message?.videoMessage
      else if (type === 'audio') mediaObj = m.quoted.audioMessage || m.quoted.message?.audioMessage
    }
    
    if (!mediaObj) mediaObj = m.quoted.message || m.quoted

    const tempPath = await m.client.dlandsave(mediaObj)
    
    let messageContent

    if (type === 'image') {
      messageContent = { image: { url: tempPath }, caption: m.quoted.caption || "🖼️ Média converti" }
    } else if (type === 'video') {
      messageContent = { video: { url: tempPath }, caption: m.quoted.caption || "🎥 Média converti" }
    } else if (type === 'audio') {
      messageContent = { audio: { url: tempPath }, ptt: false, caption: m.quoted.caption || "🔊 Audio converti" }
    } else {
      await fs.promises.unlink(tempPath)
      return await m.send("❌ *Type non supporté* \n_Format média non reconnu_")
    }

    let cible = text.trim()
    let destination = m.chat

    if (cible === 'chat') {
      destination = m.sender
    } else if (cible === 'owner') {
      destination = m.ownerJid
    } else if (/^\d{5,16}$/.test(cible)) {
      destination = `${cible}@s.whatsapp.net`
    } else if (/^\d{5,16}@s\.whatsapp\.net$/.test(cible)) {
      destination = cible
    }

    await m.client.sendMessage(destination, messageContent, { quoted: m })
    await fs.promises.unlink(tempPath)
  } catch (err) {
    console.error("❌ Erreur vv:", err)
    await m.send("❌ *Erreur conversion* \n_Impossible de convertir le média_")
  }
})

// ==================== PDF & DOCUMENTS ====================

King({
  cmd: "pdf",
  desc: "📄 Convertir image/texte en PDF",
  fromMe: wtype,
  type: "utilities",
  category: "document"
}, async (m, text) => {
  try {
    // Conversion texte vers PDF
    if (text && !text.startsWith("send")) {
      const pdf = new PDFDocument()
      const outputPath = "./text.pdf"
      const writeStream = fs.createWriteStream(outputPath)

      pdf.pipe(writeStream)
      pdf.font("Helvetica", 12).text(text, 50, 50, { align: "justify" })
      pdf.end()

      await new Promise(resolve => writeStream.on('finish', resolve))

      try {
        const buffer = fs.readFileSync(outputPath)
        await m.send(
          buffer,
          { mimetype: "application/pdf", fileName: "document.pdf", quoted: m },
          "document"
        )
      } catch (sendErr) {
        await m.send(`❌ *Erreur envoi PDF:* ${sendErr.message}`)
      } finally {
        try {
          fs.unlinkSync(outputPath)
        } catch (unlinkErr) {}
      }
      return
    }

    const dossierImages = "./pdf_images"
    if (!fs.existsSync(dossierImages)) fs.mkdirSync(dossierImages)

    // Conversion images vers PDF
    if (text === "send") {
      const fichiersImages = fs.readdirSync(dossierImages)
        .filter(file => file.toLowerCase().endsWith('.jpg'))
        .map(file => path.join(dossierImages, file))

      if (fichiersImages.length === 0) {
        return await m.send("❌ *Aucune image* \n_Aucune image trouvée dans le dossier_")
      }

      const doc = new PDFDocument()
      const pdfPath = "./images.pdf"
      const writeStream = fs.createWriteStream(pdfPath)

      doc.pipe(writeStream)

      let imagesAjoutees = 0
      for (const cheminImage of fichiersImages) {
        try {
          doc.addPage()
          doc.image(cheminImage, {
            fit: [500, 700],
            align: 'center',
            valign: 'center'
          })
          imagesAjoutees++
        } catch (imgErr) {
          await m.send(`⚠️ Impossible d'ajouter ${path.basename(cheminImage)}`)
        }
      }

      if (imagesAjoutees === 0) {
        doc.text("Aucune image valide trouvée", 100, 100)
      }

      doc.end()

      await new Promise(resolve => writeStream.on('finish', resolve))

      try {
        const buffer = fs.readFileSync(pdfPath)
        await m.send(
          buffer,
          { mimetype: "application/pdf", fileName: "images.pdf", quoted: m },
          "document"
        )
      } catch (sendErr) {
        await m.send(`❌ *Erreur envoi PDF:* ${sendErr.message}`)
      }

      // Nettoyage
      try {
        fs.unlinkSync(pdfPath)
        fs.readdirSync(dossierImages).forEach(file => {
          fs.unlinkSync(path.join(dossierImages, file))
        })
        fs.rmdirSync(dossierImages)
      } catch (cleanupErr) {}
    } else {
      // Sauvegarde image pour PDF
      if (!m.quoted?.image) {
        return await m.send(
          `📄 *CONVERSION PDF*\n\n` +
          `💬 **Texte vers PDF:**\n\`.pdf votre texte ici\`\n\n` +
          `🖼️ **Images vers PDF:**\n1. Répondez à des images avec \`.pdf\`\n2. Envoyez \`.pdf send\` pour générer le PDF`
        )
      }

      const tempPath = await m.client.dlandsave(m.quoted)
      if (!fs.existsSync(tempPath)) {
        return await m.send("❌ *Erreur téléchargement* \n_Fichier introuvable_")
      }

      let index = 0, cheminImage
      do {
        cheminImage = path.join(dossierImages, `image${index === 0 ? "" : index}.jpg`)
        index++
      } while (fs.existsSync(cheminImage))

      try {
        fs.copyFileSync(tempPath, cheminImage)
        fs.unlinkSync(tempPath)
      } catch (copyErr) {
        try {
          fs.renameSync(tempPath, cheminImage)
        } catch (renameErr) {
          fs.unlinkSync(tempPath)
          return await m.send(`❌ *Erreur sauvegarde:* ${renameErr.message}`)
        }
      }

      await m.send(`✅ *Image sauvegardée!* \n_Total: ${fs.readdirSync(dossierImages).length} image(s)_`)
    }
  } catch (err) {
    await m.send(`❌ *Erreur PDF:* ${err.message || err}`)
  }
})

// ==================== CALCUL & CONVERSION ====================

King({
  cmd: "calc|calculate",
  desc: "🧮 Calculatrice",
  fromMe: wtype,
  type: "utilities",
  category: "outils"
}, async (m, text) => {
  try {
    if (!text) return await m.send('❌ *Calcul manquant* \n_Exemple: .calc 2+3*5_')
    
    if (!/^[\d\s\+\-\*\/\(\)\.]+$/.test(text)) {
      return await m.send('❌ *Caractères invalides* \n_Utilisez seulement: chiffres, +, -, *, /, (, )_')
    }
    
    const resultat = eval(text)
    await m.send(`🧮 *Calcul:* ${text} = *${resultat}*`)
  } catch (e) {
    console.error("❌ Erreur calc:", e)
    return await m.send("❌ *Erreur calcul* \n_Expression mathématique invalide_")
  }
})

King({
  cmd: "trt|translate",
  desc: "🌍 Traduction de texte",
  fromMe: wtype,
  type: "utilities",
  category: "texte"
}, async (m, text, cmd) => {
  try {
    if (!text && !m.quoted?.text) {
      return await m.send(`❌ *Texte manquant* \n_Format: ${cmd} [langue] texte_\n_Exemple: ${cmd} en bonjour_`)
    }

    const args = text.trim().split(/\s+/)
    const premier = args[0]
    const aCodeLangue = /^[a-z]{2,5}$/i.test(premier)

    const codeLangue = aCodeLangue ? premier : (config().LANG_CODE || "fr")
    const texteATraduire = aCodeLangue ? args.slice(1).join(" ") : args.join(" ")
    const texteFinal = texteATraduire || m.quoted?.text

    if (!texteFinal) {
      return await m.send(`❌ *Texte manquant* \n_Format: ${cmd} [langue] texte_\n_Exemple: ${cmd} en bonjour_`)
    }

    const res = await m.axios(
      `https://kord-api.vercel.app/translate?text=${encodeURIComponent(texteFinal)}&to=${codeLangue}`
    )

    if (res.status == 400) return await m.send("❌ *Code langue invalide*")
    
    return await m.send(`🌍 **Traduction (${codeLangue}):**\n${res.translated}`)
  } catch (err) {
    console.error("❌ Erreur traduction:", err)
    return await m.send("❌ *Erreur traduction* \n_Service temporairement indisponible_")
  }
})

// ==================== DIVERS ====================

King({
  cmd: "ngl",
  desc: "📨 Envoyer un message NGL anonyme",
  fromMe: wtype,
  type: "utilities",
  category: "web"
}, async (m, text, cmd) => {
  try {
    if (!text) return await m.send(`❌ *Paramètres manquants* \n_Format: ${cmd} utilisateur:message_\n_Exemple: ${cmd} john:Hello world_`)
    
    const args = text.split(":")
    const utilisateur = args[0]?.trim()
    const message = args.slice(1).join(":").trim()
    
    if (!message) return await m.send(`❌ *Message manquant* \n_Format: ${cmd} utilisateur:message_`)

    const res = await m.axios(`https://kord-api.vercel.app/ngl?username=${encodeURIComponent(utilisateur)}&message=${encodeURIComponent(message)}`)
    
    if (res?.success) {
      return await m.send("✅ *Message envoyé!* \n_Message NGL envoyé avec succès_")
    } else {
      return await m.send("❌ *Erreur envoi* \n_Impossible d'envoyer le message_")
    }
  } catch (e) {
    console.error("❌ Erreur ngl:", e)
    return await m.send("❌ *Erreur service NGL* \n_Service temporairement indisponible_")
  }
})

King({
  cmd: "ip|ipbot",
  desc: "🌐 Adresse IP du bot",
  fromMe: wtype,
  type: "utilities",
  category: "info"
}, async (m) => {
  try {
    http.get({
      'host': 'api.ipify.org',
      'port': 80,
      'path': '/'
    }, function(resp) {
      let data = ''
      resp.on('data', function(chunk) {
        data += chunk
      })
      resp.on('end', function() {
        m.send(`🌐 *IP Publique du Bot:*\n\`${data}\``)
      })
    }).on('error', function(err) {
      m.send(`❌ *Erreur IP:* ${err}`)
    })
  } catch (e) {
    console.error("❌ Erreur ip:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "wiki",
  desc: "📖 Recherche Wikipédia",
  fromMe: wtype,
  type: "utilities",
  category: "recherche"
}, async (m, text) => {
  try {
    if (!text) return await m.send("❌ *Recherche manquante* \n_Quel sujet recherchez-vous ?_")
    
    const data = await m.axios(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text)}`)
    if (!data) return await m.send("❌ *Aucun résultat* \n_Sujet non trouvé sur Wikipédia_")

    return await m.send(`📖 **${data.title}**\n\n${data.extract}`)
  } catch (e) {
    console.error("❌ Erreur wiki:", e)
    return await m.send("❌ *Erreur recherche* \n_Sujet non trouvé ou service indisponible_")
  }
})

King({
  cmd: "bible",
  desc: "📖 Verset biblique",
  fromMe: wtype,
  type: "utilities",
  category: "recherche"
}, async (m, text) => {
  try {
    if (!text) return await m.send("❌ *Référence manquante* \n_Exemple: .bible Jean 3:16_")
    
    const reference = text.trim()
    const res = await m.axios(`https://bible-api.com/${encodeURIComponent(reference)}`)
    
    return await m.send(`📖 **LA BIBLE**\n\n*${res.reference}*\n${res.text.trim()}`)
  } catch (e) {
    console.error("❌ Erreur bible:", e)
    return await m.send("❌ *Erreur référence* \n_Verset non trouvé ou référence invalide_")
  }
})

King({
  cmd: "font",
  desc: "🎨 Changer la police du texte",
  fromMe: wtype,
  type: "utilities",
  category: "texte"
}, async (m, text) => {
  try {
    if (!text) {
      let listeText = "*🎨 GÉNÉRATEUR DE POLICES*\n\n*Exemple:* .font 1 Kord\n\n"
      listall("Kord-Ai").forEach((txt, index) => {
        listeText += `${index + 1} ${txt}\n`
      })
      return await m.send(listeText)
    }
    
    const numero = parseInt(text.split(" ")[0], 10)
    if (isNaN(numero)) return await m.send("❌ *Numéro invalide* \n_Exemple: .font 1 votre texte_")

    const texteFinal = text.slice(text.indexOf(' ') + 1)
    const texteFormate = await fancytext(texteFinal, numero)
    
    return await m.send(texteFormate)
  } catch (e) {
    console.error("❌ Erreur font:", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "compress",
  desc: "📦 Compresser image/vidéo",
  fromMe: wtype,
  type: "utilities",
  category: "media"
}, async (m, text) => {
  try {
    if (!(m.image || m.video || m.quoted.image || m.quoted.video)) {
      return await m.send("❌ *Média manquant* \n_Répondez à une image ou une vidéo_")
    }
    
    const tempPath = await m.client.dlandsave((m.image || m.video) ? m : (m.quoted.image || m.quoted.video) ? m.quoted : null)
    const extension = tempPath.split(".").pop()
    const outputPath = path.join(__dirname, `compressed_${Date.now()}.${extension}`)
    
    try {
      if (extension.match(/(jpg|jpeg|png|webp)/)) {
        // Compression image
        const image = await read(tempPath)
        await image
          .resize(800, Jimp.AUTO)
          .quality(60)
          .writeAsync(outputPath)

        await m.send(fs.readFileSync(outputPath), { caption: "🖼️ *Image compressée*" }, 'image')
      } else if (extension.match(/(mp4|mkv|avi)/)) {
        // Compression vidéo
        await m.reply("🎥 *Compression vidéo...* \n_Cela peut prendre quelques minutes_")
        
        await new Promise((resolve, reject) => {
          ffmpeg(tempPath)
            .outputOptions([
              '-c:v libx264',
              '-preset faster',
              '-crf 28',
              '-b:v 500k',
              '-maxrate 800k',
              '-bufsize 1200k',
              '-vf scale=-2:480',
              '-c:a aac',
              '-b:a 96k'
            ])
            .save(outputPath)
            .on('end', resolve)
            .on('error', reject)
        })
        
        await m.send(fs.readFileSync(outputPath), { caption: "🎥 *Vidéo compressée*" }, "video")
      }
    } catch (err) {
      return await m.send(`❌ *Erreur compression:* ${err}`)
    } finally {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath)
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    }
  } catch (er) {
    console.error("❌ Erreur compress:", er)
    return await m.send(`❌ *Erreur compression* \n${er}`)
  }
})

King({
  cmd: 'getdevice|device',
  desc: '📱 Obtenir le type d\'appareil',
  fromMe: wtype,
  type: 'utilities',
  category: 'info'
}, async (m) => {
  try {
    const b = await Baileys()
    const id = m.quoted?.id || m.key?.id
    const device = b.getDevice(id)
    await m.reply(`📱 **Appareil:** *${device}*`)
  } catch (e) {
    console.error("❌ Erreur device:", e)
    return await m.sendErr(e)
  }
})

console.log("✅ Module utilitaires chargé avec succès")
