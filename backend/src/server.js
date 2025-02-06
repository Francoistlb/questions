import express from "express";  // Importation du framework Express pour créer un serveur HTTP.
import { createServer } from "http";  // Importation de la fonction pour créer un serveur HTTP natif.
import { Server } from "socket.io";  // Importation de la classe Server de Socket.IO pour la communication en temps réel.
import db from './db.js';  // Importation de la configuration de la base de données (probablement Knex pour interagir avec la base de données).
import cors from 'cors';  // Importation du middleware CORS pour gérer les requêtes inter-domaines.
import { randomUUID } from 'crypto'; // Pour générer des codes uniques

const app = express();  // Création d'une instance d'Express pour gérer les requêtes HTTP.
const httpServer = createServer(app);  // Création d'un serveur HTTP en passant l'application Express comme argument.
const io = new Server(httpServer, {  // Création d'un serveur Socket.IO en attachant le serveur HTTP pour gérer les connexions WebSocket.
  cors: {  // Configuration de CORS pour autoriser les requêtes provenant de "http://localhost:3000" (port du frontend).
    origin: "http://localhost:3000",  // Origine autorisée pour les requêtes CORS.
    methods: ["GET", "POST"]  // Méthodes HTTP autorisées pour les requêtes CORS.
  }
});

// Stockage des sessions de jeu
const gameSessions = new Map();

app.use(cors());  // Application du middleware CORS pour autoriser les requêtes inter-domaines.
app.use(express.json());  // Middleware pour analyser les requêtes HTTP avec un corps JSON.

function calculateScore(responseTime, isCorrect) {
  if (!isCorrect) return 0;
  
  if (responseTime <= 5) {
    return 10;
  } else if (responseTime <= 10) {
    return 5;
  } else {
    return 2;
  }
}

// Événements Socket.IO
io.on("connection", (socket) => {  // Lorsqu'un client se connecte via WebSocket, ce code est exécuté.
  console.log("Nouvelle connexion socket:", socket.id);

  // Créer une nouvelle session de jeu avec un code random de 6 caractères
  socket.on("createGame", (playerName) => {
    const gameCode = randomUUID().substring(0, 6).toUpperCase(); 
    const gameSession = {
      id: gameCode,
      host: socket.id,
      hostName: playerName,
      players: [{
        id: socket.id,
        name: playerName,
        score: 0
      }],
      currentQuestion: null,
      isStarted: false
    };

    gameSessions.set(gameCode, gameSession);
    socket.join(gameCode); // Rejoint la room Socket.IO

    socket.emit("gameCreated", {
      gameCode,
      players: gameSession.players
    });
  });

  // Rejoindre une session existante
  socket.on("joinGame", ({ gameCode, playerName }) => {
    const gameSession = gameSessions.get(gameCode);
    
    if (!gameSession) {
      socket.emit("error", "Session de jeu non trouvée");
      return;
    }

    if (gameSession.isStarted) {
      socket.emit("error", "La partie a déjà commencé");
      return;
    }

    const newPlayer = {
      id: socket.id,
      name: playerName,
      score: 0
    };

    gameSession.players.push(newPlayer);
    socket.join(gameCode);

    // Informer tous les joueurs de la session
    io.to(gameCode).emit("playerJoined", {
      players: gameSession.players
    });
  });

  // Démarrer la partie
  socket.on("startGame", async (gameCode) => {
    const gameSession = gameSessions.get(gameCode);
    
    if (!gameSession || gameSession.host !== socket.id) {
      socket.emit("error", "Non autorisé à démarrer la partie");
      return;
    }

    gameSession.isStarted = true;
    gameSession.questionCount = 1; // Initialiser le compteur
    await sendNewQuestion(gameCode);
  });

  // Fonction pour envoyer une nouvelle question
  async function sendNewQuestion(gameCode) {
    console.log("sendNewQuestion appelé pour:", gameCode);
    try {
      const question = await db('questions')
        .select('*')
        .orderByRaw('RANDOM()')
        .first();

      const gameSession = gameSessions.get(gameCode);
      if (!gameSession) {
        console.log("Pas de session trouvée pour:", gameCode);
        return;
      }

      gameSession.currentQuestion = question;
      console.log("Envoi question:", question?.id);
      
      // Envoyer la question avec le numéro de question actuel
      io.to(gameCode).emit("question", {
        ...question,
        questionNumber: gameSession.questionCount,
        totalQuestions: 10 // Nombre total de questions
      });
    } catch (error) {
      console.error("Erreur dans sendNewQuestion:", error);
      io.to(gameCode).emit("error", error.message);
    }
  }

  // Vérifier la réponse
  socket.on("checkAnswer", async ({ gameCode, questionId, reponseChoisie, responseTime }) => {
    try {
      const gameSession = gameSessions.get(gameCode);
      if (!gameSession) {
        socket.emit("error", "Session non trouvée");
        return;
      }

      // Ajouter un compteur de questions si non existant
      if (!gameSession.questionCount) {
        gameSession.questionCount = 1;
      }

      const player = gameSession.players.find(p => p.id === socket.id);
      if (!player) return;

      // Mise à jour du statut et du score du joueur
      player.hasAnswered = true;
      if (reponseChoisie === 0) {
        // Cas du timeout : pas de points
        player.score += 0;
      } else {
        // Cas d'une réponse normale : calcul des points
        const question = await db('questions')
          .select('bonne_reponse')
          .where('id', questionId)
          .first();
        const correct = question.bonne_reponse === reponseChoisie;
        const score = calculateScore(responseTime, correct);
        player.score += score;

        // Envoyer le résultat de la réponse individuelle
        io.to(gameCode).emit("answerResult", {
          playerId: socket.id,
          playerName: player.name,
          correct,
          score,
          message: `${correct ? "Bonne réponse" : "Mauvaise réponse"} !`,
          players: gameSession.players
        });
      }

      // Vérifier si c'est la dernière question
      if (gameSession.questionCount >= 10) {
        // Trier les joueurs par score
        const sortedPlayers = gameSession.players
          .sort((a, b) => b.score - a.score);

        // Envoyer le résultat final
        io.to(gameCode).emit("gameOver", {
          players: sortedPlayers,
          message: "Partie terminée !"
        });
        
        // // Optionnel : Supprimer la session
        // setTimeout(() => {
        //   gameSessions.delete(gameCode);
        // }, 5000);
        
        return;
      }

      // Si ce n'est pas la dernière question, continuer normalement
      const allPlayersAnswered = gameSession.players.every(p => p.hasAnswered);
      if (reponseChoisie === 0 || allPlayersAnswered) {
        gameSession.questionCount++; // Incrémenter le compteur
        
        // Récupérer une nouvelle question
        const newQuestion = await db('questions')
          .select('*')
          .orderByRaw('RANDOM()')
          .first();

        if (newQuestion) {
          gameSession.currentQuestion = newQuestion;
          gameSession.players.forEach(p => p.hasAnswered = false);

          setTimeout(() => {
            io.to(gameCode).emit("question", {
              ...newQuestion,
              questionNumber: gameSession.questionCount,
              totalQuestions: 10
            });
          }, 1500);
        }
      }

    } catch (error) {
      console.error("Erreur dans checkAnswer:", error);
      socket.emit("error", error.message);
    }
  });

  // Gérer la fin du timer
  socket.on("timeUp", async ({ gameCode }) => {
    console.log("TimeUp reçu pour la partie:", gameCode);
    try {
      const gameSession = gameSessions.get(gameCode);
      if (!gameSession) {
        console.log("Session non trouvée pour le code:", gameCode);
        return;
      }

      // Informer que le timeUp a été reçu
      io.to(gameCode).emit("questionTimeUp");
      console.log("Envoi questionTimeUp à la room:", gameCode);

      // Envoyer une nouvelle question après le délai
      console.log("Préparation de l'envoi de la nouvelle question...");
      setTimeout(async () => {
        try {
          const question = await db('questions')
            .select('*')
            .orderByRaw('RANDOM()')
            .first();

          console.log("Nouvelle question trouvée:", question?.id);
          
          if (!question) {
            throw new Error("Aucune question trouvée dans la base de données");
          }

          gameSession.currentQuestion = question;
          console.log("Envoi de la nouvelle question à la room:", gameCode);
          io.to(gameCode).emit("question", question);
        } catch (error) {
          console.error("Erreur lors de l'envoi de la nouvelle question:", error);
          io.to(gameCode).emit("error", "Erreur lors de l'envoi de la nouvelle question");
        }
      }, 1500);

    } catch (error) {
      console.error("Erreur dans le gestionnaire timeUp:", error);
      socket.emit("error", error.message);
    }
  });

  // Gérer la déconnexion
  socket.on("disconnect", () => {
    // Nettoyer les sessions où le joueur était présent
    gameSessions.forEach((session, code) => {
      const playerIndex = session.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        session.players.splice(playerIndex, 1);
        
        // Si c'était l'hôte, terminer la session
        if (session.host === socket.id) {
          io.to(code).emit("gameEnded", "L'hôte s'est déconnecté");
          gameSessions.delete(code);
        } else {
          // Informer les autres joueurs
          io.to(code).emit("playerLeft", {
            players: session.players
          });
        }
      }
    });
  });
});

const port = 3001;  // Définition du port du serveur (port 3001 pour éviter le conflit avec le frontend sur le port 3000).
httpServer.listen(port, () => {  // Démarrage du serveur HTTP sur le port 3001.
  console.log(`Server running at http://localhost:${port}`);  // Message de confirmation que le serveur est en cours d'exécution.
});
