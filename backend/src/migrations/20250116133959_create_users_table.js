export const up = function(knex) {
  return knex.schema.createTable('questions', table => {
    table.increments('id').primary();
    table.text('question').notNullable();
    table.text('reponse1').notNullable();
    table.text('reponse2').notNullable();
    table.text('reponse3').notNullable();
    table.text('reponse4').notNullable();
    table.integer('bonne_reponse').notNullable();
  });
};

export const down = function(knex) {
  return knex.schema.dropTable('questions');
};
