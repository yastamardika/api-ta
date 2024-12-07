"use strict";

const User = use("App/Models/User");
const Persona = use("Persona");
const SanggarAddress = use("App/Models/AddressSanggar");
const Sanggar = use("App/Models/Sanggar");
const Database = use("Database");
const Request = use("axios");
const SECRET_KEY = "6LfaLCkdAAAAABGi8OKnZZeFjjxb2V4sZ7eUzVBk";

class UserController {
  async getCurrentUser({ auth }) {
    const user = await auth.getUser();
    const currentUser = await User.query()
      .where("id", user.id)
      .with("sanggar")
      .with("sanggar.address")
      .fetch();
    return currentUser;
  }

  async login({ request, auth, response }) {
    const payload = request.only(["uid", "password"]);
    const user = await Persona.verify(payload);

    return await auth.generate(user);
  }

  async logout({ auth, response }) {
    const user = await auth.getUser();
    const token = await auth.getAuthHeader();
    await user.tokens().where("token", token).update({ is_revoked: true });
    const status = user.tokens().where("token", token);
    return response.status(200).json({ message: "Success!", data: user });
  }

  async editUsername({ auth, request, response }) {
    try {
      const user = await auth.getUser();
      const data = request.all();
      await User.query().where("id", user.id).update(data);
      return response.status(200).json({ message: "success!" });
    } catch (e) {
      response.status(500).json({ message: "An error occured!" });
    }
  }

  async editProfilePhoto({ auth, request, response }) {
    try {
      const user = await auth.getUser();
      const data = request.all();
      await User.query().where("id", user.id).update(data);
      return response.status(200).json({ message: "success!" });
    } catch (e) {
      response.status(500).json({ message: "An error occured!" });
    }
  }
  async register({ request, auth, response }) {
    const payload = request.only([
      "username",
      "email",
      "password",
      "password_confirmation",
    ]);
    const verifToken = request.only(
      "token"
    )
    console.log(verifToken.token);
    const checkToken = await Request.get(`https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${verifToken.token}`)
    const token = checkToken.data
    if (token.success) {
      const user = await Persona.register(payload);
      return await auth.generate(user);
    }else{
      return await response.status(500).json({message: 'captcha not valid!', token})
    }
  }

  async verifyEmail({ request, session, view }) {
    const token = request.input("token");
    const user = await Persona.verifyEmail(token);
    session.flash({ message: "Email verified" });
    return view.render("verified");
  }

  async updatePassword({ auth, request, response }) {
    const payload = request.only([
      "old_password",
      "password",
      "password_confirmation",
    ]);
    const user = await auth.getUser();
    const updatedUser = await Persona.updatePassword(user, payload);
    return response.json({ message: "success!", data: updatedUser });
  }

  async forgotPassword({ request }) {
    return await Persona.forgotPassword(request.input("uid"));
  }

  async updatePasswordByToken({ request }) {
    const token = decodeURIComponent(request.input("token"));
    const payload = request.only(["password", "password_confirmation"]);
    const user = await Persona.updatePasswordByToken(token, payload);
    return user;
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
    const userInfo = request.only([
      "name",
      "description",
      "phone",
      "email",
      "photo",
      "youtube_video_profile",
    ]);
    const addressInfo = request.only([
      "address",
      "city",
      "province",
      "postal_code",
      "google_map_link",
    ]);

    const address = await SanggarAddress.create({
      address: addressInfo.address,
      city: addressInfo.city,
      province: addressInfo.province,
      postal_code: addressInfo.postal_code,
      google_map_link: addressInfo.google_map_link,
    });

    // pass the transaction object
    await address.save(trx);
    try {
      const sanggar = new Sanggar();
      sanggar.name = userInfo.name;
      sanggar.description = userInfo.description;
      sanggar.phone = userInfo.phone;
      sanggar.email = userInfo.email;
      sanggar.youtube_video_profile = userInfo.youtube_video_profile;
      sanggar.photo = userInfo.photo;
      sanggar.partnerId = user.id;
      sanggar.sanggar_addressId = address.id;

      await sanggar.save(trx);

      // once done commit the transaction
      trx.commit();
      response.status(200).json({ message: "success", data: sanggar });
      //
    } catch (error) {
      console.log("There has been an error >>", error);
      // rollback the transaction if it fails for any reason
      response.status(400).json({ message: "failed", error: error });
      await trx.rollback();
    }
  }

  async editPartnerRegistration({ auth, request, params, response }) {
    const user = await auth.getUser();
    const sanggar = await Sanggar.find(params.sanggarId);
    const userInfo = request.only([
      "name",
      "description",
      "phone",
      "email",
      "photo",
      "youtube_video_profile",
    ]);
    const addressInfo = request.only([
      "address",
      "city",
      "province",
      "postal_code",
      "google_map_link",
    ]);
    try {
      await Sanggar.query().where("partnerId", user.id).update(userInfo);
      await sanggar.address().update(addressInfo);
      return response
        .status(200)
        .json({ message: "Success, berhasil merubah data!", data: sanggar });
    } catch (err) {
      return response.status(400).json({ message: "Error!", err });
    }
  }
 
  
}

module.exports = UserController;
