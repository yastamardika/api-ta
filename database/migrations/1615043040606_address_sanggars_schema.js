'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddressSanggarsSchema extends Schema {
  up () {
    this.create('address_sanggars', (table) => {
      table.increments()
      table.string('address')
      table.string('city')
      table.string('province')
      table.string('postal_code')
      table.string('google_map_link')
      table.timestamps()
    })
  }

  down () {
    // this.drop('address_sanggars')
  }
}

module.exports = AddressSanggarsSchema
