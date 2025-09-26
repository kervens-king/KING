/* 
 * Copyright © 2025 Mirage
 * Module AI KING - Version Stylisée en Français
 * Licence GNU GPLv3
 * -------------------------------------------------------------------------------
 */

const { kord, wtype, chatWithAi, getData, storeData, commands } = require("../core")
const axios = require('axios')

// 🔹 Préfixe KING
const prefix = "."

// ----------------------------
// Utilitaire : retirer les balises <think>
// ----------------------------
function stripThoughts(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

// ----------------------------
// Historique des discussions
// ----------------------------
const chatHistories = new Map()

function clearChatHistory(chatId) {
  chatHistories.delete(chatId)
  return true
}

// ----------------------------
// Commandes génériques AI
// ----------------------------
const aiEngines = [
  { cmd: "gemma", engine: "Gemma" },
  { cmd: "gpt", engine: "gpt-3.5-turbo" },
  { cmd: "llama", engine: "Llama-2-int8" },
  { cmd: "llama2", engine: "Llama-2-int8" },
  { cmd: "llama3", engine: "Llama-2-awq" },
  { cmd: "mistral", engine: "Mistral" },
  { cmd: "hermes", engine: "OpenHermes" },
  { cmd: "zephyr", engine: "Zephyr" },
]

aiEngines.forEach(({ cmd, engine }) => {
  kord({
    cmd,
    desc: `Discuter avec l'IA (${engine})`,
    fromMe: wtype,
    type: "ai",
  }, async (m, text) => {
    try {
      const prompt = text || m.quoted?.text
      if (!prompt) return await m.send("💡 Veuillez fournir une question ou un prompt pour discuter avec l'IA !")
      const response = await chatWithAi(prompt, engine)
      await m.send(`🤖 *${engine} répond :*\n\n${response}`)
    } catch (err) {
      console.error(`Erreur de commande AI (${engine}):`, err)
      await m.send(`❌ Une erreur est survenue : ${err.message}`)
    }
  })
})

// ----------------------------
// Intégration API Mistral
// ----------------------------
const API_BASE_URL = 'https://api.mistral.ai/v1'
const API_KEY = 'AA46jQW0VLsz2x7FW7sCUnBVIpBaa1qW'
const AGENT_ID = 'ag:4151fcb9:20250104:untitled-agent:d1bde2e5'

async function getAIResponse(m, quoted) {
  const chatId = m.chat || m.chatId || m.key?.remoteJid || 'inconnu'
  const rawMessage = JSON.stringify(m, null, 2)
  const rawQuoted = quoted ? JSON.stringify(quoted, null, 2) : null

  const message = rawQuoted
    ? `Message:\n${rawMessage}\n\nCitation:\n${rawQuoted}`
    : `Message:\n${rawMessage}`

  try {
    if (!chatHistories.has(chatId)) chatHistories.set(chatId, [])
    const history = chatHistories.get(chatId)
    history.push({ role: 'user', content: message })

    const messages = [
      { role: 'system', content: "Vous êtes un bot WhatsApp. Répondez avec *gras*, _italique_, ~barré~, et ```monospace```." },
      ...history.slice(-10)
    ]

    const res = await axios.post(`${API_BASE_URL}/agents/completions`, {
      agent_id: AGENT_ID,
      messages,
      max_tokens: 500,
      stream: false,
      tool_choice: 'auto',
      parallel_tool_calls: true,
      prompt_mode: 'reasoning'
    }, {
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      timeout: 30000
    })

    const raw = res.data?.choices?.[0]?.message?.content
    const output = stripThoughts(raw)
    if (output) {
      history.push({ role: 'assistant', content: output })
      chatHistories.set(chatId, history.slice(-10))
      return output
    }
    throw new Error('Réponse vide de l’IA')
  } catch (e) {
    console.error('Erreur Mistral AI:', e.message)
    if (e.code === 'ECONNABORTED') throw new Error('⏳ Temps de réponse dépassé. Réessayez !')
    if (e.response?.status === 429) throw new Error('🚫 Limite de requêtes dépassée. Attendez un instant !')
    if (e.response?.status >= 500) throw new Error('⚠️ Erreur serveur. Réessayez plus tard !')
    throw new Error('❌ Impossible d’obtenir la réponse de l’IA')
  }
}

// ----------------------------
// Configuration Chatbot
// ----------------------------
var chatc = { active: false, global: false, activeChats: ['1234@g.us'] }
if (!getData("chatbot_cfg")) storeData("chatbot_cfg", JSON.stringify(chatc, null, 2))

// ----------------------------
// Commande Chatbot
// ----------------------------
kord({
  cmd: "chatbot",
  desc: "Activer le chatbot dans la discussion",
  fromMe: true,
  type: "ai",
}, async (m, text, cmd) => {
  try {
    const btnOptions = {
      [`${cmd} on`]: "✅ ACTIVÉ",
      [`${cmd} off`]: "❌ DÉSACTIVÉ",
      [`${cmd} on all`]: "🌐 ACTIVÉ (Toutes discussions)",
      [`${cmd} off all`]: "🌐 DÉSACTIVÉ (Toutes discussions)",
      [`${cmd} status`]: "📊 Statut",
      [`${cmd} clear`]: "🗑 Effacer historique"
    }

    if (!text) return m.btnText("Basculer Chatbot", btnOptions)

    const args = text.split(" ")
    const option = args[0].toLowerCase()
    const value = args[1]?.toLowerCase()

    switch(option) {
      case 'on':
        if (value === 'all') { chatc.global = true; await storeData('chatbot_cfg', JSON.stringify(chatc, null, 2)); return m.send('🌐 Chatbot activé pour toutes les discussions !') }
        chatc.active = true
        if (!chatc.activeChats.includes(m.chat)) chatc.activeChats.push(m.chat)
        await storeData('chatbot_cfg', JSON.stringify(chatc, null, 2))
        return m.send('✅ Chatbot activé dans cette discussion')
      case 'off':
        if (value === 'all') { chatc.global = false; await storeData('chatbot_cfg', JSON.stringify(chatc, null, 2)); return m.send('🌐 Chatbot désactivé pour toutes les discussions !') }
        chatc.activeChats = chatc.activeChats.filter(jid => jid !== m.chat)
        clearChatHistory(m.chat)
        await storeData('chatbot_cfg', JSON.stringify(chatc, null, 2))
        return m.send('❌ Chatbot désactivé dans cette discussion')
      case 'status':
        const status = await getAIStatus()
        return m.send(status ? `📊 Statut AI:\n• Statut: ${status.status}\n• Sessions actives: ${status.activeSessions}\n• Dernière mise à jour: ${new Date(status.timestamp).toLocaleString()}` : '⚠️ Impossible de récupérer le statut AI')
      case 'clear':
        clearChatHistory(m.chat)
        return m.send('🗑 Historique des discussions effacé avec succès')
      default:
        return m.btnText("Basculer Chatbot", btnOptions)
    }
  } catch(err) {
    console.error(err)
    return m.send(`❌ Erreur : ${err.message}`)
  }
})

// ----------------------------
// Gestion des réponses automatiques
// ----------------------------
kord({ on: "text", fromMe: false }, async (m, text) => {
  try {
    const cfg = await getData("chatbot_cfg") || { global: false, activeChats: [] }
    if (!cfg) return

    const shouldRespond = (cfg.global || cfg.activeChats.includes(m.chat)) &&
                          (m.quoted?.fromMe || m.mentionedJid?.includes(m.user.jid))
    if (!shouldRespond) return

    const typingInterval = setInterval(() => {
      try { m.client.sendPresenceUpdate("composing", m.chat) } catch {}
    }, 1000)

    try {
      const response = await getAIResponse(m, m.quoted)
      clearInterval(typingInterval)
      await m.send(response)
    } catch (error) {
      clearInterval(typingInterval)
      console.error("Erreur réponse AI :", error)
      let msg = "🤔 Je ne peux pas traiter cela pour le moment, réessayez"
      if (error.message.includes('timeout')) msg = "⏳ Temps de réponse dépassé, réessayez"
      else if (error.message.includes('rate limit')) msg = "🚫 Trop de requêtes, veuillez patienter"
      else if (error.message.includes('server error')) msg = "⚠️ Service AI temporairement indisponible"
      await m.send(msg)
    }
  } catch (err) {
    console.error("Erreur gestion message :", err)
  }
})

// ----------------------------
// Commande Test AI
// ----------------------------
kord({ cmd: "aitest", desc: "Tester la connectivité AI", fromMe: true, type: "ai" }, async (m) => {
  try {
    const testMessage = "Bonjour, ceci est un message de test"
    const response = await getAIResponse(testMessage, `test_${Date.now()}`)
    await m.send(`✅ *Test AI réussi !*\n\n*Message envoyé:* ${testMessage}\n*Réponse:* ${response}`)
  } catch (err) {
    await m.send(`❌ *Test AI échoué :* ${err.message}`)
  }
})
