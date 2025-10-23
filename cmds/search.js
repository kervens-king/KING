/* 
 * Copyright © 2025 Mirage
 * Ce fichier fait partie de Kord et est sous licence GNU GPLv3.
 * Et j'espère que vous savez ce que vous faites ici.
 * Vous ne pouvez pas utiliser ce fichier sauf en conformité avec la Licence.
 * Voir le fichier LICENSE ou https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { King,
  wtype,
  npmstalk,
  duckduckgo,
  searchBing,
  audioCut,
  ytaudio,
  ytvideo,
  prefix,
  searchYahoo } = require("../core")
const gis = require('g-i-s')
const { promisify } = require('util')
const { v4: uuidv4 } = require('uuid')
const gisPromise = promisify(gis)
const FormData = require('form-data')
const fetch = require('node-fetch')
const crypto = require('crypto')
const yts = require("yt-search")
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')

King(
{
        cmd: "websearch|search|recherche",
        desc: "rechercher sur le web basé sur une requête",
        fromMe: wtype,
        react: "🔎",
        type: "search",
}, async (m, text) => {
        let q
        if (!text) { 
           q = m.quoted?.text
        } else {
        q = text
        }
        if (!q) return m.send("_*Répondez ou fournissez une requête !*_")
         m.react("🔎")
         var res = await duckduckgo(q)
         if (!res.length) return m.send("_Aucun résultat trouvé_")
         const formatted = res.map((item, index) => {
  const fullLink = decodeURIComponent(item.link.split('uddg=')[1].split('&')[0])
  return `
➔ *Résultat ${index + 1}*
*❖ Titre:* ${item.title}
*➔ Lien:* ${fullLink}
*° Description:* ${item.description}
──────────────────────────────
`
}).join('\n')
        m.react("✅")
        return m.send(formatted)
})


King({
        cmd: "img|image",
        desc: "rechercher des images basées sur une requête",
        fromMe: wtype,
        react: "🖼️",
        type: "search",
}, async (m, text) => {
        let q = text || m.quoted?.text
        if (!q) return m.send("_*Répondez à un message ou fournissez une requête de recherche !*_")
        m.react("⏳")
        const opt = {
                searchTerm: q,
                queryStringAddition: '&safe=false',
                filterOutDomains: ['deviantart.com']
        }
        try {
                const imgs = await gisPromise(opt)
                if (!imgs || imgs.length === 0) return m.send("_Désolé, je n'ai rien trouvé..._")
                const selected = imgs.slice(0, 3)
                for (let img of selected) {
                        await m.send(img.url, {}, "image")
                }
        m.react("✅")
        } catch (err) {
                console.error(err)
                m.send("_Échec de la récupération des images._")
        }
})

King({
        cmd: "npm",
        desc: "donne la description d'un package npm donné",
        fromMe: wtype,
        react: "📦",
        type: "search",
}, async (m, text) => {
        if (!text) return m.send(`_*Fournissez un package npm*_\n_Exemple: ${prefix}npm axios`)
        var n = await npmstalk(text)
        return m.send(`\`\`\`❏ INFORMATIONS PACKAGE NPM ❏ 
➥ _*Nom:*_ ${n.name}
➥ _*Dernière Version:*_ ${n.versionLatest}
➥ _*Version Publiée:*_ ${n.versionPublish}
➥ _*Heure de Publication:*_ ${n.publishTime}
➥ _*Dernière Heure de Publication:*_ ${n.latestPublishTime}
➥ _*Dépendances Récentes:*_ ${n.latestDependencies}\`\`\``)
})


function buildStringToSign(
    method,
    uri,
    accessKey,
    dataType,
    signatureVersion,
    timestamp
) {
    return [method, uri, accessKey, dataType, signatureVersion, timestamp].join(
        '\n'
    )
}
function sign(signString, accessSecret) {
    return crypto
        .createHmac('sha1', accessSecret)
        .update(Buffer.from(signString, 'utf-8'))
        .digest()
        .toString('base64')
}

King({
  cmd: "shazam|findaudio|find|identifyaudio|reconnaitre",
  desc: "rechercher les détails audio d'une vidéo/audio répondu",
  fromMe: wtype,
  react: "🎶",
  type: "search",
}, async (m, text) => {
  if (!(m.quoted.audio || m.quoted.video)) return await m.send("❦ *Répondez à un message audio/vidéo*")
  try {
    var media = await m.client.dlandsave(m.quoted)
    var opt = {
      host: 'identify-eu-west-1.acrcloud.com',
      endpoint: '/v1/identify',
      signature_version: '1',
      data_type: 'audio',
      secure: true,
      access_key: '8c21a32a02bf79a4a26cb0fa5c941e95',
      access_secret: 'NRSxpk6fKwEiVdNhyx5lR0DP8LzeflYpClNg1gze',
    }
    const daa = await audioCut(media, 0, 15)
    const data = daa.data
    const current_data = new Date()
    const timestamp = current_data.getTime() / 1000
    const stringToSign = buildStringToSign(
      'POST',
      opt.endpoint,
      opt.access_key,
      opt.data_type,
      opt.signature_version,
      timestamp
    )
    const signature = sign(stringToSign, opt.access_secret)
    const form = new FormData()
    form.append('sample', data)
    form.append('sample_bytes', data.length)
    form.append('access_key', opt.access_key)
    form.append('data_type', opt.data_type)
    form.append('signature_version', opt.signature_version)
    form.append('signature', signature)
    form.append('timestamp', timestamp)

    const res = await fetch('http://' + opt.host + opt.endpoint, {
      method: 'POST',
      body: form,
    })
    const { status, metadata } = await res.json()
    if (status.code === 0) {
      const track = metadata.music[0]
      let ytInfo = null
      try {
        const searchQuery = `${track.title} ${track.artists[0].name}`
        const ytResults = await yts(searchQuery)
        ytInfo = ytResults.videos[0]
      } catch (error) {
        console.error("Erreur recherche YouTube:", error)
      }
      const resultText = `_*Audio Trouvé !*_\n\n` +
        `➤ *Titre*: ${track.title}\n` +
        `➤ *Artiste*: ${track.artists.map(a => a.name).join(", ")}\n` +
        `➤ *Album*: ${track.album.name}\n` +
        `➤ *Sorti le*: ${track.release_date || "N/A"}\n\n` +
        `*_Écouter sur :_*\n` +
        `➤ *Spotify*: ${track.external_metadata.spotify?.track.id ? 
          `https://open.spotify.com/track/${track.external_metadata.spotify.track.id}` : "N/A"}\n` +
        `➤ *YouTube*: ${ytInfo ? ytInfo.url : 
          (track.external_metadata.youtube?.vid ? 
            `https://youtube.com/watch?v=${track.external_metadata.youtube.vid}` : "N/A")}\n\n` +
        (ytInfo ? `*Infos YouTube:*\n` +
          `➤ *Vues*: ${ytInfo.views.toLocaleString()}\n` +
          `➤ *Durée*: ${ytInfo.duration.timestamp}\n` +
          `➤ *Uploadé*: ${ytInfo.ago}\n` : '') + 
          `_*RÉPONDEZ*_\n 1. audio\n 2. vidéo\n_pour le télécharger !*_`
      
      const thumbnailUrl = ytInfo?.thumbnail || 
        (track.external_metadata.spotify?.album.id ? 
          `https://i.scdn.co/image/${track.external_metadata.spotify.album.id}` :
          "https://via.placeholder.com/300")
      var sMsg = await m.send(thumbnailUrl, { caption: resultText, quoted: m }, "image")
      
      try {
        var rMsg = await m.getResponse(sMsg, 60000)
        await sMsg.react("⏰")
        var rs = rMsg.text.toLowerCase()
        if (rs === "audio" || rs === "download" || rs === "1" || rs === "send" || rs === "envoyer") {
          if (!ytInfo || !ytInfo.url) {
            return await m.send("Désolé, lien YouTube non disponible pour télécharger l'audio")
          }
          var mp3Link = await ytaudio(ytInfo.url)
          var mp = mp3Link.url
          await m.send(mp, { ptt: false, quoted: rMsg }, "audio")
          
        } else if (rs === "video" || rs === "vidéo" || rs === "2") {
          if (!ytInfo || !ytInfo.url) {
            return await m.send("Désolé, lien YouTube non disponible pour télécharger la vidéo")
          }
          
          var mp4Link = await ytvideo(ytInfo.url)
          var mk = mp4Link.url
          await m.send(mk, { caption: `*Vidéo pour ${ytInfo.title}*`, quoted: rMsg }, "video")
        } else {
          await m.send("Option invalide. Veuillez répondre avec '1' pour audio ou '2' pour vidéo.")
        }
      } catch (e) {
        console.error("Erreur gestion réponse:", e)
        await sMsg.react("❌")
      }
            
    } else {
      return await m.send("_Impossible de trouver cette chanson..._")
    }
    const filesToDelete = [media, daa.path]
    for (const file of filesToDelete) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file)
      }
    }
  } catch (error) {
    console.error(error)
    return await m.send(`Erreur: ${error.message || error}`)
  }
})

King({
  cmd: "element",
  desc: "obtenir les informations d'un élément périodique",
  fromMe: wtype,
  type: "tools",
}, async (m, text) => {
  try {
  if (!text) return await m.send(`*𝌫 Fournissez un nom d'élément !*\n_exemple: ${prefix}element Hydrogène`)
  const elementName = encodeURIComponent(text)
      var apiUrl = `https://api.popcat.xyz/periodic-table?element=${elementName}`
      var data = await m.axios(apiUrl)
            if (data.name) {
              const imageUrl = data.image
      const responseText = `
*✠ Nom de l'élément:* ${data.name}
*✠ Symbole:* ${data.symbol}
*✠ Numéro atomique:* ${data.atomic_number}
*✠ Masse atomique:* ${data.atomic_mass}
*✠ Période:* ${data.period}
*✠ Phase:* ${data.phase}
*✠ Découvert par:* ${data.discovered_by}

*❍ Résumé:* ${data.summary}
`

      await m.send(imageUrl, { caption: responseText, quoted: m}, "image")
            } else {
              return await m.send("_rien trouvé.._")
            }
} catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

// =============================================
// COMMANDES DE RECHERCHE SUPPLÉMENTAIRES POUR KING 👑
// =============================================

King({
  cmd: "youtube|yt",
  desc: "rechercher des vidéos sur YouTube",
  fromMe: wtype,
  react: "🎥",
  type: "search",
}, async (m, text) => {
  try {
    let q = text || m.quoted?.text
    if (!q) return m.send("_*Fournissez une requête de recherche YouTube !*_")
    
    m.react("⏳")
    const results = await yts(q)
    
    if (!results.videos.length) {
      m.react("❌")
      return m.send("_Aucune vidéo trouvée pour cette recherche_")
    }

    const topVideos = results.videos.slice(0, 5)
    let response = `*🔎 RÉSULTATS YOUTUBE POUR:* ${q}\n\n`
    
    topVideos.forEach((video, index) => {
      response += `*${index + 1}. ${video.title}*\n`
      response += `👤 ${video.author.name}\n`
      response += `⏱️ ${video.duration.timestamp} | 👁️ ${video.views.toLocaleString()} vues\n`
      response += `📅 ${video.ago}\n`
      response += `🔗 ${video.url}\n\n`
    })

    response += `_Répondez avec le numéro pour télécharger la vidéo_`
    
    m.react("✅")
    return m.send(response)
  } catch (err) {
    console.error(err)
    m.react("❌")
    m.send("_Échec de la recherche YouTube_")
  }
})

King({
  cmd: "urban|dictionnaire",
  desc: "rechercher une définition sur Urban Dictionary",
  fromMe: wtype,
  react: "📚",
  type: "search",
}, async (m, text) => {
  try {
    let q = text || m.quoted?.text
    if (!q) return m.send("_*Fournissez un terme à rechercher !*_")
    
    m.react("⏳")
    const response = await m.axios(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(q)}`)
    
    if (!response.list || response.list.length === 0) {
      m.react("❌")
      return m.send("_Aucune définition trouvée pour ce terme_")
    }

    const definition = response.list[0]
    const resultText = `
*📖 URBAN DICTIONARY: ${q.toUpperCase()}*

*📝 Définition:*
${definition.definition}

*💡 Exemple:*
${definition.example}

*👍 ${definition.thumbs_up} | 👎 ${definition.thumbs_down}*
*Auteur: ${definition.author}*
`

    m.react("✅")
    return m.send(resultText)
  } catch (err) {
    console.error(err)
    m.react("❌")
    m.send("_Échec de la recherche Urban Dictionary_")
  }
})

King({
  cmd: "wiki|wikipedia",
  desc: "rechercher sur Wikipedia",
  fromMe: wtype,
  react: "🌐",
  type: "search",
}, async (m, text) => {
  try {
    let q = text || m.quoted?.text
    if (!q) return m.send("_*Fournissez une requête Wikipedia !*_")
    
    m.react("⏳")
    const response = await m.axios(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`)
    
    if (response.title && response.extract) {
      const resultText = `
*🌐 WIKIPEDIA: ${response.title}*

${response.extract}

${response.thumbnail ? `*Image:* ${response.thumbnail.source}` : ''}
${response.content_urls ? `*Lien:* ${response.content_urls.desktop.page}` : ''}
`

      if (response.thumbnail) {
        m.react("✅")
        return await m.send(response.thumbnail.source, { caption: resultText }, "image")
      } else {
        m.react("✅")
        return m.send(resultText)
      }
    } else {
      m.react("❌")
      return m.send("_Aucun article Wikipedia trouvé_")
    }
  } catch (err) {
    console.error(err)
    m.react("❌")
    m.send("_Échec de la recherche Wikipedia_")
  }
})

King({
  cmd: "lyrics|paroles",
  desc: "trouver les paroles d'une chanson",
  fromMe: wtype,
  react: "🎵",
  type: "search",
}, async (m, text) => {
  try {
    let q = text || m.quoted?.text
    if (!q) return m.send("_*Fournissez le titre d'une chanson !*_")
    
    m.react("⏳")
    const response = await m.axios(`https://api.lyrics.ovh/v1/${encodeURIComponent(q)}`)
    
    if (response.lyrics) {
      const lyrics = response.lyrics
      // Limiter la longueur pour éviter les messages trop longs
      const truncatedLyrics = lyrics.length > 1500 ? lyrics.substring(0, 1500) + "...\n\n_[Paroles tronquées - trop long]_" : lyrics
      
      const resultText = `
*🎵 PAROLES: ${q}*

${truncatedLyrics}
`
      m.react("✅")
      return m.send(resultText)
    } else {
      m.react("❌")
      return m.send("_Paroles non trouvées pour cette chanson_")
    }
  } catch (err) {
    console.error(err)
    m.react("❌")
    m.send("_Échec de la recherche de paroles_")
  }
})

King({
  cmd: "news|actualites",
  desc: "obtenir les dernières actualités",
  fromMe: wtype,
  react: "📰",
  type: "search",
}, async (m, text) => {
  try {
    m.react("⏳")
    const query = text ? `&q=${encodeURIComponent(text)}` : ''
    const response = await m.axios(`https://newsapi.org/v2/top-headlines?country=fr${query}&apiKey=your_api_key_here`)
    
    // Note: Vous devrez obtenir une clé API gratuite sur newsapi.org
    if (response.articles && response.articles.length > 0) {
      const articles = response.articles.slice(0, 5)
      let newsText = `*📰 DERNIÈRES ACTUALITÉS${text ? ` POUR: ${text}` : ''}*\n\n`
      
      articles.forEach((article, index) => {
        newsText += `*${index + 1}. ${article.title}*\n`
        newsText += `📝 ${article.description || 'Pas de description'}\n`
        newsText += `🔗 ${article.url}\n`
        newsText += `---\n\n`
      })
      
      m.react("✅")
      return m.send(newsText)
    } else {
      m.react("❌")
      return m.send("_Aucune actualité trouvée_")
    }
  } catch (err) {
    console.error(err)
    m.react("❌")
    m.send("_Échec de la récupération des actualités_")
  }
})

King({
  cmd: "movie|film",
  desc: "rechercher des informations sur un film",
  fromMe: wtype,
  react: "🎬",
  type: "search",
}, async (m, text) => {
  try {
    let q = text || m.quoted?.text
    if (!q) return m.send("_*Fournissez le titre d'un film !*_")
    
    m.react("⏳")
    const response = await m.axios(`http://www.omdbapi.com/?t=${encodeURIComponent(q)}&apikey=your_omdb_api_key`)
    
    // Note: Vous devrez obtenir une clé API gratuite sur omdbapi.com
    if (response.Response === "True") {
      const movie = response
      const resultText = `
*🎬 FILM: ${movie.Title}*

*📅 Année:* ${movie.Year}
*⭐ Note:* ${movie.imdbRating}/10
*⏱️ Durée:* ${movie.Runtime}
*🎭 Genre:* ${movie.Genre}
*🎬 Réalisateur:* ${movie.Director}
*🎭 Acteurs:* ${movie.Actors}

*📖 Synopsis:*
${movie.Plot}

*🏆 Récompenses:*
${movie.Awards}
`
      if (movie.Poster && movie.Poster !== "N/A") {
        m.react("✅")
        return await m.send(movie.Poster, { caption: resultText }, "image")
      } else {
        m.react("✅")
        return m.send(resultText)
      }
    } else {
      m.react("❌")
      return m.send("_Film non trouvé_")
    }
  } catch (err) {
    console.error(err)
    m.react("❌")
    m.send("_Échec de la recherche du film_")
  }
})

console.log(`
╔═══════════════════════════════╗
║       KING SEARCH SYSTEM      ║
║         🔍 ACTIVATED 🔍       ║
║                               ║
║  🌐 Recherche Web    🖼️ Images  ║
║  🎶 Shazam Audio     🎥 YouTube ║
║  📚 Dictionnaire    🌐 Wikipedia ║
║  🎵 Paroles         📰 Actualités ║
║  🎬 Films           ⚗️  Éléments  ║
║                               ║
║     👑 KING MODE: ON 👑      ║
╚═══════════════════════════════╝
`)
