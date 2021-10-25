"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class AccountSanggarSchema extends Schema {
  up() {
    this.create("account_sanggars", (table) => {
      table.increments();
      table.string("name");
      table.string("account_number");
      table.string("bank");
      table.string("alias_name");
      table
        .integer("sanggarId")
        .unsigned()
        .references("id")
        .inTable("sanggars");
      table.timestamps();
    })
    this.table("orders", (table) => {
      table.datetime("deleted_at");
    })
  }

  down() {
    // this.drop("account_sanggars");
  }
}

module.exports = AccountSanggarSchema;
