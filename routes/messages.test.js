"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const { SECRET_KEY } = require("../config");

const Message = require("../models/message");

const TEST_USER = {
  username: "test1",
  password: "password",
  first_name: "Test1",
  last_name: "Testy1",
  phone: "+14155550000",
};

const TEST_USER_2 = {
  username: "test2",
  password: "password",
  first_name: "Test2",
  last_name: "Testy2",
  phone: "+14155550000",
};

let testUserToken;
let testUserToken2;
let fakeUserToken;
let message;

/** Tests for messages route */
describe("Messages Routes Test", function () {
  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    const u1 = await User.register(TEST_USER);
    const u2 = await User.register(TEST_USER_2);

    const u1Payload = { username: u1.username };
    testUserToken = jwt.sign(u1Payload, SECRET_KEY);

    const u2Payload = { username: u2.username };
    testUserToken2 = jwt.sign(u2Payload, SECRET_KEY);

    const newMsg = {
      from_username: u1.username,
      to_username: u2.username,
      body: "hello world!",
    };

    message = await Message.create(newMsg);

    const fakeUserPayload = { username: "fakeuser" };
    fakeUserToken = jwt.sign(fakeUserPayload, SECRET_KEY);
  });

  /** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
  describe("/POST /messages/", function() {
    test("can post a message", async function () {
      let response = await request(app)
        .post("/messages/")
        .send({
          "to_username": TEST_USER_2.username,
          "body": "hello world!",
          "_token" : testUserToken
        });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        message: {
          id: expect.any(Number),
          from_username: TEST_USER.username,
          to_username: TEST_USER_2.username,
          body: "hello world!",
          sent_at: expect.any(String)
        }
      })
    })
  })

  /** POST/:id/read - mark message as read:
   *
   *  => {message: {id, read_at}}
   *
   * Makes sure that the only the intended recipient can mark as read.
   *
   **/
  describe("/POST /:id/read", function() {
    test("can read a message", async function () {
      let response = await request(app)
        .post(`/messages/${message.id}/read`)
        .send({
          "_token" : testUserToken2
        })

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        message: {
          id: message.id,
          read_at: expect.any(String)
        }
      })
    })
  })
});

afterAll(async function () {
  await db.end();
});
