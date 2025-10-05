-- Habilitar extensões necessárias para cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configurar cron job para gerar alertas automaticamente a cada 6 horas
-- Executa às 00:00, 06:00, 12:00 e 18:00 todos os dias
SELECT cron.schedule(
  'generate-pastoral-alerts',
  '0 */6 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://sgdczaswqqwtuopngxix.supabase.co/functions/v1/generate-alerts',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZGN6YXN3cXF3dHVvcG5neGl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0OTkzNzAsImV4cCI6MjA2OTA3NTM3MH0.kIdG3vNwoepXUiSuNLXRvc6YC57C4cMWqWiYw-HPZwY"}'::jsonb
    ) as request_id;
  $$
);