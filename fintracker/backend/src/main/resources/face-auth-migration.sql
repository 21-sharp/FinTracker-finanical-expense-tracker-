USE fintrack;

ALTER TABLE users
  MODIFY COLUMN profile_picture LONGTEXT,
  MODIFY COLUMN face_embedding LONGTEXT,
  MODIFY COLUMN face_enabled BOOLEAN DEFAULT FALSE;
