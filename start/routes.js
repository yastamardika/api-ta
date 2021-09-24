"use strict";

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| Http routes are entry points to your web application. You can create
| routes for different URL's and bind Controller actions to them.
|
| A complete guide on routing is available here.
| http://adonisjs.com/docs/4.1/routing
|
*/

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use("Route");

Route.on('/checkmail').render('mail.user');
Route.on('/welcome').render('welcome');
Route.on('/payment/finish').render('order');
Route.on('/payment/unfinish').render('unfinish');
Route.on('/payment/failed').render('failed');

Route.get("/", "SanggarController.index");
Route.group(() => {
  Route.get("/home", "SanggarController.homeSanggar");
  Route.get("/sanggar", "SanggarController.index");
  Route.get("/sanggar/:id", "SanggarController.detail");
  Route.get("/auth/user", "UserController.getCurrentUser");
  Route.get("/auth/users/verify-email", "UserController.verifyEmail");
  Route.get("/forgot/password", "UserController.forgotPassword");
  Route.post("/auth/login", "UserController.login");
  Route.post("/auth/register", "UserController.register");
  Route.post("/update/password-by-token","UserController.updatePasswordByToken");
  Route.post("/sanggar/order/notification", "SanggarController.charge");
}).prefix("/api");

Route.group(() => {
  Route.get("/order", "CustomerController.indexOrderCustomer"); //daftar order yang dilakukan customer
  Route.get("/order/:orderId", "CustomerController.detailOrderCustomer"); //detail order yang dilakukan customer
  Route.get("/order/:orderId/feedback", "FeedbackController.getDetailFeedback"); 
  Route.post("/order/:orderId/feedback", "FeedbackController.createFeedback"); 
  Route.post("/order/:orderId/finish", "CustomerController.finishOrder"); //selesaikan pesanan
  Route.post("/auth/logout", "UserController.logout"); 
  Route.post("sanggar/:sanggarId/order", "CustomerController.createOrder");
  Route.post("/sanggar/order", "SanggarController.charge");
  Route.post("/partner-registration", "UserController.partnerRegistration");
  Route.put("/partner-registration/:sanggarId", "UserController.editPartnerRegistration");
  Route.put("/sanggar/:sanggarId/delete", "SanggarController.deleteSanggar");
  Route.patch("/profile/change-password", "UserController.updatePassword");
  Route.patch("/profile/change-username", "UserController.editUsername");
  Route.patch("/profile/change-profile-photo", "UserController.editProfilePhoto");
  Route.patch("/sanggar/:sanggarId/edit", "SanggarController.editSanggarInfo");
  Route.patch("/order/:orderId/feedback", "FeedbackController.editFeedback"); 
})
  .middleware(["auth"])
  .prefix("api/");
  
  Route.group(() => {
    Route.get("/info", "SanggarController.dashboardInfo");
    Route.get("/dance-package", "SanggarController.indexDancePackage");
    Route.get("/order", "SanggarController.indexOrderPartner");
    Route.get("/order/:orderId", "SanggarController.detailOrderPartner");
    Route.get("/dance-package/:dancePackageId/", "SanggarController.detailDancePackage");
    Route.post("/dance-package/create", "SanggarController.createDancePackage");
    Route.post("/order/:orderId/approve", "SanggarController.acceptPayment");
    Route.post("/order/:orderId/decline", "SanggarController.declinePayment");
    Route.patch("/dance-package/:dancePackageId/edit", "SanggarController.editDancePackage");
    Route.put("/dance-package/:dancePackageId/delete", "SanggarController.deleteDancePackage");
  })
  .middleware(["auth", "rbac:partner"])
  .prefix("api/sanggar/:sanggarId/");
  
  Route.group(() => {
    Route.get("/admin/order", "AdminController.indexOrderAdmin");
    Route.get("/admin/order/:orderId", "AdminController.detailOrderAdmin");
    Route.get("/partners", "AdminController.getAllPartner")
    Route.get("/partner-candidate", "AdminController.getPartnerCandidate")
    Route.get("/users", "AdminController.getAllUser")
    Route.get("/user/:id", "AdminController.getDetailUser")
    Route.get("/admin/categories", "CategoryController.indexCategory");
    Route.post("/verify-partner/:id", "AdminController.verifyPartner");
    Route.post("/decline-verify/:id", "AdminController.declineVerify");
    Route.post("/admin/categories", "CategoryController.createCategory");
    Route.put("/admin/categories/:id", "CategoryController.editCategory");
    Route.delete("/admin/categories/:id", "CategoryController.deleteCategory");
    
  })
    .middleware(["auth", "rbac:admin"])
    .prefix("api/");