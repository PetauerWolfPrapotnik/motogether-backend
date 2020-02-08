import bcrypt from 'bcrypt';
import Cryptiles from '@hapi/cryptiles';
import db from '../db.service';
import Joi, { IpOptions } from '@hapi/joi';
import { IDBUser } from './User';
import { getLogger } from 'nodemailer/lib/shared';
import { isObject } from 'util';

export interface ILocation {
  latitude: number;
  longitude: number;
}
export const JoiLocation = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
});

export interface IDBPath {
  id: string;
  owner_id: string;

  title: string;
  description: string;

  start_date: Date;

  location_start: string;
  location_end: string;

  created_at: Date;
  updated_at: Date;
}
export interface IPath extends Omit<IDBPath, 'location_start' | 'location_end' | 'created_at' | 'updated_at'> {
  location_start: ILocation;
  location_end: ILocation;

  created_at: string;
  updated_at: string;
}

export type ICreatePath = Omit<IDBPath, 'id' | 'owner_id' | 'created_at' | 'updated_at'>;

export const parseLocation = (path: string): ILocation => {
  const i1 = path.indexOf(',');

  return {
    latitude: parseFloat(path.substr(1, i1 - 1)),
    longitude: parseFloat(path.substr(i1 + 1, path.length - i1 - 2))
  };
};

export const view = (path: IDBPath) => ({
  id: path.id,
  owner_id: path.owner_id,

  title: path.title,
  description: path.description,

  start_date: path.start_date.toISOString(),

  location_start: parseLocation(path.location_start),
  location_end: parseLocation(path.location_end),

  created_at: path.created_at.toISOString(),
  updated_at: path.updated_at.toISOString(),
});



export const getPaths = ({ limit, skip }: { skip: number, limit: number; }): Promise<IDBPath[]> =>
  db.query('SELECT * FROM paths OFFSET $1 LIMIT $2', [skip, limit]).then((rows) => rows.rows);

export const getPath = (id: string): Promise<IDBPath | null> =>
  db.query('SELECT * FROM paths WHERE id=$1', [id]).then((rows) => rows.rows[0] || null);

export const createPath = (path: ICreatePath, user: IDBUser): Promise<IDBPath> =>
  db.query(
    'INSERT INTO paths (owner_id, title, description, start_date, location_start, location_end) VALUES ($1, $2, $3, $4, ROW($5, $6), ROW($7, $8)) RETURNING *',
    [
      user.id,
      path.title,
      path.description,
      path.start_date,
      ...Object.values(parseLocation(path.location_start)),
      ...Object.values(parseLocation(path.location_end)),
    ]
  ).then((rows) => rows.rows[0] || null);

export const updatePath = (id: string, user: Partial<IPath>) => {
  let offset = 0;
  let query = 'UPDATE paths SET ' + Object.keys(user).map((key, i) =>
    isObject((user as any)[key])
      ? `${key}=ROW(\$${i + 2 + (offset++)}, \$${i + 2 + offset})`
      : `${key}=\$${i + 2 + offset}`).join(', ')
    + ' WHERE id=$1';
  const data = Object.values(user).reduce((agg, v: any) => agg.concat(isObject(v) ? Object.values(v) : [v]), [] as any[]);

  return db.query(query, [id, ...data])
    .then((result) => result.rowCount !== 0);
};

export const deletePath = (id: string) =>
  db.query('DELETE FROM paths WHERE id=$1 RETURNING *', [id])
    .then((rows) => rows.rows[0] || null);
export const getOwner = (id: string) =>
  db.query('SELECT id FROM paths WHERE owner_id=$1', [id]).then((result) => result.rowCount === 1);
