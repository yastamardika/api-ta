'use strict'
const PaymentStatus =  use("App/Models/PaymentStatus");

/*
|--------------------------------------------------------------------------
| PaymentStatusSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
// const Factory = use('Factory')

class PaymentStatusSeeder {
  async run () {
    await PaymentStatus.create({
      name : "approved",
    });
    await PaymentStatus.create({
      name : "rejected",
    });
    await PaymentStatus.create({
      name : "processed",
    });
    await PaymentStatus.create({
      name : "completed",
    });
    await PaymentStatus.create({
      name : "failed",
    });
  }
}

module.exports = PaymentStatusSeeder
