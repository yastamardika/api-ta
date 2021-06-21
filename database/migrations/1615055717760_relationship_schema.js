"use strict";

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use("Schema");

class RelationshipSchema extends Schema {
  up() {
    this.table("tokens", (table) => {
      table.integer("user_id").unsigned().references("id").inTable("users");
    });


    this.table("dance_packages", (table) => {
      table
        .integer("sanggarId")
        .unsigned()
        .references("id")
        .inTable("sanggars");
    });
    this.table("categories_sanggars", (table) => {
      table
        .integer("sanggarId")
        .unsigned()
        .references("id")
        .inTable("sanggars");
      table
        .integer("categoryId")
        .unsigned()
        .references("id")
        .inTable("categories");
    });
    this.table("orders", (table) => {
      table
        .integer("packageId")
        .unsigned()
        .references("id")
        .inTable("dance_packages");
      table
        .integer("order_detailId")
        .unsigned()
        .references("id")
        .inTable("order_details");
      table.integer("userId").unsigned().references("id").inTable("users");
      table
        .integer("order_statusId")
        .unsigned()
        .references("id")
        .inTable("order_statuses");
    });
    this.table("feedbacks", (table) => {
      table.integer("orderId").unsigned().references("id").inTable("orders");
      table.integer("userId").unsigned().references("id").inTable("users");
    });
    this.table("feedbacks", (table) => {
      table
        .integer("detail_venuesId")
        .unsigned()
        .references("id")
        .inTable("detail_venues");
    });
     this.table("sanggars", (table) => {
      table.integer("partnerId").unsigned().references("id").inTable("users");
      table
        .integer("sanggar_addressId")
        .unsigned()
        .references("id")
        .inTable("address_sanggars");
    });
  }

  down() {
    this.table("sanggars", (table) => {
      // reverse alternations
    });
  }
}

module.exports = RelationshipSchema;
