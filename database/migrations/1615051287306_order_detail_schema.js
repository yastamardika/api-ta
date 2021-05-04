'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class OrderDetailSchema extends Schema {
  up () {
    this.create('order_details', (table) => {
      table.increments()
      table.string('name')
      table.string('phone')
      table.string('email')
      table.string('address')
      table.timestamps()
    })
  }

  down () {
    this.drop('order_details')
  }
}

module.exports = OrderDetailSchema
