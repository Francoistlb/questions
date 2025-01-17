export const seed = async function(knex) {
  // Supprime toutes les entrées existantes
  await knex('questions').del()
  
  // Insère les questions
  await knex('questions').insert([
    {
      question: "En quelle année a débuté la Révolution française ?",
      reponse1: "1789",
      reponse2: "1790",
      reponse3: "1788",
      reponse4: "1791",
      bonne_reponse: 1
    },
    {
      question: "Qui était le premier empereur romain ?",
      reponse1: "Jules César",
      reponse2: "Auguste",
      reponse3: "Néron",
      reponse4: "Caligula",
      bonne_reponse: 2
    },
    {
      question: "Quelle bataille marque la fin de Napoléon Bonaparte ?",
      reponse1: "Austerlitz",
      reponse2: "Trafalgar",
      reponse3: "Waterloo",
      reponse4: "Wagram",
      bonne_reponse: 3
    },
    {
      question: "En quelle année Christophe Colomb a-t-il découvert l'Amérique ?",
      reponse1: "1492",
      reponse2: "1498",
      reponse3: "1485",
      reponse4: "1500",
      bonne_reponse: 1
    },
    {
      question: "Qui était le roi de France surnommé le Roi-Soleil ?",
      reponse1: "Louis XV",
      reponse2: "Louis XIV",
      reponse3: "Louis XVI",
      reponse4: "Louis XIII",
      bonne_reponse: 2
    },
    {
      question: "Quel traité a mis fin à la Première Guerre mondiale ?",
      reponse1: "Traité de Vienne",
      reponse2: "Traité de Rome",
      reponse3: "Traité de Versailles",
      reponse4: "Traité de Paris",
      bonne_reponse: 3
    },
    {
      question: "En quelle année le mur de Berlin est-il tombé ?",
      reponse1: "1991",
      reponse2: "1989",
      reponse3: "1988",
      reponse4: "1990",
      bonne_reponse: 2
    },
    {
      question: "Qui était le pharaon le plus célèbre de l'Égypte antique ?",
      reponse1: "Toutânkhamon",
      reponse2: "Ramsès II",
      reponse3: "Cléopâtre",
      reponse4: "Akhenaton",
      bonne_reponse: 2
    },
    {
      question: "Quel événement a déclenché la Première Guerre mondiale ?",
      reponse1: "La crise économique",
      reponse2: "L'invasion de la Pologne",
      reponse3: "L'assassinat de François-Ferdinand",
      reponse4: "La révolution russe",
      bonne_reponse: 3
    },
    {
      question: "Qui a été le premier président de la Ve République française ?",
      reponse1: "François Mitterrand",
      reponse2: "Vincent Auriol",
      reponse3: "Charles de Gaulle",
      reponse4: "Georges Pompidou",
      bonne_reponse: 3
    }
  ]);
}; 