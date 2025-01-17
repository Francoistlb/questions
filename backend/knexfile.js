import path from 'path';  // Importation du module 'path' pour manipuler les chemins de fichiers.
import { fileURLToPath } from 'url';  // Importation de la fonction 'fileURLToPath' pour convertir une URL en chemin de fichier.

const __filename = fileURLToPath(import.meta.url);  // Obtention du chemin du fichier actuel à partir de l'URL du module.
const __dirname = path.dirname(__filename);  // Obtention du répertoire du fichier actuel en utilisant 'path.dirname'.

export default {  // Exportation par défaut d'un objet contenant la configuration pour l'environnement de développement.
  development: {  // Configuration spécifique à l'environnement de développement.
    client: 'better-sqlite3',  // Spécification du client de base de données utilisé, ici 'better-sqlite3'.
    connection: {  // Configuration de la connexion à la base de données.
      filename: path.join(__dirname, 'src/database.sqlite3'),  // Spécification du fichier de base de données SQLite, avec un chemin relatif à __dirname.
    },
    useNullAsDefault: true,  // Paramètre spécifique pour 'better-sqlite3' pour permettre l'utilisation de 'NULL' comme valeur par défaut.
    migrations: {  // Configuration des migrations de base de données.
      directory: path.join(__dirname, 'src/migrations')  // Dossier contenant les fichiers de migration, relatif à __dirname.
    },
    seeds: {  // Configuration des semences de base de données (données initiales).
      directory: path.join(__dirname, 'src/seeds')  // Dossier contenant les fichiers de semences, relatif à __dirname.
    }
  },
};
