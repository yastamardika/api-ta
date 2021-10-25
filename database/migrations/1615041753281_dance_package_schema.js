'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DancePackageSchema extends Schema {
  up () {
    this.create('dance_packages', (table) => {
      table.increments()
      table.string('nama_tarian', 200)
      table.string('harga',200)
      table.string('durasi',200)
      table.text('deskripsi')
      table.string('foto',254)
      table.timestamps()
    })
  }

  down () {
    this.drop('dance_packages')
  }
}

module.exports = DancePackageSchema
