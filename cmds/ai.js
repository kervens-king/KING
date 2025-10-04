/* 
 * 👑 KING AI UNIVERSE 2025
 * Module IA Royal par Kervens
 * Sous licence GNU GPLv3
 * -------------------------------------------------------------------------------
 */

const { King, wtype, chatWithAi, getData, storeData, commands } = require("../core")
const axios = require("axios")

const prefix = "."

// 🔹 Supprimer les balises <think>
function stripThoughts(text) {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
}

// 🔹 Historique par discussion
const chatHistories = new Map()
function clearChatHistory(chatId) { chatHistories.delete(chatId); return true }

// 🔹 Liste étendue des IA
const aiEngines = [
  { cmd: "gemma", engine: "Gemma" },
  { cmd: "gpt", engine: "gpt-3.5-turbo" },
  { cmd: "gpt4", engine: "gpt-4-turbo" },
  { cmd: "gpt5", engine: "GPT-5" },
  { cmd: "claude", engine: "Claude-3.5-Sonnet" },
  { cmd: "llama", engine: "Llama-2-int8" },
  { cmd: "llama3", engine: "Llama-3-70B" },
  { cmd: "mistral", engine: "Mistral-7B" },
  { cmd: "hermes", engine: "OpenHermes" },
  { cmd: "zephyr", engine: "Zephyr-Alpha" },
  { cmd: "deepseek", engine: "DeepSeek-R1" },
  { cmd: "perplexity", engine: "Perplexity" },
  { cmd: "blackbox", engine: "Blackbox" },
  { cmd: "copilot", engine: "GitHub-Copilot" },
  { cmd: "hugging", engine: "HuggingChat" },
  { cmd: "reka", engine: "Reka-Core" },
  { cmd: "pi", engine: "Inflection-Pi" },
  { cmd: "groq", engine: "Groq-Llama3" },
  { cmd: "firefly", engine: "Adobe-Firefly" },
  { cmd: "midjourney", engine: "Midjourney" },
  { cmd: "blackgpt", engine: "BlackGPT" },
]

// 🔹 Commandes dynamiques pour chaque IA
aiEngines.forEach(({ cmd, engine }) => {
  King({
    cmd,
    desc: `Discuter avec l'IA ${engine}`,
    fromMe: wtype,
    type: "ai",
  }, async (m, text) => {
    try {
      const prompt = text || m.quoted?.text
      if (!prompt) return await m.send("💡 Fournis un texte pour interroger l'IA.")
      const response = await chatWithAi(prompt, engine)
      await m.send(`🤖 *${engine}* dit :\n\n${response}`)
    } catch (err) {
      console.error(`Erreur AI (${engine}):`, err)
      await m.send(`❌ Erreur IA (${engine}) : ${err.message}`)
    }
  })
})

// 🔹 API Mistral par défaut
const API_BASE_URL = "https://api.mistral.ai/v1"
const API_KEY = "AA46jQW0VLsz2x7FW7sCUnBVIpBaa1qW"
const AGENT_ID = "ag:4151fcb9:20250104:untitled-agent:d1bde2e5"

async function getAIResponse(m, quoted) {
  const chatId = m.chat || "inconnu"
  const message = quoted
    ? `Message:\n${m.text}\n\nCitation:\n${quoted.text}`
    : `Message:\n${m.text}`

  try {
    if (!chatHistories.has(chatId)) chatHistories.set(chatId, [])
    const history = chatHistories.get(chatId)
    history.push({ role: "user", content: message })

    const messages = [
      { role: "system", content: "Tu es KING AI, assistant WhatsApp royal et charismatique. Réponds en français avec élégance et pertinence." },
      ...history.slice(-10)
    ]

    const res = await axios.post(`${API_BASE_URL}/agents/completions`, {
      agent_id: AGENT_ID,
      messages,
      max_tokens: 500,
      stream: false
    }, {
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      timeout: 30000
    })

    const raw = res.data?.choices?.[0]?.message?.content
    const output = stripThoughts(raw)
    if (output) {
      history.push({ role: "assistant", content: output })
      chatHistories.set(chatId, history.slice(-10))
      return output
    }
    throw new Error("Réponse vide de l’IA")
  } catch (e) {
    console.error("Erreur Mistral:", e.message)
    throw new Error("❌ Impossible d’obtenir la réponse de KING AI")
  }
}

// 🔹 Configuration du chatbot
var chatc = { active: false, global: false, activeChats: [] }
if (!getData("chatbot_cfg")) storeData("chatbot_cfg", JSON.stringify(chatc, null, 2))

// 🔹 Commande Chatbot
King({
  cmd: "chatbot",
  desc: "Activer / désactiver le chatbot IA royal",
  fromMe: true,
  type: "ai",
}, async (m, text, cmd) => {
  const options = {
    [`${cmd} on`]: "✅ Activé ici",
    [`${cmd} off`]: "❌ Désactivé ici",
    [`${cmd} on all`]: "🌐 Activé globalement",
    [`${cmd} off all`]: "🌐 Désactivé globalement",
    [`${cmd} clear`]: "🗑 Effacer historique"
  }

  if (!text) return m.btnText("Basculer Chatbot", options)
  const args = text.split(" ")
  const opt = args[0].toLowerCase()

  switch (opt) {
    case "on":
      chatc.active = true
      if (!chatc.activeChats.includes(m.chat)) chatc.activeChats.push(m.chat)
      await storeData("chatbot_cfg", JSON.stringify(chatc, null, 2))
      return m.send("✅ Chatbot activé ici 👑")
    case "off":
      chatc.activeChats = chatc.activeChats.filter(jid => jid !== m.chat)
      await storeData("chatbot_cfg", JSON.stringify(chatc, null, 2))
      return m.send("❌ Chatbot désactivé ici")
    case "onall":
      chatc.global = true
      await storeData("chatbot_cfg", JSON.stringify(chatc, null, 2))
      return m.send("🌐 Chatbot activé partout 🔥")
    case "offall":
      chatc.global = false
      await storeData("chatbot_cfg", JSON.stringify(chatc, null, 2))
      return m.send("🌐 Chatbot désactivé partout")
    case "clear":
      clearChatHistory(m.chat)
      return m.send("🧹 Historique IA effacé avec succès")
    default:
      return m.btnText("Choisis une action", options)
  }
})

// 🔹 Réponses automatiques
King({ on: "text", fromMe: false }, async (m, text) => {
  try {
    const cfg = await getData("chatbot_cfg") || {}
    const shouldRespond = cfg.global || cfg.activeChats.includes(m.chat)
    if (!shouldRespond) return

    const typing = setInterval(() => {
      try { m.client.sendPresenceUpdate("composing", m.chat) } catch {}
    }, 1000)

    const response = await getAIResponse(m, m.quoted)
    clearInterval(typing)
    await m.send(response)
  } catch (e) {
    clearInterval(typing)
    console.error("Erreur réponse AI:", e)
    await m.send("⚠️ Je ne peux pas répondre pour l’instant.")
  }
})
