"use strict";

const Router = require("express").Router;
const router = new Router();

const { BadRequestError, UnauthorizedError } = require('../expressError');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

/** POST /login: {username, password} => {token} */
router.post('/login', async function(req, res, next) {
  if (req.body === undefined) throw new BadRequestError();
  const { username, password } = req.body;

  if ((await User.authenticate(username, password)) === true) {
    User.updateLoginTimestamp(username);
    const payload = { username };
    const token = jwt.sign(payload, SECRET_KEY);

    return res.json({ token });
  }

  throw new UnauthorizedError('Invalid username/password!');
});

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post('/register', async function(req, res, next) {
  if (req.body === undefined) throw new BadRequestError();

  const user = await User.register(req.body);
  const { username } = user;
  const payload = { username };
  const token = jwt.sign(payload, SECRET_KEY);

  return res.json({ token });
});

module.exports = router;