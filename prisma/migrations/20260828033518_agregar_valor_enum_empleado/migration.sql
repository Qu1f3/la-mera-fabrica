-- AlterEnum
-- Postgres exige que un valor nuevo de enum quede confirmado (commit) en su
-- propia transaccion antes de poder usarse (ej. como DEFAULT de una columna)
-- -- por eso este cambio va en una migracion separada de la que fija el
-- nuevo DEFAULT (ver la migracion siguiente).
ALTER TYPE "RolAdmin" ADD VALUE 'EMPLEADO';
