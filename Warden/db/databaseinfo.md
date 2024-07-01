# Database Info

Warden interfaces with a PostgreSQL database for storing and managing persistent information. This is a shared database with Sentry API.

https://github.com/antixenoinitiative/sentry.api

## Tables

CREATE TABLE systems (
    system_id       SERIAL PRIMARY KEY,
    name            VARCHAR(50),
    status          bool,
    presence        int
);
CREATE TABLE incursions (
    inc_id          SERIAL PRIMARY KEY,
    system_id       int,
    time            bigint
);
CREATE TABLE presence (
    system_id       int,
    presence_lvl    int,
    time            bigint
);
CREATE TABLE incursionV2 (
    inc_id          SERIAL PRIMARY KEY,
    system_id       int,
    week            int,
    time            bigint,
);
CREATE TABLE backups(
    id              SERIAL PRIMARY KEY,
    data            text[],
    timestamp       bigint
);
CREATE TABLE club10(
    id              SERIAL PRIMARY KEY,
    user_id         text,
    name            text,
    avatar            text,
    timestamp       bigint
);
CREATE TABLE events(
    event_id        text,
    embed_id        text,
    name            text,
    description     text,
    creator         text,
    enrolled        text[],
    date            bigint,
);

CREATE TABLE carriers(
    fcid            text PRIMARY KEY,
    fcname          text,
    user_id         text,
    mission         text,
    approval        bool,
);

## Tables (Leaderboard DB)

CREATE TABLE speedrun(
    id              SERIAL PRIMARY KEY,
    user_id         text,
    name            text,
    time            int,
    class           text,
    ship            text,
    variant         text,
    link            text,
    approval        bool,
    date            bigint,
);

CREATE TABLE ace(
    id              SERIAL PRIMARY KEY,
    user_id         text,
    name            text,
    timetaken       int,
    mgauss          int,
    sgauss          int,
    mgaussfired     int,
    sgaussfired     int,
    percenthulllost int,
    score           decimal,
    link            text,
    approval        bool,
    date            bigint,
);

CREATE TABLE activity(
    id              SERIAL PRIMARY KEY,
    sys_name        text,
    density         text,
    x_coord         text,
    y_coord         text,
    dist_merope     decimal,
    date            bigint,
);