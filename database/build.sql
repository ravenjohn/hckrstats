drop database if exists hckrstats;
create database hckrstats;
use hckrstats;

drop table if exists hackathons;
CREATE TABLE hackathons(
	_id varchar(64) primary key,
	created_at bigint(15)  not null,
	updated_at bigint(15)
);
