'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DetailVenueSchema extends Schema {
  up () {
    this.create('detail_venues', (table) => {
      table.increments()
      table.string('address')
      table.string('location')
      table.string('city')
      table.string('province')
      table.string('time')
      table.timestamps()
    })
  }

  down () {
    this.drop('detail_venues')
  }
}

module.exports = DetailVenueSchema
