'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CategoriesSanggarsSchema extends Schema {
  up () {
    this.create('categories_sanggars', (table) => {
      table.increments()
      table.timestamps()
    })
  }

  down () {
    // this.drop('categories_sanggars')
  }
}

module.exports = CategoriesSanggarsSchema
