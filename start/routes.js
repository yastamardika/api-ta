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

Route.get("/", "UserController.getCurrentUser");
Route.group(() => {
  Route.post("/auth/login", "UserController.login");
  Route.post("/auth/register", "UserController.register");
  Route.get("/sanggar", "SanggarController.index");
  Route.get("/sanggar/:id", "SanggarController.detail");
  Route.get("/auth/user", "UserController.getCurrentUser");
  Route.get("/auth/users/verify-email", "UserController.verifyEmail");
  Route.post("/sanggar/order/notification", "SanggarController.charge");
}).prefix("/api");

Route.group(() => {
  Route.get("/order", "CustomerController.indexOrder"); //daftar order yang dilakukan customer
  Route.get("/order/:id", "CustomerController.detailOrder"); //detail order yang dilakukan customer
  Route.post("/auth/logout", "UserController.logout"); 
  Route.post("sanggar/:sanggarId/order", "CustomerController.createOrder");
  Route.post("/sanggar/order", "SanggarController.charge");
  Route.post("/partner-registration", "UserController.partnerRegistration");
  Route.put("/sanggar/:sanggarId/delete", "SanggarController.deleteSanggar");
  Route.patch("/profile/change-password", "UserController.updatePassword")
  Route.patch("/sanggar/:sanggarId/edit", "SanggarController.editSanggar");
})
  .middleware(["auth"])
  .prefix("api/");

Route.group(() => {
  Route.post("/verify-partner/:id", "UserController.verifyPartner");
  Route.get("/order", "CustomerController.indexOrder");
  Route.get("/order/:orderId", "CustomerController.detailOrder");
  Route.get("/partners", "UserController.getAllPartner")
  Route.get("/users", "UserController.getAllUser")
})
  .middleware(["auth", "rbac:admin"])
  .prefix("api/");

Route.group(() => {
  Route.get("/dance-package/:dancePackageId/", "SanggarController.detailDancePackage");
  Route.get("/dance-package", "SanggarController.indexDancePackage");
  Route.get("/order", "SanggarController.indexOrderPartner");
  Route.get("/order/:orderId", "SanggarController.detailOrderPartner");
  Route.post("/dance-package/create", "SanggarController.createDancePackage");
  Route.patch("/dance-package/:dancePackageId/edit", "SanggarController.editDancePackage");
})
  .middleware(["auth", "rbac:partner"])
  .prefix("api/sanggar/:sanggarId/");
