"use strict";

const cloudinary = require("../../Services/Cloudinary");

const User = use("App/Models/User");
const Persona = use("Persona");
const SanggarAddress = use("App/Models/AddressSanggar");
const Sanggar = use("App/Models/Sanggar");
const Database = use("Database");
const Cloudinary = use('App/Services/Cloudinary');
const Helpers = use("Helpers");

class UserController {
  async index({ req, res, view }) {
    const user = await User.all();
    return res(user);
  }

  async getCurrentUser({ auth }) {
    const user = await auth.getUser();
    const currentUser = await User.query()
      .where("id", user.id)
      .with("sanggar")
      .fetch();
    return currentUser;
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
  async login({ request, auth, response }) {
    const payload = request.only(["uid", "password"]);
    const user = await Persona.verify(payload);

    const data = await auth.generate(user);

    return response.json({ message: data });
  }

  async logout({ auth, response }) {
    const user = await auth.getUser();
    const token = await auth.getAuthHeader();
    await user.tokens().where("token", token).update({ is_revoked: true });
    const status = user.tokens().where("token", token);
    return response.status(200).json({ message: "Success!", data: user });
  }

  async register({ request, auth, response }) {
    const payload = request.only([
      "username",
      "email",
      "password",
      "password_confirmation",
    ]);
    const user = await Persona.register(payload);
    return await auth.generate(user);
  }

  async verifyEmail({ request, params, session, response }) {
    const token = request.input("token");
    const user = await Persona.verifyEmail(token);
    session.flash({ message: "Email verified" });
    return view.render('verified',  { user: user.toJSON() });
  }

  async partnerRegistration({ auth, request, response }) {
    const trx = await Database.beginTransaction();
    const user = await auth.getUser();
    const isHasSanggar = await User.query()
      .where("id", user.id)
      .with("sanggar")
      .fetch();
    if (isHasSanggar.sanggar != null) {
      return response
        .status(400)
        .json({ message: "failed, you already registering partner form" });
    }
    const imageSanggar = request.file("photo", {
      types: ["image"],
      size: "2mb",
    });
    const imgName = `${new Date().getTime()}.${imageSanggar.subtype}`;
    await imageSanggar.move(Helpers.tmpPath("uploads"), {
      name: imgName,
      overwrite: true,
    });
    if (!imageSanggar.moved()) {
      response.badRequest(imageSanggar.errors());
      return response.json({ message: imageSanggar.errors() });
    }
    const userInfo = request.only([
      "name",
      "description",
      "phone",
      "email",
      "photo",
    ]);
    const addressInfo = request.only([
      "address",
      "city",
      "province",
      "postal_code",
      "google_map_link",
    ]);

    try {
      const cloudinaryResponse = await Cloudinary.v2.uploader.upload(Helpers.tmpPath("uploads/"+imgName), {folder: 'sanggar'});
      // console.log(cloudinaryResponse)
      const address = await SanggarAddress.create({
        address: addressInfo.address,
        city: addressInfo.city,
        province: addressInfo.province,
        postal_code: addressInfo.postal_code,
        google_map_link: addressInfo.google_map_link,
      });

      // pass the transaction object
      await address.save(trx);

      const sanggar = new Sanggar();
      (sanggar.name = userInfo.name),
        (sanggar.description = userInfo.description),
        (sanggar.phone = userInfo.phone),
        (sanggar.email = userInfo.email),
        // (sanggar.photo = cloudinaryResponse.secure_url), //cloudinary secure_url via nuxt-module
        (sanggar.photo = userInfo.photo)
      sanggar.partnerId = user.id;
      sanggar.sanggar_addressId = address.id;

      await sanggar.save(trx);

      // once done commit the transaction
      trx.commit();
      return response.status(200).json({ message: "success", data: sanggar });
      //
    } catch (e) {
      console.log("There has been an error >>", e);
      // rollback the transaction if it fails for any reason
      await trx.rollback();
    }
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
}

module.exports = UserController;
