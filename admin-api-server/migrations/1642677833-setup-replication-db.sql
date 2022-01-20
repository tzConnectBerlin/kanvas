-- Migration: setup-replication-db
-- Created at: 2022-01-20 12:23:53
-- ====  UP  ====

CREATE DATABASE store_replication;

-- ==== DOWN ====

DELETE DATABASE store_replication;
