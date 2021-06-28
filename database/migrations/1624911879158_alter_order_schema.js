'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterOrderSchema extends Schema {
  up () {
    this.table('orders', (table) => {
      table.string('payment_url', 254).nullable()
      table.string('payment_token', 254).nullable()
    })
  }

  down () {
    this.table('orders', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AlterOrderSchema
