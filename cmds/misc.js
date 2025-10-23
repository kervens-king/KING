/* 
 * Copyright © 2025 Mirage
 * Ce fichier fait partie de King et est sous licence GNU GPLv3.
 * Et j'espère que vous savez ce que vous faites ici.
 * Vous ne pouvez pas utiliser ce fichier sauf en conformité avec la Licence.
 * Voir le fichier LICENSE ou https://www.gnu.org/licenses/gpl-3.0.html
 * -------------------------------------------------------------------------------
 */

const { King,
        wtype,
        eBinary,
        dBinary,
        getMeta,
        config,
        getData,
        storeData,
        sleep,
        prefix
} = require("../core")
const axios = require("axios")

King({
cmd: "quote",
  desc: "obtenir une citation aléatoire",
  fromMe: wtype,
  type: "misc",
}, async (m, text) => {
  try {
    var q = await m.axios("https://favqs.com/api/qotd")
    return await m.send(
    `\`\`\`┏ CITATION ┓\`\`\`
    \n\`\`\`${q.quote.body}\`\`\`
    > ${q.quote.author}`
    )
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
cmd: "fact",
  desc: "obtenir un fait aléatoire",
  fromMe: wtype,
  type: "misc",
}, async (m, text) => {
  try {
    var f = await m.axios("https://nekos.life/api/v2/fact")
    return await m.send(
    `\`\`\`┏ FAIT ┓\`\`\`
    \n\`\`\`${f.fact}\`\`\``
    )
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
cmd: "q|quotely",
  desc: "créer un sticker à partir d'un message répondu",
  fromMe: wtype,
  type: "misc",
}, async (m, text, c, str) => {
  try {
    if (!m.quoted) return await m.send("_répondez à un message.._")
    let p = await m.client.profilePictureUrl(m.quoted.sender).catch(() => "https://files.catbox.moe/wpi099.png")
    
    let td = ["#FFFFFF", "#000000", "#1f272a"]
    let tdd = td[Math.floor(Math.random() * td.length)]
    var username = await str.getname(m.quoted.sender)
    let qq
    qq = {}
    let k = {
    type: "quote",
    format: "png",
    backgroundColor: tdd,
    width: 512,
    height: 512,
    scale: 3,
    messages: [{
    avatar: true,
    from: {
    first_name: username,
    language_code: "fr",
    name: username,
    photo: {
    url: p,
    },
    },
    text: m.quoted.text,
    replyMessage:  qq,
    }, ],
    }
    let res = await axios.post("https://bot.lyo.su/quote/generate", k)
    let img = Buffer.from(res.data.result.image, "base64")
    return await m.sendstk(img)
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
cmd: "ebinary|ebin",
  desc: "encoder du texte en binaire",
  fromMe: wtype,
  type: "misc",
}, async (m, text) => {
  try {
    var txt = text || m.quoted.text
    if (!txt) return await m.send("_Répondez ou fournissez un texte._")
    return await m.send(await eBinary(txt))
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
cmd: "dbinary|dbin",
  desc: "décoder du binaire en texte",
  fromMe: wtype,
  type: "misc",
}, async (m, text) => {
  try {
    var txt = text || m.quoted.text
    if (!txt) return await m.send("_Répondez ou fournissez un texte._")
    return await m.send(await dBinary(txt))
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
cmd: "pick",
  desc: "choisir une personne aléatoire dans le groupe",
  fromMe: wtype,
  gc: true,
  type: "group",
}, async (m, text) => {
  try {
    if (!text) return await m.send("*Fournissez une raison !*")
    var gm = await getMeta(m.client, m.chat)
    var p = gm.participants
    var user = p[Math.floor(Math.random() * p.length)].id
    return await m.send(`La personne ${text} ici est : @${user.split("@")[0]}`, {mentions: [user] })
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
cmd: "pickupl|pickupline",
  desc: "obtenir une phrase de drague",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  try {
    var p = await m.axios("https://api.popcat.xyz/pickuplines")
    return await m.send(
    `\`\`\`┏ PHRASE DE DRAGUE ┓\`\`\`
    \n\`\`\`${p.pickupline}\`\`\``
    )
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
cmd: "breakupl|breakupline",
  desc: "obtenir une phrase de rupture",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  try {
    var b = await m.axios("https://api.jcwyt.com/breakup")
    return await m.send(
    `\`\`\`┏ PHRASE DE RUPTURE ┓\`\`\`
    \n\`\`\`${b}\`\`\``
    )
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})
 
 
King({
  cmd: "insult|roast",
  desc: "envoie un message d'insulte à l'utilisateur mentionné/répondu",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  try {
  var t = m.quoted?.sender || m.mentionedJid?.[0] || null
  if (!t) return await m.send("_répondez ou mentionnez un utilisateur_")
  var yr = await m.axios("https://insult.mattbas.org/api/insult.json?who=youuu")
  var r = yr.insult
  if (t) {
    await m.send(`${yr.insult}`.replace("youuu", `@${t.split("@")[0]}`), { mentions: [t] })
  } else return await m.send("_répondez ou mentionnez un utilisateur_")
  } catch (er) {
    console.error("erreur commande: ", er)
    return await m.sendErr(er)
  }
})

King({
  cmd: "emojimix|emix",
  desc: "mélanger deux emojis en un sticker",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  try {
    if (!text || !text.includes("+")) return await m.send(`Exemple: ${prefix}emojimix 😎+🤡`)
    var [emoji1, emoji2] = text.split("+")
    var url = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`
    var r = await m.axios(url)
    if (!r.results || r.results.length < 1) return await m.send("Aucun mélange trouvé")
    var img = r.results[0].media_formats.png_transparent.url
    if (img) {
    return await m.send(img, { packname: config().STICKER_PACKNAME, author: config().STICKER_AUTHOR, quoted: m }, "sticker")
    } else {
      await m.react("🚫")
      sleep(2000)
      await m.react("")
    }
  } catch (e) {
    console.error("erreur commande", e)
    return await m.sendErr(e)
  }
})


King({
  cmd: "addnote|writenote|savenote",
  desc: "écrire une note dans la base de données",
  fromMe: true,
  type: "utilities",
}, async (m, text) => {
  try {
    if (!m.quoted.text || !text) return await m.send("_répondez à la note/texte avec son nom_")
    var data = await getData("notes") || {}
    data[text.split(" ")[0]] = m.quoted.text
    await storeData("notes", data)
    return await m.send(`_note sauvegardée pour le nom : ${text.split(" ")[0]}_`)
  } catch (err) {
    console.error("erreur commande(notes)", err)
    return await m.sendErr(err)
  }
})

King({
  cmd: "delnote|removenote|deletenote",
  desc: "supprimer une note de la base de données",
  fromMe: true,
  type: "utilities",
}, async (m, text) => {
  try {
    if (!text) return await m.send("_fournissez le nom de la note_")
    var data = await getData("notes") || {} 
    var noteName = text.split(" ")[0]
    if (!data[noteName]) return await m.send("_aucune note trouvée avec ce nom_")
    delete data[noteName]
    await storeData("notes", data)
    return await m.send(`_note supprimée : ${noteName}_`)
  } catch(err) {
    console.error("erreur commande", err)
    return await m.sendErr(err)
  }
})

King({
  cmd: "allnotes|notes|getnotes",
  desc: "obtenir toutes les notes sauvegardées",
  fromMe: true,
  type: "utilities",
}, async (m, text) => {
  try {
    var data = await getData("notes") || {}
    if (Object.keys(data).length === 0) return await m.send("_aucune note trouvée_")
    
    var notesList = ""
    for (let name in data) {
      notesList += `*${name}:* ${data[name]}\n\n`
    }
    
    return await m.send(`*Toutes les Notes:*\n\n${notesList}`)
  } catch (err) {
    console.error("erreur commande(allnotes)", err)
    return await m.sendErr(err)
  }
})

King({
  cmd: "getnote|readnote|note",
  desc: "obtenir une note spécifique par son nom",
  fromMe: true,
  type: "utilities",
}, async (m, text) => {
  try {
    if (!text) return await m.send("_fournissez le nom de la note_")
    var data = await getData("notes") || {}
    var noteName = text.split(" ")[0]
    
    if (!data[noteName]) return await m.send("_note non trouvée_")
    
    return await m.send(`*${noteName}:*\n${data[noteName]}`)
  } catch (err) {
    console.error("erreur commande(getnote)", err)
    return await m.sendErr(err)
  }
})

King({
  cmd: "delallnote|delnotes|clearallnotes",
  desc: "supprimer toutes les notes de la base de données",
  fromMe: true,
  type: "utilities",
}, async (m, text) => {
  try {
    var data = await getData("notes") || {}
    if (Object.keys(data).length === 0) return await m.send("_aucune note à supprimer_")
    
    await storeData("notes", {})
    return await m.send("_toutes les notes ont été supprimées avec succès_")
  } catch (err) {
    console.error("erreur commande(delallnotes)", err)
    return await m.sendErr(err)
  }
})

// =============================================
// COMMANDES SUPPLEMENTAIRES POUR KING 👑
// =============================================

King({
  cmd: "joke|blague",
  desc: "obtenir une blague aléatoire",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  try {
    var joke = await m.axios("https://v2.jokeapi.dev/joke/Any?lang=fr")
    
    if (joke.type === "single") {
      return await m.send(
        `\`\`\`┏ BLAGUE ┓\`\`\`\n\`\`\`${joke.joke}\`\`\``
      )
    } else {
      return await m.send(
        `\`\`\`┏ BLAGUE ┓\`\`\`\n\`\`\`${joke.setup}\`\`\`\n\n\`\`\`${joke.delivery}\`\`\``
      )
    }
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "advice|conseil",
  desc: "obtenir un conseil aléatoire",
  fromMe: wtype,
  type: "misc",
}, async (m, text) => {
  try {
    var advice = await m.axios("https://api.adviceslip.com/advice")
    return await m.send(
      `\`\`\`┏ CONSEIL ┓\`\`\`\n\`\`\`${advice.slip.advice}\`\`\``
    )
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "compliment",
  desc: "envoyer un compliment à un utilisateur",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  try {
    var t = m.quoted?.sender || m.mentionedJid?.[0] || null
    if (!t) return await m.send("_répondez ou mentionnez un utilisateur_")
    
    var compliments = [
      "Tu es incroyable ! ✨",
      "Ton sourit illumine la pièce ! 🌟",
      "Tu as un grand cœur ! 💖",
      "Tu es très intelligent ! 🧠",
      "Ton énergie est contagieuse ! ⚡",
      "Tu es unique et spécial ! 🌈",
      "Le monde est meilleur avec toi ! 🌍",
      "Tu inspires les autres ! 🎯",
      "Tu as un grand potentiel ! 🚀",
      "Tu es magnifique à l'intérieur comme à l'extérieur ! 🌸"
    ]
    
    var randomCompliment = compliments[Math.floor(Math.random() * compliments.length)]
    
    await m.send(`@${t.split("@")[0]} ${randomCompliment}`, { mentions: [t] })
  } catch (e) {
    console.error("erreur commande: ", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "flip|coin|piece",
  desc: "lancer une pièce de monnaie",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  try {
    var result = Math.random() < 0.5 ? "Pile" : "Face"
    var emoji = result === "Pile" ? "🪙" : "👑"
    
    return await m.send(
      `\`\`\`┏ LANCER DE PIÈCE ┓\`\`\`\n${emoji} *${result}*`
    )
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "dice|de|dés",
  desc: "lancer un dé",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  try {
    var result = Math.floor(Math.random() * 6) + 1
    var diceEmojis = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"]
    
    return await m.send(
      `\`\`\`┏ LANCER DE DÉ ┓\`\`\`\n${diceEmojis[result - 1]} *${result}*`
    )
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "rate|note",
  desc: "noter quelque chose ou quelqu'un",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  try {
    if (!text) return await m.send("_Que voulez-vous noter ?_")
    
    var rating = Math.floor(Math.random() * 11) // 0-10
    var stars = "⭐".repeat(rating) + "☆".repeat(10 - rating)
    
    return await m.send(
      `\`\`\`┏ NOTE ┓\`\`\`\n*${text}*\n\n${stars}\n*${rating}/10*`
    )
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "8ball|boule8",
  desc: "poser une question à la boule magique",
  fromMe: wtype,
  type: "fun",
}, async (m, text) => {
  try {
    if (!text) return await m.send("_Posez une question !_")
    
    var responses = [
      "Oui, certainement ! ✅",
      "C'est décidément ainsi. 👍",
      "Sans aucun doute. 👌",
      "Oui, définitivement. 💯",
      "Vous pouvez compter dessus. 🤝",
      "Comme je le vois, oui. 👁️",
      "Très probablement. 📈",
      "Les perspectives sont bonnes. 🌟",
      "Oui. ✅",
      "Les signes indiquent oui. 🔮",
      "Réponse floue, réessayez. 🤔",
      "Redemandez plus tard. ⏳",
      "Mieux vaut ne pas vous le dire maintenant. 🤫",
      "Impossible de prédire maintenant. 🎱",
      "Concentrez-vous et redemandez. 🧘",
      "Ne comptez pas dessus. ❌",
      "Ma réponse est non. 👎",
      "Mes sources disent non. 📢",
      "Les perspectives ne sont pas bonnes. 📉",
      "Très douteux. 🤨"
    ]
    
    var randomResponse = responses[Math.floor(Math.random() * responses.length)]
    
    return await m.send(
      `\`\`\`┏ BOULE MAGIQUE ┓\`\`\`\n*Question:* ${text}\n\n*Réponse:* ${randomResponse}`
    )
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

King({
  cmd: "weather|météo",
  desc: "obtenir la météo d'une ville",
  fromMe: wtype,
  type: "misc",
}, async (m, text) => {
  try {
    if (!text) return await m.send("_Fournissez le nom d'une ville_")
    
    // Simulation de données météo (remplacer par une vraie API)
    var weatherData = {
      temp: Math.floor(Math.random() * 35) + 5,
      condition: ["☀️ Ensoleillé", "⛅ Partiellement nuageux", "☁️ Nuageux", "🌧️ Pluvieux", "⛈️ Orageux", "❄️ Neigeux"][Math.floor(Math.random() * 6)],
      humidity: Math.floor(Math.random() * 100),
      wind: Math.floor(Math.random() * 50)
    }
    
    return await m.send(
      `\`\`\`┏ MÉTÉO ┓\`\`\`\n*Ville:* ${text}\n*Température:* ${weatherData.temp}°C\n*Condition:* ${weatherData.condition}\n*Humidité:* ${weatherData.humidity}%\n*Vent:* ${weatherData.wind} km/h`
    )
  } catch (e) {
    console.log("erreur commande", e)
    return await m.sendErr(e)
  }
})

console.log(`
╔═══════════════════════════════╗
║        KING FUN SYSTEM        ║
║         🎭 ACTIVATED 🎭       ║
║                               ║
║  📝 Citations     🎯 Utilitaires ║
║  🎮 Fun Games     📚 Notes      ║
║  😂 Blagues       🔮 Divertissement ║
║                               ║
║     👑 KING MODE: ON 👑      ║
╚═══════════════════════════════╝
`)
