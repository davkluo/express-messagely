"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const { SECRET_KEY } = require('../config');

const TEST_USER = {
  username: "test1",
  password: "password",
  first_name: "Test1",
  last_name: "Testy1",
  phone: "+14155550000",
};

let testUserToken;
let fakeUserToken;

describe("User Routes Test", function () {

  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");

    const u1 = await User.register(TEST_USER);

    const u1Payload = { username: u1.username };
    testUserToken = jwt.sign(u1Payload, SECRET_KEY);

    const fakeUserPayload = { username: 'fakeuser' };
    fakeUserToken = jwt.sign(fakeUserPayload, SECRET_KEY);
  });

  /** GET /users/ => {users: [{username, first_name, last_name}, ...]} */
  describe('GET /users/', function() {
    test('can get all users', async function() {
      let response = await request(app)
        .get('/users/')
        .query({ _token: testUserToken });

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        users: [{
          username: 'test1',
          first_name: 'Test1',
          last_name: 'Testy1'
        }]
      });
    });
  });

  /** GET /users/:username =>
   * {user: {username, first_name, last_name, phone, join_at, last_login_at}}
   */
  describe('GET /users/:username', function() {
    test('can get specific user', async function() {
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
          last_login_at: expect.any(String)
        }
      });
    });

    test('returns 401 for invalid username in url', async function() {
      let response = await request(app)
        .get(`/users/notauser`)
        .query({ _token: testUserToken });

      expect(response.statusCode).toEqual(401);
    });

    test('returns 401 for invalid token', async function() {
      let response = await request(app)
        .get(`/users/${TEST_USER.username}`)
        .query({ _token: 'FDAJFDKLSJA.DFJASKLFJSA.FDJALKFDSJKA' });

      expect(response.statusCode).toEqual(401);
    });

    test('returns 404 for non-existent user', async function() {
      let response = await request(app)
        .get(`/users/fakeuser`)
        .query({ _token: fakeUserToken });

      expect(response.statusCode).toEqual(404);
    });
  });

  // /** POST /auth/register => token  */

  // describe("POST /auth/register", function () {
  //   test("can register", async function () {
  //     let response = await request(app)
  //       .post("/auth/register")
  //       .send({
  //         username: "bob",
  //         password: "secret",
  //         first_name: "Bob",
  //         last_name: "Smith",
  //         phone: "+14150000000"
  //       });

  //     let token = response.body.token;
  //     expect(jwt.decode(token)).toEqual({
  //       username: "bob",
  //       iat: expect.any(Number)
  //     });
  //   });
  // });

  // /** POST /auth/login => token  */

  // describe("POST /auth/login", function () {
  //   test("can login", async function () {
  //     let response = await request(app)
  //       .post("/auth/login")
  //       .send({ username: "test1", password: "password" });

  //     let token = response.body.token;
  //     expect(jwt.decode(token)).toEqual({
  //       username: "test1",
  //       iat: expect.any(Number)
  //     });
  //   });

  //   test("won't login w/wrong password", async function () {
  //     let response = await request(app)
  //       .post("/auth/login")
  //       .send({ username: "test1", password: "WRONG" });
  //     expect(response.statusCode).toEqual(401);
  //   });

  //   test("won't login w/wrong password", async function () {
  //     let response = await request(app)
  //       .post("/auth/login")
  //       .send({ username: "not-user", password: "password" });
  //     expect(response.statusCode).toEqual(401);
  //   });
  // });
});

afterAll(async function () {
  await db.end();
});
