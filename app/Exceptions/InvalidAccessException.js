'use strict'

const { LogicalException } = require('@adonisjs/generic-exceptions')

class InvalidAccessException extends LogicalException {
  /**
   * Handle this exception by itself
   */
  handle (error, { response }) {
    response.status(500).send({message:'forbidden to access this page!', error: error})
  }
}

module.exports = InvalidAccessException
