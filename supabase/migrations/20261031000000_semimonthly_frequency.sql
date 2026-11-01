-- Frecuencia quincenal: dos días fijos de cada mes (15 y último, 1 y 15…).
-- Va sola en su migración: un valor nuevo de enum no puede usarse en la
-- misma transacción en que se añade.

alter type public.recurrence_frequency add value 'semimonthly';
