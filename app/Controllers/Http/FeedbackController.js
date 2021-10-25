"use strict";

const Order = use("App/Models/Order");
const OrderStatus = use("App/Models/OrderStatus");
const Feedback = use("App/Models/Feedback");

class FeedbackController {
  async getDetailFeedback({ params, response }){
    try {
      const feedback = await Feedback.findByOrFail('orderId', params.orderId)
      return feedback
    } catch (error) {
      return response.json({message: 'gagal mendapatkan data feedback'})
    }
  }

  async createFeedback({ auth, params, request, response }) {
    const currentUser = await auth.getUser();
    const status = await OrderStatus.findByOrFail("name", "completed");
    try {
      const order = await Order.query()
        .where("id", params.orderId)
        .where("userId", currentUser.id)
        .where("order_statusId", status.id)
        .doesntHave("feedback")
        .fetch();
      const jsonOrder = order.toJSON();
      const payload = request.all();
      const feedback = await Feedback.create({
        feedback: payload.feedback,
        orderId: jsonOrder[0].id,
        userId: currentUser.id,
        detail_venuesId: jsonOrder[0].venueId,
      });
      return response.status(200).json({ message: "Berhasil!" }, feedback);
    } catch (err) {
      return response
        .status(400)
        .json({
          message: "Gagal!, feedback sudah pernah ditambahkan pada pesanan ini",
          err
        });
    }
  }

  async editFeedback({auth, params, request, response}){
    try {
      const currentUser = await auth.getUser();
      const payload = request.only("feedback")
      await Feedback.query()
      .where("orderId", params.orderId)
      .where("userId", currentUser.id)
      .update(payload)
      return response.json({message: 'Berhasil mengubah feedback!'})
    } catch (error) {
      return response
        .status(400)
        .json({
          message: "Gagal mengubah data!",
          error
        });
    }
  }
}

module.exports = FeedbackController;
