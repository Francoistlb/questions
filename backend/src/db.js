import knex from 'knex';  // Importation de la bibliothèque Knex, qui permet de construire des requêtes SQL de manière programmatique.
import config from '../knexfile.js';  // Importation du fichier de configuration Knex (qui contient la configuration de la base de données).

const db = knex(config.development);  // Création d'une instance de la base de données avec la configuration "development" provenant de "knexfile.js".

export default db;  // Exportation de l'instance de base de données pour pouvoir l'utiliser ailleurs dans le projet.
