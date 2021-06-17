'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AlterUserAndSanggarSchema extends Schema {
  up () {
    this.table('users', (table) => {
      table.string('profile_photo', 254).nullable()
    })
    this.table('sanggars', (table) => {
      table.string('youtube_video_profile', 254).nullable()
    })
  }

  down () {
    this.table('users', (table) => {
      // reverse alternations
    })
  }
}

module.exports = AlterUserAndSanggarSchema
