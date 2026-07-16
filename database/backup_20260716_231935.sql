--
-- PostgreSQL database dump
--

\restrict TKGx88TcoFovHnjGPbqRmv8Sw79x2NNSkx89cQnl0NaiT6iANEAnuzhBL4QVTgX

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
    tm character varying(100)
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
-- Name: breakers; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.breakers (
    id integer NOT NULL,
    name character varying(255),
    type character varying(50),
    rating character varying(20),
    project_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.breakers OWNER TO hrroot;

--
-- Name: breakers_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.breakers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.breakers_id_seq OWNER TO hrroot;

--
-- Name: breakers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.breakers_id_seq OWNED BY public.breakers.id;


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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
-- Name: components; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.components (
    id integer NOT NULL,
    type_id integer,
    manufacturer_id integer,
    model character varying(255),
    price numeric(10,2),
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.components OWNER TO hrroot;

--
-- Name: components_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.components_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.components_id_seq OWNER TO hrroot;

--
-- Name: components_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.components_id_seq OWNED BY public.components.id;


--
-- Name: consumable_block_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consumable_block_links (
    id integer NOT NULL,
    consumable_id integer NOT NULL,
    block_template_id integer NOT NULL,
    quantity numeric(10,2) DEFAULT 1
);


ALTER TABLE public.consumable_block_links OWNER TO postgres;

--
-- Name: consumable_block_links_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.consumable_block_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.consumable_block_links_id_seq OWNER TO postgres;

--
-- Name: consumable_block_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.consumable_block_links_id_seq OWNED BY public.consumable_block_links.id;


--
-- Name: consumable_cabinet_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consumable_cabinet_links (
    id integer NOT NULL,
    consumable_id integer NOT NULL,
    cabinet_id integer NOT NULL,
    quantity numeric(10,2) DEFAULT 1
);


ALTER TABLE public.consumable_cabinet_links OWNER TO postgres;

--
-- Name: consumable_cabinet_links_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.consumable_cabinet_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.consumable_cabinet_links_id_seq OWNER TO postgres;

--
-- Name: consumable_cabinet_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.consumable_cabinet_links_id_seq OWNED BY public.consumable_cabinet_links.id;


--
-- Name: consumable_system_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consumable_system_links (
    id integer NOT NULL,
    consumable_id integer NOT NULL,
    system_component_id integer NOT NULL,
    quantity numeric(10,2) DEFAULT 1
);


ALTER TABLE public.consumable_system_links OWNER TO postgres;

--
-- Name: consumable_system_links_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.consumable_system_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.consumable_system_links_id_seq OWNER TO postgres;

--
-- Name: consumable_system_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.consumable_system_links_id_seq OWNED BY public.consumable_system_links.id;


--
-- Name: consumables; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consumables (
    id integer NOT NULL,
    article character varying(255),
    name character varying(255) NOT NULL,
    unit character varying(50),
    price numeric(10,2),
    description text,
    manufacturer_id integer,
    url character varying(500),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    manufacturer_url character varying(500)
);


ALTER TABLE public.consumables OWNER TO postgres;

--
-- Name: consumables_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.consumables_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.consumables_id_seq OWNER TO postgres;

--
-- Name: consumables_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.consumables_id_seq OWNED BY public.consumables.id;


--
-- Name: ln_values; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ln_values (
    id integer NOT NULL,
    value character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ln_values OWNER TO postgres;

--
-- Name: ln_values_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ln_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ln_values_id_seq OWNER TO postgres;

--
-- Name: ln_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ln_values_id_seq OWNED BY public.ln_values.id;


--
-- Name: manufacturers; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.manufacturers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    country character varying(100),
    website character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
    tm character varying(100)
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
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
-- Name: project_block_params; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.project_block_params (
    id integer NOT NULL,
    block_id integer,
    param_id integer,
    value text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.project_block_params OWNER TO hrroot;

--
-- Name: project_block_params_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.project_block_params_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_block_params_id_seq OWNER TO hrroot;

--
-- Name: project_block_params_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.project_block_params_id_seq OWNED BY public.project_block_params.id;


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
-- Name: project_results; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.project_results (
    id integer NOT NULL,
    project_id integer,
    data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.project_results OWNER TO hrroot;

--
-- Name: project_results_id_seq; Type: SEQUENCE; Schema: public; Owner: hrroot
--

CREATE SEQUENCE public.project_results_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_results_id_seq OWNER TO hrroot;

--
-- Name: project_results_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: hrroot
--

ALTER SEQUENCE public.project_results_id_seq OWNED BY public.project_results.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: hrroot
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
-- Name: system_block_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_block_links (
    id integer NOT NULL,
    system_component_id integer NOT NULL,
    block_template_id integer NOT NULL,
    quantity integer DEFAULT 1,
    "position" integer DEFAULT 0
);


ALTER TABLE public.system_block_links OWNER TO postgres;

--
-- Name: system_block_links_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_block_links_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_block_links_id_seq OWNER TO postgres;

--
-- Name: system_block_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
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
-- Name: system_component_type_blocks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_component_type_blocks (
    id integer NOT NULL,
    type_id integer NOT NULL,
    block_template_id integer NOT NULL,
    quantity integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_component_type_blocks OWNER TO postgres;

--
-- Name: system_component_type_blocks_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_component_type_blocks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_component_type_blocks_id_seq OWNER TO postgres;

--
-- Name: system_component_type_blocks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.system_component_type_blocks_id_seq OWNED BY public.system_component_type_blocks.id;


--
-- Name: system_component_type_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_component_type_materials (
    id integer NOT NULL,
    type_id integer NOT NULL,
    material_id integer NOT NULL,
    quantity integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_component_type_materials OWNER TO postgres;

--
-- Name: system_component_type_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_component_type_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_component_type_materials_id_seq OWNER TO postgres;

--
-- Name: system_component_type_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
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
    updated_at timestamp with time zone DEFAULT now()
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
    tm character varying(100)
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
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
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
-- Name: system_parameter_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_parameter_types (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    value text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_parameter_types OWNER TO postgres;

--
-- Name: system_parameter_types_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.system_parameter_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_parameter_types_id_seq OWNER TO postgres;

--
-- Name: system_parameter_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
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
    tm numeric
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
    created_at timestamp without time zone DEFAULT now()
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
-- Name: tm_values; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tm_values (
    id integer NOT NULL,
    value character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tm_values OWNER TO postgres;

--
-- Name: tm_values_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tm_values_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tm_values_id_seq OWNER TO postgres;

--
-- Name: tm_values_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tm_values_id_seq OWNED BY public.tm_values.id;


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
-- Name: breakers id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.breakers ALTER COLUMN id SET DEFAULT nextval('public.breakers_id_seq'::regclass);


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
-- Name: components id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.components ALTER COLUMN id SET DEFAULT nextval('public.components_id_seq'::regclass);


--
-- Name: consumable_block_links id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumable_block_links ALTER COLUMN id SET DEFAULT nextval('public.consumable_block_links_id_seq'::regclass);


--
-- Name: consumable_cabinet_links id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumable_cabinet_links ALTER COLUMN id SET DEFAULT nextval('public.consumable_cabinet_links_id_seq'::regclass);


--
-- Name: consumable_system_links id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumable_system_links ALTER COLUMN id SET DEFAULT nextval('public.consumable_system_links_id_seq'::regclass);


--
-- Name: consumables id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumables ALTER COLUMN id SET DEFAULT nextval('public.consumables_id_seq'::regclass);


--
-- Name: ln_values id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ln_values ALTER COLUMN id SET DEFAULT nextval('public.ln_values_id_seq'::regclass);


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
-- Name: project_block_params id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_block_params ALTER COLUMN id SET DEFAULT nextval('public.project_block_params_id_seq'::regclass);


--
-- Name: project_blocks id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_blocks ALTER COLUMN id SET DEFAULT nextval('public.project_blocks_id_seq'::regclass);


--
-- Name: project_materials id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_materials ALTER COLUMN id SET DEFAULT nextval('public.project_materials_id_seq'::regclass);


--
-- Name: project_results id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_results ALTER COLUMN id SET DEFAULT nextval('public.project_results_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: system_block_links id; Type: DEFAULT; Schema: public; Owner: postgres
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
-- Name: system_component_type_blocks id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_component_type_blocks ALTER COLUMN id SET DEFAULT nextval('public.system_component_type_blocks_id_seq'::regclass);


--
-- Name: system_component_type_materials id; Type: DEFAULT; Schema: public; Owner: postgres
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
-- Name: system_parameter_types id; Type: DEFAULT; Schema: public; Owner: postgres
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
-- Name: tm_values id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tm_values ALTER COLUMN id SET DEFAULT nextval('public.tm_values_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


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

COPY public.block_templates (id, name, created_at, updated_at, type_id, manufacturer_id, article, price, labor, weight_grams, power_watts, url, description, ln, tm) FROM stdin;
49	Автоматический выключатель 10A 400В	2026-07-08 22:07:09.94405	2026-07-08 22:07:09.94405	32	1	S9F21310	4240.00	\N	\N	\N	https://api.systeme.ru/catalog/view/S9F21310	Systeme9 Автоматический выключатель (АВ) B 10A 3P 6kA 400В	\N	\N
50	Автоматический выключатель 16A 400В	2026-07-08 22:12:58.03125	2026-07-08 22:12:58.03125	32	1	S9F23416	7950.00	\N	\N	\N	https://api.systeme.ru/catalog/view/S9F23416	Systeme9 Автоматический выключатель (АВ) D 16A 4P 6kA 400В	\N	\N
46	Автоматический выключатель 16A 230В	2026-07-08 21:51:00.686367	2026-07-08 21:51:00.686367	32	1	S9F21116	1070.00	\N	\N	\N	https://api.systeme.ru/catalog/view/S9F21116	Systeme9 Автоматический выключатель (АВ) B 16A 1P 6kA 230В	\N	\N
47	Автоматический выключатель 6A 400В	2026-07-08 21:52:40.579833	2026-07-08 21:52:40.579833	32	1	S9F21306	3320.00	\N	\N	\N	https://api.systeme.ru/catalog/view/S9F21306	Systeme9 Автоматический выключатель (АВ) B 6A 3P 6kA 400В	\N	\N
7	Реле 230V	2026-06-29 19:08:37.99461	2026-07-16 22:22:53.613817	29	1	SXG22P7	1003.00	\N	19.00	\N	https://systeme.ru/product/SXG22P7?ysclid=mp4113fjdn489734512	Реле 8A 2CO 230VAC тест кнопка LED	8	15
25	Контактор 24В	2026-07-07 11:38:30.754427	2026-07-16 09:24:30.925348	31	1	MP1K1201BD	5819.40	\N	\N	1.00	https://systeme.ru/product/MP1K1201BD?ysclid=mp40uzqrqh438380385	КОНТАКТОР MP1K 12A 1НЗ DC24V	8	\N
29	Автоматический выключатель 6A 230В	2026-07-08 21:39:22.531255	2026-07-09 00:33:02.446889	32	1	S9F21106	1280.00	\N	\N	\N	https://api.systeme.ru/catalog/view/S9F21106	Systeme9 Автоматический выключатель (АВ) B 6A 1P 6kA 230В	\N	\N
26	SystemeHD	2026-07-07 12:57:20.772926	2026-07-16 11:17:24.224491	1	1	HD1407E	149500.00	\N	600.00	14.00	https://api.systeme.ru/catalog/view/HD1407E	Контроллер SystemeHD, 6DI 8UI 3DO 2AO 2VO, 2Ethernet 2RS485 BACnet Modbus ~24В/=24В	26	\N
6	SystemeHD	2026-06-29 19:03:09.38992	2026-07-16 11:18:01.00488	1	1	HD1407	124500.00	\N	600.00	14.00	https://api.systeme.ru/catalog/view/HD1407	Контроллер SystemeHD, 6DI 8UI 3DO 2AO 2VO Ethernet 2RS485 BACnet Modbus ~24В/=24В	27	25
31	Автоматический выключатель 10A 230В	2026-07-08 21:41:26.515326	2026-07-16 20:16:36.664837	32	1	S9F21110	1180.00	\N	\N	\N	https://api.systeme.ru/catalog/view/S9F21110	Systeme9 Автоматический выключатель (АВ) B 10A 1P 6kA 230В	\N	\N
\.


--
-- Data for Name: breakers; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.breakers (id, name, type, rating, project_id, created_at) FROM stdin;
\.


--
-- Data for Name: cabinet_systems; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.cabinet_systems (id, cabinet_id, name, description, system_id, "position") FROM stdin;
24	10	\N	Раздевалки ЩУВ-П2.50	22	0
36	10	\N	ПВ (6нП15.1/6нВ18.1) ЩУВ-П2.50	27	0
37	10	\N	ПВ (6нП15.1/6нВ18.1) ЩУВ-П2.50	28	0
38	1	\N	\N	\N	0
39	1	\N	Центральная кроссовая ЩУВ-П2.47	18	1
23	1	\N	Раздевалки ЩУВ-П2.47	1	2
25	1	\N	Лифтовые холлы паркинга ЩУВ-П2.47	17	3
27	1	\N	ПВ (6нП15.2/6нВ18.2) - ИТП П3.17 ЩУВ-П2.47	20	4
29	1	\N	ПВ (6нП15.3/6нВ18.3) помещения?	24	5
40	1	\N	Центральная кроссовая ЩУВ-П2.47	19	6
28	1	\N	ПВ (6нП15.2/6нВ18.2) - ИТП П3.17 ЩУВ-П2.47	21	7
30	1	\N	ПВ (6нП15.3/6нВ18.3) помещения?	25	8
41	1	\N	\N	26	9
\.


--
-- Data for Name: cabinets; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.cabinets (id, name, project_id, user_id, created_at, updated_at, description, width, height, depth) FROM stdin;
10	ЩУВ-П2.50	2	1	2026-07-07 21:17:20.12974	2026-07-14 20:35:47.458453		\N	\N	\N
1	ЩУВ-П2.47	2	1	2026-06-28 15:41:21.340102	2026-07-14 20:35:50.866953	для сети "Петрович"	\N	\N	\N
\.


--
-- Data for Name: component_param_values; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.component_param_values (id, component_id, param_id, value, created_at) FROM stdin;
22	6	1	8	2026-06-29 19:03:09.38992
23	6	8	6	2026-06-29 19:03:09.38992
24	6	2	2	2026-06-29 19:03:09.38992
25	6	4	3	2026-06-29 19:03:09.38992
26	6	6	1	2026-06-29 19:03:09.38992
27	6	5	2	2026-06-29 19:03:09.38992
\.


--
-- Data for Name: component_types; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.component_types (id, name, category, description, created_at) FROM stdin;
32	Автоматический выключатель	\N	\N	2026-06-29 18:54:10.715973
1	Контроллер		\N	2026-06-26 20:21:03.509978
2	Модуль расширения		\N	2026-06-27 10:51:00.812674
24	Блок питания	\N	\N	2026-06-29 18:54:10.711833
25	Графическая панель оператора	\N	\N	2026-06-29 18:54:10.712633
26	Коммутатор	\N	\N	2026-06-29 18:54:10.713241
27	Реле контроля фаз	\N	\N	2026-06-29 18:54:10.713694
28	Реле промежуточное (колодка)	\N	\N	2026-06-29 18:54:10.714149
29	Реле промежуточное (реле)	\N	\N	2026-06-29 18:54:10.714797
30	Реле промежуточное (реле+колодка)	\N	\N	2026-06-29 18:54:10.715208
31	Контактор	\N	\N	2026-06-29 18:54:10.715597
33	Выключатель нагрузки	\N	\N	2026-06-29 18:54:10.716299
34	Вентилятор	\N	\N	2026-06-29 18:54:10.716611
35	Корпус шкафа	\N	\N	2026-06-29 18:54:10.716939
\.


--
-- Data for Name: components; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.components (id, type_id, manufacturer_id, model, price, description, created_at) FROM stdin;
\.


--
-- Data for Name: consumable_block_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consumable_block_links (id, consumable_id, block_template_id, quantity) FROM stdin;
\.


--
-- Data for Name: consumable_cabinet_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consumable_cabinet_links (id, consumable_id, cabinet_id, quantity) FROM stdin;
\.


--
-- Data for Name: consumable_system_links; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consumable_system_links (id, consumable_id, system_component_id, quantity) FROM stdin;
\.


--
-- Data for Name: consumables; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consumables (id, article, name, unit, price, description, manufacturer_id, url, created_at, updated_at, manufacturer_url) FROM stdin;
\.


--
-- Data for Name: ln_values; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ln_values (id, value, entity_type, entity_id, created_at) FROM stdin;
2	1	material	10	2026-07-06 20:08:10.191038+05
121	2	block_template	31	2026-07-08 21:41:26.515326+05
1	1	material	18	2026-07-06 20:08:10.191038+05
67	2	system_component	41	2026-07-07 09:41:32.207507+05
120	2	block_template	29	2026-07-08 21:39:22.531255+05
12	2	system_component	12	2026-07-06 20:08:10.191038+05
66	2	system_component	40	2026-07-07 09:39:22.126834+05
11	1	system_component	11	2026-07-06 20:08:10.191038+05
6	1	material	7	2026-07-06 20:08:10.191038+05
7	1	material	13	2026-07-06 20:08:10.191038+05
5	1	material	17	2026-07-06 20:08:10.191038+05
3	1	material	9	2026-07-06 20:08:10.191038+05
90	3	system_component	35	2026-07-07 17:32:55.490564+05
198	3	system_component	60	2026-07-10 12:29:05.897416+05
4	1	material	16	2026-07-06 20:08:10.191038+05
10	3	system_component	3	2026-07-06 20:08:10.191038+05
9	8	block_template	7	2026-07-06 20:08:10.191038+05
94	1	system_component	48	2026-07-07 17:34:02.764683+05
95	1	system_component	45	2026-07-07 17:34:10.506203+05
96	1	system_component	46	2026-07-07 17:34:19.253141+05
97	1	system_component	49	2026-07-07 17:34:27.438024+05
361		system_component	68	2026-07-16 22:33:11.171881+05
59	1	system_component	32	2026-07-06 23:14:47.268696+05
61	1	system_component	34	2026-07-06 23:46:19.918689+05
62	1	system_component	36	2026-07-07 09:20:26.051327+05
65	1	system_component	39	2026-07-07 09:33:47.98721+05
68	1	system_component	42	2026-07-07 09:43:04.514984+05
69	1	system_component	43	2026-07-07 09:46:26.345731+05
70	1	system_component	44	2026-07-07 09:48:23.921594+05
71	1	system_component	47	2026-07-07 11:43:47.932439+05
168	1	system_component	53	2026-07-10 08:23:50.481238+05
98	10	block_template	28	2026-07-07 21:51:30.628963+05
75	26	block_template	26	2026-07-07 13:17:27.551512+05
8	27	block_template	6	2026-07-06 20:08:10.191038+05
128	2	block_template	40	2026-07-08 21:45:19.721808+05
129	2	block_template	46	2026-07-08 21:51:00.686367+05
130	6	block_template	47	2026-07-08 21:52:40.579833+05
131	6	block_template	49	2026-07-08 22:07:09.94405+05
132	6	block_template	50	2026-07-08 22:12:58.03125+05
187	1	system_component	56	2026-07-10 11:17:33.26816+05
185	3	system_component	55	2026-07-10 11:05:53.154501+05
189	1	system_component	57	2026-07-10 11:21:24.459649+05
183	3	system_component	54	2026-07-10 11:05:03.744461+05
194	3	system_component	59	2026-07-10 12:22:15.194162+05
192	1	system_component	58	2026-07-10 12:19:04.780042+05
101	1	system_component	52	2026-07-07 21:57:31.698012+05
64	3	system_component	38	2026-07-07 09:30:33.660812+05
63	2	system_component	37	2026-07-07 09:26:07.201102+05
74	8	block_template	25	2026-07-07 13:17:27.551512+05
\.


--
-- Data for Name: manufacturers; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.manufacturers (id, name, country, website, created_at) FROM stdin;
1	Systeme Electric	Россия		2026-06-26 08:23:59.316451
3	Dekraft	Россия	\N	2026-06-26 08:34:44.04663
4	DKS	Россия	\N	2026-06-26 08:34:44.047092
5	IEK	Россия	\N	2026-06-26 08:34:44.047567
27	Дмитров-Кабель	Россия	\N	2026-07-01 22:57:05.103164
28	КВТ	\N	\N	2026-07-05 10:40:34.540282
29	THERMOKON	\N	\N	2026-07-06 16:00:24.668021
18	Shuft	Дания	https://www.shuft.pro	2026-06-29 21:21:35.452749
\.


--
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.materials (id, article, name, manufacturer, description, unit, price, created_at, updated_at, manufacturer_id, manufacturer_url, ln, tm) FROM stdin;
10	9888602	ПУГВнг(А)-LS 1х1.5 белый	\N	Провод силовой ПУГВнг(А)-LS 1х1.5 ТРТС белый многопроволочный 100м Дмитров-Кабель	м	27.77	2026-07-02 19:59:34.812034	2026-07-08 22:19:12.459176	27	https://www.etm.ru/cat/nn/9888602	2	2
20	8806872	Наконечник 2 х 1.5-8	\N	Наконечник штыревой втулочный изолированный НШВИ(2) 1.5-8 79466 КВТ	шт	2.10	2026-07-07 22:07:33.753728	2026-07-16 22:21:30.75207	28	https://www.etm.ru/cat/nn/8806872	1	1
22	5041367	Клемма проходная, 4 кв.мм, серая	\N	Клемма проходная, винтовой зажим, 2 точки подключения, 4 кв.мм, серая TUR-4 DKC	шт	76.05	2026-07-15 08:28:37.674186	2026-07-16 11:17:40.225764	4	https://www.etm.ru/cat/nn/5041367	2	1
9	8519116	Клемма двухуровневая, 2.5 кв.мм, серая	\N	Клемма двухуровневая, винтовой зажим, 4 точки подключения, 2.5 кв.мм, серая KRUKB-3 DKC	шт	374.84	2026-07-02 14:03:06.897852	2026-07-16 11:18:06.37474	4	https://www.etm.ru/cat/nn/8519116	1	1
7	5226932	ПуГВнг(А)-LS 1х0.75 белый	\N	Провод силовой ПуГВнг(А)-LS 1х0.75белый 500м ТРТС Дмитров-Кабель	м	15.08	2026-07-01 22:59:38.992109	2026-07-16 20:11:40.139849	27	https://www.etm.ru/cat/nn/5226932	1	1
18	5044120	ПУГВнг(А)-LS 1х1.5 синий	\N	Провод силовой ПУГВнг(А)-LS 1х1.5 ТРТС синий многопроволочный Дмитров-Кабель	м	28.48	2026-07-06 10:38:46.471228	2026-07-07 11:40:30.495708	27	https://www.etm.ru/cat/nn/5044120	1	1
19	4943770	Наконечник 1.5-8	\N	Наконечник штыревой втулочный изолированный НШВИ 1.5-8 79440 КВТ	шт	1.04	2026-07-07 22:06:20.115682	2026-07-16 21:51:06.450323	28	https://www.etm.ru/cat/nn/4943770	1	1
17	2530140	Наконечник 2 х 0.75-8	\N	Наконечник штыревой втулочный изолированный НШВИ(2) 0.75-8 79462 КВТ	шт	1.64	2026-07-05 10:43:51.209397	2026-07-16 22:23:09.287559	28	https://www.etm.ru/cat/nn/2530140	1	1
23	5728143	Клемма заземления,  4 кв.мм	\N	Клемма заземления, винтовой зажим, 2 точки подключения, 4 кв.мм TUR-4-PE DKC	шт	250.68	2026-07-15 08:31:21.048041	2026-07-16 09:00:17.014583	4	https://www.etm.ru/cat/nn/5728143	2	1
21	6016932	Клемма проходная, 4 кв.мм, синяя	\N	Клемма проходная, винтовой зажим, 2 точки подключения, 4 кв.мм, синяя TUR-4-BU DKC	шт	89.35	2026-07-15 08:27:08.568127	2026-07-16 09:04:03.973474	4	https://www.etm.ru/cat/nn/6016932	2	1
13	7262531	ПуГВнг(А)-LS 1х0.75 синий	\N	Провод силовой ПуГВнг(А)-LS 1х0.75синий 500м ТРТ С Дмитров-Кабель	м	15.51	2026-07-04 11:12:23.024586	2026-07-16 20:11:48.836684	27	https://www.etm.ru/cat/nn/7262531	1	1
16	2976861	Наконечник  0.75-8	\N	Наконечник штыревой втулочный изолированный НШВИ 0.75-8 79436 КВТ	шт	0.87	2026-07-05 10:41:50.745652	2026-07-16 21:09:35.63942	28	https://www.etm.ru/cat/nn/2976861	1	1
\.


--
-- Data for Name: parameters; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.parameters (id, name, unit, type, description, created_at) FROM stdin;
1	AI	\N	1	Аналоговый вход	2026-06-26 20:21:17.81597
2	AO			Аналоговый выход	2026-06-27 10:51:00.825187
8	DI			Дискретный вход	2026-06-27 11:47:44.599184
4	DO			Дискретный выход	2026-06-27 11:27:00.975712
6	Eth			Интернет порт	2026-06-27 11:27:53.341558
5	RS485			порт RS485	2026-06-27 11:27:23.919453
\.


--
-- Data for Name: project_block_params; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.project_block_params (id, block_id, param_id, value, created_at) FROM stdin;
\.


--
-- Data for Name: project_blocks; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.project_blocks (id, project_id, cabinet_id, template_id, "position", created_at, quantity, linked) FROM stdin;
\.


--
-- Data for Name: project_materials; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.project_materials (id, project_id, material_id, quantity, created_at, cabinet_id, linked, updated_at) FROM stdin;
42	1	20	1	2026-07-16 21:45:16.819424	1	f	2026-07-16 21:45:16.819424
\.


--
-- Data for Name: project_results; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.project_results (id, project_id, data, created_at) FROM stdin;
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.projects (id, name, description, user_id, created_at, updated_at) FROM stdin;
1	Ижевск	шкафы автоматики	1	2026-06-26 08:58:55.518043	2026-06-26 08:58:55.518043
2	Питер	Автоматизация вентиляции	2	2026-06-26 09:15:01.104668	2026-06-28 16:08:08.020327
\.


--
-- Data for Name: system_block_links; Type: TABLE DATA; Schema: public; Owner: postgres
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
-- Data for Name: system_component_type_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_component_type_blocks (id, type_id, block_template_id, quantity, created_at) FROM stdin;
22	26	7	1	2026-07-16 22:22:54.863185+05
\.


--
-- Data for Name: system_component_type_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_component_type_materials (id, type_id, material_id, quantity, created_at) FROM stdin;
52	26	17	1	2026-07-16 22:23:10.620086+05
\.


--
-- Data for Name: system_component_types; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_component_types (id, name, description, created_at, updated_at) FROM stdin;
23	привод заслонки 220/0-10/О/З	\N	2026-07-10 08:04:53.801229+05	2026-07-16 21:49:54.669383+05
21	Двигатель (Частотный преобразователь)	\N	2026-07-07 11:48:47.209634+05	2026-07-10 08:07:43.583589+05
18	Привод трехходового клапана 24/0-10/статус	\N	2026-07-07 10:29:22.514806+05	2026-07-10 08:09:16.336661+05
24	привод заслонки 24/0-10/О/З	\N	2026-07-10 08:09:38.654499+05	2026-07-10 08:09:38.654499+05
6	привод заслонки  220/DO/О/З	1	2026-06-27 12:12:43.894779+05	2026-07-16 22:22:44.696128+05
26	test	\N	2026-07-16 22:20:47.597211+05	2026-07-16 22:23:12.630361+05
25	привод заслонки 24/DO/О/З	\N	2026-07-10 08:09:52.596463+05	2026-07-14 17:53:37.094246+05
17	Датчик температуры - ТЕ	\N	2026-07-06 15:56:03.01345+05	2026-07-16 08:44:44.604872+05
19	Циркуляционный насос	\N	2026-07-07 11:32:12.961835+05	2026-07-07 11:32:12.961835+05
20	Термостат	\N	2026-07-07 11:44:58.389633+05	2026-07-07 11:44:58.389633+05
16	Датчик перепада - PDS	\N	2026-07-06 15:54:14.002119+05	2026-07-16 10:32:51.464572+05
15	Фильтр	\N	2026-07-02 20:12:58.799329+05	2026-07-16 10:32:55.764425+05
22	Двигатель (Контактор 3P 220)	\N	2026-07-07 21:56:28.187202+05	2026-07-16 10:42:58.263634+05
\.


--
-- Data for Name: system_components; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_components (id, name, type_id, manufacturer_id, article, description, created_at, updated_at, url, module_id, ln, tm) FROM stdin;
32	Датчик температуры канала притока	17	1	\N	\N	2026-07-06 23:14:47.268696+05	2026-07-07 14:21:12.376611+05	\N	11	1	15
43	Датчик температуры канала притока после жалюзей	17	1	\N	\N	2026-07-07 09:46:26.345731+05	2026-07-07 14:21:16.980407+05	\N	14	1	15
47	Датчик температуры обратной воды	17	1	\N	\N	2026-07-07 11:43:47.932439+05	2026-07-07 14:21:25.855248+05	\N	17	1	15
55	привод заслонки резервного вентилятора	6	18	\N	\N	2026-07-10 11:05:53.154501+05	2026-07-16 11:19:19.911577+05	\N	4	\N	\N
54	привод заслонки основного вентилятора	6	18	\N	\N	2026-07-10 11:05:03.744461+05	2026-07-16 11:19:29.290467+05	\N	3	\N	\N
59	привод заслонки вентилятора вытяжки резервного	6	18	\N	\N	2026-07-10 12:22:15.194162+05	2026-07-16 11:19:39.47169+05	\N	13	\N	\N
58	Двигатель (контактор) вентилятора вытяжки 2	22	\N	\N	\N	2026-07-10 12:19:04.780042+05	2026-07-16 11:19:46.130612+05	\N	16	\N	\N
52	Двигатель (контактор) вентилятора притока 1	22	\N	\N	\N	2026-07-07 21:57:31.698012+05	2026-07-16 11:19:50.903168+05	\N	10	\N	\N
36	Датчик температуры вытяжки из помещения	17	1	\N	\N	2026-07-07 09:20:26.051327+05	2026-07-07 09:24:26.210963+05	\N	12	1	15
68	test	26	\N	\N	\N	2026-07-16 22:33:11.171881+05	2026-07-16 22:33:11.171881+05	\N	19	\N	\N
38	привод заслонки вытяжки	6	18	\N	\N	2026-07-07 09:30:33.660812+05	2026-07-16 11:44:57.414082+05	\N	2	4	30
48	Термостат угрозы заморозки	20	\N	\N	\N	2026-07-07 11:45:32.852089+05	2026-07-07 17:34:02.764683+05	\N	17	1	15
45	Привод трехходового клапана контура тепла	18	\N	\N	\N	2026-07-07 10:29:33.487908+05	2026-07-07 17:34:10.506203+05	\N	17	1	15
46	Циркуляционный насос фодяного контура нагрева	19	\N	\N	\N	2026-07-07 11:37:11.308804+05	2026-07-07 17:34:19.253141+05	\N	17	1	15
49	Частотный преобразователь вентилятора притока 1	21	\N	\N	\N	2026-07-07 11:50:24.461961+05	2026-07-07 17:34:27.438024+05	\N	10	1	30
35	привод заслонки рециркуляции	6	18	\N	\N	2026-07-07 08:29:54.739483+05	2026-07-16 21:49:01.794203+05	\N	2	4	30
60	привод заслонки вентилятора вытяжки основного	6	18	\N	\N	2026-07-10 12:29:05.897416+05	2026-07-16 21:49:08.584903+05	\N	16	\N	\N
3	привод заслонки притока	23	18	\N	\N	2026-06-27 12:05:35.484324+05	2026-07-16 21:53:12.767766+05	/api/system-components/3	1	4	30
53	Двигатель (контактор) вентилятора вытяжки 1	22	\N	\N	\N	2026-07-10 08:23:50.481238+05	2026-07-10 08:40:32.235566+05	\N	13	\N	\N
37	Датчик перепада на Вентиляторе вытяжки 1	16	29	\N	привет это описание	2026-07-07 09:26:07.201102+05	2026-07-14 17:53:57.03406+05	\N	13	1	15
41	Датчик перепада на Вентиляторе вытяжки 2	16	29	\N	\N	2026-07-07 09:41:32.207507+05	2026-07-16 08:44:06.648336+05	\N	16	1	15
56	Частотный преобразователь вентилятора притока 2	21	\N	\N	\N	2026-07-10 11:17:33.26816+05	2026-07-10 11:17:47.404424+05	\N	15	\N	\N
57	Датчик температуры в помещении	17	1	\N	\N	2026-07-10 11:21:24.459649+05	2026-07-10 11:21:42.431077+05	\N	18	\N	\N
12	Датчик перепада на Вентиляторе притока 1	16	29	\N	\N	2026-07-06 15:59:58.5888+05	2026-07-16 08:46:23.741316+05	\N	10	2	15
40	Датчик перепада на Вентиляторе притока 2	16	29	\N	\N	2026-07-07 09:39:22.126834+05	2026-07-16 08:46:28.74405+05	\N	15	1	15
11	Датчик перепада на Фильтре	16	29	\N	\N	2026-07-02 20:17:20.770039+05	2026-07-16 08:46:34.087306+05	\N	6	1	15
\.


--
-- Data for Name: system_components_link; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_components_link (id, system_id, component_id, quantity, "position") FROM stdin;
114	18	3	1	0
118	18	43	1	1
115	18	11	1	2
119	18	45	1	3
125	18	54	1	4
52	20	3	1	0
59	20	43	1	1
145	20	35	1	2
56	20	11	1	3
127	18	55	1	5
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
48	22	32	1	1
50	22	35	1	2
60	24	3	1	0
61	24	11	1	1
62	24	12	1	2
63	24	32	1	3
64	24	43	1	4
70	24	45	1	5
75	24	38	1	6
101	24	52	1	7
72	25	37	1	0
73	25	36	1	1
74	25	35	1	2
103	27	52	1	0
104	27	37	1	1
105	27	36	1	2
106	27	35	1	3
107	28	38	1	0
108	28	52	1	1
109	28	3	1	2
110	28	11	1	3
111	28	12	1	4
112	28	32	1	5
113	28	43	1	6
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
131	17	3	1	0
132	17	43	1	0
133	17	11	1	0
134	17	46	1	0
135	17	45	1	0
136	17	48	1	0
150	19	37	1	3
151	19	41	1	4
152	19	60	1	5
153	19	59	1	6
154	19	36	1	7
137	17	47	1	0
138	17	49	1	0
139	17	12	1	0
140	17	32	1	0
\.


--
-- Data for Name: system_modules; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_modules (id, name, description, created_at, updated_at) FROM stdin;
5	Воздушная заслонка рециркуляции приточной и вытяжной систем	\N	2026-07-02 09:05:24.107873	2026-07-02 09:05:24.107873
1	Воздушная заслонка приточной системы	\N	2026-07-02 09:00:22.242057	2026-07-02 09:05:31.126324
6	Фильтр притока 1	\N	2026-07-02 20:13:35.621091	2026-07-02 20:13:35.621091
7	Фильтр притока 2	\N	2026-07-02 20:13:48.356623	2026-07-02 20:13:48.356623
8	Фильтр вытяжки 1	\N	2026-07-02 20:14:29.45965	2026-07-02 20:14:29.45965
9	Фильтр вытяжки 2	\N	2026-07-02 20:14:37.038154	2026-07-02 20:14:37.038154
2	Воздушная заслонка вытяжной системы	Описание	2026-07-02 09:00:22.242057	2026-07-05 13:20:52.686613
3	Воздушная заслонка приточной для основного вентилятора	Описание	2026-07-02 09:04:26.781373	2026-07-05 13:46:42.686505
4	Воздушная заслонка приточной для резервного вентилятора	12	2026-07-02 09:04:39.690032	2026-07-05 20:03:44.513922
10	Вентилятор притока 1	\N	2026-07-06 15:57:53.449467	2026-07-06 15:57:53.449467
11	Выход канала притока	\N	2026-07-06 15:58:44.43052	2026-07-06 15:58:44.43052
12	Вход канала вытяжки	\N	2026-07-06 15:58:55.711705	2026-07-06 15:58:55.711705
13	Вентилятор вытяжки 1	\N	2026-07-07 09:26:53.815148	2026-07-07 09:26:53.815148
14	Канал притока после жалюзей	\N	2026-07-07 09:33:38.469489	2026-07-07 09:33:38.469489
15	Вентилятор притока 2	\N	2026-07-07 09:40:02.304192	2026-07-07 09:40:02.304192
16	Вентиляторе вытяжки 2	\N	2026-07-07 09:42:04.994077	2026-07-07 09:42:04.994077
17	Водяной контур нагрева	\N	2026-07-07 10:28:17.993438	2026-07-07 10:28:17.993438
18	Помещение	\N	2026-07-10 11:21:07.392534	2026-07-10 11:21:07.392534
19	test	\N	2026-07-16 22:20:58.185368	2026-07-16 22:20:58.185368
\.


--
-- Data for Name: system_parameter_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_parameter_types (id, name, value, created_at, updated_at) FROM stdin;
1	AI	Аналоговый вход	2026-07-06 11:34:24.671796+05	2026-07-06 11:34:24.671796+05
2	AO	Аналоговый выход	2026-07-06 11:34:50.302082+05	2026-07-06 11:35:26.653533+05
3	DI	Дискретный вход	2026-07-06 11:35:48.229822+05	2026-07-06 11:35:48.229822+05
4	DO	Дискретный выход	2026-07-06 11:36:13.567957+05	2026-07-06 11:36:13.567957+05
5	rs485	интерфейс rs485	2026-07-07 11:51:01.970834+05	2026-07-07 17:35:27.352622+05
\.


--
-- Data for Name: system_parameters; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.system_parameters (id, name, value, description, created_at, updated_at, type, ln, tm) FROM stdin;
7	статус закрыто	\N	Описание	2026-06-28 13:08:32.605933+05	2026-07-05 12:49:00.632345+05	DI	1	1
18	Статус засора	\N	Описание	2026-07-02 20:16:38.875105+05	2026-07-05 12:49:05.947785+05	DI	1	1
6	статус открыто	\N	Описание	2026-06-28 13:07:09.795998+05	2026-07-05 12:49:12.508217+05	DI	1	1
19	Статус AI	\N	\N	2026-07-06 21:15:31.383048+05	2026-07-07 09:25:30.808801+05	AI	1	1
17	Команда управление 0-10 В	\N	Описание	2026-07-02 09:40:01.07852+05	2026-07-07 09:28:42.760332+05	AO	1	1
8	Команда управления - открыть	\N	Описание	2026-06-28 13:14:14.654716+05	2026-07-07 09:28:57.548497+05	DO	1	1
20	Статус DI	\N	\N	2026-07-07 11:33:55.836712+05	2026-07-07 17:34:55.051966+05	DI	1	1
21	интерфейс rs485	\N	\N	2026-07-07 11:50:13.895142+05	2026-07-07 17:34:58.515923+05	rs485	1	1
\.


--
-- Data for Name: systems; Type: TABLE DATA; Schema: public; Owner: hrroot
--

COPY public.systems (id, name, description, created_at) FROM stdin;
23	6нВ17	Лифтовые холлы паркинга ЩУВ-П2.50	2026-07-06 10:02:27.815297
21	6нВ18.2	ИТП П3.17 ЩУВ-П2.47	2026-07-06 09:59:29.33203
19	6нВ14	Центральная кроссовая ЩУВ-П2.47	2026-07-06 09:58:40.20832
25	6нВ18.3	уточнить в какое помещение работает и шкаф	2026-07-06 10:03:23.389963
18	6нП12	Центральная кроссовая ЩУВ-П2.47	2026-07-06 09:58:01.633482
1	6нП14	Раздевалки ЩУВ-П2.47	2026-06-28 16:46:41.681613
20	6нП15.2	ИТП П3.17 ЩУВ-П2.47	2026-07-06 09:59:13.178276
24	6нП15.3	уточнить в какое помещение работает и шкаф	2026-07-06 10:03:07.178812
17	6нП16	Лифтовые холлы паркинга ЩУВ-П2.47	2026-07-06 09:57:18.793545
26	test	\N	2026-07-06 21:44:30.056454
27	6нВ18.1	\N	2026-07-07 21:40:53.385833
28	6нП15.1	\N	2026-07-07 21:41:16.161244
22	6нВ16	Раздевалки ЩУВ-П2.50	2026-07-06 10:02:08.301098
\.


--
-- Data for Name: tm_values; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tm_values (id, value, entity_type, entity_id, created_at) FROM stdin;
2	1	material	10	2026-07-06 20:08:10.192251+05
1	1	material	18	2026-07-06 20:08:10.192251+05
192	30	system_component	59	2026-07-10 12:22:15.194162+05
190	15	system_component	58	2026-07-10 12:19:04.780042+05
105	15	system_component	52	2026-07-07 21:57:31.698012+05
68	30	system_component	38	2026-07-07 09:30:33.660812+05
126	15	block_template	40	2026-07-08 21:45:19.721808+05
127	15	block_template	46	2026-07-08 21:51:00.686367+05
128	30	block_template	47	2026-07-08 21:52:40.579833+05
129	30	block_template	49	2026-07-08 22:07:09.94405+05
130	30	block_template	50	2026-07-08 22:12:58.03125+05
5	1	material	17	2026-07-06 20:08:10.192251+05
6	1	material	7	2026-07-06 20:08:10.192251+05
7	1	material	13	2026-07-06 20:08:10.192251+05
3	1	material	9	2026-07-06 20:08:10.192251+05
83	30	block_template	25	2026-07-07 13:43:48.701987+05
4	1	material	16	2026-07-06 20:08:10.192251+05
67	16	system_component	37	2026-07-07 09:26:07.201102+05
124	15	block_template	29	2026-07-08 21:39:22.531255+05
125	15	block_template	31	2026-07-08 21:41:26.515326+05
71	16	system_component	41	2026-07-07 09:41:32.207507+05
12	16	system_component	12	2026-07-06 20:08:10.192251+05
63	15	system_component	32	2026-07-06 23:14:47.268696+05
70	16	system_component	40	2026-07-07 09:39:22.126834+05
65	15	system_component	34	2026-07-06 23:46:19.918689+05
66	15	system_component	36	2026-07-07 09:20:26.051327+05
69	15	system_component	39	2026-07-07 09:33:47.98721+05
72	15	system_component	42	2026-07-07 09:43:04.514984+05
73	15	system_component	43	2026-07-07 09:46:26.345731+05
74	15	system_component	44	2026-07-07 09:48:23.921594+05
75	15	system_component	47	2026-07-07 11:43:47.932439+05
11	15	system_component	11	2026-07-06 20:08:10.192251+05
100	15	system_component	48	2026-07-07 17:34:02.764683+05
101	15	system_component	45	2026-07-07 17:34:10.506203+05
102	15	system_component	46	2026-07-07 17:34:19.253141+05
103	15	system_component	49	2026-07-07 17:34:27.438024+05
96	30	system_component	35	2026-07-07 17:32:55.490564+05
196	30	system_component	60	2026-07-10 12:29:05.897416+05
10	30	system_component	3	2026-07-06 20:08:10.192251+05
9	16	block_template	7	2026-07-06 20:08:10.192251+05
354		system_component	68	2026-07-16 22:33:11.171881+05
166	15	system_component	53	2026-07-10 08:23:50.481238+05
185	15	system_component	56	2026-07-10 11:17:33.26816+05
187	15	system_component	57	2026-07-10 11:21:24.459649+05
104	30	block_template	28	2026-07-07 21:51:30.628963+05
82	30	block_template	26	2026-07-07 13:43:35.473497+05
8	30	block_template	6	2026-07-06 20:08:10.192251+05
183	30	system_component	55	2026-07-10 11:05:53.154501+05
181	30	system_component	54	2026-07-10 11:05:03.744461+05
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

SELECT pg_catalog.setval('public.block_templates_id_seq', 53, true);


--
-- Name: breakers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.breakers_id_seq', 1, false);


--
-- Name: cabinet_systems_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.cabinet_systems_id_seq', 41, true);


--
-- Name: cabinets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.cabinets_id_seq', 11, true);


--
-- Name: component_param_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.component_param_values_id_seq', 27, true);


--
-- Name: component_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.component_types_id_seq', 43, true);


--
-- Name: components_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.components_id_seq', 1, false);


--
-- Name: consumable_block_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.consumable_block_links_id_seq', 1, false);


--
-- Name: consumable_cabinet_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.consumable_cabinet_links_id_seq', 1, false);


--
-- Name: consumable_system_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.consumable_system_links_id_seq', 1, false);


--
-- Name: consumables_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.consumables_id_seq', 1, false);


--
-- Name: ln_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ln_values_id_seq', 361, true);


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
-- Name: project_block_params_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.project_block_params_id_seq', 1, false);


--
-- Name: project_blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.project_blocks_id_seq', 94, true);


--
-- Name: project_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.project_materials_id_seq', 42, true);


--
-- Name: project_results_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.project_results_id_seq', 1, false);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.projects_id_seq', 10, true);


--
-- Name: system_block_links_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
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
-- Name: system_component_type_blocks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_component_type_blocks_id_seq', 23, true);


--
-- Name: system_component_type_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_component_type_materials_id_seq', 52, true);


--
-- Name: system_component_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_component_types_id_seq', 26, true);


--
-- Name: system_components_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_components_id_seq', 68, true);


--
-- Name: system_components_link_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_components_link_id_seq', 154, true);


--
-- Name: system_modules_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_modules_id_seq', 19, true);


--
-- Name: system_parameter_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.system_parameter_types_id_seq', 5, true);


--
-- Name: system_parameters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.system_parameters_id_seq', 21, true);


--
-- Name: systems_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.systems_id_seq', 29, true);


--
-- Name: tm_values_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tm_values_id_seq', 354, true);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: hrroot
--

SELECT pg_catalog.setval('public.user_sessions_id_seq', 8, true);


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
-- Name: breakers breakers_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.breakers
    ADD CONSTRAINT breakers_pkey PRIMARY KEY (id);


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
-- Name: components components_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.components
    ADD CONSTRAINT components_pkey PRIMARY KEY (id);


--
-- Name: consumable_block_links consumable_block_links_consumable_id_block_template_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumable_block_links
    ADD CONSTRAINT consumable_block_links_consumable_id_block_template_id_key UNIQUE (consumable_id, block_template_id);


--
-- Name: consumable_block_links consumable_block_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumable_block_links
    ADD CONSTRAINT consumable_block_links_pkey PRIMARY KEY (id);


--
-- Name: consumable_cabinet_links consumable_cabinet_links_consumable_id_cabinet_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumable_cabinet_links
    ADD CONSTRAINT consumable_cabinet_links_consumable_id_cabinet_id_key UNIQUE (consumable_id, cabinet_id);


--
-- Name: consumable_cabinet_links consumable_cabinet_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumable_cabinet_links
    ADD CONSTRAINT consumable_cabinet_links_pkey PRIMARY KEY (id);


--
-- Name: consumable_system_links consumable_system_links_consumable_id_system_component_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumable_system_links
    ADD CONSTRAINT consumable_system_links_consumable_id_system_component_id_key UNIQUE (consumable_id, system_component_id);


--
-- Name: consumable_system_links consumable_system_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumable_system_links
    ADD CONSTRAINT consumable_system_links_pkey PRIMARY KEY (id);


--
-- Name: consumables consumables_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumables
    ADD CONSTRAINT consumables_pkey PRIMARY KEY (id);


--
-- Name: ln_values ln_values_entity_type_entity_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ln_values
    ADD CONSTRAINT ln_values_entity_type_entity_id_key UNIQUE (entity_type, entity_id);


--
-- Name: ln_values ln_values_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ln_values
    ADD CONSTRAINT ln_values_pkey PRIMARY KEY (id);


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
-- Name: project_block_params project_block_params_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_block_params
    ADD CONSTRAINT project_block_params_pkey PRIMARY KEY (id);


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
-- Name: project_results project_results_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_results
    ADD CONSTRAINT project_results_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: system_block_links system_block_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
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
-- Name: system_component_type_blocks system_component_type_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_component_type_blocks
    ADD CONSTRAINT system_component_type_blocks_pkey PRIMARY KEY (id);


--
-- Name: system_component_type_blocks system_component_type_blocks_type_id_block_template_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_component_type_blocks
    ADD CONSTRAINT system_component_type_blocks_type_id_block_template_id_key UNIQUE (type_id, block_template_id);


--
-- Name: system_component_type_materials system_component_type_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_component_type_materials
    ADD CONSTRAINT system_component_type_materials_pkey PRIMARY KEY (id);


--
-- Name: system_component_type_materials system_component_type_materials_type_id_material_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
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
-- Name: system_parameter_types system_parameter_types_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_parameter_types
    ADD CONSTRAINT system_parameter_types_name_key UNIQUE (name);


--
-- Name: system_parameter_types system_parameter_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
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
-- Name: tm_values tm_values_entity_type_entity_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tm_values
    ADD CONSTRAINT tm_values_entity_type_entity_id_key UNIQUE (entity_type, entity_id);


--
-- Name: tm_values tm_values_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tm_values
    ADD CONSTRAINT tm_values_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


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
-- Name: idx_components_manufacturer_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_components_manufacturer_id ON public.components USING btree (manufacturer_id);


--
-- Name: idx_components_type_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_components_type_id ON public.components USING btree (type_id);


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
-- Name: idx_project_block_params_block_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_project_block_params_block_id ON public.project_block_params USING btree (block_id);


--
-- Name: idx_project_block_params_param_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_project_block_params_param_id ON public.project_block_params USING btree (param_id);


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
-- Name: idx_project_results_project_id; Type: INDEX; Schema: public; Owner: hrroot
--

CREATE INDEX idx_project_results_project_id ON public.project_results USING btree (project_id);


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
-- Name: system_block_links_unique; Type: INDEX; Schema: public; Owner: postgres
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
-- Name: consumables trigger_update_consumables_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_consumables_updated_at BEFORE UPDATE ON public.consumables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


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
-- Name: breakers breakers_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.breakers
    ADD CONSTRAINT breakers_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


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
-- Name: components components_manufacturer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.components
    ADD CONSTRAINT components_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id) ON DELETE SET NULL;


--
-- Name: components components_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.components
    ADD CONSTRAINT components_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.component_types(id) ON DELETE SET NULL;


--
-- Name: consumable_block_links consumable_block_links_block_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumable_block_links
    ADD CONSTRAINT consumable_block_links_block_template_id_fkey FOREIGN KEY (block_template_id) REFERENCES public.block_templates(id) ON DELETE CASCADE;


--
-- Name: consumable_block_links consumable_block_links_consumable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumable_block_links
    ADD CONSTRAINT consumable_block_links_consumable_id_fkey FOREIGN KEY (consumable_id) REFERENCES public.consumables(id) ON DELETE CASCADE;


--
-- Name: consumable_cabinet_links consumable_cabinet_links_cabinet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumable_cabinet_links
    ADD CONSTRAINT consumable_cabinet_links_cabinet_id_fkey FOREIGN KEY (cabinet_id) REFERENCES public.cabinets(id) ON DELETE CASCADE;


--
-- Name: consumable_cabinet_links consumable_cabinet_links_consumable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumable_cabinet_links
    ADD CONSTRAINT consumable_cabinet_links_consumable_id_fkey FOREIGN KEY (consumable_id) REFERENCES public.consumables(id) ON DELETE CASCADE;


--
-- Name: consumable_system_links consumable_system_links_consumable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumable_system_links
    ADD CONSTRAINT consumable_system_links_consumable_id_fkey FOREIGN KEY (consumable_id) REFERENCES public.consumables(id) ON DELETE CASCADE;


--
-- Name: consumable_system_links consumable_system_links_system_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumable_system_links
    ADD CONSTRAINT consumable_system_links_system_component_id_fkey FOREIGN KEY (system_component_id) REFERENCES public.system_components(id) ON DELETE CASCADE;


--
-- Name: consumables consumables_manufacturer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumables
    ADD CONSTRAINT consumables_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id) ON DELETE SET NULL;


--
-- Name: materials materials_manufacturer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_manufacturer_id_fkey FOREIGN KEY (manufacturer_id) REFERENCES public.manufacturers(id) ON DELETE SET NULL;


--
-- Name: project_block_params project_block_params_block_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_block_params
    ADD CONSTRAINT project_block_params_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.project_blocks(id) ON DELETE CASCADE;


--
-- Name: project_block_params project_block_params_param_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_block_params
    ADD CONSTRAINT project_block_params_param_id_fkey FOREIGN KEY (param_id) REFERENCES public.parameters(id) ON DELETE CASCADE;


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
-- Name: project_results project_results_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.project_results
    ADD CONSTRAINT project_results_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: projects projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: hrroot
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: system_block_links system_block_links_block_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_block_links
    ADD CONSTRAINT system_block_links_block_template_id_fkey FOREIGN KEY (block_template_id) REFERENCES public.block_templates(id) ON DELETE CASCADE;


--
-- Name: system_block_links system_block_links_system_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
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
-- Name: system_component_type_blocks system_component_type_blocks_block_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_component_type_blocks
    ADD CONSTRAINT system_component_type_blocks_block_template_id_fkey FOREIGN KEY (block_template_id) REFERENCES public.block_templates(id) ON DELETE CASCADE;


--
-- Name: system_component_type_blocks system_component_type_blocks_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_component_type_blocks
    ADD CONSTRAINT system_component_type_blocks_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.system_component_types(id) ON DELETE CASCADE;


--
-- Name: system_component_type_materials system_component_type_materials_material_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_component_type_materials
    ADD CONSTRAINT system_component_type_materials_material_id_fkey FOREIGN KEY (material_id) REFERENCES public.materials(id) ON DELETE CASCADE;


--
-- Name: system_component_type_materials system_component_type_materials_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
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
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO hrroot;


--
-- Name: TABLE consumable_block_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.consumable_block_links TO hrroot;


--
-- Name: SEQUENCE consumable_block_links_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.consumable_block_links_id_seq TO hrroot;


--
-- Name: TABLE consumable_cabinet_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.consumable_cabinet_links TO hrroot;


--
-- Name: SEQUENCE consumable_cabinet_links_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.consumable_cabinet_links_id_seq TO hrroot;


--
-- Name: TABLE consumable_system_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.consumable_system_links TO hrroot;


--
-- Name: SEQUENCE consumable_system_links_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.consumable_system_links_id_seq TO hrroot;


--
-- Name: TABLE consumables; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.consumables TO hrroot;


--
-- Name: SEQUENCE consumables_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.consumables_id_seq TO hrroot;


--
-- Name: TABLE ln_values; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.ln_values TO hrroot;


--
-- Name: SEQUENCE ln_values_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.ln_values_id_seq TO hrroot;


--
-- Name: TABLE system_block_links; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.system_block_links TO hrroot;


--
-- Name: SEQUENCE system_block_links_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.system_block_links_id_seq TO hrroot;


--
-- Name: TABLE system_component_type_blocks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.system_component_type_blocks TO hrroot;


--
-- Name: SEQUENCE system_component_type_blocks_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.system_component_type_blocks_id_seq TO hrroot;


--
-- Name: TABLE system_component_type_materials; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.system_component_type_materials TO hrroot;


--
-- Name: SEQUENCE system_component_type_materials_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.system_component_type_materials_id_seq TO hrroot;


--
-- Name: TABLE system_parameter_types; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.system_parameter_types TO hrroot;


--
-- Name: SEQUENCE system_parameter_types_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.system_parameter_types_id_seq TO hrroot;


--
-- Name: TABLE tm_values; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.tm_values TO hrroot;


--
-- Name: SEQUENCE tm_values_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.tm_values_id_seq TO hrroot;


--
-- PostgreSQL database dump complete
--

\unrestrict TKGx88TcoFovHnjGPbqRmv8Sw79x2NNSkx89cQnl0NaiT6iANEAnuzhBL4QVTgX

