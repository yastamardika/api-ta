"use strict";

const Order = use("App/Models/Order");
const DetailVenue = use("App/Models/DetailVenue");
const OrderDetail = use("App/Models/OrderDetail");
const DancePackage = use("App/Models/DancePackage");
const Midtrans = use("Midtrans");
const moment = use("moment");
const Mail = use('Mail')
const Database = use("Database");
const OrderStatus = use("App/Models/OrderStatus");

class CustomerController {
  async indexOrderCustomer({ auth, response, request }) {
    const page = request.input("page", 1);
    try {
      const currentUser = await auth.getUser();
      const order = await Order.query()
        .where("userId", currentUser.id)
        .with("customer")
        .with("package")
        .with("detail")
        .with("venue")
        .with("sanggar")
        .with("status")
        .paginate(page, 3);
      response.status(200).json(order);
    } catch (error) {
      response.status(500).json({ message: error });
    }
  }

  async detailOrderCustomer({ auth, params, response }) {
    let midtransStatus;
    try {
      midtransStatus = await Midtrans.status(params.orderId);
      const transactionStatus = midtransStatus.transaction_status;
      if (transactionStatus == "settlement") {
        const orderStatus = await OrderStatus.findByOrFail("name", "paid");
        const order = await Order.findOrFail(params.orderId);
        const currentStatus = await order.status().fetch();
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
      midtransStatus = null;
    }
    try {
      const currentUser = await auth.getUser();
      const order = await Order.query()
        .where("userId", currentUser.id)
        .where("id", params.orderId)
        .with("package")
        .with("detail")
        .with("venue")
        .with("sanggar")
        .with("status")
        .fetch();
      const midtransStatus = await Midtrans.status(params.orderId);
      response
        .status(200)
        .json({
          message: "success!",
          data: order,
          midtrans_status: midtransStatus,
        });
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
      order.payment_token = token;
      order.payment_url = redirect_url;
      await order.save(trx);
      await trx.commit();

      return response
        .status(200)
        .json({ message: "success", data: { redirect_url, order } });
    } catch (error) {
      await trx.rollback();
      return response.status(500).json({ message: "failed", data: error });
    }
  }

  async paymentSuccessPage({ response }) {
    return response.redirect("localhost:3000/order", false, 301);
  }

  async finishOrder({ auth, params,response }) {
    // try {
      const currentUser = await auth.getUser();
      const toFinish = await Order.findOrFail(params.orderId);    
      const order = await Order.query()
        .where("userId", currentUser.id)
        .where("id", params.orderId)
        .with("package")
        .with("detail")
        .with("venue")
        .with("sanggar")
        .with("status")
        .fetch();
      const orderJSON = order.toJSON();
      if (orderJSON[0].status.name == "processed" && moment().isSameOrAfter(orderJSON[0].venue.time)) {
        const orderStatus = await OrderStatus.findByOrFail(
          "name",
          "completed"
        );
        await Order.query().where("id", params.orderId).update({
          order_statusId: orderStatus.id,
        });
        const orderPrice = new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(orderJSON[0].package.harga);
        const orderDate = moment(orderJSON[0].created_at).format("LLL");
        await Mail.send('mail.completed-order', { orderJSON, orderPrice, orderDate }, (message) => {
          message
            .to(orderJSON[0].sanggar.email)
            .from('admin@i-tallenta.com')
            .subject('Pesanan anda telah selesai')
        })
      }
      response.status(200).json(order);
    // } catch (error) {
    //   response.status(500).json({ message: "error!" });
    // }
  }
}
module.exports = CustomerController;
