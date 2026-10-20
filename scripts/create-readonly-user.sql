-- Cria um usuário SOMENTE LEITURA no Postgres de PRODUÇÃO, para o app local espelhar os dados reais.
-- Rode no console SQL do serviço de banco no EasyPanel (como o usuário dono do banco).
-- Troque <SENHA_FORTE> por uma senha longa e <BANCO> pelo nome do banco do app.
--
-- Depois, no .env LOCAL:
--   DATABASE_URL="postgresql://v4_readonly:<SENHA_FORTE>@<HOST>:<PORTA>/<BANCO>?sslmode=require"
--   DB_READONLY=1
-- (<HOST>:<PORTA> são os de "Expor" do serviço de banco no EasyPanel; restrinja ao seu IP se possível.)

CREATE ROLE v4_readonly LOGIN PASSWORD '<SENHA_FORTE>';
GRANT CONNECT ON DATABASE "<BANCO>" TO v4_readonly;
GRANT USAGE ON SCHEMA public TO v4_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO v4_readonly;
-- Tabelas criadas por migrações futuras também ficam legíveis:
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO v4_readonly;
-- Segredos que o app local não precisa ler (hashes de senha e token do eKyte continuam existindo,
-- mas o usuário local não os enxerga):
REVOKE SELECT ON "PasswordResetToken", "EkyteIntegration" FROM v4_readonly;
