-- Script para corrigir a estrutura da tabela acunetix_config
-- Execute este script no PostgreSQL para adicionar as colunas necessárias

-- Adicionar coluna api_url se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acunetix_config' AND column_name='api_url') THEN
        ALTER TABLE acunetix_config ADD COLUMN api_url TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Coluna api_url adicionada';
    ELSE
        RAISE NOTICE 'Coluna api_url já existe';
    END IF;
END $$;

-- Adicionar coluna api_key se não existir  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acunetix_config' AND column_name='api_key') THEN
        ALTER TABLE acunetix_config ADD COLUMN api_key TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Coluna api_key adicionada';
    ELSE
        RAISE NOTICE 'Coluna api_key já existe';
    END IF;
END $$;

-- Adicionar coluna profile_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acunetix_config' AND column_name='profile_id') THEN
        ALTER TABLE acunetix_config ADD COLUMN profile_id TEXT DEFAULT '11111111-1111-1111-1111-111111111111';
        RAISE NOTICE 'Coluna profile_id adicionada';
    ELSE
        RAISE NOTICE 'Coluna profile_id já existe';
    END IF;
END $$;

-- Adicionar coluna created_at se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acunetix_config' AND column_name='created_at') THEN
        ALTER TABLE acunetix_config ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Coluna created_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna created_at já existe';
    END IF;
END $$;

-- Adicionar coluna updated_at se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='acunetix_config' AND column_name='updated_at') THEN
        ALTER TABLE acunetix_config ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe';
    END IF;
END $$;

-- Verificar estrutura final da tabela
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'acunetix_config' 
ORDER BY ordinal_position;
