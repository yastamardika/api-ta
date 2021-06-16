const querystring = require("querystring");
const Env = use("Env");
const Event = use("Event");
const Mail = use("Mail");

// on new user registration, send email verification link
Event.on("user::created", async (payload) => {
  const user = payload.user.toJSON();
  const token = querystring.encode({
    token: payload.token,
  });

  await Mail.send("mail.user", { user, token }, (message) => {
    message
      .to(payload.user.email)
      .from(`<${Env.get("MAIL_USERNAME")}>`)
      .subject("Thanks for registering!");
  });
});

Event.on("forgot::password", async (payload) => {
  const user = payload.user.toJSON();
  const token = querystring.encode({
    token: payload.token,
  });

  await Mail.send("mail.resetpass", { token, user }, (message) => {
    message
      .to(payload.user.email)
      .from(`<${Env.get("MAIL_USERNAME")}>`)
      .subject("Password Reset Request");
  });
});
