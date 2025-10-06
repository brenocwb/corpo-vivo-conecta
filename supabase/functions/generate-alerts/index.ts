import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    console.log('Iniciando geração de alertas pastorais...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Chamar a função do banco de dados para gerar alertas com métricas
    const { data, error } = await supabase.rpc('generate_pastoral_alerts');

    if (error) {
      console.error('Erro ao gerar alertas:', error);
      throw error;
    }

    const executionTime = Date.now() - startTime;
    
    // Formatar métricas
    const metrics = data?.reduce((acc: any, row: any) => {
      acc[row.alert_type] = row.count;
      return acc;
    }, {}) || {};

    const totalAlerts = Object.values(metrics).reduce((sum: number, count: any) => sum + count, 0);

    console.log('Alertas gerados com sucesso!', { metrics, totalAlerts, executionTime });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Alertas gerados com sucesso',
        timestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
        metrics,
        totalAlerts
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Erro na função generate-alerts:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
