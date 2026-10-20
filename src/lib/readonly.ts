/** Modo "espelho de produção": o app local aponta para o banco de produção com um usuário de banco
 *  SOMENTE LEITURA (DB_READONLY=1). O banco é a trava de verdade; este flag só evita escritas
 *  desnecessárias (login) e avisa na tela que nada pode ser editado ali. */
export const DB_READONLY = process.env.DB_READONLY === "1";
