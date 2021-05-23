"use strict";

const User = use("App/Models/User");
const Database = use("Database");
const Persona = use("Persona");
class AdminController {
  async verifyPartner({ auth, params, response }) {
    const currentUser = await auth.getUser();
    const toBePartner = await User.find(params.id);
    if (currentUser.role === "admin") {
      toBePartner.update("role", "partner");
      return response
        .status(200)
        .json({ message: "success", data: toBePartner });
    }
    return response.status(400).json({ message: "failed" });
  }

  async getDetailUser({ auth, params, response }) {
    const currentUser = await auth.getUser();
    const detailUser = await User.find(params.id);
    if (currentUser.role === "admin") {
      return response
        .status(200)
        .json({ message: "success", data: detailUser });
    }
    return response.status(400).json({ message: "failed, you are not authorized!" });
  }
}
