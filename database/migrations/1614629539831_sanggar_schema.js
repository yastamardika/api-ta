'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SanggarSchema extends Schema {
  up () {
    this.create('sanggars', (table) => {
      table.increments()
      table.string('name',200)
      table.text('description')
      table.string('phone', 200)
      table.string('email',200)
      table.string('photo', 200)

      table.timestamps()
    })
  }

  down () {
    // this.drop('sanggars')
  }
}

module.exports = SanggarSchema
