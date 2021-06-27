"use strict";

const User = use("App/Models/User");
const Order = use("App/Models/Order");
const Database = use('Database')
const Persona = use("Persona");

class AdminController {
  async indexUser({ req, res, view }) {
    const user = await User.all();
    return res(user);
  } 
  
  async getAllPartner({ auth, response }) {
    const currentUser = await auth.getUser();
    if (currentUser.role === "admin") {
      const allPartner = await User.query()
        .where("role", "partner")
        .whereNull("deleted_at")
        .fetch();
      return response
        .status(200)
        .json({ message: "success", data: allPartner });
    }
    return response
      .status(404)
      .json({ message: "failed", data: "Unauthorized User!" });
  }

  async getAllUser({ auth, response }) {
    const currentUser = await auth.getUser();
    if (currentUser.role === "admin") {
      const allUser = await User.all();
      return response.status(200).json({ message: "success", data: allUser });
    }
    return response
      .status(404)
      .json({ message: "failed", data: "Unauthorized User!" });
  }


  async getPartnerCandidate({ auth, response }) {
    const currentUser = await auth.getUser();
    if (currentUser.role === "admin") {
      const allCandidate = await User.query().where('role','customer').whereHas('sanggar').with('sanggar').fetch();
      return response.status(200).json({ message: "success", data: allCandidate });
    }
    return response
      .status(404)
      .json({ message: "failed", data: "Unauthorized User!" });
  }

  async indexOrderAdmin({ response }) {
    try {
      const order = await Order.query()
        .with("customer")
        .with("package")
        .with("detail")
        .with("venue")
        .with("sanggar")
        .with("status")
        .fetch();
      response.status(200).json({ message: "success!", data: order });
    } catch (error) {
      response.status(500).json({ message: error });
    }
  }

  async detailOrderAdmin({ params, response }) {
    try {
      const order = await Order.query()
        .where("id", params.orderId)
        .with("customer")
        .with("package")
        .with("detail")
        .with("venue")
        .with("sanggar")
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

  async verifyPartner({ auth, params, response }) {
    const currentUser = await auth.getUser();
    const time = new Date();
    if (currentUser.role === "admin") {
      const toBePartner = await User.query()
        .where("id", params.id)
        .update({ role: "partner", verified_by_admin_at: time });
      return response
        .status(200)
        .json({ message: "success", data: toBePartner });
    } else {
      return response.status(400).json({ message: "failed" });
    }
  }

  async declineVerify({ auth, params, response }) {
    const currentUser = await auth.getUser();
    if (currentUser.role === "admin") {
      const toBePartner = await User.query()
        .where("id", params.id)
        .update({
          role: "customer",
          verified_by_admin_at: "pengajuan ditolak",
        });
      return response
        .status(200)
        .json({ message: "success", data: toBePartner });
    } else {
      return response.status(400).json({ message: "failed" });
    }
  }
}


module.exports = AdminController;
