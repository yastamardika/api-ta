"use strict";
const User =  use("App/Models/User");
const Hash = use('Hash')
// import BaseSeeder from "@ioc:Adonis/Lucid/Seeder";
/*
|--------------------------------------------------------------------------
| UserSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
// const Factory = use('Factory')

class UserSeeder {
  async run() {
    // await User.create({
    //   username: "admin",
    //   email : "admin@i-tallenta.com",
    //   password: await Hash.make("masukaja"),
    //   account_status: "active",
    //   role: "admin",
    // });
  }
}

module.exports = UserSeeder;
