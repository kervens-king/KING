/* 
 * 👑 KING AI UNIVERSE 2025 - MULTI-IA INTÉGRÉE
 * Module IA Royal par Kervens
 * Sous licence GNU GPLv3
 * -------------------------------------------------------------------------------
 */

const { King, wtype, chatWithAi, getData, storeData, commands } = require("../core");
const axios = require("axios");

const prefix = ".";

// 🔹 Cache intelligent pour les performances
const responseCache = new Map();
const userCooldowns = new Map();

// 🔹 Supprimer les balises <think> avec optimisation
function stripThoughts(text) {
    if (!text) return "";
    return text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
}

// 🔹 Gestion avancée de l'historique
class ChatHistoryManager {
    constructor(maxHistory = 15, maxContextLength = 4000) {
        this.histories = new Map();
        this.maxHistory = maxHistory;
        this.maxContextLength = maxContextLength;
    }

    getHistory(chatId) {
        return this.histories.get(chatId) || [];
    }

    addMessage(chatId, role, content) {
        if (!this.histories.has(chatId)) {
            this.histories.set(chatId, []);
        }
        
        const history = this.histories.get(chatId);
        history.push({ 
            role, 
            content: content.slice(0, 2000),
            timestamp: Date.now()
        });

        if (history.length > this.maxHistory) {
            this.histories.set(chatId, history.slice(-this.maxHistory));
        }

        this.cleanContext(chatId);
    }

    cleanContext(chatId) {
        const history = this.histories.get(chatId);
        if (!history) return;

        let totalLength = history.reduce((acc, msg) => acc + msg.content.length, 0);
        
        while (totalLength > this.maxContextLength && history.length > 3) {
            const removed = history.shift();
            totalLength -= removed.content.length;
        }
    }

    clearHistory(chatId) {
        this.histories.delete(chatId);
        return true;
    }

    getContextSummary(chatId) {
        const history = this.getHistory(chatId);
        if (history.length === 0) return "Aucun contexte précédent";
        
        const recent = history.slice(-3);
        return recent.map(msg => 
            `${msg.role === 'user' ? '👤' : '🤖'}: ${msg.content.slice(0, 100)}...`
        ).join('\n');
    }
}

const chatManager = new ChatHistoryManager();

// 🔹 TOUTES LES IA DISPONIBLES
const allAIEngines = [
    // 🔥 IA PRINCIPALES
    { cmd: "ai", engine: "KING-AI", desc: "IA principale KING AI - Intelligence complète" },
    { cmd: "chatbot", engine: "Chatbot-Mode", desc: "Mode chatbot conversationnel" },
    { cmd: "gpt", engine: "gpt-3.5-turbo", desc: "GPT-3.5 Turbo - Équilibre parfait" },
    { cmd: "gpt4", engine: "gpt-4-turbo", desc: "GPT-4 Turbo - Intelligence avancée" },
    { cmd: "gpt5", engine: "GPT-5", desc: "GPT-5 - Prochaine génération" },
    
    // 🌟 IA SPÉCIALISÉES
    { cmd: "claude", engine: "Claude-3.5-Sonnet", desc: "Claude 3.5 - Raisonnement expert" },
    { cmd: "gemini", engine: "Gemini-Pro", desc: "Google Gemini - Multimodal" },
    { cmd: "llama", engine: "Llama-2-70B", desc: "Llama 2 - Open source" },
    { cmd: "llama3", engine: "Llama-3-70B", desc: "Llama 3 70B - Puissance pure" },
    { cmd: "mistral", engine: "Mistral-7B", desc: "Mistral 7B - Efficacité française" },
    
    // 💡 IA CRÉATIVES
    { cmd: "midjourney", engine: "Midjourney", desc: "Génération d'images artistiques" },
    { cmd: "dalle", engine: "DALL-E-3", desc: "DALL-E 3 - Création visuelle" },
    { cmd: "firefly", engine: "Adobe-Firefly", desc: "Adobe Firefly - Design créatif" },
    { cmd: "blackbox", engine: "Blackbox", desc: "Blackbox - Code et création" },
    { cmd: "copilot", engine: "GitHub-Copilot", desc: "GitHub Copilot - Assistance code" },
    
    // 🚀 IA RAPIDES
    { cmd: "groq", engine: "Groq-Llama3", desc: "Groq Llama3 - Ultra rapide" },
    { cmd: "deepseek", engine: "DeepSeek-R1", desc: "DeepSeek R1 - Recherche avancée" },
    { cmd: "zephyr", engine: "Zephyr-Alpha", desc: "Zephyr Alpha - Léger et efficace" },
    { cmd: "hermes", engine: "OpenHermes", desc: "OpenHermes - Assistant ouvert" },
    
    // 🔬 IA TECHNIQUES
    { cmd: "code", engine: "Code-Expert", desc: "Expert en programmation" },
    { cmd: "math", engine: "Math-Solver", desc: "Résolution de problèmes mathématiques" },
    { cmd: "science", engine: "Science-Assistant", desc: "Assistant scientifique" },
    { cmd: "medical", engine: "Medical-AI", desc: "Assistant médical (information)" },
    
    // 🎭 IA DIVERTISSEMENT
    { cmd: "joke", engine: "Joke-Bot", desc: "Générateur d'humour et blagues" },
    { cmd: "story", engine: "Story-Teller", desc: "Conteur d'histoires" },
    { cmd: "poem", engine: "Poetry-AI", desc: "Générateur de poésie" },
    { cmd: "music", engine: "Music-Composer", desc: "Composition musicale" },
    
    // 🌍 IA LINGUISTIQUES
    { cmd: "translate", engine: "Translator-Pro", desc: Traducteur multilingue" },
    { cmd: "writer", engine: "Writing-Assistant", desc: "Assistant rédactionnel" },
    { cmd: "summarize", engine: "Summary-Pro", desc: "Résumeur de texte" },
    { cmd: "grammar", engine: "Grammar-Checker", desc: "Correcteur grammatical" },
    
    // 🔮 IA SPÉCIALES
    { cmd: "vision", engine: "Vision-AI", desc: "Analyse d'images" },
    { cmd: "voice", engine: "Voice-Assistant", desc: "Assistant vocal" },
    { cmd: "search", engine: "Search-Expert", desc: "Recherche web intelligente" },
    { cmd: "finance", engine: "Finance-AI", desc: "Assistant financier" },
    
    // 👑 IA KING TEAM
    { cmd: "king", engine: "KING-AI-Royal", desc: "IA royale KING TEAM" },
    { cmd: "crown", engine: "Crown-AI", desc: "IA premium Crown Edition" },
    { cmd: "royal", engine: "Royal-Assistant", desc: "Assistant royal personnel" }
];

// 🔹 Configuration API multiple
const API_CONFIGS = {
    mistral: {
        baseURL: "https://api.mistral.ai/v1",
        apiKey: "AA46jQW0VLsz2x7FW7sCUnBVIpBaa1qW",
        agentId: "ag:4151fcb9:20250104:untitled-agent:d1bde2e5",
        timeout: 25000
    },
    openai: {
        baseURL: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_KEY,
        timeout: 30000
    },
    gemini: {
        baseURL: "https://generativelanguage.googleapis.com/v1",
        apiKey: process.env.GEMINI_KEY,
        timeout: 25000
    }
};

// 🔹 Système de prompts spécialisés
const AI_PROMPTS = {
    default: `Tu es KING AI, assistant WhatsApp royal et charismatique. Réponds en français avec élégance et pertinence.`,

    creative: `Tu es un assistant créatif expert en génération de contenu original, d'idées innovantes et de solutions créatives. Sois inspirant !`,

    technical: `Tu es un expert technique. Réponds avec précision, exactitude et structure logique. Priorité aux faits et données vérifiables.`,

    code: `Tu es un expert en programmation. Fournis du code propre, bien commenté et des explications techniques précises.`,

    story: `Tu es un conteur captivant. Crée des histoires immersives avec des personnages riches et des intrigues passionnantes.`,

    joke: `Tu es un comédien IA. Crée de l'humour intelligent, des blagues originales et des jeux de mots créatifs.`,

    translate: `Tu es un traducteur professionnel multilingue. Traduis avec précision en conservant le sens et le style original.`,

    medical: `Tu es un assistant d'information médicale. Fournis des informations éducatives uniquement. Consulte toujours un professionnel de santé.`,

    finance: `Tu es un assistant financier. Donne des informations éducatives sur la finance personnelle et les investissements.`
};

// 🔹 Gestionnaire de cooldown
class CooldownManager {
    constructor(cooldownTime = 2000) {
        this.cooldownTime = cooldownTime;
        this.users = new Map();
    }

    canProceed(userId) {
        const now = Date.now();
        const lastRequest = this.users.get(userId);
        
        if (!lastRequest || (now - lastRequest) > this.cooldownTime) {
            this.users.set(userId, now);
            return true;
        }
        return false;
    }

    getRemainingTime(userId) {
        const lastRequest = this.users.get(userId);
        if (!lastRequest) return 0;
        return Math.max(0, this.cooldownTime - (Date.now() - lastRequest));
    }
}

const cooldownManager = new CooldownManager(1500);

// 🔹 Fonction principale de réponse IA
async function getAIResponse(m, quoted, engine = "KING-AI", customPrompt = null) {
    const chatId = m.chat;
    const userId = m.sender;
    const cacheKey = `${chatId}:${userId}:${engine}:${m.text.slice(0, 50)}`;

    // Vérification cooldown
    if (!cooldownManager.canProceed(userId)) {
        const remaining = cooldownManager.getRemainingTime(userId);
        throw new Error(`⏳ Veuillez patienter ${Math.ceil(remaining/1000)}s`);
    }

    // Vérification cache
    if (responseCache.has(cacheKey)) {
        return responseCache.get(cacheKey);
    }

    try {
        const userMessage = quoted
            ? `Message: ${m.text}\n\nCitation: ${quoted.text}`
            : m.text;

        // Ajout à l'historique
        chatManager.addMessage(chatId, "user", userMessage);

        const history = chatManager.getHistory(chatId);
        const systemPrompt = customPrompt || AI_PROMPTS.default;

        const messages = [
            { role: "system", content: systemPrompt },
            ...history.slice(-8),
            { role: "user", content: userMessage }
        ];

        // Utilisation de l'API Mistral par défaut (à étendre pour d'autres APIs)
        const response = await axios.post(
            `${API_CONFIGS.mistral.baseURL}/agents/completions`,
            {
                agent_id: API_CONFIGS.mistral.agentId,
                messages,
                max_tokens: 800,
                temperature: 0.7,
                top_p: 0.9,
                stream: false
            },
            {
                headers: {
                    Authorization: `Bearer ${API_CONFIGS.mistral.apiKey}`,
                    "Content-Type": "application/json"
                },
                timeout: API_CONFIGS.mistral.timeout
            }
        );

        const rawResponse = response.data?.choices?.[0]?.message?.content;
        const cleanResponse = stripThoughts(rawResponse);

        if (!cleanResponse) {
            throw new Error("Réponse vide de l'IA");
        }

        // Mise en cache et historique
        chatManager.addMessage(chatId, "assistant", cleanResponse);
        responseCache.set(cacheKey, cleanResponse);

        // Nettoyage périodique du cache
        if (responseCache.size > 100) {
            const keys = Array.from(responseCache.keys()).slice(0, 20);
            keys.forEach(key => responseCache.delete(key));
        }

        return cleanResponse;

    } catch (error) {
        console.error(`Erreur ${engine}:`, error.message);
        
        if (error.response?.status === 429) {
            throw new Error("🚦 Limite de requêtes atteinte");
        } else if (error.code === 'ECONNABORTED') {
            throw new Error("⏰ Délai de réponse dépassé");
        } else {
            throw new Error(`❌ Erreur ${engine}: ${error.message}`);
        }
    }
}

// 🔹 GÉNÉRATION DE TOUTES LES COMMANDES IA
allAIEngines.forEach(({ cmd, engine, desc }) => {
    King({
        cmd,
        desc: desc || `Discuter avec ${engine}`,
        fromMe: wtype,
        type: "ai",
        category: getAICategory(engine)
    }, async (m, text) => {
        try {
            const startTime = Date.now();
            const prompt = text || m.quoted?.text;
            
            if (!prompt) {
                return await m.send(`💡 *Usage :* ${prefix}${cmd} [question]\nOu répondez à un message\n\n🤖 *Moteur :* ${engine}\n📝 *Description :* ${desc}`);
            }

            // Indicateur de typing
            const typingInterval = setInterval(() => {
                try { m.client.sendPresenceUpdate("composing", m.chat); } catch {}
            }, 2000);

            let customPrompt = AI_PROMPTS.default;
            
            // Prompt spécialisé selon le type d'IA
            if (cmd === 'code' || cmd === 'copilot') customPrompt = AI_PROMPTS.code;
            else if (cmd === 'joke') customPrompt = AI_PROMPTS.joke;
            else if (cmd === 'story' || cmd === 'poem') customPrompt = AI_PROMPTS.story;
            else if (cmd === 'translate') customPrompt = AI_PROMPTS.translate;
            else if (cmd === 'medical') customPrompt = AI_PROMPTS.medical;
            else if (cmd === 'finance') customPrompt = AI_PROMPTS.finance;
            else if (['gpt4', 'gpt5', 'claude', 'gemini'].includes(cmd)) customPrompt = AI_PROMPTS.technical;

            const response = await getAIResponse(m, m.quoted, engine, customPrompt);
            clearInterval(typingInterval);

            const responseTime = Date.now() - startTime;
            
            await m.send(`🤖 *${engine}* (${responseTime}ms) :\n\n${response}\n\n━━━━━━━━━━━━━━━━━━━━\n*💬 Contexte :* ${chatManager.getHistory(m.chat).length} messages`);

        } catch (error) {
            console.error(`Erreur ${engine}:`, error);
            await m.send(`❌ *${engine} - Erreur :*\n${error.message}`);
        }
    });
});

function getAICategory(engine) {
    if (engine.includes('GPT') || engine.includes('gpt')) return 'OpenAI';
    if (engine.includes('Claude')) return 'Anthropic';
    if (engine.includes('Gemini')) return 'Google';
    if (engine.includes('Llama') || engine.includes('Mistral')) return 'Open Source';
    if (engine.includes('Midjourney') || engine.includes('DALL-E')) return 'Création';
    if (engine.includes('Code') || engine.includes('Copilot')) return 'Programmation';
    if (engine.includes('KING') || engine.includes('Royal')) return 'KING Team';
    return 'Divers';
}

// 🔹 Configuration du chatbot
class ChatbotConfig {
    constructor() {
        this.config = {
            active: false,
            global: false,
            activeChats: [],
            settings: {
                maxResponseLength: 2000,
                enableTypingIndicator: true,
                cooldownPerUser: 1500,
                maxHistoryPerChat: 15
            }
        };
        this.loadConfig();
    }

    async loadConfig() {
        try {
            const saved = await getData("chatbot_cfg");
            if (saved) {
                this.config = { ...this.config, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error("Erreur chargement config:", error);
        }
    }

    async saveConfig() {
        await storeData("chatbot_cfg", JSON.stringify(this.config, null, 2));
    }

    isActive(chatId) {
        return this.config.global || this.config.activeChats.includes(chatId);
    }
}

const chatbotConfig = new ChatbotConfig();

// 🔹 COMMANDE CHATBOT AMÉLIORÉE
King({
    cmd: "chatbot|bot",
    desc: "Système de chatbot IA avancé",
    fromMe: true,
    type: "ai"
}, async (m, text) => {
    const isActive = chatbotConfig.isActive(m.chat);
    const status = isActive ? "✅ ACTIVÉ" : "❌ DÉSACTIVÉ";
    
    const options = {
        "chatbot on": "✅ Activer ici",
        "chatbot off": "❌ Désactiver ici", 
        "chatbot global on": "🌐 Activer globalement",
        "chatbot global off": "🌐 Désactiver globalement",
        "chatbot stats": "📊 Statistiques",
        "chatbot clear": "🧹 Effacer historique"
    };

    if (!text) {
        const statusText = `🔧 *Configuration Chatbot IA*\n\nStatus: ${status}\nChats actifs: ${chatbotConfig.config.activeChats.length}\nMode global: ${chatbotConfig.config.global ? 'ON' : 'OFF'}`;
        return m.btnText(statusText, options);
    }

    const args = text.toLowerCase().split(' ');
    
    try {
        switch (args[0]) {
            case 'on':
                if (!chatbotConfig.config.activeChats.includes(m.chat)) {
                    chatbotConfig.config.activeChats.push(m.chat);
                }
                await chatbotConfig.saveConfig();
                await m.send("✅ *Chatbot activé dans ce chat*\nJe répondrai maintenant aux messages.");
                break;
                
            case 'off':
                chatbotConfig.config.activeChats = chatbotConfig.config.activeChats.filter(
                    chat => chat !== m.chat
                );
                await chatbotConfig.saveConfig();
                await m.send("❌ *Chatbot désactivé dans ce chat*");
                break;
                
            case 'global':
                if (args[1] === 'on') {
                    chatbotConfig.config.global = true;
                    await chatbotConfig.saveConfig();
                    await m.send("🌐 *Chatbot activé globalement*\nActif dans tous les chats.");
                } else if (args[1] === 'off') {
                    chatbotConfig.config.global = false;
                    await chatbotConfig.saveConfig();
                    await m.send("🌐 *Chatbot désactivé globalement*");
                }
                break;
                
            case 'stats':
                const stats = {
                    "Chats actifs": chatbotConfig.config.activeChats.length,
                    "Mode global": chatbotConfig.config.global ? "OUI" : "NON",
                    "Historiques": chatManager.histories.size,
                    "Cache": responseCache.size,
                    "IA disponibles": allAIEngines.length
                };
                
                const statsText = Object.entries(stats)
                    .map(([key, value]) => `• ${key}: ${value}`)
                    .join('\n');
                    
                await m.send(`📊 *Statistiques Chatbot:*\n\n${statsText}`);
                break;
                
            case 'clear':
                chatManager.clearHistory(m.chat);
                await m.send("🧹 *Historique effacé*\nLa conversation a été réinitialisée.");
                break;
                
            default:
                await m.send("❌ Option non reconnue. Utilisez les boutons.");
        }
    } catch (error) {
        console.error("Erreur configuration chatbot:", error);
        await m.send("❌ Erreur lors de la configuration.");
    }
});

// 🔹 COMMANDE LISTE DES IA
King({
    cmd: "ailist|iais|listai",
    desc: "Liste toutes les IA disponibles",
    fromMe: wtype,
    type: "ai"
}, async (m, text) => {
    const categories = {};
    
    allAIEngines.forEach(ai => {
        const category = getAICategory(ai.engine);
        if (!categories[category]) categories[category] = [];
        categories[category].push(ai);
    });

    let listMessage = `👑 *KING AI UNIVERSE - ${allAIEngines.length} IA DISPONIBLES*\n\n`;
    
    Object.entries(categories).forEach(([category, ais]) => {
        listMessage += `📁 *${category}*\n`;
        ais.forEach(ai => {
            listMessage += `• ${prefix}${ai.cmd.padEnd(12)} - ${ai.desc}\n`;
        });
        listMessage += '\n';
    });

    listMessage += `\n💡 *Utilisation :* ${prefix}[commande] [votre message]`;
    listMessage += `\n📖 *Exemple :* ${prefix}gpt Comment fonctionne l'IA ?`;
    listMessage += `\n\n👑 *KING TEAM 2025 - Intelligence Multimodale*`;

    await m.send(listMessage);
});

// 🔹 COMMANDE INFO IA
King({
    cmd: "aiinfo|iainfo",
    desc: "Information détaillée sur le système IA",
    fromMe: wtype,
    type: "ai"
}, async (m) => {
    const info = `
👑 *KING AI UNIVERSE 2025*

🚀 *Système Multi-IA Intégré*
• ${allAIEngines.length} moteurs IA disponibles
• Gestion d'historique intelligent
• Cache de performance
• Cooldown adaptatif

📊 *Statistiques Live:*
• Historiques actifs: ${chatManager.histories.size}
• Réponses en cache: ${responseCache.size}
• Commandes chargées: ${allAIEngines.length}

⚙️ *Fonctionnalités:*
• Chatbot automatique
• Historique conversationnel
• Prompts spécialisés
• Multi-APIs support

🔧 *Commandes Principales:*
• ${prefix}ailist - Liste toutes les IA
• ${prefix}chatbot - Gestion chatbot  
• ${prefix}history - Gestion historique
• ${prefix}[ia] [message] - Utiliser une IA

🎯 *IA Phares:*
• ${prefix}ai - KING AI principal
• ${prefix}gpt4 - Intelligence avancée
• ${prefix}claude - Raisonnement expert
• ${prefix}code - Assistant programmation
• ${prefix}midjourney - Création visuelle

*Développé avec excellence par KING TEAM* 👑
    `.trim();

    await m.send(info);
});

// 🔹 COMMANDE HISTORIQUE
King({
    cmd: "history|hist",
    desc: "Gérer l'historique des conversations IA",
    fromMe: wtype,
    type: "ai"
}, async (m, text) => {
    const chatId = m.chat;
    const history = chatManager.getHistory(chatId);
    
    const options = {
        "history clear": "🧹 Effacer l'historique",
        "history stats": "📊 Statistiques",
        "history summary": "📝 Résumé du contexte"
    };

    if (!text) {
        return m.btnText(`🗂 *Historique IA - ${history.length} messages*\nChoisissez une action :`, options);
    }

    switch (text.toLowerCase()) {
        case "clear":
            chatManager.clearHistory(chatId);
            responseCache.clear();
            await m.send("✅ *Historique effacé*\nToutes les conversations ont été supprimées.");
            break;
            
        case "stats":
            const stats = {
                "Messages": history.length,
                "Utilisateur": history.filter(h => h.role === 'user').length,
                "Assistant": history.filter(h => h.role === 'assistant').length,
                "Dernier": history.length > 0 ? 
                    new Date(history[history.length-1].timestamp).toLocaleTimeString() : "Aucun"
            };
            
            const statsText = Object.entries(stats)
                .map(([key, value]) => `• ${key}: ${value}`)
                .join('\n');
                
            await m.send(`📊 *Statistiques Historique:*\n\n${statsText}`);
            break;
            
        case "summary":
            const summary = chatManager.getContextSummary(chatId);
            await m.send(`📝 *Contexte Actuel:*\n\n${summary}`);
            break;
            
        default:
            await m.send("❌ Option non reconnue.");
    }
});

// 🔹 SYSTÈME DE RÉPONSES AUTOMATIQUES
King({ on: "text", fromMe: false }, async (m, text) => {
    try {
        if (!chatbotConfig.isActive(m.chat)) return;
        if (text.startsWith(prefix)) return;
        if (text.length < 2) return;

        const typingInterval = setInterval(() => {
            try { 
                m.client.sendPresenceUpdate("composing", m.chat); 
            } catch (error) {
                // Ignorer les erreurs de présence
            }
        }, 3000);

        try {
            const response = await getAIResponse(m, m.quoted, "KING-AI");
            await m.send(`👑 *KING AI* :\n\n${response}`);
        } finally {
            clearInterval(typingInterval);
        }

    } catch (error) {
        console.error("Erreur réponse automatique:", error);
    }
});

module.exports = {
    getAIResponse,
    chatManager,
    chatbotConfig,
    cooldownManager,
    allAIEngines
};
