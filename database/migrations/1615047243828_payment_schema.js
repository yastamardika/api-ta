'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PaymentSchema extends Schema {
  up () {
    this.create('payments', (table) => {
      table.increments()
      table.string('total_amount')
      table.string('payment_method')

      table.timestamps()
    })
  }

  down () {
    // this.drop('payments')
  }
}

module.exports = PaymentSchema
