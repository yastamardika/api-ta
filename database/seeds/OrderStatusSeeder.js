'use strict'
const OrderStatus =  use("App/Models/OrderStatus");

/*
|--------------------------------------------------------------------------
| OrderStatusSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
// const Factory = use('Factory')

class OrderStatusSeeder {
  async run () {
    await OrderStatus.create({
      name : "waiting for payment",
    });
      await OrderStatus.create({
      name : "paid",
    });
    await OrderStatus.create({
      name : "processed",
    });
    await OrderStatus.create({
      name : "completed",
    });
    await OrderStatus.create({
      name : "failed",
    });
    await OrderStatus.create({
      name : "rejected",
    });
  }
}

module.exports = OrderStatusSeeder
