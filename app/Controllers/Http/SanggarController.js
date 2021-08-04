"use strict";
const User = use("App/Models/User");
const Sanggar = use("App/Models/Sanggar");
const DancePackage = use("App/Models/DancePackage");
const Order = use("App/Models/Order");
const Midtrans = use("Midtrans");
const moment = use("moment");
const Mail = use("Mail");
const OrderStatus = use("App/Models/OrderStatus");

class SanggarController {
  async index({ response, request }) {
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

  async dashboardInfo({ params, response }) {
    const sanggar = await Sanggar.find(params.sanggarId);
    const status = await OrderStatus.findByOrFail("name", "completed");
    const totalOrderCompleted = await Order.query()
      .where("sanggarId", sanggar.id)
      .where("order_statusId", status.id)
      .getCount();
    const allSanggarOrderCount = await Order.query()
      .where("sanggarId", sanggar.id)
      .getCount();
    // 5 sanggarOrder terbaru
    const latestOrder = await Order.query()
      .where("sanggarId", sanggar.id)
      .with("customer")
      .with("package")
      .with("detail")
      .with("venue")
      .with("sanggar")
      .with("status")
      .pickInverse(5);
    // total pelanggan
    const totalCustomer = await Order.query()
      .where("sanggarId", sanggar.id)
      .getCountDistinct("userId");
    // total pemasukan
    const totalIncome = await Order.query()
      .where("sanggarId", sanggar.id)
      .where("order_statusId", status.id)
      .getSum("total_amount");
    response.status(200).json({
      total_order_completed: totalOrderCompleted,
      all_sanggar_order_count: allSanggarOrderCount,
      latest_order: latestOrder,
      total_customer: totalCustomer,
      total_income: totalIncome,
    });
  }

  async homeSanggar({ response }) {
    try {
      const data = await User.query()
        .where("role", "partner")
        .has("sanggar")
        .whereHas("sanggar.packages", (builder) => {
          builder.whereNull("deleted_at");
        })
        .with("sanggar.address")
        .whereNull("deleted_at")
        .orderBy("id", "desc")
        .limit(3)
        .fetch();
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
      const minPrice = await DancePackage.query()
        .where("sanggarId", params.id)
        .getMin("harga");
      response
        .status(201)
        .json({ message: "Success", data: sanggar, min_price: minPrice });
    } catch (error) {
      response.status(500).json({ message: "error" });
    }
  }

  async editSanggarInfo({ auth, request, params, response }) {
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

  async acceptPayment({ params, response }) {
    try {
      const orderStatus = await OrderStatus.findByOrFail("name", "processed");
      await Order.query().where("id", params.orderId).update({
        order_statusId: orderStatus.id,
      });
      const res = await Order.query()
        .where("id", params.orderId)
        .with("status")
        .fetch();
      return response.status(200).json({ message: "success", data: res });
    } catch (error) {
      return response.status(400).json({ message: "failed!" });
    }
  }

  async declinePayment({ params, response }) {
    try {
      const order = await Order.findOrFail(params.orderId);
      const customer = await User.findOrFail(order.userId);
      const dataOrder = await Order.query()
        .where("id", params.orderId)
        .with("customer")
        .with("package")
        .with("sanggar")
        .fetch();
      const orderStatus = await OrderStatus.findByOrFail("name", "failed");
      const tra = await Order.query().where("id", params.orderId).update({
        order_statusId: orderStatus.id,
      });
      const status = await Midtrans.status(params.orderId);
      const orderDate = moment(order.created_at).format("LLL");
      const dataOrderJSON = dataOrder.toJSON();
      const orderPrice = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(dataOrderJSON[0].package.harga);
      await Mail.send(
        "mail.decline-order",
        {
          customer,
          dataOrder: dataOrder.toJSON(),
          orderDate: orderDate,
          orderPrice: orderPrice,
        },
        (message) => {
          message
            .to(customer.email)
            .from("admin@i-tallenta.com")
            .subject("Pesanan anda ditolak");
        }
      );
      return response
        .status(200)
        .json({ message: "success", data: status, tra, dataOrder });
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
      const orderStatus = await OrderStatus.findByOrFail("name", "paid");
      console.log(orderStatus);
      const tra = await Order.query().where("id", orderId).update({
        order_statusId: orderStatus.id,
      });

      return response
        .status(200)
        .json({ message: "paid successful", data: tra });
    } else if (
      transactionStatus == "cancel" ||
      transactionStatus == "deny" ||
      transactionStatus == "expire"
    ) {
      // TODO set transaction status on your databaase to 'failure'
      const orderStatus = await OrderStatus.findByOrFail("name", "failed");
      const tra = await Order.query().where("id", orderId).update({
        order_statusId: orderStatus.id,
      });

      return response.status(200).json({ message: "failed to pay", data: tra });
    } else if (transactionStatus == "pending") {
      // TODO set transaction status on your databaase to 'pending' / waiting payment
      const orderStatus = await OrderStatus.findByOrFail(
        "name",
        "waiting for payment"
      );
      const tra = await Order.query().where("id", orderId).update({
        order_statusId: orderStatus.id,
      });
      return response
        .status(200)
        .json({ message: "payment on pending", data: tra });
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
    let midtransStatus;
    try {
      midtransStatus = await Midtrans.status(params.orderId);
      const transactionStatus = midtransStatus.transaction_status;
      const order = await Order.findOrFail(params.orderId);
      const currentStatus = await order.status().fetch();
      if (transactionStatus == "settlement") {
        const orderStatus = await OrderStatus.findByOrFail("name", "paid");
        if (currentStatus.name != "processed") {
          if (currentStatus.name != "completed") {
            if (currentStatus.name != "failed") {
              await Order.query().where("id", params.orderId).update({
                order_statusId: orderStatus.id,
              });
            }
          }
        }
      } else if (
        transactionStatus == "cancel" ||
        transactionStatus == "deny" ||
        transactionStatus == "expire"
      ) {
        // TODO set transaction status on your databaase to 'failure'
        const orderStatus = await OrderStatus.findByOrFail("name", "failed");
        await Order.query().where("id", params.orderId).update({
          order_statusId: orderStatus.id,
        });
      } else if (transactionStatus == "pending") {
        // TODO set transaction status on your databaase to 'pending' / waiting payment
        const orderStatus = await OrderStatus.findByOrFail(
          "name",
          "waiting for payment"
        );
        await Order.query().where("id", params.orderId).update({
          order_statusId: orderStatus.id,
        });
      }
    } catch (error) {
      midtransStatus = "null";
    }
    try {
      if (sanggar.id == params.sanggarId) {
        const order = await Order.query()
          .where("id", params.orderId)
          .where("sanggarId", params.sanggarId)
          .with("customer")
          .with("package")
          .with("detail")
          .with("venue")
          .with("sanggar")
          .with("status")
          .fetch();
        response.status(200).json({
          message: "success!",
          data: order,
          midtrans_status: midtransStatus,
        });
      } else {
        response.status(404).json({ message: "Order not found!" });
      }
    } catch (error) {
      response.status(500).json({ message: error });
    }
  }
}

module.exports = SanggarController;
