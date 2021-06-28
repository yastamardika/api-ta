"use strict";

const Order = use("App/Models/Order");
const DetailVenue = use("App/Models/DetailVenue");
const OrderDetail = use("App/Models/OrderDetail");
const DancePackage = use("App/Models/DancePackage");
const Mail = use("Mail");
const Midtrans = use("Midtrans");
const moment = use("moment");
const Sanggar = use("App/Models/Sanggar");
const Database = use("Database");
const OrderStatus = use("App/Models/OrderStatus");

class CustomerController {
  async indexOrderCustomer({ auth, response }) {
    try {
      const currentUser = await auth.getUser();
      const order = Order.query()
        .where("userId", currentUser.id)
        .with(["customer", "package", "detail", "venue", "sanggar", "status"])
        .fetch();
      response.status(200).json({ message: "success!", data: order });
    } catch (error) {
      response.status(500).json({ message: error });
    }
  }

  async detailOrderCustomer({ auth, params, response }) {
    try {
      const currentUser = await auth.getUser();
      const order = Order.query()
        .where("userId", currentUser.id)
        .where("id", params.orderId)
        .with(["customer", "package", "detail", "venue", "sanggar", "status"])
        .fetch();
      response.status(200).json({ message: "success!", data: order });
    } catch (error) {
      response.status(500).json({ message: error });
    }
  }

  async createOrder({ auth, request, params, response }) {
    const trx = await Database.beginTransaction();
    const orderStatus = await OrderStatus.firstOrFail();
    const currentUser = await auth.getUser();
    const detailInfo = request.only(["name", "phone", "email", "address"]);
    const detailOrder = await OrderDetail.create(detailInfo);
    await detailOrder.save(trx);
    const venueInfo = request.only([
      "venueAddress",
      "venueLocation",
      "venueCity",
      "venueProvince",
      "venueTime",
    ]);
    try {
      const venue = await DetailVenue.create({
        address: venueInfo.venueAddress,
        location: venueInfo.venueLocation,
        city: venueInfo.venueCity,
        province: venueInfo.venueProvince,
        time: venueInfo.venueTime,
      });
      await venue.save(trx);
      const paket = await DancePackage.findOrFail(request.input("packageId"));

      const date = new Date();
      const order = new Order();
      order.sanggarId = params.sanggarId;
      order.order_date = date;
      order.packageId = paket.id;
      order.order_detailId = detailOrder.id;
      order.userId = currentUser.id;
      order.total_amount = paket.harga;
      order.order_statusId = orderStatus.id;
      order.venueId = venue.id;

      await order.save(trx);

      let transaction_data = {
        transaction_details: {
          order_id: order.id,
          gross_amount: paket.harga,
        },
        customer_details: {
          first_name: detailInfo.name,
          email: detailInfo.email,
          phone: detailInfo.phone,
          address: detailInfo.address,
        },
        customer_expiry: {
          start_time: moment().format("Y-MM-DD HH:mm:ss Z"),
          unit: "day",
          duration: 2,
        },
        item_details: [
          {
            id: paket.id,
            quantity: 1,
            name: paket.nama_tarian,
            price: paket.harga,
          },
        ],
        credit_card_option: {
          secure: true,
          channel: "migs",
        },
      };
      console.log(transaction_data);
      // result: 3bfdd6d4-d757-4b01-a547-fe3b862d1aaa
      const token = await Midtrans.getSnapToken(transaction_data);
      console.log(token);
      // or
      // result: https://app.sandbox.midtrans.com/snap/v2/vtweb/token
      const redirect_url = await Midtrans.vtwebCharge(transaction_data);
      console.log(redirect_url);

      await trx.commit();

      return response
        .status(200)
        .json({ message: "success", data: redirect_url });
    } catch (error) {
      await trx.rollback();
      return response.status(500).json({ message: "failed", data: error });
    }

    // choice one, token or redirect_url

    //send email while success

    // if (redirect_url != null) {
    //   Mail.send('emails.welcome', user.toJSON(), (message) => {
    //     message
    //       .to(user.email)
    //       .from('<from-email>')
    //       .subject('Welcome to yardstick')
    //   })
    // }
  }
}
module.exports = CustomerController;
