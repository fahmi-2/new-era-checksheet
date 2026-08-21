--
-- PostgreSQL database dump
--

\restrict 4jPyfPG7cpEIcHHDclSeq4GTkQIQAQRXOhpDwTb3FfpaNifNtafx2UXwZUR06oI

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

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

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, full_name, nik, department, role, password_hash, is_active, created_at, last_seen_at, is_online, total_logins, last_login_at, last_login_ip) FROM stdin;
user_1770691355267_7372v0o	fah123	Zulfahmi Nafiis Suffi	3501043005050001	general-affairs	inspector-ga	$2b$10$TzGos11S/ZyUHXzOY8JVbuSKfO68eVGAnDsa7.AMvmszupXQ8ktLS	t	2026-02-10 09:42:35.269419	\N	f	0	\N	\N
user_1771917203618_jxdi76l	inspector-fahmi	Fahmi	21331451351	general-affairs	inspector-ga	$2b$10$xdn82fpk0qP1rZzIHG2/Y.DtQRdXzo1.vncp13QiEfzLDY7ua4li6	t	2026-02-24 14:13:23.619271	\N	f	0	\N	\N
user_1773196167864_p6pyi1k	Dahana	Dahana Pratama	17530	general-affairs	inspector-ga	$2b$10$58gDdP4vh9LFa.4AcaLPF.D.IghzJbcyEq3HCNpxN01ZLt.wGbIF2	t	2026-03-11 09:29:27.865223	\N	f	0	\N	\N
admin-123451	admin	Admin	123451	general-affairs	admin	$2b$10$inNZYJ8qYAIx4L/fdVmju.IWuAefOVsW.8dSAk7fiAYOCIkv6Zbcu	t	2026-03-12 08:27:33.273039	\N	f	0	\N	\N
user_1777349498162_mgi9oen	test	Zulfahmi Nafiis Suffi	123123	general-affairs	inspector-ga	$2b$10$dE4XRf9FGBKXh45Cztz/cONF5c.J8I6W0KTv7BAIbX.pVIQmCJq5O	t	2026-04-28 11:11:38.165032	\N	f	0	\N	\N
user_1777439939300_4b05zl2	user1	us	123213	general-affairs	inspector-ga-fire	$2b$10$.EdVjFz/zfRc50pz0lZnf.Bmdtg8zxHhmaHWUJsP0FZDvC.5HcwcC	t	2026-04-29 12:18:59.306892	\N	f	0	\N	\N
user_1777525567748_ujao0f9	usertoilet	agung	1232131	general-affairs	inspector-ga-facility	$2b$10$BFueNzoXOZGXGv3cg2FIbuCyKjM2msi.gTvKU.TlC.LHNKxegaBs2	t	2026-04-30 12:06:07.749926	\N	f	0	\N	\N
user_1777526239953_5myftgp	userperalatan	agus	12312351	general-affairs	inspector-ga-equipment	$2b$10$bZwTBvboUOvBP/DIQowr1eTV7kvYt9xUBKz0tEq81ekjRzAY3pzfe	t	2026-04-30 12:17:19.954761	\N	f	0	\N	\N
user_1777526291314_yekx2hj	userlistrik	agung hapsah	1231123123	general-affairs	inspector-ga-electrical	$2b$10$I0HKCm416CpxEBOhWjj7M.XfhIAoWlwhImWWekK8FU/qkNlshPjH6	t	2026-04-30 12:18:11.316819	\N	f	0	\N	\N
user_1777526329720_3zldg1m	userapd	syahirini	1441241312	general-affairs	inspector-ga-personal	$2b$10$z6cXWf0Q/IpYFIUmgOCPfuHLhUcJfb3jXIyU6qqnZOI5PoX5YQnZK	t	2026-04-30 12:18:49.721577	\N	f	0	\N	\N
\.


--
-- PostgreSQL database dump complete
--

\unrestrict 4jPyfPG7cpEIcHHDclSeq4GTkQIQAQRXOhpDwTb3FfpaNifNtafx2UXwZUR06oI

