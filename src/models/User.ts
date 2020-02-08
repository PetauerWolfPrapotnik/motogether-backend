import bcrypt from 'bcrypt';
import Cryptiles from '@hapi/cryptiles';
import db from '../db.service';
import Joi from '@hapi/joi';

export interface IUser {
  id: string;

  first_name: string;
  last_name: string;
  nickname?: string;

  email: string;
  email_verified: boolean;

  created_at: string;
  updated_at: string;
}
export interface IDBUser extends Omit<IUser, 'created_at' | 'updated_at'> {
  password_hash: string;

  created_at: Date;
  updated_at: Date;
}
export type IRegisterUser = Omit<IUser, 'id' | 'created_at' | 'updated_at' | 'email_verified'>;

export interface IToken {
  id: string;
  token: string;

  // Binded data
  user_id: string;

  // Extra
  created_at: string;
}

export const createToken = (user: IDBUser): Promise<string | null> =>
  db.query('INSERT INTO tokens (token, user_id) VALUES ($1, $2) RETURNING *', [Cryptiles.randomString(32), user.id])
    .then((result) => result.rows[0]?.token || null);

export const createUser = async (user: IRegisterUser, password: string): Promise<IDBUser | null> =>
  db.query('INSERT INTO users (email, first_name, last_name, nickname, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [
      user.email,
      user.first_name,
      user.last_name,
      user.nickname,
      await bcrypt.hash(password, await bcrypt.genSalt(10))
    ]).then((result) => result.rows[0] || null);
export const changePassword = async (user: IDBUser, password: string) =>
  db.query('UPDATE users SET password_hash=$2 WHERE id=$1', [
    user.id,
    await bcrypt.hash(password, await bcrypt.genSalt(10))
  ])
    .then((result) => result.rowCount !== 0);

export const findByID = (id: string): Promise<IDBUser | null> =>
  db.query('SELECT * FROM users WHERE id=$1 LIMIT 1', [id]).then((result) => result.rows[0] || null);
export const findByEmail = (email: string): Promise<IDBUser | null> =>
  db.query('SELECT * FROM users WHERE email=$1 LIMIT 1', [email]).then((result) => result.rows[0] || null);
export const isEmailTaken = (email: string): Promise<boolean> =>
  db.query('SELECT id FROM users WHERE email=$1', [email]).then((result) => result.rowCount === 1);
export const isUserVerified = (email: string): Promise<boolean> =>
  db.query('SELECT id FROM users WHERE email=$1 AND email_verified=true', [email]).then((result) => result.rowCount === 1);
export const verifyUserByToken = (token: string): Promise<boolean> =>
  db.query('UPDATE users SET email_verified = true WHERE id IN (SELECT user_id FROM tokens WHERE token=$1);',
    [token])
    .then((result) => result.rowCount !== 0);
export const removeToken = (token: string) =>
  db.query('DELETE FROM tokens WHERE token=$1',
    [token])
    .then((result) => result.rowCount === 1);
export const updateUser = (id: string, user: Partial<IUser>) => {
  let query = 'UPDATE users SET ' + Object.keys(user).map((key, i) => `${key}=\$${i + 2}`).join(', ') + ' WHERE id=$1';
  const data = Object.values(user);
  return db.query(query, [id, ...data])
    .then((result) => result.rowCount !== 0);
};
export const getTokenForEmail = (email: string): Promise<string | null> =>
  db.query('SELECT token FROm tokens WHERE user_id IN (SELECT id FROM users WHERE email=$1)', [email])
    .then((result) => result.rows[0]?.token || null);

export const checkPassword = async (user: IDBUser, password: string) => await bcrypt.compare(password, user.password_hash);
export const view = (user: IDBUser): IUser => ({
  id: user.id,

  first_name: user.first_name,
  last_name: user.last_name,
  nickname: user.nickname,

  email: user.email,
  email_verified: user.email_verified,

  created_at: user.created_at.toISOString(),
  updated_at: user.updated_at.toISOString(),
});
export const JoiView = Joi.object({
  id: Joi.string(),
  first_name: Joi.string(),
  last_name: Joi.string(),
  nickname: Joi.string().allow(null),
  email: Joi.string(),
  email_verified: Joi.boolean(),
  created_at: Joi.string().isoDate(),
  updated_at: Joi.string().isoDate(),
});

//
// Creation
//
/*
const create = () => knex.schema.createTable('users', (table) => {
  table.increments('id');

  table.string('first_name');
  table.string('last_name');
  table.string('nickname');

  table.string('email');
  table.boolean('email_verified');

  table.string('password_hash');

  table.timestamp('created_at').defaultTo('NOW()');
  table.timestamp('updated_at').defaultTo('NOW()');
});*/

if (require.main === module) {
  (async () => {
    // console.log(await isEmailTaken('tim.prapotnik@sers.si'));
    // await create();
    await db.connect();
    console.log(await isEmailTaken('tim.prapotnik@sers.si'));

    /*console.log(await createUser({
      first_name: 'Tim',
      last_name: 'Prapotnik',
      // nickname: 'audioXD',

      email: 'tim.prapotnik@sers.si',
      // email_verified: true,
    }, 'tim12345'));*/
    // console.log(JSON.stringify(await findByID(1)));



  })();
  // create()
  // findByID(1).then(() => console.log('Created')).catch(console.error);
}
