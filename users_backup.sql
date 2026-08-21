--
-- PostgreSQL database dump
--

\restrict mCVYGMlMbTLBcG4glbk4alJc8tMdhy8qMJQf5HLo7bWIk0Cn1j8DiOcVAUmw7Fn

-- Dumped from database version 16.12
-- Dumped by pg_dump version 16.12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying(100) NOT NULL,
    username character varying(50) NOT NULL,
    full_name character varying(100) NOT NULL,
    nik character varying(50) NOT NULL,
    department character varying(50) NOT NULL,
    role character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, full_name, nik, department, role, password_hash, is_active, created_at, updated_at) FROM stdin;
user_1774596390430_bxl1b24	fah123	Zulfahmi Nafiis	0019	general-affairs	inspector-ga	$2b$10$G5zLkQcLSffqCgtneiEW1ea4kuyCPD.lYHP9VHr1AwKTyyAOnDN1.	t	2026-03-27 14:26:30.432247	2026-03-27 14:26:30.432247
admin-123451	admin	Admin	123451	general-affairs	admin	$2b$10$cEjbLBqL8uPkO1W5Qn0uvurUe2Z0nWcbydGIDEhG.YIsqGwxK2neO	t	2026-03-27 15:03:56.086515	2026-03-27 15:03:56.086515
\.


--
-- Name: users users_nik_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_nik_key UNIQUE (nik);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_users_department; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_department ON public.users USING btree (department);


--
-- Name: idx_users_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- PostgreSQL database dump complete
--

\unrestrict mCVYGMlMbTLBcG4glbk4alJc8tMdhy8qMJQf5HLo7bWIk0Cn1j8DiOcVAUmw7Fn

