'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Sanggar extends Model {
    address (){
        return this.belongsTo('App/Models/AddressSanggar','sanggar_addressId', 'id')
    }
    user (){
        return this.belongsTo('App/Models/User','partnerId', 'id')
    }
    packages(){
        return this.hasMany('App/Models/DancePackage','id', 'sanggarId')
    }

}

module.exports = Sanggar
