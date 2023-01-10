"use strict";

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureToOrFromUser, ensureRecipient } = require("../middleware/auth");
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_PHONE, TWILIO_TO_PHONE } = require('../config');
const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

const Router = require("express").Router;
const router = new Router();

const Message = require("../models/message");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureToOrFromUser, async function (req, res, next) {
  const message = await Message.get(req.params.id);

  return res.json({ message });
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function (req, res, next) {
  if (req.body === undefined) throw new BadRequestError();
  const msgInput = {
    from_username: res.locals.user.username,
    to_username: req.body.to_username,
    body: req.body.body,
  };
  const message = await Message.create(msgInput);

  client.messages
  .create({
     body: `${message.from_username} says to ${message.to_username}: ${message.body}`,
     from: `${TWILIO_FROM_PHONE}`,
     to: `${TWILIO_TO_PHONE}`
   })
  .then(message => console.log(message.sid));

  return res.json({ message });
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post(
  "/:id/read",
  ensureRecipient,
  async function (req, res, next) {
    if (req.body === undefined) throw new BadRequestError();

    const message = await Message.markRead(req.params.id);
    return res.json({message});
  }
);

module.exports = router;
