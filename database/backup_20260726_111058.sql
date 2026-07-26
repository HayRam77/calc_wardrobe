--
-- PostgreSQL database dump
--

\restrict LKq2oMWubLszwfL9rPAUCLi9spRc2wID7yl3Z3IKdUTbvwImT8T5Wo1YB3emZoo

-- Dumped from database version 17.9 (Debian 17.9-0+deb13u1)
-- Dumped by pg_dump version 17.9 (Debian 17.9-0+deb13u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_modified_column() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: block_template_materials; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.block_template_materials (
    id integer NOT NULL,
    block_template_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.block_template_materials OWNER TO hrroot;

--
-- Name: block_template_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.block_template_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.block_template_materials_id_seq OWNER TO hrroot;

--
-- Name: block_template_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.block_template_materials_id_seq OWNED BY public.block_template_materials.id;


--
-- Name: block_templates; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.block_templates (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    type_id integer,
    manufacturer_id integer,
    article character varying(255),
    price numeric(10,2),
    labor numeric(10,2),
    weight_grams numeric(10,2),
    power_watts numeric(10,2),
    url character varying(500),
    description text,
    ln character varying(100),
    tm character varying(100),
    "position" integer DEFAULT 0
);


ALTER TABLE public.block_templates OWNER TO hrroot;

--
-- Name: block_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.block_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.block_templates_id_seq OWNER TO hrroot;

--
-- Name: block_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.block_templates_id_seq OWNED BY public.block_templates.id;


--
-- Name: cabinet_systems; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.cabinet_systems (
    id integer NOT NULL,
    cabinet_id integer NOT NULL,
    name character varying(255),
    description text,
    system_id integer,
    "position" integer DEFAULT 0
);


ALTER TABLE public.cabinet_systems OWNER TO hrroot;

--
-- Name: cabinet_systems_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.cabinet_systems_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cabinet_systems_id_seq OWNER TO hrroot;

--
-- Name: cabinet_systems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.cabinet_systems_id_seq OWNED BY public.cabinet_systems.id;


--
-- Name: cabinets; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.cabinets (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    project_id integer,
    user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    description text,
    width numeric(10,2),
    height numeric(10,2),
    depth numeric(10,2)
);


ALTER TABLE public.cabinets OWNER TO hrroot;

--
-- Name: cabinets_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.cabinets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cabinets_id_seq OWNER TO hrroot;

--
-- Name: cabinets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.cabinets_id_seq OWNED BY public.cabinets.id;


--
-- Name: component_param_values; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.component_param_values (
    id integer NOT NULL,
    component_id integer,
    param_id integer,
    value text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.component_param_values OWNER TO hrroot;

--
-- Name: component_param_values_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.component_param_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.component_param_values_id_seq OWNER TO hrroot;

--
-- Name: component_param_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.component_param_values_id_seq OWNED BY public.component_param_values.id;


--
-- Name: component_types; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.component_types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "position" integer DEFAULT 0
);


ALTER TABLE public.component_types OWNER TO hrroot;

--
-- Name: component_types_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.component_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.component_types_id_seq OWNER TO hrroot;

--
-- Name: component_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.component_types_id_seq OWNED BY public.component_types.id;


--
-- Name: manufacturers; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.manufacturers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    country character varying(100),
    website character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "position" integer DEFAULT 0
);


ALTER TABLE public.manufacturers OWNER TO hrroot;

--
-- Name: manufacturers_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.manufacturers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.manufacturers_id_seq OWNER TO hrroot;

--
-- Name: manufacturers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.manufacturers_id_seq OWNED BY public.manufacturers.id;


--
-- Name: materials; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.materials (
    id integer NOT NULL,
    article character varying(100),
    name character varying(255) NOT NULL,
    manufacturer character varying(255),
    description text,
    unit character varying(50),
    price numeric(15,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    manufacturer_id integer,
    manufacturer_url character varying(500),
    ln character varying(100),
    tm character varying(100),
    "position" integer DEFAULT 0
);


ALTER TABLE public.materials OWNER TO hrroot;

--
-- Name: materials_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.materials_id_seq OWNER TO hrroot;

--
-- Name: materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.materials_id_seq OWNED BY public.materials.id;


--
-- Name: parameters; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.parameters (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    unit character varying(50),
    type character varying(50),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "position" integer DEFAULT 0
);


ALTER TABLE public.parameters OWNER TO hrroot;

--
-- Name: parameters_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.parameters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.parameters_id_seq OWNER TO hrroot;

--
-- Name: parameters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.parameters_id_seq OWNED BY public.parameters.id;


--
-- Name: project_blocks; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.project_blocks (
    id integer NOT NULL,
    project_id integer,
    cabinet_id integer,
    template_id integer,
    "position" integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    quantity integer DEFAULT 1,
    linked boolean DEFAULT false
);


ALTER TABLE public.project_blocks OWNER TO hrroot;

--
-- Name: project_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.project_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_blocks_id_seq OWNER TO hrroot;

--
-- Name: project_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.project_blocks_id_seq OWNED BY public.project_blocks.id;


--
-- Name: project_materials; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.project_materials (
    id integer NOT NULL,
    project_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cabinet_id integer,
    linked boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.project_materials OWNER TO hrroot;

--
-- Name: project_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.project_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_materials_id_seq OWNER TO hrroot;

--
-- Name: project_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.project_materials_id_seq OWNED BY public.project_materials.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "position" integer DEFAULT 0
);


ALTER TABLE public.projects OWNER TO hrroot;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO hrroot;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: system_block_links; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.system_block_links (
    id integer NOT NULL,
    system_component_id integer NOT NULL,
    block_template_id integer NOT NULL,
    quantity integer DEFAULT 1,
    "position" integer DEFAULT 0
);


ALTER TABLE public.system_block_links OWNER TO hrroot;

--
-- Name: system_block_links_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.system_block_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_block_links_id_seq OWNER TO hrroot;

--
-- Name: system_block_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.system_block_links_id_seq OWNED BY public.system_block_links.id;


--
-- Name: system_component_materials; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.system_component_materials (
    id integer NOT NULL,
    system_component_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "position" integer DEFAULT 0
);


ALTER TABLE public.system_component_materials OWNER TO hrroot;

--
-- Name: system_component_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.system_component_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_component_materials_id_seq OWNER TO hrroot;

--
-- Name: system_component_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.system_component_materials_id_seq OWNED BY public.system_component_materials.id;


--
-- Name: system_component_params; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.system_component_params (
    id integer NOT NULL,
    component_id integer NOT NULL,
    parameter_id integer NOT NULL,
    value character varying(255),
    type character varying(50)
);


ALTER TABLE public.system_component_params OWNER TO hrroot;

--
-- Name: system_component_params_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.system_component_params_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_component_params_id_seq OWNER TO hrroot;

--
-- Name: system_component_params_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.system_component_params_id_seq OWNED BY public.system_component_params.id;


--
-- Name: system_component_type_blocks; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.system_component_type_blocks (
    id integer NOT NULL,
    type_id integer NOT NULL,
    block_template_id integer NOT NULL,
    quantity integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_component_type_blocks OWNER TO hrroot;

--
-- Name: system_component_type_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.system_component_type_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_component_type_blocks_id_seq OWNER TO hrroot;

--
-- Name: system_component_type_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.system_component_type_blocks_id_seq OWNED BY public.system_component_type_blocks.id;


--
-- Name: system_component_type_materials; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.system_component_type_materials (
    id integer NOT NULL,
    type_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_component_type_materials OWNER TO hrroot;

--
-- Name: system_component_type_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.system_component_type_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_component_type_materials_id_seq OWNER TO hrroot;

--
-- Name: system_component_type_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.system_component_type_materials_id_seq OWNED BY public.system_component_type_materials.id;


--
-- Name: system_component_types; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.system_component_types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    "position" integer DEFAULT 0
);


ALTER TABLE public.system_component_types OWNER TO hrroot;

--
-- Name: system_component_types_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.system_component_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_component_types_id_seq OWNER TO hrroot;

--
-- Name: system_component_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.system_component_types_id_seq OWNED BY public.system_component_types.id;


--
-- Name: system_components; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.system_components (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    type_id integer NOT NULL,
    manufacturer_id integer,
    article character varying(255),
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    url character varying(500),
    module_id integer,
    ln character varying(100),
    tm character varying(100),
    "position" integer DEFAULT 0
);


ALTER TABLE public.system_components OWNER TO hrroot;

--
-- Name: system_components_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.system_components_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_components_id_seq OWNER TO hrroot;

--
-- Name: system_components_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.system_components_id_seq OWNED BY public.system_components.id;


--
-- Name: system_components_link; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.system_components_link (
    id integer NOT NULL,
    system_id integer NOT NULL,
    component_id integer NOT NULL,
    quantity integer DEFAULT 1,
    "position" integer DEFAULT 0
);


ALTER TABLE public.system_components_link OWNER TO hrroot;

--
-- Name: system_components_link_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.system_components_link_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_components_link_id_seq OWNER TO hrroot;

--
-- Name: system_components_link_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.system_components_link_id_seq OWNED BY public.system_components_link.id;


--
-- Name: system_modules; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.system_modules (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "position" integer DEFAULT 0
);


ALTER TABLE public.system_modules OWNER TO hrroot;

--
-- Name: system_modules_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.system_modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_modules_id_seq OWNER TO hrroot;

--
-- Name: system_modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.system_modules_id_seq OWNED BY public.system_modules.id;


--
-- Name: system_parameter_types; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.system_parameter_types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    value text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    "position" integer
);


ALTER TABLE public.system_parameter_types OWNER TO hrroot;

--
-- Name: system_parameter_types_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.system_parameter_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_parameter_types_id_seq OWNER TO hrroot;

--
-- Name: system_parameter_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.system_parameter_types_id_seq OWNED BY public.system_parameter_types.id;


--
-- Name: system_parameters; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.system_parameters (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    value character varying(255),
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    type character varying(50),
    ln numeric,
    tm numeric,
    "position" integer DEFAULT 0
);


ALTER TABLE public.system_parameters OWNER TO hrroot;

--
-- Name: system_parameters_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.system_parameters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_parameters_id_seq OWNER TO hrroot;

--
-- Name: system_parameters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.system_parameters_id_seq OWNED BY public.system_parameters.id;


--
-- Name: systems; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.systems (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now(),
    "position" integer DEFAULT 0,
    room character varying(255),
    installation text,
    page character varying(255)
);


ALTER TABLE public.systems OWNER TO hrroot;

--
-- Name: systems_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.systems_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.systems_id_seq OWNER TO hrroot;

--
-- Name: systems_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.systems_id_seq OWNED BY public.systems.id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id integer,
    token text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_sessions OWNER TO hrroot;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_id_seq OWNER TO hrroot;

--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- Name: user_table_sort; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.user_table_sort (
    id integer NOT NULL,
    user_id integer,
    table_name character varying(100) NOT NULL,
    sort_order jsonb DEFAULT '[]'::jsonb,
    sort_key character varying(50),
    sort_dir character varying(10) DEFAULT 'asc'::character varying,
    filter_data jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_table_sort OWNER TO hrroot;

--
-- Name: user_table_sort_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.user_table_sort_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_table_sort_id_seq OWNER TO hrroot;

--
-- Name: user_table_sort_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.user_table_sort_id_seq OWNED BY public.user_table_sort.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY (ARRAY[('user'::character varying)::text, ('admin'::character varying)::text])))
);


ALTER TABLE public.users OWNER TO hrroot;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO hrroot;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: block_template_materials id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.block_template_materials ALTER COLUMN id SET DEFAULT nextval('public.block_template_materials_id_seq'::regclass);


--
-- Name: block_templates id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.block_templates ALTER COLUMN id SET DEFAULT nextval('public.block_templates_id_seq'::regclass);


--
-- Name: cabinet_systems id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.cabinet_systems ALTER COLUMN id SET DEFAULT nextval('public.cabinet_systems_id_seq'::regclass);


--
-- Name: cabinets id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.cabinets ALTER COLUMN id SET DEFAULT nextval('public.cabinets_id_seq'::regclass);


--
-- Name: component_param_values id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.component_param_values ALTER COLUMN id SET DEFAULT nextval('public.component_param_values_id_seq'::regclass);


--
-- Name: component_types id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.component_types ALTER COLUMN id SET DEFAULT nextval('public.component_types_id_seq'::regclass);


--
-- Name: manufacturers id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.manufacturers ALTER COLUMN id SET DEFAULT nextval('public.manufacturers_id_seq'::regclass);


--
-- Name: materials id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.materials ALTER COLUMN id SET DEFAULT nextval('public.materials_id_seq'::regclass);


--
-- Name: parameters id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.parameters ALTER COLUMN id SET DEFAULT nextval('public.parameters_id_seq'::regclass);


--
-- Name: project_blocks id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_blocks ALTER COLUMN id SET DEFAULT nextval('public.project_blocks_id_seq'::regclass);


--
-- Name: project_materials id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_materials ALTER COLUMN id SET DEFAULT nextval('public.project_materials_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: system_block_links id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_block_links ALTER COLUMN id SET DEFAULT nextval('public.system_block_links_id_seq'::regclass);


--
-- Name: system_component_materials id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_materials ALTER COLUMN id SET DEFAULT nextval('public.system_component_materials_id_seq'::regclass);


--
-- Name: system_component_params id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_params ALTER COLUMN id SET DEFAULT nextval('public.system_component_params_id_seq'::regclass);


--
-- Name: system_component_type_blocks id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_type_blocks ALTER COLUMN id SET DEFAULT nextval('public.system_component_type_blocks_id_seq'::regclass);


--
-- Name: system_component_type_materials id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_type_materials ALTER COLUMN id SET DEFAULT nextval('public.system_component_type_materials_id_seq'::regclass);


--
-- Name: system_component_types id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_types ALTER COLUMN id SET DEFAULT nextval('public.system_component_types_id_seq'::regclass);


--
-- Name: system_components id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_components ALTER COLUMN id SET DEFAULT nextval('public.system_components_id_seq'::regclass);


--
-- Name: system_components_link id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_components_link ALTER COLUMN id SET DEFAULT nextval('public.system_components_link_id_seq'::regclass);


--
-- Name: system_modules id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_modules ALTER COLUMN id SET DEFAULT nextval('public.system_modules_id_seq'::regclass);


--
-- Name: system_parameter_types id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_parameter_types ALTER COLUMN id SET DEFAULT nextval('public.system_parameter_types_id_seq'::regclass);


--
-- Name: system_parameters id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_parameters ALTER COLUMN id SET DEFAULT nextval('public.system_parameters_id_seq'::regclass);


--
-- Name: systems id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.systems ALTER COLUMN id SET DEFAULT nextval('public.systems_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Name: user_table_sort id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.user_table_sort ALTER COLUMN id SET DEFAULT nextval('public.user_table_sort_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: block_template_materials; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.block_template_materials (id, block_template_id, material_id, quantity, created_at) FROM stdin;
6	7	16	1	2026-07-16 20:10:26.97324
\.


--
-- Data for Name: block_templates; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.block_templates (id, name, created_at, updated_at, type_id, manufacturer_id, article, price, labor, weight_grams, power_watts, url, description, ln, tm, "position") FROM stdin;
54	SystemeHD	2026-07-17 23:16:39.74921	2026-07-24 19:30:08.105146	1	1	HD1407	124500.00	\N	600.00	14.00	https://api.systeme.ru/catalog/view/HD1407	Контроллер SystemeHD	27	1	6
56	SystemeHD	2026-07-17 23:18:20.330472	2026-07-24 19:30:08.105146	1	1	HD1407E	149500.00	\N	600.00	14.00	https://api.systeme.ru/catalog/view/HD1407E	Контроллер SystemeHD, 6DI 8UI 3DO 2AO 2VO, 2Ethernet 2RS485 BACnet Modbus ~24В/=24В	26	\N	3
61	Автоматический выключатель 10A 400В	2026-07-17 23:18:20.338828	2026-07-24 19:30:08.105146	32	1	S9F21310	4240.00	\N	\N	\N	https://api.systeme.ru/catalog/view/S9F21310	Systeme9 Автоматический выключатель (АВ) B 10A 3P 6kA 400В	\N	\N	5
7	Реле 230V	2026-06-29 19:08:37.99461	2026-07-19 22:22:57.100864	29	1	SXG22P7	1003.00	\N	19.00	\N	https://systeme.ru/product/SXG22P7	Реле 8A 2CO 230VAC тест кнопка LED	8	15	7
60	Автоматический выключатель 6A 400В	2026-07-17 23:18:20.337576	2026-07-19 22:22:57.101382	32	1	S9F21306	3320.00	\N	\N	\N	https://api.systeme.ru/catalog/view/S9F21306	Systeme9 Автоматический выключатель (АВ) B 6A 3P 6kA 400В	\N	\N	8
59	Автоматический выключатель 16A 230В	2026-07-17 23:18:20.336092	2026-07-19 22:22:57.094026	32	1	S9F21116	1070.00	\N	\N	\N	https://api.systeme.ru/catalog/view/S9F21116	Systeme9 Автоматический выключатель (АВ) B 16A 1P 6kA 230В	\N	\N	0
58	Автоматический выключатель 10A 230В	2026-07-17 23:18:20.333565	2026-07-19 22:22:57.096292	32	1	S9F21110	1180.00	\N	\N	\N	https://api.systeme.ru/catalog/view/S9F21110	Systeme9 Автоматический выключатель (АВ) B 10A 1P 6kA 230В	\N	\N	1
57	Автоматический выключатель 6A 230В	2026-07-17 23:18:20.331737	2026-07-19 22:22:57.096968	32	1	S9F21106	1280.00	\N	\N	\N	https://api.systeme.ru/catalog/view/S9F21106	Systeme9 Автоматический выключатель (АВ) B 6A 1P 6kA 230В	\N	\N	2
55	Контактор 24В	2026-07-17 23:18:20.329084	2026-07-19 22:22:57.099091	31	1	MP1K1201BD	5819.40	\N	\N	1.00	https://systeme.ru/product/MP1K1201BD?ysclid=mp40uzqrqh438380385	КОНТАКТОР MP1K 12A 1НЗ DC24V	8	\N	4
\.


--
-- Data for Name: cabinet_systems; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.cabinet_systems (id, cabinet_id, name, description, system_id, "position") FROM stdin;
94	10	\N	\N	28	0
95	10	\N	\N	27	0
96	12	\N	\N	37	0
97	12	\N	\N	38	0
62	12	\N	\N	40	0
66	1	\N	\N	25	0
67	1	\N	\N	24	0
70	1	\N	\N	19	0
71	1	\N	\N	1	0
73	1	\N	\N	17	0
75	12	\N	\N	36	0
76	1	\N	\N	18	0
79	12	\N	\N	43	0
80	10	\N	\N	23	0
82	12	\N	\N	35	0
85	12	\N	\N	34	0
86	12	\N	\N	33	0
87	10	\N	\N	22	0
88	1	\N	\N	20	0
89	1	\N	\N	21	0
\.


--
-- Data for Name: cabinets; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.cabinets (id, name, project_id, user_id, created_at, updated_at, description, width, height, depth) FROM stdin;
1	ЩУВ-П2.47	2	1	2026-06-28 15:41:21.340102	2026-07-14 20:35:50.866953	для сети "Петрович"	\N	\N	\N
10	ЩУВ-П2.50	2	1	2026-07-07 21:17:20.12974	2026-07-14 20:35:47.458453		\N	\N	\N
12	ЩУВ-П1.04	2	1	2026-07-18 15:58:58.63267	2026-07-18 16:53:57.649861		\N	\N	\N
13	Тестовый шкаф	2	1	2026-07-18 17:38:35.903151	2026-07-18 17:38:35.903151	\N	\N	\N	\N
\.


--
-- Data for Name: component_param_values; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.component_param_values (id, component_id, param_id, value, created_at) FROM stdin;
44	7	4	1	2026-07-17 23:18:20.324182
51	54	1	8	2026-07-23 22:30:07.579369
52	54	2	2	2026-07-23 22:30:07.579369
53	54	4	3	2026-07-23 22:30:07.579369
54	54	5	2	2026-07-23 22:30:07.579369
55	54	6	1	2026-07-23 22:30:07.579369
56	54	8	6	2026-07-23 22:30:07.579369
\.


--
-- Data for Name: component_types; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.component_types (id, name, category, description, created_at, "position") FROM stdin;
34	Вентилятор	\N	\N	2026-06-29 18:54:10.716611	0
1	Контроллер		\N	2026-06-26 20:21:03.509978	1
33	Выключатель нагрузки	\N	\N	2026-06-29 18:54:10.716299	2
25	Графическая панель оператора	\N	\N	2026-06-29 18:54:10.712633	3
26	Коммутатор	\N	\N	2026-06-29 18:54:10.713241	4
31	Контактор	\N	\N	2026-06-29 18:54:10.715597	5
35	Корпус шкафа	\N	\N	2026-06-29 18:54:10.716939	6
2	Модуль расширения		\N	2026-06-27 10:51:00.812674	7
27	Реле контроля фаз	\N	\N	2026-06-29 18:54:10.713694	8
28	Реле промежуточное (колодка)	\N	\N	2026-06-29 18:54:10.714149	9
29	Реле промежуточное (реле)	\N	\N	2026-06-29 18:54:10.714797	10
24	Блок питания	\N	\N	2026-06-29 18:54:10.711833	11
30	Реле промежуточное (реле+колодка)	\N	\N	2026-06-29 18:54:10.715208	12
32	Автоматический выключатель	\N	\N	2026-06-29 18:54:10.715973	13
\.


--
-- Data for Name: manufacturers; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.manufacturers (id, name, country, website, created_at, "position") FROM stdin;
3	Dekraft	Россия	\N	2026-06-26 08:34:44.04663	0
4	DKS	Россия	\N	2026-06-26 08:34:44.047092	0
5	IEK	Россия	\N	2026-06-26 08:34:44.047567	0
27	Дмитров-Кабель	Россия	\N	2026-07-01 22:57:05.103164	0
28	КВТ	\N	\N	2026-07-05 10:40:34.540282	0
29	THERMOKON	\N	\N	2026-07-06 16:00:24.668021	0
18	Shuft	Дания	https://www.shuft.pro	2026-06-29 21:21:35.452749	0
1	Systeme Electric	Россия		2026-06-26 08:23:59.316451	1
\.


--
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.materials (id, article, name, manufacturer, description, unit, price, created_at, updated_at, manufacturer_id, manufacturer_url, ln, tm, "position") FROM stdin;
22	5041367	Клемма проходная, 4 кв.мм, серая	\N	Клемма проходная, винтовой зажим, 2 точки подключения, 4 кв.мм, серая TUR-4 DKC	шт	76.05	2026-07-15 08:28:37.674186	2026-07-16 11:17:40.225764	4	https://www.etm.ru/cat/nn/5041367	2	1	0
7	5226932	ПуГВнг(А)-LS 1х0.75 белый	\N	Провод силовой ПуГВнг(А)-LS 1х0.75белый 500м ТРТС Дмитров-Кабель	м	15.08	2026-07-01 22:59:38.992109	2026-07-16 20:11:40.139849	27	https://www.etm.ru/cat/nn/5226932	1	1	0
19	4943770	Наконечник 1.5-8	\N	Наконечник штыревой втулочный изолированный НШВИ 1.5-8 79440 КВТ	шт	1.04	2026-07-07 22:06:20.115682	2026-07-16 21:51:06.450323	28	https://www.etm.ru/cat/nn/4943770	1	1	0
17	2530140	Наконечник 2 х 0.75-8	\N	Наконечник штыревой втулочный изолированный НШВИ(2) 0.75-8 79462 КВТ	шт	1.64	2026-07-05 10:43:51.209397	2026-07-16 22:23:09.287559	28	https://www.etm.ru/cat/nn/2530140	1	1	0
23	5728143	Клемма заземления,  4 кв.мм	\N	Клемма заземления, винтовой зажим, 2 точки подключения, 4 кв.мм TUR-4-PE DKC	шт	250.68	2026-07-15 08:31:21.048041	2026-07-16 09:00:17.014583	4	https://www.etm.ru/cat/nn/5728143	2	1	0
21	6016932	Клемма проходная, 4 кв.мм, синяя	\N	Клемма проходная, винтовой зажим, 2 точки подключения, 4 кв.мм, синяя TUR-4-BU DKC	шт	89.35	2026-07-15 08:27:08.568127	2026-07-16 09:04:03.973474	4	https://www.etm.ru/cat/nn/6016932	2	1	0
13	7262531	ПуГВнг(А)-LS 1х0.75 синий	\N	Провод силовой ПуГВнг(А)-LS 1х0.75синий 500м ТРТ С Дмитров-Кабель	м	15.51	2026-07-04 11:12:23.024586	2026-07-16 20:11:48.836684	27	https://www.etm.ru/cat/nn/7262531	1	1	0
16	2976861	Наконечник  0.75-8	\N	Наконечник штыревой втулочный изолированный НШВИ 0.75-8 79436 КВТ	шт	0.87	2026-07-05 10:41:50.745652	2026-07-16 21:09:35.63942	28	https://www.etm.ru/cat/nn/2976861	1	1	0
20	8806872	Наконечник 2 х 1.5-8	\N	Наконечник штыревой втулочный изолированный НШВИ(2) 1.5-8 79466 КВТ	шт	2.10	2026-07-07 22:07:33.753728	2026-07-23 19:49:06.707889	28	https://www.etm.ru/cat/nn/8806872	1	1	0
9	8519116	Клемма двухуровневая, 2.5 кв.мм, серая	\N	Клемма двухуровневая, винтовой зажим, 4 точки подключения, 2.5 кв.мм, серая KRUKB-3 DKC	шт	374.84	2026-07-02 14:03:06.897852	2026-07-24 23:18:02.841744	4	https://www.etm.ru/cat/nn/8519116	1	1	0
18	5044120	ПУГВнг(А)-LS 1х1.5 синий	\N	Провод силовой ПУГВнг(А)-LS 1х1.5 ТРТС синий многопроволочный Дмитров-Кабель	м	28.48	2026-07-06 10:38:46.471228	2026-07-16 23:58:29.256377	27	https://www.etm.ru/cat/nn/5044120	1	1	0
10	9888602	ПУГВнг(А)-LS 1х1.5 белый	\N	Провод силовой ПУГВнг(А)-LS 1х1.5 ТРТС белый многопроволочный 100м Дмитров-Кабель	м	27.77	2026-07-02 19:59:34.812034	2026-07-16 23:58:22.75147	27	https://www.etm.ru/cat/nn/9888602	2	2	0
\.


--
-- Data for Name: parameters; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.parameters (id, name, unit, type, description, created_at, "position") FROM stdin;
1	AI	\N	1	Аналоговый вход	2026-06-26 20:21:17.81597	0
4	DO			Дискретный выход	2026-06-27 11:27:00.975712	1
6	Eth			Интернет порт	2026-06-27 11:27:53.341558	2
8	DI			Дискретный вход	2026-06-27 11:47:44.599184	3
2	AO			Аналоговый выход	2026-06-27 10:51:00.825187	4
5	RS485			порт RS485	2026-06-27 11:27:23.919453	5
\.


--
-- Data for Name: project_blocks; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.project_blocks (id, project_id, cabinet_id, template_id, "position", created_at, quantity, linked) FROM stdin;
96	\N	1	56	0	2026-07-23 22:34:24.041711	1	f
97	\N	1	61	0	2026-07-23 22:50:34.133054	3	f
\.


--
-- Data for Name: project_materials; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.project_materials (id, project_id, material_id, quantity, created_at, cabinet_id, linked, updated_at) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.projects (id, name, description, user_id, created_at, updated_at, "position") FROM stdin;
11	3	куку	1	2026-07-19 14:16:20.727897	2026-07-19 19:09:14.949428	0
1	Ижевск	шкафы автоматики	1	2026-06-26 08:58:55.518043	2026-07-19 19:09:14.950128	1
2	Питер	Автоматизация вентиляции	2	2026-06-26 09:15:01.104668	2026-07-19 19:09:14.950491	2
\.


--
-- Data for Name: system_block_links; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_block_links (id, system_component_id, block_template_id, quantity, "position") FROM stdin;
126	55	7	1	0
127	54	7	1	0
128	59	7	1	0
129	38	7	1	0
131	60	7	1	0
\.


--
-- Data for Name: system_component_materials; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_component_materials (id, system_component_id, material_id, quantity, created_at, "position") FROM stdin;
387	3	19	1	2026-07-16 21:37:57.410687	0
389	55	17	2	2026-07-16 21:47:51.632539	0
390	54	17	2	2026-07-16 21:47:51.632539	0
391	59	17	2	2026-07-16 21:47:51.632539	0
393	38	17	2	2026-07-16 21:47:51.632539	0
395	35	17	2	2026-07-16 21:49:01.794203	0
396	60	17	2	2026-07-16 21:49:08.584903	0
397	55	19	1	2026-07-16 21:51:08.505821	0
398	54	19	1	2026-07-16 21:51:08.505821	0
399	59	19	1	2026-07-16 21:51:08.505821	0
400	38	19	1	2026-07-16 21:51:08.505821	0
401	35	19	1	2026-07-16 21:51:08.505821	0
402	60	19	1	2026-07-16 21:51:08.505821	0
403	55	17	1	2026-07-16 21:52:29.860716	0
404	54	17	1	2026-07-16 21:52:29.860716	0
405	59	17	1	2026-07-16 21:52:29.860716	0
406	38	17	1	2026-07-16 21:52:29.860716	0
407	35	17	1	2026-07-16 21:52:29.860716	0
408	60	17	1	2026-07-16 21:52:29.860716	0
\.


--
-- Data for Name: system_component_params; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_component_params (id, component_id, parameter_id, value, type) FROM stdin;
676	35	7	1	DI
677	35	6	1	DI
678	35	8	1	DO
679	60	7	1	DI
680	60	6	1	DI
681	60	8	1	DO
325	32	19	1	AI
326	43	19	1	AI
685	3	7	1	DI
327	47	19	1	AI
686	3	6	1	DI
687	3	8	1	DO
426	53	8	1	DO
641	55	7	1	DI
642	55	6	1	DI
643	55	8	1	DO
647	54	7	1	DI
648	54	6	1	DI
649	54	8	1	DO
653	59	7	1	DI
654	59	6	1	DI
655	59	8	1	DO
656	58	8	1	DO
657	52	8	1	DO
339	48	19	1	AI
247	36	19	1	AI
661	38	7	1	DI
340	45	17	1	AO
341	46	8	1	DO
450	56	21	1	rs485
342	46	20	1	DI
343	49	21	1	rs485
452	57	19	1	AI
662	38	6	1	DI
663	38	8	1	DO
477	41	18	1	DI
482	12	18	1	DI
483	40	18	1	DI
484	11	18	1	DI
\.


--
-- Data for Name: system_component_type_blocks; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_component_type_blocks (id, type_id, block_template_id, quantity, created_at) FROM stdin;
22	26	7	1	2026-07-16 22:22:54.863185+05
\.


--
-- Data for Name: system_component_type_materials; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_component_type_materials (id, type_id, material_id, quantity, created_at) FROM stdin;
52	26	17	1	2026-07-16 22:23:10.620086+05
\.


--
-- Data for Name: system_component_types; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_component_types (id, name, description, created_at, updated_at, "position") FROM stdin;
15	Фильтр	\N	2026-07-02 20:12:58.799329+05	2026-07-19 18:50:22.614632+05	0
16	Датчик перепада - PDS	\N	2026-07-06 15:54:14.002119+05	2026-07-19 18:50:22.615605+05	1
6	привод заслонки  220/DO/О/З	1	2026-06-27 12:12:43.894779+05	2026-07-19 18:50:22.6161+05	2
17	Датчик температуры - ТЕ	\N	2026-07-06 15:56:03.01345+05	2026-07-19 18:50:22.616551+05	3
18	Привод трехходового клапана 24/0-10/статус	\N	2026-07-07 10:29:22.514806+05	2026-07-19 18:50:22.61691+05	4
19	Циркуляционный насос	\N	2026-07-07 11:32:12.961835+05	2026-07-19 18:50:22.617226+05	5
20	Термостат	\N	2026-07-07 11:44:58.389633+05	2026-07-19 18:50:22.617544+05	6
21	Двигатель (Частотный преобразователь)	\N	2026-07-07 11:48:47.209634+05	2026-07-19 18:50:22.617903+05	7
22	Двигатель (Контактор 3P 220)	\N	2026-07-07 21:56:28.187202+05	2026-07-19 18:50:22.618281+05	8
23	привод заслонки 220/0-10/О/З	\N	2026-07-10 08:04:53.801229+05	2026-07-19 18:50:22.618651+05	9
24	привод заслонки 24/0-10/О/З	\N	2026-07-10 08:09:38.654499+05	2026-07-19 18:50:22.61901+05	10
25	привод заслонки 24/DO/О/З	\N	2026-07-10 08:09:52.596463+05	2026-07-19 18:50:22.619312+05	11
26	test	\N	2026-07-16 22:20:47.597211+05	2026-07-19 18:50:22.619574+05	12
27	ТЭН	\N	2026-07-26 10:56:43.020751+05	2026-07-26 10:56:43.020751+05	0
\.


--
-- Data for Name: system_components; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_components (id, name, type_id, manufacturer_id, article, description, created_at, updated_at, url, module_id, ln, tm, "position") FROM stdin;
32	Датчик температуры канала притока	17	1	\N	\N	2026-07-06 23:14:47.268696+05	2026-07-22 23:54:49.214695+05	\N	11	1	15	17
36	Датчик температуры вытяжки из помещения	17	1	\N	\N	2026-07-07 09:20:26.051327+05	2026-07-22 23:54:49.215127+05	\N	12	1	15	18
57	Датчик температуры в помещении	17	1	\N	\N	2026-07-10 11:21:24.459649+05	2026-07-22 23:54:49.215532+05	\N	18	\N	\N	19
11	Датчик перепада на Фильтре	16	29	\N	\N	2026-07-02 20:17:20.770039+05	2026-07-22 23:54:49.21584+05	\N	6	1	15	20
40	Датчик перепада на Вентиляторе притока 2	16	29	\N	\N	2026-07-07 09:39:22.126834+05	2026-07-22 23:54:49.216135+05	\N	15	1	15	21
56	Частотный преобразователь вентилятора притока 2	21	\N	\N	\N	2026-07-10 11:17:33.26816+05	2026-07-22 23:54:49.204941+05	\N	15	\N	\N	0
3	привод заслонки притока	23	18	\N	\N	2026-06-27 12:05:35.484324+05	2026-07-22 23:54:49.207128+05	/api/system-components/3	1	4	30	1
49	Частотный преобразователь вентилятора притока 1	21	\N	\N	\N	2026-07-07 11:50:24.461961+05	2026-07-22 23:54:49.207689+05	\N	10	1	30	2
46	Циркуляционный насос фодяного контура нагрева	19	\N	\N	\N	2026-07-07 11:37:11.308804+05	2026-07-22 23:54:49.208071+05	\N	17	1	15	3
48	Термостат угрозы заморозки	20	\N	\N	\N	2026-07-07 11:45:32.852089+05	2026-07-22 23:54:49.208525+05	\N	17	1	15	4
45	Привод трехходового клапана контура тепла	18	\N	\N	\N	2026-07-07 10:29:33.487908+05	2026-07-22 23:54:49.209114+05	\N	17	1	15	5
35	привод заслонки рециркуляции	6	18	\N	\N	2026-07-07 08:29:54.739483+05	2026-07-22 23:54:49.209832+05	\N	2	4	30	6
55	привод заслонки резервного вентилятора	6	18	\N	\N	2026-07-10 11:05:53.154501+05	2026-07-22 23:54:49.210724+05	\N	4	\N	\N	7
54	привод заслонки основного вентилятора	6	18	\N	\N	2026-07-10 11:05:03.744461+05	2026-07-22 23:54:49.211323+05	\N	3	\N	\N	8
38	привод заслонки вытяжки	6	18	\N	\N	2026-07-07 09:30:33.660812+05	2026-07-22 23:54:49.211805+05	\N	2	4	30	9
59	привод заслонки вентилятора вытяжки резервного	6	18	\N	\N	2026-07-10 12:22:15.194162+05	2026-07-22 23:54:49.212271+05	\N	13	\N	\N	10
12	Датчик перепада на Вентиляторе притока 1	16	29	\N	\N	2026-07-06 15:59:58.5888+05	2026-07-22 23:54:49.216453+05	\N	10	2	15	22
60	привод заслонки вентилятора вытяжки основного	6	18	\N	\N	2026-07-10 12:29:05.897416+05	2026-07-22 23:54:49.212672+05	\N	16	\N	\N	11
41	Датчик перепада на Вентиляторе вытяжки 2	16	29	\N	\N	2026-07-07 09:41:32.207507+05	2026-07-22 23:54:49.216796+05	\N	16	1	15	23
37	Датчик перепада на Вентиляторе вытяжки 1	16	29	\N	привет это описание	2026-07-07 09:26:07.201102+05	2026-07-22 23:54:49.217104+05	\N	13	1	15	24
52	Двигатель (контактор) вентилятора притока 1	22	\N	\N	\N	2026-07-07 21:57:31.698012+05	2026-07-22 23:54:49.213021+05	\N	10	\N	\N	12
58	Двигатель (контактор) вентилятора вытяжки 2	22	\N	\N	\N	2026-07-10 12:19:04.780042+05	2026-07-22 23:54:49.213382+05	\N	16	\N	\N	13
53	Двигатель (контактор) вентилятора вытяжки 1	22	\N	\N	\N	2026-07-10 08:23:50.481238+05	2026-07-22 23:54:49.213678+05	\N	13	\N	\N	14
47	Датчик температуры обратной воды	17	1	\N	\N	2026-07-07 11:43:47.932439+05	2026-07-22 23:54:49.21397+05	\N	17	1	15	15
68	test	26	\N	\N	\N	2026-07-16 22:33:11.171881+05	2026-07-24 19:30:08.105146+05	\N	19			25
69	Частотный преобразователь вентилятора вытяжки 1	21	\N	\N	\N	2026-07-25 18:01:47.684818+05	2026-07-25 18:01:47.684818+05	\N	13	\N	\N	0
70	Частотный преобразователь вентилятора вытяжки 2	21	\N	\N	\N	2026-07-25 18:02:10.00881+05	2026-07-25 18:02:10.00881+05	\N	16	\N	\N	0
71	ТЭН 1ст 0-10	27	\N	\N	\N	2026-07-26 10:58:57.40372+05	2026-07-26 10:58:57.40372+05	\N	20	\N	\N	0
43	Датчик температуры канала притока после жалюзей	17	1	\N	\N	2026-07-07 09:46:26.345731+05	2026-07-22 23:54:49.214318+05	\N	14	1	15	16
\.


--
-- Data for Name: system_components_link; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_components_link (id, system_id, component_id, quantity, "position") FROM stdin;
118	18	43	1	1
115	18	11	1	2
119	18	45	1	3
125	18	54	1	4
52	20	3	1	0
59	20	43	1	1
145	20	35	1	2
56	20	11	1	3
126	18	49	1	6
128	18	56	1	7
116	18	12	1	8
129	18	40	1	9
117	18	32	1	10
130	18	57	1	11
102	20	52	1	4
57	20	12	1	5
58	20	32	1	6
53	21	37	1	1
54	21	36	1	2
146	21	38	1	0
47	22	12	1	0
50	22	35	1	2
60	24	3	1	0
61	24	11	1	1
62	24	12	1	2
63	24	32	1	3
64	24	43	1	4
70	24	45	1	5
101	24	52	1	7
72	25	37	1	0
73	25	36	1	1
147	19	38	1	0
148	19	53	1	1
149	19	58	1	2
76	1	3	1	0
80	1	43	1	1
77	1	11	1	2
83	1	46	1	3
81	1	45	1	4
86	1	48	1	5
85	1	47	1	6
87	1	49	1	7
78	1	12	1	8
79	1	32	1	9
150	19	37	1	3
151	19	41	1	4
152	19	60	1	5
153	19	59	1	6
154	19	36	1	7
158	24	35	1	0
159	25	53	1	0
160	25	38	1	0
161	21	53	1	0
162	17	3	1	0
163	17	11	1	1
164	17	12	1	2
165	17	32	1	3
166	17	43	1	4
167	17	45	1	5
168	17	52	1	7
169	17	35	1	0
170	36	3	1	0
171	36	43	1	1
172	36	11	1	2
173	36	46	1	3
174	36	45	1	4
175	36	48	1	5
176	36	47	1	6
177	36	49	1	7
178	36	12	1	8
179	36	32	1	9
114	18	3	1	0
181	18	55	1	0
182	43	43	1	1
183	43	11	1	2
184	43	45	1	3
185	43	54	1	4
186	43	49	1	6
187	43	56	1	7
188	43	12	1	8
189	43	40	1	9
190	43	32	1	10
191	43	57	1	11
192	43	3	1	0
193	43	55	1	0
194	23	38	1	0
198	23	37	1	0
199	23	36	1	0
200	23	69	1	0
202	35	38	1	0
203	35	37	1	0
204	35	36	1	0
205	35	69	1	0
206	34	38	1	0
207	34	37	1	0
208	34	36	1	0
209	34	69	1	0
210	33	38	1	0
211	33	37	1	0
212	33	36	1	0
213	33	69	1	0
214	22	53	1	0
215	22	36	1	0
216	28	3	1	0
217	28	43	1	1
218	28	35	1	2
219	28	11	1	3
220	28	52	1	4
221	28	12	1	5
222	28	32	1	6
223	27	37	1	1
224	27	36	1	2
225	27	38	1	0
226	27	53	1	0
227	37	3	1	0
228	37	43	1	0
229	37	11	1	0
\.


--
-- Data for Name: system_modules; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_modules (id, name, description, created_at, updated_at, "position") FROM stdin;
14	Канал притока после жалюзей	\N	2026-07-07 09:33:38.469489	2026-07-19 18:50:33.865738	13
15	Вентилятор притока 2	\N	2026-07-07 09:40:02.304192	2026-07-19 18:50:33.866096	14
16	Вентиляторе вытяжки 2	\N	2026-07-07 09:42:04.994077	2026-07-19 18:50:33.866404	15
17	Водяной контур нагрева	\N	2026-07-07 10:28:17.993438	2026-07-19 18:50:33.866778	16
18	Помещение	\N	2026-07-10 11:21:07.392534	2026-07-19 18:50:33.867173	17
19	test	\N	2026-07-16 22:20:58.185368	2026-07-19 18:50:33.867518	18
20	ТЭН	\N	2026-07-26 10:56:15.92112	2026-07-26 10:56:15.92112	0
3	Воздушная заслонка приточной для основного вентилятора	Описание	2026-07-02 09:04:26.781373	2026-07-19 18:50:33.858383	0
2	Воздушная заслонка вытяжной системы	Описание	2026-07-02 09:00:22.242057	2026-07-19 18:50:33.860997	1
4	Воздушная заслонка приточной для резервного вентилятора	12	2026-07-02 09:04:39.690032	2026-07-19 18:50:33.861818	2
1	Воздушная заслонка приточной системы	\N	2026-07-02 09:00:22.242057	2026-07-19 18:50:33.862266	3
5	Воздушная заслонка рециркуляции приточной и вытяжной систем	\N	2026-07-02 09:05:24.107873	2026-07-19 18:50:33.862647	4
6	Фильтр притока 1	\N	2026-07-02 20:13:35.621091	2026-07-19 18:50:33.863043	5
7	Фильтр притока 2	\N	2026-07-02 20:13:48.356623	2026-07-19 18:50:33.863415	6
8	Фильтр вытяжки 1	\N	2026-07-02 20:14:29.45965	2026-07-19 18:50:33.863787	7
9	Фильтр вытяжки 2	\N	2026-07-02 20:14:37.038154	2026-07-19 18:50:33.864135	8
10	Вентилятор притока 1	\N	2026-07-06 15:57:53.449467	2026-07-19 18:50:33.864454	9
11	Выход канала притока	\N	2026-07-06 15:58:44.43052	2026-07-19 18:50:33.86477	10
12	Вход канала вытяжки	\N	2026-07-06 15:58:55.711705	2026-07-19 18:50:33.865087	11
13	Вентилятор вытяжки 1	\N	2026-07-07 09:26:53.815148	2026-07-19 18:50:33.865397	12
\.


--
-- Data for Name: system_parameter_types; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_parameter_types (id, name, value, created_at, updated_at, "position") FROM stdin;
1	AI	Аналоговый вход	2026-07-06 11:34:24.671796+05	2026-07-06 11:34:24.671796+05	0
4	DO	Дискретный выход	2026-07-06 11:36:13.567957+05	2026-07-06 11:36:13.567957+05	1
3	DI	Дискретный вход	2026-07-06 11:35:48.229822+05	2026-07-06 11:35:48.229822+05	2
2	AO	Аналоговый выход	2026-07-06 11:34:50.302082+05	2026-07-06 11:35:26.653533+05	3
5	rs485	интерфейс rs485	2026-07-07 11:51:01.970834+05	2026-07-07 17:35:27.352622+05	4
6	rest	\N	2026-07-23 14:42:54.245558+05	2026-07-23 14:42:54.245558+05	\N
\.


--
-- Data for Name: system_parameters; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_parameters (id, name, value, description, created_at, updated_at, type, ln, tm, "position") FROM stdin;
17	Команда управление 0-10 В	\N	Описание	2026-07-02 09:40:01.07852+05	2026-07-19 18:50:28.337695+05	AO	1	1	0
7	статус закрыто	\N	Описание	2026-06-28 13:08:32.605933+05	2026-07-19 18:50:28.338474+05	DI	1	1	1
8	Команда управления - открыть	\N	Описание	2026-06-28 13:14:14.654716+05	2026-07-19 18:50:28.338862+05	DO	1	1	2
6	статус открыто	\N	Описание	2026-06-28 13:07:09.795998+05	2026-07-19 18:50:28.339166+05	DI	1	1	3
18	Статус засора	\N	Описание	2026-07-02 20:16:38.875105+05	2026-07-19 18:50:28.33946+05	DI	1	1	4
19	Статус AI	\N	\N	2026-07-06 21:15:31.383048+05	2026-07-19 18:50:28.339788+05	AI	1	1	5
20	Статус DI	\N	\N	2026-07-07 11:33:55.836712+05	2026-07-19 18:50:28.340256+05	DI	1	1	6
21	интерфейс rs485	\N	\N	2026-07-07 11:50:13.895142+05	2026-07-19 18:50:28.340857+05	rs485	1	1	7
\.


--
-- Data for Name: systems; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.systems (id, name, description, created_at, "position", room, installation, page) FROM stdin;
1	6нП14	Раздевалки ЩУВ-П2.47	2026-06-28 16:46:41.681613	12	П2.47	6нП11 (6нП14, 6нП16)	39
17	6нП16	Лифтовые холлы паркинга ЩУВ-П2.47	2026-07-06 09:57:18.793545	14	П2.47	6нП11 (6нП14, 6нП16)	39
36	6нП11	Насосная АУПТ, КНС - стр 39	2026-07-18 16:03:13.181883	3	\N	\N	\N
18	6нП12	Центральная кроссовая ЩУВ-П2.47	2026-07-06 09:58:01.633482	13	П2.47	6нП12 (6нП12.1)	42
43	6нП12.1	\N	2026-07-25 17:50:55.577777	0	П1.04	6нП12 (6нП12.1)	42
23	6нВ17	Лифтовые холлы паркинга	2026-07-06 10:02:27.815297	15	П2.50	6нВ13 (6нВ15.1, 6нВ15.2, 6нВ17)	41
35	6нВ13	Насосная АУПТ, КНС	2026-07-18 16:00:10.847747	4	П1.04	6нВ13 (6нВ15.1, 6нВ15.2, 6нВ17)	41
34	6нВ15.1	Складские пом. кухни на Р1 категории В4	2026-07-18 15:59:51.011384	5	П1.04	6нВ13 (6нВ15.1, 6нВ15.2, 6нВ17)	41
33	6нВ15.2	Складские пом. кухни на Р1 категории В3	2026-07-18 15:59:21.595282	6	П1.04	6нВ13 (6нВ15.1, 6нВ15.2, 6нВ17)	41
22	6нВ16	Раздевалки	2026-07-06 10:02:08.301098	16	П2.50	6нВ16	44
20	6нП15.2	ИТП П3.17	2026-07-06 09:59:13.178276	10	П2.47	6нП15.2/6нВ18.2	45
21	6нВ18.2	ИТП П3.17	2026-07-06 09:59:29.33203	9	П2.47	6нП15.2/6нВ18.2	45
28	6нП15.1	ИТП П3.08	2026-07-07 21:41:16.161244	17	П2.50	6нП15.1/6нВ18.1	45
27	6нВ18.1	ИТП П3.08	2026-07-07 21:40:53.385833	18	П2.50	6нП15.1/6нВ18.1	45
37	6нП13.1	Складские пом. кухни на Р1 категории В4	2026-07-18 16:05:08.806757	2	П1.04	6нП13.1 (6нП13.2)	40
40	6нВ14.1	ИБП-3 - стр 43	2026-07-18 18:45:39.762676	1	\N	\N	\N
38	6нП13.2	Складские пом. кухни на Р1 категории В3 - стр 40	2026-07-18 16:06:14.452077	0	П1.04	6нП13.1 (6нП13.2)	40
25	6нВ18.3	уточнить в какое помещение работает и шкаф	2026-07-06 10:03:23.389963	7	П2.47	6нП15.3/6нВ18.3	46
24	6нП15.3	уточнить в какое помещение работает и шкаф	2026-07-06 10:03:07.178812	8	П2.47	6нП15.3/6нВ18.3	46
19	6нВ14	Центральная кроссовая ЩУВ-П2.47	2026-07-06 09:58:40.20832	11	П2.47	6нВ14 (6нВ14.1)	43
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.user_sessions (id, user_id, token, created_at) FROM stdin;
1	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4MjQ0Mzg1NCwiZXhwIjoxNzgyNTMwMjU0fQ.dYWr3ZgrbSNvoWxga6ZHDAWHv1aLZkKh9l5vF6HX2AM	2026-06-26 08:17:34.242046
2	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4MjQ0NDYyMCwiZXhwIjoxNzgyNTMxMDIwfQ.prx_6ybP52XouazgcEthW5JPIMntjm_pG5sdbuuLGzI	2026-06-26 08:30:20.363021
3	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4MjQ0NjY2NywiZXhwIjoxNzgyNTMzMDY3fQ.B0e6rMG2KXvK1XTyRBNAkumkvzUNjlMkpG90DEX0Cc0	2026-06-26 09:04:27.704415
4	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ0ZXN0Iiwicm9sZSI6InVzZXIiLCJpYXQiOjE3ODI0NDcyNzcsImV4cCI6MTc4MjUzMzY3N30.WKSAhcbULWAmn5VzJTSFcocZJ-HNJlv_c3FFslcv5gg	2026-06-26 09:14:37.989934
5	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4MjQ0NzMyNywiZXhwIjoxNzgyNTMzNzI3fQ.V6B2OY9ZBsB2pFh52Y-rv3xejC8dEjSlIAfgYB0QaVY	2026-06-26 09:15:27.984246
6	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwidXNlcm5hbWUiOiJ0ZXN0Iiwicm9sZSI6InVzZXIiLCJpYXQiOjE3ODI0NDkwNjYsImV4cCI6MTc4MjUzNTQ2Nn0.YJtAtIrcVGB__04Pa280QOyN111H21TlnXHZBfPHSyk	2026-06-26 09:44:26.34615
7	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4MjQ0OTE1OCwiZXhwIjoxNzgyNTM1NTU4fQ.ZrG0HdElK4lz4PICEG0KSfxsNx6RiZUahgdRAcYykms	2026-06-26 09:45:58.058532
8	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4MjQ0OTg4MywiZXhwIjoxNzgyNTM2MjgzfQ.tXAfX8Vi_Lj3A3950ijxxgO_P4TkZ92usuQO1Wac6Rw	2026-06-26 09:58:03.065206
\.


--
-- Data for Name: user_table_sort; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.user_table_sort (id, user_id, table_name, sort_order, sort_key, sort_dir, filter_data, updated_at) FROM stdin;
1	1	systems	[]	\N	asc	{"page": [], "installation": [], "cabinet_names": ["ЩУВ-П1.04"]}	2026-07-26 10:51:48.399691
680	1	system_components_37	[227, 228, 229]	\N	asc	{}	2026-07-26 10:54:38.113272
612	1	system_components_24	[60, 64, 158, 61, 70, 101, 62, 63]	\N	asc	{}	2026-07-25 16:27:24.36528
616	1	system_components_25	[160, 159, 72, 73]	\N	asc	{}	2026-07-25 16:37:27.277095
279	1	system-parameters	[6, 7, 8, 17, 18, 19, 20, 21]	id	asc	{}	2026-07-24 20:01:00.959757
404	1	system_components_20	[52, 59, 145, 56, 102, 57, 58]	\N	asc	{}	2026-07-25 16:43:20.495845
402	1	system_components_18	[114, 118, 115, 119, 125, 126, 116, 181, 128, 129, 117, 130]	\N	asc	{}	2026-07-25 17:48:39.09286
291	1	component-types	[32, 24, 34, 33, 25, 26, 31, 1, 35, 2, 27, 28, 29, 30]	name	asc	{}	2026-07-23 14:49:58.938436
282	1	system-modules	[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]	id	asc	{}	2026-07-24 20:01:10.469869
653	1	system_components_23	[194, 200, 198, 199]	\N	asc	{}	2026-07-25 18:02:30.393393
294	1	parameters	[5, 6, 4, 8, 2, 1]	description	desc	{}	2026-07-23 14:51:09.283408
284	1	system-parameter-types	[1, 2, 3, 4, 5, 6]	id	asc	{}	2026-07-24 20:01:19.211723
409	1	system_components_17	[134, 138, 136, 135, 131, 137, 132, 140, 133, 139]	\N	asc	{}	2026-07-24 18:46:09.158449
407	1	system_components_1	[76, 80, 77, 83, 81, 86, 85, 87, 78, 79]	\N	asc	{}	2026-07-25 17:38:14.330285
192	1	system-components	[12, 37, 41, 40, 11, 57, 36, 32, 43, 47, 53, 58, 52, 60, 59, 38, 54, 3, 55, 35, 45, 48, 46, 49, 56, 68]	\N	asc	{}	2026-07-24 20:01:38.235204
247	1	system-component-types	[6, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]	id	asc	{}	2026-07-24 20:00:50.869595
287	1	block-templates	[7, 56, 54, 55, 61, 60, 59, 58, 57]	type_name	desc	{}	2026-07-24 19:47:55.405816
314	1	cabinet_systems	[75, 96, 97, 82, 85, 86, 79, 62]	\N	asc	{}	2026-07-26 10:52:40.037999
311	1	cabinet-systems	[59, 23, 39, 27, 29, 40, 28, 30]	\N	asc	{}	2026-07-23 15:14:01.487201
400	1	system_components_19	[]	\N	asc	{"name": []}	2026-07-23 19:25:50.770648
662	1	system_components_22	[50, 214, 47, 48]	\N	asc	{}	2026-07-26 10:41:56.523143
475	1	cabinet_blocks	["block_1", "block_0", "block_2", "block_3", "block_4", "block_6", "block_5"]	component_name	desc	{}	2026-07-23 21:59:16.312916
496	1	cabinet_materials	["mat_32", "mat_33", "mat_34", "mat_35", "mat_36", "mat_37", "mat_38", "mat_18", "mat_19", "mat_20", "mat_21", "mat_22", "mat_23", "mat_24", "mat_25", "mat_26", "mat_27", "mat_28", "mat_29", "mat_30", "mat_31", "mat_0", "mat_1", "mat_2", "mat_3", "mat_4", "mat_5", "mat_6", "mat_7", "mat_8", "mat_9", "mat_10", "mat_11", "mat_12", "mat_13", "mat_14", "mat_15", "mat_16", "mat_17"]	name	asc	{}	2026-07-23 22:23:01.199315
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.users (id, username, email, password_hash, role, created_at, updated_at) FROM stdin;
2	test	test@test.ru	$2a$10$KkIRlDA7wjP0HmWZlmauDOML11WRsfw4/MlPifW3FwcRuzAdiT8I.	user	2026-06-26 09:14:15.512192	2026-07-14 20:24:59.244114
1	admin	admin@example.com	$2a$10$9ElgRws1Jkv1QmGsE/vs1..0kO.Xo4EwgBUEcfpNJkhqR3b/nonDO	admin	2026-06-26 08:14:29.532979	2026-07-15 08:04:31.919593
\.


--
-- Name: block_template_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.block_template_materials_id_seq', 11, true);


--
-- Name: block_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.block_templates_id_seq', 61, true);


--
-- Name: cabinet_systems_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.cabinet_systems_id_seq', 97, true);


--
-- Name: cabinets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.cabinets_id_seq', 14, true);


--
-- Name: component_param_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.component_param_values_id_seq', 56, true);


--
-- Name: component_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.component_types_id_seq', 43, true);


--
-- Name: manufacturers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.manufacturers_id_seq', 29, true);


--
-- Name: materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.materials_id_seq', 23, true);


--
-- Name: parameters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.parameters_id_seq', 32, true);


--
-- Name: project_blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.project_blocks_id_seq', 99, true);


--
-- Name: project_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.project_materials_id_seq', 44, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.projects_id_seq', 11, true);


--
-- Name: system_block_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_block_links_id_seq', 133, true);


--
-- Name: system_component_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_component_materials_id_seq', 410, true);


--
-- Name: system_component_params_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_component_params_id_seq', 687, true);


--
-- Name: system_component_type_blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_component_type_blocks_id_seq', 23, true);


--
-- Name: system_component_type_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_component_type_materials_id_seq', 52, true);


--
-- Name: system_component_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_component_types_id_seq', 27, true);


--
-- Name: system_components_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_components_id_seq', 71, true);


--
-- Name: system_components_link_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_components_link_id_seq', 229, true);


--
-- Name: system_modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_modules_id_seq', 20, true);


--
-- Name: system_parameter_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_parameter_types_id_seq', 6, true);


--
-- Name: system_parameters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_parameters_id_seq', 21, true);


--
-- Name: systems_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.systems_id_seq', 43, true);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 8, true);


--
-- Name: user_table_sort_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.user_table_sort_id_seq', 680, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.users_id_seq', 5, true);


--
-- Name: block_template_materials block_template_materials_block_template_id_material_id_key; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.block_template_materials
    ADD CONSTRAINT block_template_materials_block_template_id_material_id_key UNIQUE (block_template_id, material_id);


--
-- Name: block_template_materials block_template_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.block_template_materials
    ADD CONSTRAINT block_template_materials_pkey PRIMARY KEY (id);


--
-- Name: block_templates block_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.block_templates
    ADD CONSTRAINT block_templates_pkey PRIMARY KEY (id);


--
-- Name: cabinet_systems cabinet_systems_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.cabinet_systems
    ADD CONSTRAINT cabinet_systems_pkey PRIMARY KEY (id);


--
-- Name: cabinets cabinets_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.cabinets
    ADD CONSTRAINT cabinets_pkey PRIMARY KEY (id);


--
-- Name: component_param_values component_param_values_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.component_param_values
    ADD CONSTRAINT component_param_values_pkey PRIMARY KEY (id);


--
-- Name: component_types component_types_name_unique; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.component_types
    ADD CONSTRAINT component_types_name_unique UNIQUE (name);


--
-- Name: component_types component_types_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.component_types
    ADD CONSTRAINT component_types_pkey PRIMARY KEY (id);


--
-- Name: manufacturers manufacturers_name_unique; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.manufacturers
    ADD CONSTRAINT manufacturers_name_unique UNIQUE (name);


--
-- Name: manufacturers manufacturers_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.manufacturers
    ADD CONSTRAINT manufacturers_pkey PRIMARY KEY (id);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: parameters parameters_name_unique; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.parameters
    ADD CONSTRAINT parameters_name_unique UNIQUE (name);


--
-- Name: parameters parameters_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.parameters
    ADD CONSTRAINT parameters_pkey PRIMARY KEY (id);


--
-- Name: project_blocks project_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_blocks
    ADD CONSTRAINT project_blocks_pkey PRIMARY KEY (id);


--
-- Name: project_materials project_materials_cabinet_material_linked_unique; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_materials
    ADD CONSTRAINT project_materials_cabinet_material_linked_unique UNIQUE (cabinet_id, material_id, linked);


--
-- Name: project_materials project_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_materials
    ADD CONSTRAINT project_materials_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: system_block_links system_block_links_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_block_links
    ADD CONSTRAINT system_block_links_pkey PRIMARY KEY (id);


--
-- Name: system_component_materials system_component_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_materials
    ADD CONSTRAINT system_component_materials_pkey PRIMARY KEY (id);


--
-- Name: system_component_params system_component_params_component_id_parameter_id_key; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_params
    ADD CONSTRAINT system_component_params_component_id_parameter_id_key UNIQUE (component_id, parameter_id);


--
-- Name: system_component_params system_component_params_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_params
    ADD CONSTRAINT system_component_params_pkey PRIMARY KEY (id);


--
-- Name: system_component_type_blocks system_component_type_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_type_blocks
    ADD CONSTRAINT system_component_type_blocks_pkey PRIMARY KEY (id);


--
-- Name: system_component_type_blocks system_component_type_blocks_type_id_block_template_id_key; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_type_blocks
    ADD CONSTRAINT system_component_type_blocks_type_id_block_template_id_key UNIQUE (type_id, block_template_id);


--
-- Name: system_component_type_materials system_component_type_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_type_materials
    ADD CONSTRAINT system_component_type_materials_pkey PRIMARY KEY (id);


--
-- Name: system_component_type_materials system_component_type_materials_type_id_material_id_key; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_type_materials
    ADD CONSTRAINT system_component_type_materials_type_id_material_id_key UNIQUE (type_id, material_id);


--
-- Name: system_component_types system_component_types_name_unique; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_types
    ADD CONSTRAINT system_component_types_name_unique UNIQUE (name);


--
-- Name: system_component_types system_component_types_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_types
    ADD CONSTRAINT system_component_types_pkey PRIMARY KEY (id);


--
-- Name: system_components_link system_components_link_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_components_link
    ADD CONSTRAINT system_components_link_pkey PRIMARY KEY (id);


--
-- Name: system_components_link system_components_link_system_id_component_id_key; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_components_link
    ADD CONSTRAINT system_components_link_system_id_component_id_key UNIQUE (system_id, component_id);


--
-- Name: system_components system_components_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_components
    ADD CONSTRAINT system_components_pkey PRIMARY KEY (id);


--
-- Name: system_modules system_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_modules
    ADD CONSTRAINT system_modules_pkey PRIMARY KEY (id);


--
-- Name: system_parameter_types system_parameter_types_name_key; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_parameter_types
    ADD CONSTRAINT system_parameter_types_name_key UNIQUE (name);


--
-- Name: system_parameter_types system_parameter_types_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_parameter_types
    ADD CONSTRAINT system_parameter_types_pkey PRIMARY KEY (id);


--
-- Name: system_parameters system_parameters_name_unique; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_parameters
    ADD CONSTRAINT system_parameters_name_unique UNIQUE (name);


--
-- Name: system_parameters system_parameters_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_parameters
    ADD CONSTRAINT system_parameters_pkey PRIMARY KEY (id);


--
-- Name: systems systems_name_key; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.systems
    ADD CONSTRAINT systems_name_key UNIQUE (name);


--
-- Name: systems systems_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.systems
    ADD CONSTRAINT systems_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_table_sort user_table_sort_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.user_table_sort
    ADD CONSTRAINT user_table_sort_pkey PRIMARY KEY (id);


--
-- Name: user_table_sort user_table_sort_user_id_table_name_key; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.user_table_sort
    ADD CONSTRAINT user_table_sort_user_id_table_name_key UNIQUE (user_id, table_name);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: block_templates_article_unique; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE UNIQUE INDEX block_templates_article_unique ON public.block_templates USING btree (article) WHERE (article IS NOT NULL);


--
-- Name: cabinet_systems_unique; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE UNIQUE INDEX cabinet_systems_unique ON public.cabinet_systems USING btree (cabinet_id, system_id);


--
-- Name: idx_cabinet_systems_cabinet_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_cabinet_systems_cabinet_id ON public.cabinet_systems USING btree (cabinet_id);


--
-- Name: idx_cabinet_systems_system_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_cabinet_systems_system_id ON public.cabinet_systems USING btree (system_id);


--
-- Name: idx_cabinets_project_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_cabinets_project_id ON public.cabinets USING btree (project_id);


--
-- Name: idx_cabinets_user_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_cabinets_user_id ON public.cabinets USING btree (user_id);


--
-- Name: idx_materials_article; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_materials_article ON public.materials USING btree (article);


--
-- Name: idx_materials_manufacturer_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_materials_manufacturer_id ON public.materials USING btree (manufacturer_id);


--
-- Name: idx_materials_name; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_materials_name ON public.materials USING btree (name);


--
-- Name: idx_project_blocks_cabinet_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_project_blocks_cabinet_id ON public.project_blocks USING btree (cabinet_id);


--
-- Name: idx_project_blocks_project_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_project_blocks_project_id ON public.project_blocks USING btree (project_id);


--
-- Name: idx_project_blocks_template_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_project_blocks_template_id ON public.project_blocks USING btree (template_id);


--
-- Name: idx_project_materials_cabinet_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_project_materials_cabinet_id ON public.project_materials USING btree (cabinet_id);


--
-- Name: idx_project_materials_material; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_project_materials_material ON public.project_materials USING btree (material_id);


--
-- Name: idx_projects_created_at; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_projects_created_at ON public.projects USING btree (created_at DESC);


--
-- Name: idx_projects_user_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_projects_user_id ON public.projects USING btree (user_id);


--
-- Name: idx_scm_component_material; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_scm_component_material ON public.system_component_materials USING btree (system_component_id, material_id);


--
-- Name: idx_system_component_params_component; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_system_component_params_component ON public.system_component_params USING btree (component_id);


--
-- Name: idx_system_component_params_parameter; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_system_component_params_parameter ON public.system_component_params USING btree (parameter_id);


--
-- Name: idx_system_component_types_name; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_system_component_types_name ON public.system_component_types USING btree (name);


--
-- Name: idx_system_components_link_component_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_system_components_link_component_id ON public.system_components_link USING btree (component_id);


--
-- Name: idx_system_components_link_system_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_system_components_link_system_id ON public.system_components_link USING btree (system_id);


--
-- Name: idx_system_components_manufacturer; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_system_components_manufacturer ON public.system_components USING btree (manufacturer_id);


--
-- Name: idx_system_components_module_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_system_components_module_id ON public.system_components USING btree (module_id);


--
-- Name: idx_system_components_type; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_system_components_type ON public.system_components USING btree (type_id);


--
-- Name: idx_system_parameters_name; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_system_parameters_name ON public.system_parameters USING btree (name);


--
-- Name: idx_user_sessions_token; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_user_sessions_token ON public.user_sessions USING btree (token);


--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: project_blocks_cabinet_template_unique; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE UNIQUE INDEX project_blocks_cabinet_template_unique ON public.project_blocks USING btree (cabinet_id, template_id);


--
-- Name: system_block_links_unique; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE UNIQUE INDEX system_block_links_unique ON public.system_block_links USING btree (system_component_id, block_template_id);


--
-- Name: system_components_article_unique; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE UNIQUE INDEX system_components_article_unique ON public.system_components USING btree (article) WHERE (article IS NOT NULL);


--
-- Name: system_component_types set_updated_at_system_component_types; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER set_updated_at_system_component_types BEFORE UPDATE ON public.system_component_types FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: system_components set_updated_at_system_components; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER set_updated_at_system_components BEFORE UPDATE ON public.system_components FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: system_parameters set_updated_at_system_parameters; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER set_updated_at_system_parameters BEFORE UPDATE ON public.system_parameters FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: block_templates trigger_update_block_templates_updated_at; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER trigger_update_block_templates_updated_at BEFORE UPDATE ON public.block_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cabinets trigger_update_cabinets_updated_at; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER trigger_update_cabinets_updated_at BEFORE UPDATE ON public.cabinets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: materials trigger_update_materials_updated_at; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER trigger_update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: project_materials trigger_update_project_materials_updated_at; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER trigger_update_project_materials_updated_at BEFORE UPDATE ON public.project_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects trigger_update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER trigger_update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: system_component_types trigger_update_system_component_types_updated_at; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER trigger_update_system_component_types_updated_at BEFORE UPDATE ON public.system_component_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: system_components trigger_update_system_components_updated_at; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER trigger_update_system_components_updated_at BEFORE UPDATE ON public.system_components FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: system_modules trigger_update_system_modules_updated_at; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER trigger_update_system_modules_updated_at BEFORE UPDATE ON public.system_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: system_parameters trigger_update_system_parameters_updated_at; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER trigger_update_system_parameters_updated_at BEFORE UPDATE ON public.system_parameters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users trigger_update_users_updated_at; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER trigger_update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: block_templates update_block_templates_updated_at; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER update_block_templates_updated_at BEFORE UPDATE ON public.block_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cabinets update_cabinets_updated_at; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER update_cabinets_updated_at BEFORE UPDATE ON public.cabinets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects update_projects_updated_at; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: hrroot
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: block_template_materials block_template_materials_block_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.block_template_materials
    ADD CONSTRAINT block_template_materials_block_template_id_fkey FOREIGN KEY (block_template_id) REFERENCES public.block_templates(id) ON DELETE CASCADE;


--
-- Name: block_template_materials block_template_materials_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.block_template_materials
    ADD CONSTRAINT block_template_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;


--
-- Name: block_templates block_templates_manufacturer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.block_templates
    ADD CONSTRAINT block_templates_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id);


--
-- Name: block_templates block_templates_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.block_templates
    ADD CONSTRAINT block_templates_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.component_types(id);


--
-- Name: cabinet_systems cabinet_systems_cabinet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.cabinet_systems
    ADD CONSTRAINT cabinet_systems_cabinet_id_fkey FOREIGN KEY (cabinet_id) REFERENCES public.cabinets(id) ON DELETE CASCADE;


--
-- Name: cabinet_systems cabinet_systems_system_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.cabinet_systems
    ADD CONSTRAINT cabinet_systems_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(id) ON DELETE CASCADE;


--
-- Name: cabinets cabinets_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.cabinets
    ADD CONSTRAINT cabinets_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: cabinets cabinets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.cabinets
    ADD CONSTRAINT cabinets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: component_param_values component_param_values_param_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.component_param_values
    ADD CONSTRAINT component_param_values_param_id_fkey FOREIGN KEY (param_id) REFERENCES public.parameters(id) ON DELETE CASCADE;


--
-- Name: materials materials_manufacturer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id) ON DELETE SET NULL;


--
-- Name: project_blocks project_blocks_cabinet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_blocks
    ADD CONSTRAINT project_blocks_cabinet_id_fkey FOREIGN KEY (cabinet_id) REFERENCES public.cabinets(id) ON DELETE CASCADE;


--
-- Name: project_blocks project_blocks_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_blocks
    ADD CONSTRAINT project_blocks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_blocks project_blocks_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_blocks
    ADD CONSTRAINT project_blocks_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.block_templates(id) ON DELETE SET NULL;


--
-- Name: project_materials project_materials_cabinet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_materials
    ADD CONSTRAINT project_materials_cabinet_id_fkey FOREIGN KEY (cabinet_id) REFERENCES public.cabinets(id) ON DELETE CASCADE;


--
-- Name: project_materials project_materials_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_materials
    ADD CONSTRAINT project_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;


--
-- Name: project_materials project_materials_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_materials
    ADD CONSTRAINT project_materials_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: projects projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: system_block_links system_block_links_block_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_block_links
    ADD CONSTRAINT system_block_links_block_template_id_fkey FOREIGN KEY (block_template_id) REFERENCES public.block_templates(id) ON DELETE CASCADE;


--
-- Name: system_block_links system_block_links_system_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_block_links
    ADD CONSTRAINT system_block_links_system_component_id_fkey FOREIGN KEY (system_component_id) REFERENCES public.system_components(id) ON DELETE CASCADE;


--
-- Name: system_component_materials system_component_materials_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_materials
    ADD CONSTRAINT system_component_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;


--
-- Name: system_component_materials system_component_materials_system_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_materials
    ADD CONSTRAINT system_component_materials_system_component_id_fkey FOREIGN KEY (system_component_id) REFERENCES public.system_components(id) ON DELETE CASCADE;


--
-- Name: system_component_params system_component_params_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_params
    ADD CONSTRAINT system_component_params_component_id_fkey FOREIGN KEY (component_id) REFERENCES public.system_components(id) ON DELETE CASCADE;


--
-- Name: system_component_params system_component_params_parameter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_params
    ADD CONSTRAINT system_component_params_parameter_id_fkey FOREIGN KEY (parameter_id) REFERENCES public.system_parameters(id) ON DELETE RESTRICT;


--
-- Name: system_component_type_blocks system_component_type_blocks_block_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_type_blocks
    ADD CONSTRAINT system_component_type_blocks_block_template_id_fkey FOREIGN KEY (block_template_id) REFERENCES public.block_templates(id) ON DELETE CASCADE;


--
-- Name: system_component_type_blocks system_component_type_blocks_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_type_blocks
    ADD CONSTRAINT system_component_type_blocks_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.system_component_types(id) ON DELETE CASCADE;


--
-- Name: system_component_type_materials system_component_type_materials_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_type_materials
    ADD CONSTRAINT system_component_type_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;


--
-- Name: system_component_type_materials system_component_type_materials_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_component_type_materials
    ADD CONSTRAINT system_component_type_materials_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.system_component_types(id) ON DELETE CASCADE;


--
-- Name: system_components_link system_components_link_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_components_link
    ADD CONSTRAINT system_components_link_component_id_fkey FOREIGN KEY (component_id) REFERENCES public.system_components(id) ON DELETE CASCADE;


--
-- Name: system_components_link system_components_link_system_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_components_link
    ADD CONSTRAINT system_components_link_system_id_fkey FOREIGN KEY (system_id) REFERENCES public.systems(id) ON DELETE CASCADE;


--
-- Name: system_components system_components_manufacturer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_components
    ADD CONSTRAINT system_components_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id) ON DELETE SET NULL;


--
-- Name: system_components system_components_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_components
    ADD CONSTRAINT system_components_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.system_modules(id) ON DELETE SET NULL;


--
-- Name: system_components system_components_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.system_components
    ADD CONSTRAINT system_components_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.system_component_types(id) ON DELETE RESTRICT;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_table_sort user_table_sort_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.user_table_sort
    ADD CONSTRAINT user_table_sort_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO hrroot;


--
-- PostgreSQL database dump complete
--

\unrestrict LKq2oMWubLszwfL9rPAUCLi9spRc2wID7yl3Z3IKdUTbvwImT8T5Wo1YB3emZoo

