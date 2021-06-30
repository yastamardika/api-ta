"use strict";
const User = use("App/Models/User");
const Sanggar = use("App/Models/Sanggar");
const DancePackage = use("App/Models/DancePackage");
const Order = use("App/Models/Order");
const Midtrans = use("Midtrans");
const OrderStatus = use("App/Models/OrderStatus");

class SanggarController {
  async index({ response, request }) {
    // .has("sanggar.packages")
    const page = request.input("page", 1);
    try {
      const data = await User.query()
        .where("role", "partner")
        .has("sanggar")
        .whereHas("sanggar.packages", (builder) => {
          builder.whereNull("deleted_at");
        })
        .with("sanggar.address")
        .whereNull("deleted_at")
        .paginate(page);
      response.status(200).json(data);
    } catch (err) {
      response.status(500).json({ messages: "error", error: err });
    }
  }

  async detail({ params, response }) {
    try {
      const sanggar = await Sanggar.query()
        .with("address")
        .with("packages", (builder) => {
          builder.whereNull("deleted_at");
        })
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
        .update({
          order_statusId: OrderStatus.findByOrFail("name", "paid").id,
        });

      return response.status(200).json({ message: "success", data: tra });
    } else if (
      transactionStatus == "cancel" ||
      transactionStatus == "deny" ||
      transactionStatus == "expire"
    ) {
      // TODO set transaction status on your databaase to 'failure'
      const tra = await Order.query()
        .where("id", orderId)
        .update({
          order_statusId: OrderStatus.findByOrFail("name", "failed").id,
        });

      return response.status(200).json({ message: "success", data: tra });
    } else if (transactionStatus == "pending") {
      // TODO set transaction status on your databaase to 'pending' / waiting payment
      const tra = await Order.query()
        .where("id", orderId)
        .update({
          order_statusId: OrderStatus.findByOrFail(
            "name",
            "waiting for payment"
          ).id,
        });
      return response.status(200).json({ message: "success", data: tra });
    }
  }

  async indexDancePackage({ params, response }) {
    try {
      const dancePackage = await DancePackage.query()
        .where("sanggarId", params.sanggarId)
        .whereNull("deleted_at")
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
      return response.status(400).json({ message: "Failed!", error: error });
    }
  }

  async editDancePackage({ auth, params, request, response }) {
    try {
      const user = await auth.getUser();
      const data = request.all();
      const partner = await Sanggar.find(params.sanggarId);
      if (user.id == partner.partnerId) {
        await DancePackage.query()
          .where("id", params.dancePackageId)
          .update(data);
        return response.status(200).json({ status: 200, message: "success!" });
      }
      return response
        .status(400)
        .json({ message: "Failed!, unauthorized user!" });
    } catch (e) {
      response.status(500).json({ status: 400, message: "An error occured!" });
    }
  }

  async deleteDancePackage({ auth, params, response }) {
    try {
      const user = await auth.getUser();
      const sanggar = await Sanggar.find(params.sanggarId);
      if (user.id == sanggar.partnerId) {
        await DancePackage.query()
          .where("id", params.dancePackageId)
          .update({ deleted_at: new Date() });
        return response.status(200).json({ message: "Success", data: sanggar });
      }
      return response
        .status(400)
        .json({ message: "Failed!, unauthorized user!" });
    } catch (err) {
      response.status(500).json({ message: `error!, ${err}` });
    }
  }

  async detailDancePackage({ params, response }) {
    try {
      const dancePackage = await DancePackage.find(params.dancePackageId);
      response.status(201).json({ message: "Success", data: dancePackage });
    } catch (err) {
      response.status(500).json({ message: err });
    }
  }

  async indexOrderPartner({ auth, response }) {
    const currentUser = await auth.getUser();
    const sanggar = await Sanggar.findByOrFail("partnerId", currentUser.id);
    try {
      const order = await Order.query()
        .where("sanggarId", sanggar.id)
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

  async detailOrderPartner({ auth, params, response }) {
    const currentUser = await auth.getUser();
    const sanggar = await Sanggar.findByOrFail("partnerId", currentUser.id);
    try {
      if (sanggar.id === params.sanggarId) {
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
      } else {
        response.status(404).json({ message: "Order not found!" });
      }
    } catch (error) {
      response.status(500).json({ message: error });
    }
  }
}

module.exports = SanggarController;
