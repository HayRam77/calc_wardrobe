BEGIN;

-- ============================================================
-- 1. СМЕНА ВЛАДЕЛЬЦЕВ ТАБЛИЦ (если они существуют)
-- ============================================================
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_block_links') THEN
    ALTER TABLE public.system_block_links OWNER TO hrroot;
    ALTER SEQUENCE public.system_block_links_id_seq OWNER TO hrroot;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_component_type_blocks') THEN
    ALTER TABLE public.system_component_type_blocks OWNER TO hrroot;
    ALTER SEQUENCE public.system_component_type_blocks_id_seq OWNER TO hrroot;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_component_type_materials') THEN
    ALTER TABLE public.system_component_type_materials OWNER TO hrroot;
    ALTER SEQUENCE public.system_component_type_materials_id_seq OWNER TO hrroot;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'system_parameter_types') THEN
    ALTER TABLE public.system_parameter_types OWNER TO hrroot;
    ALTER SEQUENCE public.system_parameter_types_id_seq OWNER TO hrroot;
  END IF;
END $$;

-- ============================================================
-- 2. КОНСОЛИДАЦИЯ LN И TM (если таблицы еще существуют)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ln_values') THEN
    UPDATE public.materials m SET ln = l.value FROM public.ln_values l WHERE l.entity_type = 'material' AND l.entity_id = m.id AND (m.ln IS NULL OR m.ln = '');
    UPDATE public.block_templates b SET ln = l.value FROM public.ln_values l WHERE l.entity_type = 'block_template' AND l.entity_id = b.id AND (b.ln IS NULL OR b.ln = '');
    UPDATE public.system_components s SET ln = l.value FROM public.ln_values l WHERE l.entity_type = 'system_component' AND l.entity_id = s.id AND (s.ln IS NULL OR s.ln = '');
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tm_values') THEN
    UPDATE public.materials m SET tm = t.value FROM public.tm_values t WHERE t.entity_type = 'material' AND t.entity_id = m.id AND (m.tm IS NULL OR m.tm = '');
    UPDATE public.block_templates b SET tm = t.value FROM public.tm_values t WHERE t.entity_type = 'block_template' AND t.entity_id = b.id AND (b.tm IS NULL OR b.tm = '');
    UPDATE public.system_components s SET tm = t.value FROM public.tm_values t WHERE t.entity_type = 'system_component' AND t.entity_id = s.id AND (s.tm IS NULL OR s.tm = '');
  END IF;
END $$;

-- Удаление EAV таблиц (если существовали)
DROP TABLE IF EXISTS public.ln_values CASCADE;
DROP TABLE IF EXISTS public.tm_values CASCADE;

-- ============================================================
-- 3. ОЧИСТКА НЕИСПОЛЬЗУЕМЫХ Таблиц
-- ============================================================
DROP TABLE IF EXISTS public.consumable_block_links CASCADE;
DROP TABLE IF EXISTS public.consumable_cabinet_links CASCADE;
DROP TABLE IF EXISTS public.consumable_system_links CASCADE;
DROP TABLE IF EXISTS public.consumables CASCADE;
DROP TABLE IF EXISTS public.breakers CASCADE;
DROP TABLE IF EXISTS public.components CASCADE;
DROP TABLE IF EXISTS public.project_block_params CASCADE;
DROP TABLE IF EXISTS public.project_results CASCADE;

COMMIT;