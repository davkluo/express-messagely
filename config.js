"use strict";

/** Common config for message.ly */

// read .env files and make environmental variables

require("dotenv").config();

const DB_URI = (process.env.NODE_ENV === "test")
    ? "postgresql:///messagely_test"
    : "postgresql:///messagely";

const SECRET_KEY = process.env.SECRET_KEY || "secret";

const BCRYPT_WORK_FACTOR = 12;

const TWILIO_ACCOUNT_SID = process.env.ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.AUTH_TOKEN;
const TWILIO_FROM_PHONE = process.env.TWILIO_FROM_PHONE;
const TWILIO_TO_PHONE = process.env.TWILIO_TO_PHONE;


module.exports = {
  DB_URI,
  SECRET_KEY,
  BCRYPT_WORK_FACTOR,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_PHONE,
  TWILIO_TO_PHONE
};