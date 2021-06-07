"use strict";

const User = use("App/Models/User");
const Order = use("App/Models/Order");
const Database = use('Database')
const Persona = use("Persona");

class AdminController {
  async indexOrderAdmin({ response }) {
    try {
      const order = Order.query()
        .with("customer")
        .with("package")
        .with("detail")
        .with("venue")
        .with("sanggar")
        .with("payment")
        .with("status")
        .fetch();
      response.status(200).json({ message: "success!", data: order });
    } catch (error) {
      response.status(500).json({ message: error });
    }
  }

  async detailOrderAdmin({ params, response }) {
    try {
      const order = Order.query()
        .where("id", params.orderId)
        .with("customer")
        .with("package")
        .with("detail")
        .with("venue")
        .with("sanggar")
        .with("payment")
        .with("status")
        .fetch();
      response.status(200).json({ message: "success!", data: order });
    } catch (error) {
      response.status(500).json({ message: error });
    }
  }
  async getDetailUser({ auth, params, response }) {
    const currentUser = await auth.getUser();
    const detailUser = await User.find(params.id);
    if (currentUser.role === "admin") {
      return response
        .status(200)
        .json({ message: "success", data: detailUser });
    }
    return response
      .status(400)
      .json({ message: "failed, you are not authorized!" });
  }
}
