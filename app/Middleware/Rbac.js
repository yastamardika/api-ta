'use strict'
/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

class Rbac {
  /**
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Function} next
   */
   async handle ({ request, auth }, next, rule) {
    const roles = rule
    if (roles.length == 0) {
      await next()
    } else {
      try {
        const user = await auth.getUser()
        const role = user.role
        if(roles.includes(role)){
          await next()
        } else {
          throw new Error(`Only user with role: ${roles} can access the route`)  
        }
      } catch (e) {
        console.log(e)
        throw new Error(`error: ${roles} and ${e} can access the route`)
      }
    }
  }
}

module.exports = Rbac
