"use strict";
const User = use("App/Models/User");
const Sanggar = use("App/Models/Sanggar");
const DancePackage = use("App/Models/DancePackage");
const Order = use("App/Models/Order");
const Midtrans = use("Midtrans");
class SanggarController {
  async index({ response }) {
    try {
      const user = await User.query()
        .where("role", "partner")
        .with("sanggar")
        .with("sanggar.address")
        .whereNull("deleted_at")
        .whereHas()
        .fetch();
      response
        .status(200)
        .json({ messages: "success", data: user });
    } catch (err) {
      response.status(500).json({ messages: "error" });
    }
  }

  async detail({ params, response }) {
    try {
      const sanggar = await Sanggar.query()
        .with("address")
        .with("packages")
        .with("user")
        .where("id", params.id)
        .fetch();
      response.status(201).json({ message: "Success", data: sanggar });
    } catch (error) {
      response.status(500).json({ message: "error" });
    }
  }

  async editSanggar({ auth, request, params, response }) {
    try {
      const user = await auth.getUser();
      const data = request.all();
      const partner = await Sanggar.find(params.sanggarId);
      if (user.id == partner.partnerId) {
        await Sanggar.query().where("id", params.sanggarId).update(data);
        return response.status(200).json({ status: 200, message: "success!" });
      }
      return response
        .status(400)
        .json({ message: "Failed!, unauthorized user!" });
    } catch (e) {
      response.status(500).json({ status: 400, message: "An error occured!" });
    }
  }

  async deleteSanggar({ auth, params, response }) {
    try {
      const user = await auth.getUser();
      const sanggar = await Sanggar.find(params.id);
      if (user.id == sanggar.partnerId) {
        sanggar.update({ deleted_at: new Date() });
        return response.status(200).json({ message: "Success", data: sanggar });
      }
      return response
        .status(400)
        .json({ message: "Failed!, unauthorized user!" });
    } catch (error) {
      response.status(500).json({ message: error });
    }
  }

  async acceptPayment({ request, response }) {
    try {
      const status = await Midtrans.approve(request.input("order_id"));
      return response.status(200).json({ message: "success", data: status });
    } catch (error) {
      return response.status(400).json({ message: "failed!" });
    }
  }

  async charge({ request, response }) {
    const notification = request.all();

    const statusResponse = await Midtrans.notification(notification);

    let orderId = statusResponse.order_id;
    let transactionStatus = statusResponse.transaction_status;
    let fraudStatus = statusResponse.fraud_status;

    console.log(
      `Transaction notification received. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}`
    );

    // Sample transactionStatus handling logic
    if (transactionStatus == "settlement") {
      const tra = await Order.query()
        .where("id", orderId)
        .update({ order_statusId: 2 });

      return response.status(200).json({ message: "success", data: tra });
      // if (fraudStatus == "challenge") {
      //   // TODO set transaction status on your databaase to 'challenge'
      //   order.query().update({ order_status: 4 });
      //   return response.status(200).json({ message: "success", data: order });
      // } else if (fraudStatus == "accept") {
      //   // TODO set transaction status on your databaase to 'success'
      //   order.query().update({ order_status: 2 });
      //   return response.status(200).json({ message: "success", data: order });
      // }
    } else if (
      transactionStatus == "cancel" ||
      transactionStatus == "deny" ||
      transactionStatus == "expire"
    ) {
      // TODO set transaction status on your databaase to 'failure'
      const tra = await Order.query()
        .where("id", orderId)
        .update({ order_statusId: 3 });

      return response.status(200).json({ message: "success", data: tra });
    } else if (transactionStatus == "pending") {
      // TODO set transaction status on your databaase to 'pending' / waiting payment
      const tra = await Order.query()
        .where("id", orderId)
        .update({ order_statusId: 1 });
      return response.status(200).json({ message: "success", data: tra });
    }
  }

  async indexDancePackage({ auth, params, response }) {
    try {
      const dancePackage = await DancePackage.query()
        .where("sanggarId", params.sanggarId)
        .fetch();
      response.status(201).json({ message: "Success", data: dancePackage });
    } catch (err) {
      response.status(500).json({ message: err });
    }
  }

  async createDancePackage({ auth, params, request, response }) {
    try {
      const user = await auth.getUser();
      const partner = await Sanggar.find(params.sanggarId);
      if (user.id == partner.partnerId) {
        const allData = request.all();
        allData.sanggarId = params.sanggarId;
        const dancePackage = await DancePackage.create(allData);
        dancePackage.sanggarId = params.sanggarId;
        await dancePackage.save();

        return response
          .status(200)
          .json({ message: "Success", data: dancePackage });
      }
      return response
        .status(400)
        .json({ message: "Failed!, unauthorized user!" });
    } catch (error) {
      return response.status(400).json({ message: "Failed!, error occured" });
    }
  }

  async editDancePackage({ auth, request, response }) {}

  async detailDancePackage({ params, response }) {
    try {
      const dancePackage = await DancePackage.find(params.dancePackageId);
      response.status(201).json({ message: "Success", data: dancePackage });
    } catch (err) {
      response.status(500).json({ message: err });
    }
  }
}

module.exports = SanggarController;
