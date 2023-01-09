"use strict";

/** User of the site. */

const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const db = require("../db");
const { UnauthorizedError, NotFoundError } = require("../expressError");

class User {
  /** Register new user. Returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const join_at = new Date();
    const last_login_at = new Date();

    const result = await db.query(
      `INSERT INTO users
        (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7)
        RETURNING username, password, first_name, last_name, phone`,
      [
        username,
        hashedPassword,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at,
      ]
    );

    return result.rows[0];
  }

  /** Authenticate: is username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
        FROM users
        WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (user) {
      if ((await bcrypt.compare(password, user.password)) === true) {
        return true;
      }
    }

    // throw new UnauthorizedError("Invalid user/password");
    // Or should we return false here?
    return false;
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    const last_login_at = new Date();

    const result = await db.query(
      `UPDATE users
        SET last_login_at = $1
        WHERE username = $2
        RETURNING username, last_login_at`,
      [last_login_at, username]
    );

    // Question: Should we test again that the user exists?

    return result.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name
        FROM users
        ORDER BY username`
    );

    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
        FROM users
        WHERE username = $1`,
      [username]
    );

    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No such user: ${username}.`);

    return user;
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id,
          m.body,
          m.sent_at,
          m.read_at,
          u.username,
          u.first_name,
          u.last_name,
          u.phone
        FROM messages AS m
          JOIN users as u ON m.to_username = u.username
        WHERE from_username = $1`,
      [username]
    );

    const mappedResults = result.rows.map((r) => {
      return {
        id: r.id,
        to_user: {
          username: r.username,
          first_name: r.first_name,
          last_name: r.last_name,
          phone: r.phone,
        },
        body: r.body,
        sent_at: r.sent_at,
        read_at: r.read_at,
      };
    });

    return mappedResults;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT m.id,
        m.body,
        m.sent_at,
        m.read_at,
        u.username,
        u.first_name,
        u.last_name,
        u.phone
      FROM messages AS m
        JOIN users as u ON m.from_username = u.username
      WHERE to_username = $1`,
      [username]
    );

    const mappedResults = result.rows.map((r) => {
      return {
        id: r.id,
        from_user: {
          username: r.username,
          first_name: r.first_name,
          last_name: r.last_name,
          phone: r.phone,
        },
        body: r.body,
        sent_at: r.sent_at,
        read_at: r.read_at,
      };
    });

    return mappedResults;
  }
}

module.exports = User;
