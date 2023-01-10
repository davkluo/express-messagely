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

describe("User Routes Test", function () {
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

    message = Message.create(newMsg);

    const fakeUserPayload = { username: "fakeuser" };
    fakeUserToken = jwt.sign(fakeUserPayload, SECRET_KEY);
  });

  /** GET /users/ => {users: [{username, first_name, last_name}, ...]} */
  describe("GET /users/", function () {
    test("can get all users", async function () {
      let response = await request(app)
        .get("/users/")
        .query({ _token: testUserToken });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        users: [
          {
            username: "test1",
            first_name: "Test1",
            last_name: "Testy1",
          },
          {
            username: "test2",
            first_name: "Test2",
            last_name: "Testy2",
          },
        ],
      });
    });
  });

  /** GET /users/:username =>
   * {user: {username, first_name, last_name, phone, join_at, last_login_at}}
   */
  describe("GET /users/:username", function () {
    test("can get specific user", async function () {
      let response = await request(app)
        .get(`/users/${TEST_USER.username}`)
        .query({ _token: testUserToken });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        user: {
          username: TEST_USER.username,
          first_name: TEST_USER.first_name,
          last_name: TEST_USER.last_name,
          phone: TEST_USER.phone,
          join_at: expect.any(String),
          last_login_at: expect.any(String),
        },
      });
    });

    test("returns 401 for invalid username in url", async function () {
      let response = await request(app)
        .get(`/users/notauser`)
        .query({ _token: testUserToken });

      expect(response.statusCode).toEqual(401);
    });

    test("returns 401 for invalid token", async function () {
      let response = await request(app)
        .get(`/users/${TEST_USER.username}`)
        .query({ _token: "FDAJFDKLSJA.DFJASKLFJSA.FDJALKFDSJKA" });

      expect(response.statusCode).toEqual(401);
    });

    test("returns 404 for non-existent user", async function () {
      let response = await request(app)
        .get(`/users/fakeuser`)
        .query({ _token: fakeUserToken });

      expect(response.statusCode).toEqual(404);
    });
  });

  /** GET /:username/to - get messages to user
   * {messages: [{id,
   *                 body,
   *                 sent_at,
   *                 read_at,
   *                 from_user: {username, first_name, last_name, phone}}**/

  describe("GET /:username/to", function () {
    test("can get messages to user", async function () {
      let response = await request(app)
        .get(`/users/test2/to`)
        .query({ _token: testUserToken2 });

      expect(response.statusCode).toEqual(200);

      expect(response.body).toEqual({
        messages: [
          {
            id: expect.any(Number),
            from_user: {
              username: "test1",
              first_name: "Test1",
              last_name: "Testy1",
              phone: "+14155550000",
            },
            body: "hello world!",
            sent_at: expect.any(String),
            read_at: null,
          },
        ],
      });
    });
  });

  /** GET /:username/from - get messages from user
   * {messages: [{id,
   *                 body,
   *                 sent_at,
   *                 read_at,
   *                 to_user: {username, first_name, last_name, phone}}**/

  describe("GET /:username/from", function () {
    test("can get messages from user", async function () {
      let response = await request(app)
        .get(`/users/test1/from`)
        .query({ _token: testUserToken });

      expect(response.statusCode).toEqual(200);

      expect(response.body).toEqual({
        messages: [
          {
            id: expect.any(Number),
            to_user: {
              username: "test2",
              first_name: "Test2",
              last_name: "Testy2",
              phone: "+14155550000",
            },
            body: "hello world!",
            sent_at: expect.any(String),
            read_at: null,
          },
        ],
      });
    });
  });
});

afterAll(async function () {
  await db.end();
});
