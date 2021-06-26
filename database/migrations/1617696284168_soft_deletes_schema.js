'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class SoftDeletesSchema extends Schema {
  up () {
    this.table('sanggars', (table) => {
      table.datetime('deleted_at')
    })
    this.table('dance_packages', (table) => {
      table.datetime('deleted_at')
    })
  }

  down () {
    this.table('sanggars', (table) => {
      // reverse alternations
    })
  }
}

module.exports = SoftDeletesSchema
