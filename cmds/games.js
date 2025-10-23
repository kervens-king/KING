/* 
 * 👑 KING GAMES UNIVERSE 2025
 * Module Jeux Royal par Kervens
 * Sous licence GNU GPLv3
 * -------------------------------------------------------------------------------
 */

const { King, isAdmin, prefix, TicTacToe, WCG, wtype } = require("../core");

// 🔹 Cache pour optimiser les performances
const gamesCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// 🔹 Gestionnaire d'erreur amélioré
async function handleGameError(m, error, commandName) {
    console.error(`[GAME ERROR] ${commandName}:`, error);
    
    const errorMessages = [
        "🎮 *La partie a rencontré un problème...* Réessayez !",
        "⚡ *Problème de jeu...* Nouvelle tentative ?",
        "💫 *Erreur de gameplay...* Patientez un instant !",
        "🔧 *Bug technique...* Redémarrez la partie !"
    ];
    
    const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
    await m.send(`${randomError}\n\n_Erreur: ${error.message}_`);
}

// 🔹 Fonctions utilitaires de cache
function getCachedData(key) {
    const cached = gamesCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCachedData(key, data) {
    gamesCache.set(key, { data, timestamp: Date.now() });
}

// 🎯 SYSTÈME TIC-TAC-TOE AMÉLIORÉ

King({
    cmd: "ttt|morpion",
    desc: "Jouer au Tic-Tac-Toe (Morpion) avec d'autres joueurs",
    fromMe: wtype,
    type: "game",
    react: "❌"
}, async (m, text) => {
    try {
        global.tictactoe = global.tictactoe || {};
        
        // Vérifier si le joueur est déjà dans une partie
        let activeGame = Object.values(global.tictactoe).find(room => 
            room.id.startsWith("tictactoe") && 
            [room.game.playerX, room.game.playerO].includes(m.sender)
        );
        
        if (activeGame) {
            return await m.send(
                "🎮 *VOUS ÊTES DÉJÀ EN JEU !*\n\n" +
                "Vous participez déjà à une partie de Tic-Tac-Toe.\n\n" +
                "💡 *Conseil:* Terminez votre partie actuelle avant d'en commencer une nouvelle."
            );
        }

        // Rechercher une salle d'attente
        let room = Object.values(global.tictactoe).find(room => 
            room.state === "WAITING" && (text ? room.name === text : true)
        );

        if (room) {
            // Rejoindre une salle existante
            room.o = m.chat;
            room.game.playerO = m.mentionedJid[0] || m.sender;
            room.state = "PLAYING";
            
            const board = room.game.render().map(v => ({
                X: "❌", O: "⭕", 1: "1️⃣", 2: "2️⃣", 3: "3️⃣", 4: "4️⃣", 5: "5️⃣", 6: "6️⃣", 7: "7️⃣", 8: "8️⃣", 9: "9️⃣"
            }[v]));
            
            const gameMessage = 
                "🎮 *PARTIE DE MORPION COMMENCÉE !* 🎮\n\n" +
                "📊 *Grille de jeu:*\n" +
                `${board.slice(0,3).join("")}\n` +
                `${board.slice(3,6).join("")}\n` +
                `${board.slice(6).join("")}\n\n` +
                `🎯 *Tour actuel:* @${room.game.currentTurn.split("@")[0]}\n\n` +
                "👥 *Joueurs:*\n" +
                `❌ @${room.game.playerX.split("@")[0]}\n` +
                `⭕ @${room.game.playerO.split("@")[0]}\n\n` +
                "📖 *Comment jouer:*\n" +
                "Tapez un chiffre de 1 à 9 pour placer votre symbole\n\n" +
                "🛑 *Abandonner:*\n" +
                'Tapez "abandon" ou "surrender"';

            const mentions = [room.game.playerX, room.game.playerO, room.game.currentTurn];
            await m.send(gameMessage, { mentions, quoted: m });
            
        } else {
            // Créer une nouvelle salle
            room = {
                id: "tictactoe-" + Date.now(),
                x: m.chat,
                o: "",
                game: new TicTacToe(m.sender, "o"),
                state: "WAITING",
                createdAt: Date.now()
            };
            
            if (text) room.name = text;

            const waitMessage = 
                "🎮 *SALLE DE MORPION CRÉÉE !* 🎮\n\n" +
                `👤 *Joueur 1:* @${m.sender.split("@")[0]} ❌\n\n` +
                "⏳ *En attente du Joueur 2...*\n\n" +
                "🎯 *Comment rejoindre:*\n" +
                `• Tapez \`${prefix}ttt\` pour rejoindre\n` +
                `• Répondez "rejoindre" à ce message\n` +
                `• Mentionnez quelqu'un pour l'inviter\n\n` +
                "⏱️ *La salle expire dans 5 minutes*";

            await m.send(waitMessage, { mentions: [m.sender] });
            global.tictactoe[room.id] = room;

            // Nettoyage automatique après 5 minutes
            setTimeout(() => {
                if (global.tictactoe[room.id] && global.tictactoe[room.id].state === "WAITING") {
                    delete global.tictactoe[room.id];
                }
            }, 5 * 60 * 1000);
        }
        
    } catch (e) {
        await handleGameError(m, e, "ttt");
    }
});

King({
    cmd: "delttt|stoppermorpion",
    desc: "Supprimer une partie de Tic-Tac-Toe en cours",
    fromMe: wtype,
    type: "game",
    react: "🗑️"
}, async (m) => {
    try {
        global.tictactoe = global.tictactoe || {};
        
        const game = Object.values(global.tictactoe).find(room => 
            room.id.startsWith("tictactoe") && 
            room.x === m.chat
        );

        if (!game) {
            return await m.send(
                "❌ *AUCUNE PARTIE ACTIVE*\n\n" +
                "Aucune partie de Tic-Tac-Toe n'est en cours dans ce chat."
            );
        }

        // Vérifier les permissions
        const isParticipant = [game.game.playerX, game.game.playerO].includes(m.sender);
        const isChatAdmin = await isAdmin(m);
        
        if (!isParticipant && !isChatAdmin) {
            return await m.send(
                "🚫 *PERMISSION REFUSÉE*\n\n" +
                "Seuls les participants ou les administrateurs peuvent supprimer la partie."
            );
        }

        delete global.tictactoe[game.id];
        
        await m.send(
            "🗑️ *PARTIE SUPPRIMÉE*\n\n" +
            "La partie de Tic-Tac-Toe a été supprimée avec succès.\n\n" +
            "🎮 *Nouvelle partie:*\n" +
            `Tapez \`${prefix}ttt\` pour recommencer`
        );
        
    } catch (e) {
        await handleGameError(m, e, "delttt");
    }
});

// 🔄 GESTIONNAIRE DE MESSAGES POUR TIC-TAC-TOE
King({
    on: "text",
    fromMe: wtype
}, async (m, text) => {
    try {
        global.tictactoe = global.tictactoe || {};
        
        // Rejoindre une salle d'attente
        let waitingRoom = Object.values(global.tictactoe).find(room => 
            room.state === "WAITING" && room.x === m.chat
        );
        
        if (waitingRoom && text.toLowerCase() === "rejoindre" && m.sender !== waitingRoom.game.playerX) {
            waitingRoom.o = m.chat;
            waitingRoom.game.playerO = m.sender;
            waitingRoom.state = "PLAYING";
            
            const board = waitingRoom.game.render().map(v => ({
                X: "❌", O: "⭕", 1: "1️⃣", 2: "2️⃣", 3: "3️⃣", 4: "4️⃣", 5: "5️⃣", 6: "6️⃣", 7: "7️⃣", 8: "8️⃣", 9: "9️⃣"
            }[v]));
            
            const gameMessage = 
                "🎮 *PARTIE DE MORPION COMMENCÉE !* 🎮\n\n" +
                "📊 *Grille de jeu:*\n" +
                `${board.slice(0,3).join("")}\n` +
                `${board.slice(3,6).join("")}\n` +
                `${board.slice(6).join("")}\n\n` +
                `🎯 *Tour actuel:* @${waitingRoom.game.currentTurn.split("@")[0]}\n\n` +
                "👥 *Joueurs:*\n" +
                `❌ @${waitingRoom.game.playerX.split("@")[0]}\n` +
                `⭕ @${waitingRoom.game.playerO.split("@")[0]}\n\n` +
                "📖 *Comment jouer:*\n" +
                "Tapez un chiffre de 1 à 9 pour placer votre symbole";

            const mentions = [waitingRoom.game.playerX, waitingRoom.game.playerO, waitingRoom.game.currentTurn];
            await m.send(gameMessage, { mentions });
            return;
        }
        
        // Gestion du gameplay
        let room = Object.values(global.tictactoe).find(room =>
            room.id && room.game && room.state &&
            room.id.startsWith("tictactoe") &&
            [room.game.playerX, room.game.playerO].includes(m.sender) &&
            room.state === "PLAYING"
        );
        
        if (!room) return;

        const input = text.toLowerCase();
        
        // Validation de l'entrée
        if (!/^([1-9]|abandon|surrender|stop)$/i.test(input)) return;
        
        const isSurrender = !/^[1-9]$/.test(input);
        
        // Vérifier que c'est le tour du joueur
        if (m.sender !== room.game.currentTurn && !isSurrender) return;
        
        let result;
        if (!isSurrender) {
            result = room.game.turn(m.sender === room.game.playerO, parseInt(input) - 1);
            
            if (result < 1) {
                const errorMessages = {
                    "-3": "❌ La partie est terminée",
                    "-2": "❌ Action invalide",
                    "-1": "❌ Position invalide",
                    "0": "❌ Position invalide"
                };
                return await m.send(errorMessages[result] || "❌ Erreur inconnue");
            }
        }

        const isWin = m.sender === room.game.winner;
        const isTie = room.game.board === 511;
        
        if (isSurrender) {
            room.game._currentTurn = m.sender === room.game.playerX;
            isWin = true;
        }

        const board = room.game.render().map(v => ({
            X: "❌", O: "⭕", 1: "1️⃣", 2: "2️⃣", 3: "3️⃣", 4: "4️⃣", 5: "5️⃣", 6: "6️⃣", 7: "7️⃣", 8: "8️⃣", 9: "9️⃣"
        }[v]));

        const winner = isSurrender ? room.game.currentTurn : room.game.winner;
        
        let gameStatus;
        if (isWin) {
            gameStatus = `🎉 @${winner.split("@")[0]} A GAGNÉ ! 🎉`;
        } else if (isTie) {
            gameStatus = "🤝 MATCH NUL !";
        } else {
            gameStatus = `🎯 *Tour actuel:* ${["❌", "⭕"][1 * room.game._currentTurn]} @${room.game.currentTurn.split("@")[0]}`;
        }

        const gameMessage = 
            `🎮 *MORPION - ${room.id}*\n\n` +
            `📊 *Grille:*\n` +
            `${board.slice(0,3).join("")}\n` +
            `${board.slice(3,6).join("")}\n` +
            `${board.slice(6).join("")}\n\n` +
            `${gameStatus}\n\n` +
            `👥 *Joueurs:*\n` +
            `❌ @${room.game.playerX.split("@")[0]}\n` +
            `⭕ @${room.game.playerO.split("@")[0]}`;

        const mentions = [room.game.playerX, room.game.playerO, winner || room.game.currentTurn];
        await m.send(gameMessage, { mentions, quoted: m });

        // Nettoyer la partie si elle est terminée
        if (isWin || isTie) {
            delete global.tictactoe[room.id];
        }
        
    } catch (e) {
        console.error("Erreur gameplay Tic-Tac-Toe:", e);
    }
});

// 🔤 SYSTÈME WORD CHAIN GAME AMÉLIORÉ

const wordChainGames = {};
let validWords = new Set();
const messageProcessed = new Set();

class WordChainGame {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
        this.previousWord = '';
        this.wordChain = '';
        this.wordsCount = 0;
        this.wordLength = 3;
        this.maxWordLength = 10;
        this.wordLengthIncrement = 3;
        this.longestWordBy = 'Aucun mot le plus long pour le moment';
        this.gameStatus = false;
        this.waitingForPlayers = false;
        this.botPlayer = false;
        this.wrongAttempts = {};
        this.maxAttempts = 5;
        this.turnTimeLimit = 45;
        this.turnStartTime = 0;
        this.currentRemTime = 45;
        this.turnIntervalId = null;
        this.waitingTimeoutId = null;
        this.validWords = validWords;
        this.processingTurn = false;
        this.gameEnded = false;
        this.finalWarningShown = false;
        this.createdAt = Date.now();
    }

    get currentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    stopTurn() {
        if (this.turnIntervalId) {
            clearInterval(this.turnIntervalId);
            this.turnIntervalId = null;
        }
        if (this.waitingTimeoutId) {
            clearTimeout(this.waitingTimeoutId);
            this.waitingTimeoutId = null;
        }
    }

    async wait(seconds) {
        await new Promise(r => setTimeout(r, seconds * 1000));
        this.botPlayer = false;
    }

    getRandomLetter() {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        return alphabet[Math.floor(Math.random() * alphabet.length)];
    }

    async startWaitingTimer(m) {
        this.waitingTimeoutId = setTimeout(async () => {
            if (this.gameEnded) return;
            if (this.players.length >= 2) {
                await this.startGame(m);
            } else {
                await m.send(
                    "❌ *PARTIE ANNULÉE*\n\n" +
                    "Pas assez de joueurs pour commencer la partie.\n\n" +
                    "👥 *Minimum requis:* 2 joueurs\n" +
                    `💡 *Nouvelle partie:* \`${prefix}wcg\``
                );
                this.gameEnded = true;
                delete wordChainGames[m.chat];
            }
        }, 30000);
    }

    async startGame(m) {
        if (this.gameEnded) return;
        this.stopTurn();
        this.gameStatus = true;
        this.waitingForPlayers = false;
        this.botPlayer = true;
        this.turnStartTime = Date.now();
        this.finalWarningShown = false;
        
        this.players.forEach(player => {
            this.wrongAttempts[player] = 0;
        });
        
        this.previousWord = this.getRandomLetter();
        this.wordChain = this.previousWord;
        this.currentPlayerIndex = 0;
        this.turnTimeLimit = Math.floor(Math.random() * 21) + 30;
        
        const playerList = this.players.map((p, i) => `${i + 1}. @${p.split('@')[0]}`).join('\n');
        
        await m.send(
            "🚀 *CHAÎNE DE MOTS - PARTIE COMMENCÉE !* 🚀\n\n" +
            `👥 *Joueurs (${this.players.length}):*\n${playerList}\n\n` +
            `🎯 *Tour actuel:* @${this.currentPlayer.split('@')[0]}\n\n` +
            `📝 *Commencez par:* "${this.previousWord}"\n` +
            `📏 *Longueur minimum:* ${this.wordLength} lettres\n` +
            `⏱️ *Temps par tour:* ${this.turnTimeLimit}s\n\n` +
            "📜 *Règles du jeu:*\n" +
            `• Longueur augmente tous les ${this.wordLengthIncrement} mots\n` +
            `• Maximum ${this.maxAttempts} erreurs par joueur\n` +
            `• Doit commencer par la dernière lettre du mot précédent\n` +
            `• Uniquement des mots uniques autorisés\n\n` +
            "_Que la bataille des mots commence !_",
            { mentions: this.players }
        );
        
        this.startTurn(m);
        await this.wait(2);
    }

    async startTurn(m) {
        if (this.gameEnded) return;
        this.finalWarningShown = false;
        
        this.turnIntervalId = setInterval(async () => {
            if (this.gameEnded) {
                this.stopTurn();
                return;
            }
            
            const elapsed = Math.floor((Date.now() - this.turnStartTime) / 1000);
            this.currentRemTime = this.turnTimeLimit - elapsed;

            if (this.currentRemTime <= 0 && this.gameStatus && !this.processingTurn) {
                await this.handleTimeOut(m);
            } else if (this.currentRemTime === 10 && this.gameStatus && !this.processingTurn && !this.finalWarningShown) {
                await this.handleFinalWarning(m);
            }
        }, 1000);
    }

    async handleTimeOut(m) {
        this.processingTurn = true;
        this.botPlayer = true;
        
        if (this.players.length >= 2) {
            await m.send(
                `⏰ *TEMPS ÉCOULÉ !*\n\n` +
                `@${this.currentPlayer.split('@')[0]} a dépassé le temps imparti...\n\n` +
                "*La partie continue avec les joueurs restants*",
                { mentions: [this.currentPlayer] }
            );
            
            this.players.splice(this.currentPlayerIndex, 1);
            if (this.currentPlayerIndex >= this.players.length) {
                this.currentPlayerIndex = 0;
            }
            
            if (this.players.length === 1) {
                await this.endGameWithWinner(m);
            } else {
                await this.continueGame(m);
            }
        } else {
            await this.terminateGame(m);
        }
    }

    async handleFinalWarning(m) {
        this.finalWarningShown = true;
        this.botPlayer = true;
        
        if (this.players.length >= 2) {
            await m.send(
                `⚠️ *DERNIER AVERTISSEMENT !*\n\n` +
                `@${this.currentPlayer.split('@')[0]} - *10 secondes restantes !*\n\n` +
                `📝 *Commencez par:* "${this.previousWord.slice(-1)}"\n` +
                `📏 *Longueur minimum:* ${this.wordLength} lettres`,
                { mentions: [this.currentPlayer] }
            );
        }
        await this.wait(1);
    }

    async endGameWithWinner(m) {
        await m.send(
            `🎉 *PARTIE TERMINÉE !*\n\n` +
            `🏆 *Vainqueur:* @${this.players[0].split('@')[0]}\n\n` +
            `📊 *Statistiques finales:*\n` +
            `• Total des mots: ${this.wordsCount}\n` +
            `• ${this.longestWordBy}\n` +
            `• Erreurs: ${this.wrongAttempts[this.players[0]] || 0}\n\n` +
            `🔗 *Chaîne finale:* ${this.wordChain}`,
            { mentions: [this.players[0]] }
        );
        
        this.gameEnded = true;
        this.stopTurn();
        delete wordChainGames[m.chat];
    }

    async continueGame(m) {
        this.turnTimeLimit = Math.floor(Math.random() * 21) + 30;
        this.turnStartTime = Date.now();
        this.processingTurn = false;
        
        await m.send(
            `🎯 *TOUR SUIVANT !*\n\n` +
            `@${this.currentPlayer.split('@')[0]} - à votre tour !\n\n` +
            `📝 *Commencez par:* "${this.previousWord.slice(-1)}"\n` +
            `📏 *Longueur minimum:* ${this.wordLength} lettres\n` +
            `⏱️ *Temps limite:* ${this.turnTimeLimit}s\n\n` +
            "*La partie continue !*",
            { mentions: [this.currentPlayer] }
        );
        
        this.startTurn(m);
    }

    async terminateGame(m) {
        await m.send(
            "❌ *PARTIE INTERROMPUE*\n\n" +
            "Tous les joueurs étaient inactifs"
        );
        this.gameEnded = true;
        this.stopTurn();
        delete wordChainGames[m.chat];
    }
}

// 🎯 COMMANDES PRINCIPALES WCG

King({
    cmd: 'wcg|wordchain|chainemots',
    desc: 'Démarrer une partie de Chaîne de Mots',
    fromMe: wtype,
    type: 'game',
    react: "🔤"
}, async (m, text) => {
    try {
        if (m.isBot) return;
        
        const chat = m.chat;
        let game = wordChainGames[chat];

        // Gestion de la fin de partie
        if (text && text.toLowerCase().startsWith('end') && game) {
            game.gameEnded = true;
            game.stopTurn();
            delete wordChainGames[chat];
            return await m.send(
                "🛑 *PARTIE TERMINÉE*\n\n" +
                "La partie de Chaîne de Mots a été arrêtée avec succès.\n\n" +
                "_À bientôt pour une nouvelle partie !_"
            );
        }

        // Démarrer une partie en attente
        if (text && text.toLowerCase().startsWith('start') && game && game.waitingForPlayers) {
            if (game.players.length < 2) {
                return await m.send(
                    "❌ *PAS ASSEZ DE JOUEURS*\n\n" +
                    "Au moins 2 joueurs sont nécessaires pour commencer la partie."
                );
            }
            return await game.startGame(m);
        }

        // Vérifier si une partie est déjà en cours
        if (game && game.gameStatus) {
            return await m.send(
                "⚠️ *PARTIE DÉJÀ EN COURS*\n\n" +
                "Une partie de Chaîne de Mots est déjà en cours dans ce chat.\n\n" +
                `🛑 *Arrêter:* \`${prefix}wcg end\``
            );
        }

        const opponent = m.quoted ? m.quoted.sender : m.mentionedJid ? m.mentionedJid[0] : false;

        // Initialiser une nouvelle partie
        if (!game) {
            await initWords();
            game = new WordChainGame();
            wordChainGames[chat] = game;
        }

        // Ajouter le joueur actuel
        if (!game.players.includes(m.sender)) {
            if (game.players.length >= 5) {
                return await m.send(
                    "🚫 *SALLE PLEINE*\n\n" +
                    "Maximum 5 joueurs autorisés par partie."
                );
            }
            
            game.players.push(m.sender);
            
            // Ajouter l'opposant mentionné
            if (opponent && opponent !== m.sender && !game.players.includes(opponent)) {
                if (game.players.length >= 5) {
                    return await m.send(
                        "🚫 *SALLE PLEINE*\n\n" +
                        "Maximum 5 joueurs autorisés par partie."
                    );
                }
                game.players.push(opponent);
            }
        }

        // Gérer l'attente des joueurs
        if (game.players.length === 1) {
            game.waitingForPlayers = true;
            game.startWaitingTimer(m);
            return await m.send(
                "🎮 *CHAÎNE DE MOTS*\n\n" +
                `👤 *Joueur:* @${game.players[0].split('@')[0]}\n\n` +
                "⏳ *En attente de plus de joueurs...*\n\n" +
                "🎯 *Comment rejoindre:*\n" +
                `• Tapez \`${prefix}wcg\` ou \"rejoindre\"\n` +
                `• Maximum 5 joueurs\n\n` +
                "🚀 *Commencer:*\n" +
                `\`${prefix}wcg start\` pour lancer avec les joueurs actuels\n\n` +
                "⏱️ *Démarrage automatique dans 30 secondes* avec 2+ joueurs",
                { mentions: game.players }
            );
        } else {
            const playerList = game.players.map((p, i) => `${i + 1}. @${p.split('@')[0]}`).join('\n');
            
            if (game.waitingForPlayers) {
                return await m.send(
                    "🎮 *JOUEURS MIS À JOUR*\n\n" +
                    `👥 *Joueurs actuels (${game.players.length}/5):*\n${playerList}\n\n` +
                    "🎯 Tapez \"" + "rejoindre\" ou \"" + `${prefix}wcg\" pour participer\n` +
                    "🚀 Tapez \"" + `${prefix}wcg start\" pour commencer\n` +
                    "⏱️ *Démarrage automatique bientôt*",
                    { mentions: game.players }
                );
            } else {
                return await game.startGame(m);
            }
        }
    } catch (e) {
        await handleGameError(m, e, "wcg");
    }
});

King({
    cmd: 'delwcg|stopwcg',
    desc: 'Supprimer une partie de Chaîne de Mots en cours',
    fromMe: wtype,
    type: 'game',
    react: "🗑️"
}, async (m) => {
    try {
        if (m.isBot) return;
        
        const chat = m.chat;
        const game = wordChainGames[chat];
        const isOwner = m.isCreator || await isAdmin(m) || (game && game.players.includes(m.sender));

        if (!game) {
            return await m.send(
                "❌ *AUCUNE PARTIE ACTIVE*\n\n" +
                "Aucune partie de Chaîne de Mots n'est en cours dans ce chat."
            );
        }

        if (!isOwner) {
            return await m.send(
                "🚫 *ACCÈS REFUSÉ*\n\n" +
                "Seuls les participants ou les administrateurs peuvent supprimer la partie."
            );
        }

        game.gameEnded = true;
        game.stopTurn();
        delete wordChainGames[chat];

        return await m.send(
            "🗑️ *PARTIE SUPPRIMÉE*\n\n" +
            `*Salle:* wcg-${chat.split('@')[0]}\n\n` +
            (game.wordsCount ? 
                `📊 *Statistiques finales:*\n` +
                `• Total des mots: ${game.wordsCount}\n` +
                `• ${game.longestWordBy}\n` +
                `• Chaîne: ${game.wordChain}` 
                : '')
        );
    } catch (e) {
        await handleGameError(m, e, "delwcg");
    }
});

// 🆘 COMMANDE D'AIDE JEUX

King({
    cmd: "games|jeux",
    desc: "Aide complète pour les jeux disponibles",
    fromMe: wtype,
    type: "game",
    react: "🎮"
}, async (m) => {
    const helpMessage = `
👑 *KING GAMES UNIVERSE - AIDE COMPLÈTE* 👑

🎯 **TIC-TAC-TOE (MORPION)**
• .ttt - Créer/rejoindre une partie
• .delttt - Supprimer une partie en cours
• "rejoindre" - Rejoindre une salle d'attente
• 1-9 - Placer son symbole

🔤 **CHAÎNE DE MOTS**
• .wcg - Démarrer/joindre une partie
• .delwcg - Supprimer une partie
• .wcg start - Forcer le démarrage
• .wcg end - Terminer la partie

🎮 **COMMANDES DE JEU:**
• "abandon" - Abandonner une partie
• "rejoindre" - Rejoindre une partie en attente

💡 **CONSEILS:**
• Les parties expirent après 5 minutes d'inactivité
• Maximum 5 joueurs pour la Chaîne de Mots
• Le temps est limité pour chaque tour

👑 *KING TEAM 2025 - Divertissement royal !*
    `.trim();

    await m.send(helpMessage);
});

module.exports = {
    handleGameError,
    getCachedData,
    setCachedData
};
