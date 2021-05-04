"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class AlterOrderSchema extends Schema {
  up() {
    this.table("orders", (table) => {
      table
        .integer("venueId")
        .unsigned()
        .references("id")
        .inTable("detail_venues");
      table
        .integer("sanggarId")
        .unsigned()
        .references("id")
        .inTable("sanggars");
    });
  }

  down() {
    this.table("orders", (table) => {
      // reverse alternations
    });
  }
}

module.exports = AlterOrderSchema;
