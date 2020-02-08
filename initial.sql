create extension "uuid-ossp";

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--
-- Users
--

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),

  email VARCHAR NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false ,

  password_hash VARCHAR NOT NULL,

  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  nickname VARCHAR,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER users_set_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


--
-- Token
--

CREATE TABLE tokens (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR NOT NULL UNIQUE,

  user_id uuid NOT NULL REFERENCES users(id),

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

--
-- Path
--

CREATE TYPE Location AS (
  latitude       double precision,
  longitude       double precision
);

CREATE TABLE paths (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id),

  title VARCHAR NOT NULL,
  description TEXT NOT NULL,

  start_date TIMESTAMP NOT NULL,

  location_start Location NOT NULL,
  location_end Location NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TRIGGER paths_set_timestamp
BEFORE UPDATE ON paths
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();


CREATE TABLE path_followers (
  path_id UUID NOT NULL REFERENCES paths(id),
  user_id UUID NOT NULL REFERENCES users(id),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  PRIMARY KEY(path_id, user_id)
);
