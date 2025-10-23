/* 
 * 👑 KING ECONOMY UNIVERSE 2025
 * Module Économie Royal par Kervens
 * Sous licence GNU GPLv3
 * -------------------------------------------------------------------------------
 */

const { King, prefix, wtype, config, getData, storeData } = require("../core");
const fs = require("fs");
const path = require("path");
const edb = require("../core/edb");

// 🔹 Configuration MongoDB
if (config().MONGODB_URI) {
    var con = edb.connect(config().MONGODB_URI);
} else {
    con = undefined;
}

const k = "king";
const stored = path.join(__dirname, '..', 'core', 'store');

// 🔹 Cache pour optimiser les performances
const economyCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// 🔹 Gestionnaire d'erreur amélioré
async function handleEconomyError(m, error, commandName) {
    console.error(`[ECONOMY ERROR] ${commandName}:`, error);
    
    const errorMessages = [
        "💸 *Problème économique détecté...* Réessayez !",
        "🏦 *Banque temporairement fermée...* Patientez !",
        "⚡ *Transaction échouée...* Vérifiez votre solde !",
        "🔧 *Erreur système...* Contactez le support !"
    ];
    
    const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    await m.send(`${randomError}\n\n_Erreur: ${error.message}_`);
}

// 🔹 Fonctions utilitaires de cache
function getCachedData(key) {
    const cached = economyCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCachedData(key, data) {
    economyCache.set(key, { data, timestamp: Date.now() });
}

// 🔹 Système d'économie amélioré
class EconomyManager {
    constructor() {
        this.activeChats = new Set();
        this.loadConfig();
    }

    async loadConfig() {
        try {
            const edata = await getData("econ") || [];
            this.activeChats = new Set(edata);
        } catch (error) {
            console.error("Erreur chargement config économie:", error);
        }
    }

    async saveConfig() {
        await storeData("econ", Array.from(this.activeChats));
    }

    isActive(chatId) {
        return this.activeChats.has(chatId);
    }

    async activate(chatId) {
        this.activeChats.add(chatId);
        await this.saveConfig();
    }

    async deactivate(chatId) {
        this.activeChats.delete(chatId);
        await this.saveConfig();
    }
}

const economyManager = new EconomyManager();

// 🏦 COMMANDE PRINCIPALE ÉCONOMIE

King({
    cmd: "economy|econ",
    desc: "Gérer le système économique du groupe",
    fromMe: wtype,
    type: "economy",
    react: "💎"
}, async (m, text) => {
    try {
        if (!config().MONGODB_URI || config().MONGODB_URI === "") {
            return await m.send(
                "🔧 *Configuration MongoDB requise !*\n\n" +
                "Pour activer l'économie, configurez MONGODB_URI dans votre config.\n\n" +
                "*Exemple:*\n" +
                "```setvar MONGODB_URI=mongodb://localhost:27017/kingdb```\n\n" +
                "Ou ajoutez dans config.js:\n" +
                "```MONGODB_URI: 'votre_url_mongodb'```"
            );
        }

        const isActive = economyManager.isActive(m.chat);
        
        if (text) {
            const action = text.toLowerCase();
            
            switch (action) {
                case "on":
                case "activate":
                    if (isActive) {
                        return await m.send("💎 *L'économie est déjà activée dans ce groupe !*");
                    }
                    await economyManager.activate(m.chat);
                    return await m.send(
                        "📈 *ÉCONOMIE ACTIVÉE* 📈\n\n" +
                        "Le système économique est maintenant actif !\n\n" +
                        "💰 *Commandes disponibles:*\n" +
                        "• .bal - Voir votre solde\n" +
                        "• .daily - Récompense quotidienne\n" +
                        "• .work - Travailler pour gagner\n" +
                        "• .dep <montant> - Déposer à la banque\n" +
                        "• .shop - Magasin d'objets\n\n" +
                        "👑 *Bonne chance dans vos affaires !*"
                    );

                case "off":
                case "deactivate":
                    if (!isActive) {
                        return await m.send("💎 *L'économie est déjà désactivée dans ce groupe !*");
                    }
                    await economyManager.deactivate(m.chat);
                    return await m.send("📉 *ÉCONOMIE DÉSACTIVÉE*\n\nLe système économique a été désactivé dans ce groupe.");

                case "help":
                case "aide":
                    return await showEconomyHelp(m);
                    
                default:
                    return await showEconomyHelp(m);
            }
        }

        // Aucun argument - bascule automatique
        if (isActive) {
            return await showEconomyHelp(m);
        } else {
            await economyManager.activate(m.chat);
            return await m.send(
                "🎉 *ÉCONOMIE ACTIVÉE AUTOMATIQUEMENT* 🎉\n\n" +
                "Le système économique est maintenant actif !\n" +
                "Utilisez *.economy help* pour voir toutes les commandes."
            );
        }
        
    } catch (e) {
        await handleEconomyError(m, e, "economy");
    }
});

// 💰 COMMANDES ÉCONOMIQUES

King({
    cmd: "bal|wallet|solde",
    desc: "Afficher votre solde et portefeuille",
    fromMe: wtype,
    type: "economy",
    react: "💰"
}, async (m, text) => {
    try {
        if (!economyManager.isActive(m.chat)) {
            return await m.send("💎 *Économie non activée !*\n\nUtilisez *.economy on* pour activer le système.");
        }

        const cacheKey = `balance_${m.sender}`;
        const cached = getCachedData(cacheKey);
        
        let b;
        if (cached) {
            b = cached;
        } else {
            b = await edb.balance(m.sender, k);
            setCachedData(cacheKey, b);
        }

        const totalWealth = b.wallet + b.bank;
        const progressBar = createProgressBar(b.bank, b.bankCapacity);
        
        const message = `👑 *PORTEFEUILLE ROYAL* 👑\n\n` +
                       `💎 *Solde Portefeuille:* ₹${b.wallet.toLocaleString()}\n` +
                       `🏦 *Solde Banque:* ₹${b.bank.toLocaleString()}\n` +
                       `📊 *Capacité Banque:* ₹${b.bankCapacity.toLocaleString()}\n` +
                       `📈 *Progression:* ${progressBar}\n` +
                       `💰 *Richesse Totale:* ₹${totalWealth.toLocaleString()}\n\n` +
                       `⚡ *Statut:* ${getWealthStatus(totalWealth)}`;

        await m.send(message, {
            title: "💰 Votre Portefeuille",
            body: `Richesse totale: ₹${totalWealth.toLocaleString()}`,
            thumbnail: fs.readFileSync(path.join(stored, 'wallet.png'))
        }, "ad");
        
    } catch (e) {
        await handleEconomyError(m, e, "bal");
    }
});

King({
    cmd: "daily|quotidien",
    desc: "Recevoir votre récompense quotidienne",
    fromMe: wtype,
    type: "economy",
    react: "🎁"
}, async (m, text) => {
    try {
        if (!economyManager.isActive(m.chat)) {
            return await m.send("💎 *Économie non activée !*");
        }

        const d = await edb.daily(m.sender, k, 1500); // Augmentation du daily
        
        if (d.cd) {
            return await m.send(
                `⏰ *RÉCOMPENSE DÉJÀ RECUE !*\n\n` +
                `Vous avez déjà réclamé votre récompense aujourd'hui.\n\n` +
                `🕒 *Prochaine récompense dans:* ${d.cdL}\n` +
                `💡 *Astuce:* Revenez demain pour plus de pièces !`,
                {
                    title: "⏰ Récompense Quotidienne",
                    body: "Revenez demain pour votre prochaine récompense",
                    thumbnail: fs.readFileSync(path.join(stored, 'cooldown.png'))
                }, "ad"
            );
        }

        const newBal = await edb.balance(m.sender, k);
        const bonus = Math.random() > 0.8 ? " 🎉 BONUS SPÉCIAL !" : "";
        
        await m.send(
            `🎁 *RÉCOMPENSE QUOTIDIENNE REÇUE !*${bonus}\n\n` +
            `💰 *Montant reçu:* ₹${d.amount.toLocaleString()}\n` +
            `💎 *Nouveau solde:* ₹${newBal.wallet.toLocaleString()}\n` +
            `🕒 *Prochaine récompense:* 24 heures\n\n` +
            `✨ *Merci pour votre fidélité !*`,
            {
                title: "🎁 Récompense Quotidienne",
                body: `₹${d.amount.toLocaleString()} ajoutés à votre portefeuille`,
                thumbnail: fs.readFileSync(path.join(stored, 'daily.png'))
            }, "ad"
        );
        
    } catch (e) {
        await handleEconomyError(m, e, "daily");
    }
});

King({
    cmd: "dep|deposit|déposer",
    desc: "Déposer de l'argent à la banque",
    fromMe: wtype,
    type: "economy",
    react: "🏦"
}, async (m, text) => {
    try {
        if (!economyManager.isActive(m.chat)) {
            return await m.send("💎 *Économie non activée !*");
        }

        if (!text) {
            return await m.send(
                "🏦 *UTILISATION DU DÉPÔT*\n\n" +
                "*.dep <montant>* - Déposer un montant spécifique\n" +
                "*.dep all* - Déposer tout votre argent\n\n" +
                "*Exemples:*\n" +
                "• .dep 500\n" +
                "• .dep all"
            );
        }

        const amount = text.toLowerCase() === "all" ? "all" : parseInt(text);
        
        if (amount !== "all" && (isNaN(amount) || amount <= 0)) {
            return await m.send("❌ *Montant invalide !*\n\nVeuillez spécifier un nombre positif.");
        }

        const result = await edb.deposit(m.sender, k, amount);
        
        if (result.noten) {
            return await m.send(
                "💸 *SOLDE INSUFFISANT !*\n\n" +
                "Vous n'avez pas assez d'argent dans votre portefeuille.\n" +
                "Utilisez *.work* pour gagner de l'argent."
            );
        }

        const newBal = await edb.balance(m.sender, k);
        economyCache.delete(`balance_${m.sender}`); // Invalider le cache
        
        await m.send(
            `🏦 *DÉPÔT RÉUSSI !*\n\n` +
            `💰 *Montant déposé:* ₹${result.amount.toLocaleString()}\n` +
            `💎 *Portefeuille actuel:* ₹${newBal.wallet.toLocaleString()}\n` +
            `🏦 *Banque actuelle:* ₹${newBal.bank.toLocaleString()}\n` +
            `📊 *Capacité restante:* ₹${(newBal.bankCapacity - newBal.bank).toLocaleString()}\n\n` +
            `🔒 *Votre argent est en sécurité !*`,
            {
                title: "🏦 Dépôt Bancaire",
                body: `₹${result.amount.toLocaleString()} déposés avec succès`,
                thumbnail: fs.readFileSync(path.join(stored, 'deposit.png'))
            }, "ad"
        );
        
    } catch (e) {
        await handleEconomyError(m, e, "dep");
    }
});

King({
    cmd: "with|withdraw|retirer",
    desc: "Retirer de l'argent de la banque",
    fromMe: wtype,
    type: "economy",
    react: "💸"
}, async (m, text) => {
    try {
        if (!economyManager.isActive(m.chat)) {
            return await m.send("💎 *Économie non activée !*");
        }

        if (!text) {
            return await m.send(
                "💸 *UTILISATION DU RETRAIT*\n\n" +
                "*.with <montant>* - Retirer un montant spécifique\n" +
                "*.with all* - Retirer tout votre argent\n\n" +
                "*Exemples:*\n" +
                "• .with 500\n" +
                "• .with all"
            );
        }

        const amount = text.toLowerCase() === "all" ? "all" : parseInt(text);
        
        if (amount !== "all" && (isNaN(amount) || amount <= 0)) {
            return await m.send("❌ *Montant invalide !*\n\nVeuillez spécifier un nombre positif.");
        }

        const result = await edb.withdraw(m.sender, k, amount);
        
        if (result.noten) {
            return await m.send("💸 *SOLDE BANCAIRE INSUFFISANT !*");
        }
        
        if (result.invalid) {
            return await m.send("❌ *Montant invalide spécifié !*");
        }

        const newBal = await edb.balance(m.sender, k);
        economyCache.delete(`balance_${m.sender}`);
        
        await m.send(
            `💸 *RETRAIT RÉUSSI !*\n\n` +
            `💰 *Montant retiré:* ₹${result.amount.toLocaleString()}\n` +
            `💎 *Portefeuille actuel:* ₹${newBal.wallet.toLocaleString()}\n` +
            `🏦 *Banque actuelle:* ₹${newBal.bank.toLocaleString()}\n\n` +
            `💳 *Argent disponible dans votre portefeuille !*`,
            {
                title: "💸 Retrait Bancaire",
                body: `₹${result.amount.toLocaleString()} retirés avec succès`,
                thumbnail: fs.readFileSync(path.join(stored, 'withdraw.png'))
            }, "ad"
        );
        
    } catch (e) {
        await handleEconomyError(m, e, "with");
    }
});

King({
    cmd: "work|travail",
    desc: "Travailler pour gagner de l'argent",
    fromMe: wtype,
    type: "economy",
    react: "💼"
}, async (m, text) => {
    try {
        if (!economyManager.isActive(m.chat)) {
            return await m.send("💎 *Économie non activée !*");
        }

        const result = await edb.work(m.sender, k);
        
        if (result.cd) {
            return await m.send(
                `😴 *REPOS NÉCESSAIRE !*\n\n` +
                `Vous êtes fatigué de votre dernier travail.\n\n` +
                `🕒 *Reprenez dans:* ${result.cdL}\n` +
                `💡 *Conseil:* Reposez-vous pour être plus productif !`,
                {
                    title: "😴 Temps de Repos",
                    body: "Prenez une pause avant de retravailler",
                    thumbnail: fs.readFileSync(path.join(stored, 'tired.png'))
                }, "ad"
            );
        }

        const jobs = [
            { name: "👨‍💻 Développeur", salary: [800, 1200] },
            { name: "🎨 Designer", salary: [600, 900] },
            { name: "👨‍🏫 Enseignant", salary: [500, 800] },
            { name: "👨‍⚕️ Médecin", salary: [1000, 1500] },
            { name: "👨‍🔧 Ingénieur", salary: [900, 1300] },
            { name: "👨‍🍳 Chef Cuisinier", salary: [400, 700] },
            { name: "✍️ Écrivain", salary: [300, 600] },
            { name: "🎭 Artiste", salary: [200, 500] },
            { name: "💼 Manager", salary: [1200, 1800] },
            { name: "🔬 Chercheur", salary: [700, 1100] }
        ];
        
        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const salary = Math.floor(Math.random() * (job.salary[1] - job.salary[0])) + job.salary[0];
        
        // Ajouter le salaire manuellement puisque l'API ne le fait pas
        await edb.give(m.sender, k, salary);
        
        await m.send(
            `💼 *TRAVAIL TERMINÉ !*\n\n` +
            `👷 *Emploi:* ${job.name}\n` +
            `💰 *Salaire gagné:* ₹${salary.toLocaleString()}\n` +
            `🕒 *Prochain travail dans:* ${result.cdL}\n\n` +
            `🌟 *Bon travail ! Continuez comme ça !*`,
            {
                title: "💼 Travail Terminé",
                body: `${job.name} - ₹${salary.toLocaleString()} gagnés`,
                thumbnail: fs.readFileSync(path.join(stored, 'work.png'))
            }, "ad"
        );
        
    } catch (e) {
        await handleEconomyError(m, e, "work");
    }
});

King({
    cmd: "give|pay|donner",
    desc: "Donner de l'argent à un autre joueur",
    fromMe: wtype,
    type: "economy",
    react: "💸"
}, async (m, text) => {
    try {
        if (!economyManager.isActive(m.chat)) {
            return await m.send("💎 *Économie non activée !*");
        }

        if (!m.quoted && !text) {
            return await m.send(
                "💸 *UTILISATION DU DON*\n\n" +
                "*Méthode 1:* Répondez à un message avec *.give <montant>*\n" +
                "*Méthode 2:* *.give @mention <montant>*\n\n" +
                "*Exemples:*\n" +
                "• .give 500 (en réponse)\n" +
                "• .give @joueur 500"
            );
        }

        let target = m.quoted ? m.quoted.sender : m.mentions[0];
        let amount = text ? parseInt(text.split(" ")[1] || text) : parseInt(text);
        
        if (!target) return await m.send("❌ *Veuillez spécifier à qui donner !*");
        if (isNaN(amount) || amount <= 0) return await m.send("❌ *Montant invalide !*");
        if (target === m.sender) return await m.send("😂 *Vous ne pouvez pas vous donner de l'argent à vous-même !*");

        const senderBal = await edb.balance(m.sender, k);
        if (senderBal.wallet < amount) {
            return await m.send(
                "💸 *SOLDE INSUFFISANT !*\n\n" +
                `Vous avez seulement ₹${senderBal.wallet.toLocaleString()} dans votre portefeuille.\n` +
                `Montant demandé: ₹${amount.toLocaleString()}`
            );
        }

        await edb.deduct(m.sender, k, amount);
        await edb.give(target, k, amount);
        
        // Invalider les caches
        economyCache.delete(`balance_${m.sender}`);
        economyCache.delete(`balance_${target}`);
        
        const newBal = await edb.balance(m.sender, k);
        
        await m.send(
            `💸 *DON EFFECTUÉ !*\n\n` +
            `💰 *Montant:* ₹${amount.toLocaleString()}\n` +
            `👤 *Destinataire:* @${target.split("@")[0]}\n` +
            `💎 *Votre nouveau solde:* ₹${newBal.wallet.toLocaleString()}\n\n` +
            `🤝 *Merci pour votre générosité !*`,
            {
                title: "💸 Transfert d'Argent",
                body: `₹${amount.toLocaleString()} envoyés avec succès`,
                thumbnail: fs.readFileSync(path.join(stored, 'payment.png'))
            }, "ad"
        );
        
    } catch (e) {
        await handleEconomyError(m, e, "give");
    }
});

// 🎰 COMMANDES DE JEUX

King({
    cmd: "rob|voler",
    desc: "Tenter de voler un autre joueur",
    fromMe: wtype,
    type: "economy",
    react: "🎯"
}, async (m, text) => {
    try {
        if (!economyManager.isActive(m.chat)) {
            return await m.send("💎 *Économie non activée !*");
        }

        if (!m.quoted && !m.mentions[0]) {
            return await m.send(
                "🎯 *UTILISATION DU VOL*\n\n" +
                "*Méthode 1:* Répondez à un message avec *.rob*\n" +
                "*Méthode 2:* *.rob @mention*\n\n" +
                "⚠️ *Attention:* Risque d'amende si échec !"
            );
        }

        const target = m.quoted ? m.quoted.sender : m.mentions[0];
        if (target === m.sender) return await m.send("😂 *Vous ne pouvez pas vous voler vous-même !*");

        const result = await edb.rob(m.sender, k, target);
        
        if (result.cd) {
            return await m.send(
                `🚨 *TROP RÉCENT !*\n\n` +
                `Vous avez déjà tenté un vol récemment.\n\n` +
                `🕒 *Prochaine tentative dans:* ${result.cdL}\n` +
                `💡 *Conseil:* Attendez un peu pour éviter les soupçons.`
            );
        }

        if (result.lowbal) {
            return await m.send(
                "💸 *CIBLE TROP PAUVRE !*\n\n" +
                "Cette personne n'a pas assez d'argent pour valoir le risque.\n" +
                "Trouvez une cible plus riche !"
            );
        }

        if (result.success) {
            await m.send(
                `🎯 *VOL RÉUSSI !*\n\n` +
                `💰 *Butin volé:* ₹${result.amount.toLocaleString()}\n` +
                `👤 *Victime:* @${target.split("@")[0]}\n` +
                `😈 *Vous vous êtes échappé sans être vu !*\n\n` +
                `🏃‍♂️ *Fuyez avant que la police n'arrive !*`,
                {
                    title: "🎯 Vol Réussi",
                    body: `₹${result.amount.toLocaleString()} dérobés avec succès`,
                    thumbnail: fs.readFileSync(path.join(stored, 'robbery.png'))
                }, "ad"
            );
        } else {
            await edb.deduct(m.sender, k, result.fine);
            economyCache.delete(`balance_${m.sender}`);
            
            await m.send(
                `🚨 *VOL RATE !*\n\n` +
                `💸 *Amende payée:* ₹${result.fine.toLocaleString()}\n` +
                `👮 *Arrêté par la police !*\n` +
                `😢 *Plus de chance la prochaine fois...*\n\n` +
                `⚖️ *Le crime ne paie pas !*`,
                {
                    title: "🚨 Vol Raté",
                    body: `Amende de ₹${result.fine.toLocaleString()} payée`,
                    thumbnail: fs.readFileSync(path.join(stored, 'caught.png'))
                }, "ad"
            );
        }
        
    } catch (e) {
        await handleEconomyError(m, e, "rob");
    }
});

King({
    cmd: "gamble|bet|parier",
    desc: "Parier de l'argent au jeu",
    fromMe: wtype,
    type: "economy",
    react: "🎰"
}, async (m, text) => {
    try {
        if (!economyManager.isActive(m.chat)) {
            return await m.send("💎 *Économie non activée !*");
        }

        if (!text) {
            return await m.send(
                "🎰 *UTILISATION DU JEU*\n\n" +
                "*.gamble <montant>* - Parier un montant spécifique\n\n" +
                "*Exemples:*\n" +
                "• .gamble 500\n" +
                "• .gamble 1000\n\n" +
                "⚠️ *Attention:* Vous pouvez perdre votre mise !"
            );
        }

        const amount = parseInt(text);
        if (isNaN(amount) || amount <= 0) return await m.send("❌ *Montant de pari invalide !*");

        const userBal = await edb.balance(m.sender, k);
        if (userBal.wallet < amount) {
            return await m.send(
                "💸 *SOLDE INSUFFISANT !*\n\n" +
                `Vous avez seulement ₹${userBal.wallet.toLocaleString()} dans votre portefeuille.\n` +
                `Mise demandée: ₹${amount.toLocaleString()}`
            );
        }

        const win = Math.random() > 0.45; // 55% de chance de gagner pour rendre le jeu plus fun
        
        if (win) {
            const winAmount = Math.floor(amount * (0.8 + Math.random() * 0.6)); // Gain entre 80% et 140%
            await edb.give(m.sender, k, winAmount);
            economyCache.delete(`balance_${m.sender}`);
            
            await m.send(
                `🎰 *VOUS AVEZ GAGNÉ !* 🎉\n\n` +
                `💰 *Mise:* ₹${amount.toLocaleString()}\n` +
                `🎊 *Gains:* ₹${winAmount.toLocaleString()}\n` +
                `📈 *Profit:* ₹${(winAmount - amount).toLocaleString()}\n\n` +
                `✨ *La chance vous sourit aujourd'hui !*`,
                {
                    title: "🎰 Jackpot !",
                    body: `₹${winAmount.toLocaleString()} gagnés !`,
                    thumbnail: fs.readFileSync(path.join(stored, 'jackpot.png'))
                }, "ad"
            );
        } else {
            await edb.deduct(m.sender, k, amount);
            economyCache.delete(`balance_${m.sender}`);
            
            await m.send(
                `💸 *VOUS AVEZ PERDU...*\n\n` +
                `💰 *Mise perdue:* ₹${amount.toLocaleString()}\n` +
                `😢 *Meilleure chance la prochaine fois !*\n\n` +
                `💡 *Conseil:* Ne misez pas plus que vous ne pouvez perdre.`,
                {
                    title: "💸 Perte au Jeu",
                    body: `₹${amount.toLocaleString()} perdus`,
                    thumbnail: fs.readFileSync(path.join(stored, 'loss.png'))
                }, "ad"
            );
        }
        
    } catch (e) {
        await handleEconomyError(m, e, "gamble");
    }
});

// 🏆 CLASSEMENT ET BOUTIQUE

King({
    cmd: "lb|leaderboard|top|classement",
    desc: "Voir le classement des plus riches",
    fromMe: wtype,
    type: "economy",
    react: "🏆"
}, async (m, text) => {
    try {
        if (!economyManager.isActive(m.chat)) {
            return await m.send("💎 *Économie non activée !*");
        }

        const count = parseInt(text) || 10;
        const lb = await edb.lb(k, Math.min(count, 20));
        
        if (lb.length === 0) {
            return await m.send(
                "📊 *CLASSEMENT VIDE*\n\n" +
                "Aucun joueur n'a encore rejoint l'économie.\n" +
                "Soyez le premier à utiliser *.daily* !"
            );
        }

        let msg = "👑 *CLASSEMENT DES RICHES* 👑\n\n";
        
        for (let i = 0; i < lb.length; i++) {
            const pos = i + 1;
            const user = lb[i];
            const total = user.wallet + user.bank;
            const medal = pos === 1 ? "🥇" : pos === 2 ? "🥈" : pos === 3 ? "🥉" : `▫️`;
            const rank = pos <= 3 ? medal : `**${pos}.**`;
            
            msg += `${rank} *@${user.userID.split("@")[0]}* - ₹${total.toLocaleString()}\n`;
        }
        
        msg += `\n💰 *Total des joueurs:* ${lb.length}`;
        
        await m.send(msg, {
            title: "🏆 Classement Économique",
            body: `Top ${lb.length} joueurs les plus riches`,
            thumbnail: fs.readFileSync(path.join(stored, 'leaderboard.png'))
        }, "ad");
        
    } catch (e) {
        await handleEconomyError(m, e, "lb");
    }
});

King({
    cmd: "shop|boutique",
    desc: "Voir les objets disponibles en boutique",
    fromMe: wtype,
    type: "economy",
    react: "🛒"
}, async (m, text) => {
    try {
        if (!economyManager.isActive(m.chat)) {
            return await m.send("💎 *Économie non activée !*");
        }

        const shop = await edb.getShop();
        
        if (!shop || shop.length === 0) {
            return await m.send(
                "🛒 *BOUTIQUE VIDE*\n\n" +
                "Aucun objet n'est disponible pour le moment.\n" +
                "Revenez plus tard !"
            );
        }

        let msg = "🛒 *BOUTIQUE ROYALE* 🛒\n\n";
        
        shop.forEach((item, i) => {
            const number = (i + 1).toString().padStart(2, '0');
            msg += `**${number}. ${item.name}**\n`;
            msg += `   💰 *Prix:* ₹${item.price.toLocaleString()}\n`;
            msg += `   📝 *${item.description}*\n\n`;
        });
        
        msg += "💡 *Utilisez* .buy <numéro/nom> *pour acheter*";

        await m.send(msg, {
            title: "🛒 Boutique d'Objets",
            body: `${shop.length} objets disponibles`,
            thumbnail: fs.readFileSync(path.join(stored, 'shop.png'))
        }, "ad");
        
    } catch (e) {
        await handleEconomyError(m, e, "shop");
    }
});

King({
    cmd: "buy|acheter",
    desc: "Acheter un objet de la boutique",
    fromMe: wtype,
    type: "economy",
    react: "🛍️"
}, async (m, text) => {
    try {
        if (!economyManager.isActive(m.chat)) {
            return await m.send("💎 *Économie non activée !*");
        }

        if (!text) {
            return await m.send(
                "🛍️ *UTILISATION DE L'ACHAT*\n\n" +
                "*.buy <numéro>* - Acheter par numéro\n" +
                "*.buy <nom>* - Acheter par nom\n\n" +
                "*Exemples:*\n" +
                "• .buy 1\n" +
                "• .buy Épée Légendaire\n\n" +
                "💡 *Utilisez* .shop *pour voir les objets*"
            );
        }

        const result = await edb.buyItem(m.sender, k, text);
        
        if (result.notfound) {
            return await m.send(
                "❌ *OBJET INTROUVABLE !*\n\n" +
                "Cet objet n'existe pas dans la boutique.\n" +
                "Utilisez *.shop* pour voir les objets disponibles."
            );
        }
        
        if (result.insufficient) {
            return await m.send(
                "💸 *SOLDE INSUFFISANT !*\n\n" +
                `L'objet **${text}** coûte ₹${result.item?.price.toLocaleString()}\n` +
                "Travaillez plus pour économiser !"
            );
        }

        economyCache.delete(`balance_${m.sender}`);
        
        await m.send(
            `🛍️ *ACHAT RÉUSSI !*\n\n` +
            `🎁 *Objet acheté:* ${result.item.name}\n` +
            `💰 *Prix payé:* ₹${result.item.price.toLocaleString()}\n` +
            `💎 *Solde restant:* ₹${result.newBalance.toLocaleString()}\n\n` +
            `📦 *Utilisez* .inv *pour voir votre inventaire*`,
            {
                title: "🛍️ Achat Effectué",
                body: `${result.item.name} acheté avec succès`,
                thumbnail: fs.readFileSync(path.join(stored, 'purchase.png'))
            }, "ad"
        );
        
    } catch (e) {
        await handleEconomyError(m, e, "buy");
    }
});

King({
    cmd: "inv|inventory|inventaire",
    desc: "Voir votre inventaire d'objets",
    fromMe: wtype,
    type: "economy",
    react: "📦"
}, async (m, text) => {
    try {
        if (!economyManager.isActive(m.chat)) {
            return await m.send("💎 *Économie non activée !*");
        }

        const inv = await edb.getInventory(m.sender, k);
        
        if (inv.length === 0) {
            return await m.send(
                "📦 *INVENTAIRE VIDE*\n\n" +
                "Vous ne possédez aucun objet pour le moment.\n\n" +
                "🛒 *Visitez la boutique avec* .shop\n" +
                "💰 *Gagnez de l'argent avec* .work",
                {
                    title: "📦 Inventaire Vide",
                    body: "Achetez des objets dans la boutique",
                    thumbnail: fs.readFileSync(path.join(stored, 'empty.png'))
                }, "ad"
            );
        }

        let msg = "📦 *VOTRE INVENTAIRE* 📦\n\n";
        let totalValue = 0;
        
        inv.forEach((item, i) => {
            const itemValue = item.price * item.quantity;
            totalValue += itemValue;
            
            msg += `**${i + 1}. ${item.name}** x${item.quantity}\n`;
            msg += `   📝 ${item.description}\n`;
            msg += `   💰 Valeur: ₹${itemValue.toLocaleString()}\n\n`;
        });
        
        msg += `💰 *Valeur totale de l'inventaire:* ₹${totalValue.toLocaleString()}`;

        await m.send(msg, {
            title: "📦 Votre Inventaire",
            body: `${inv.length} objets possédés`,
            thumbnail: fs.readFileSync(path.join(stored, 'inventory.png'))
        }, "ad");
        
    } catch (e) {
        await handleEconomyError(m, e, "inv");
    }
});

// 🔧 FONCTIONS UTILITAIRES

function createProgressBar(current, max, length = 10) {
    const percentage = current / max;
    const filled = Math.round(length * percentage);
    const empty = length - filled;
    
    return '█'.repeat(filled) + '░'.repeat(empty) + ` ${Math.round(percentage * 100)}%`;
}

function getWealthStatus(wealth) {
    if (wealth >= 1000000) return "👑 EMPEREUR";
    if (wealth >= 500000) return "💎 MILLIONNAIRE";
    if (wealth >= 100000) return "💰 RICHE";
    if (wealth >= 50000) return "💼 CONFORTABLE";
    if (wealth >= 10000) return "📈 CROISSANT";
    if (wealth >= 5000) return "🌱 DÉBUTANT";
    return "🌱 NOUVEAU";
}

async function showEconomyHelp(m) {
    const helpMessage = `
👑 *KING ECONOMY UNIVERSE - AIDE COMPLÈTE* 👑

💰 **GESTION FINANCIÈRE**
• .bal - Voir votre solde
• .daily - Récompense quotidienne (24h)
• .work - Travailler pour gagner (cooldown)
• .dep <montant> - Déposer à la banque
• .with <montant> - Retirer de la banque

🎮 **JEUX & INTERACTIONS**
• .give @mention <montant> - Donner de l'argent
• .rob @mention - Tenter un vol (risqué)
• .gamble <montant> - Parier (55% de gain)

🏆 **CLASSEMENT & BOUTIQUE**
• .lb - Classement des plus riches
• .shop - Voir la boutique
• .buy <objet> - Acheter un objet
• .inv - Votre inventaire

⚙️ **ADMINISTRATION**
• .economy on/off - Activer/désactiver
• .economy help - Voir cette aide

💡 **CONSEILS:**
• Utilisez .daily tous les jours
• Déposez votre argent à la banque
• Évitez de trop parier
• Travaillez régulièrement

👑 *KING TEAM 2025 - Économie Royale !*
    `.trim();

    await m.send(helpMessage);
}

module.exports = {
    economyManager,
    handleEconomyError,
    getCachedData,
    setCachedData
};
