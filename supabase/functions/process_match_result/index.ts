import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Auth header' }), { status: 401 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Regular client for sanity checking
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } }
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await req.json();
    const { matchPoints, wonGame, lostGame, matchEnded, addFaceOff } = body;
    
    // Safety check for points
    const pts = typeof matchPoints === 'number' ? Math.max(0, Math.min(matchPoints, 15000)) : 0;

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('score, games_won, games_lost, games_drawn, face_offs')
      .eq('id', user.id)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404 });
    }

    const updates: any = {
      score: (profile.score || 0) + pts,
    };

    if (addFaceOff) {
      updates.face_offs = (profile.face_offs || 0) + 1;
    }

    if (matchEnded) {
      // Logic for results:
      const isDraw = (wonGame && lostGame) || (!wonGame && !lostGame);
      
      if (isDraw) {
        updates.games_drawn = (profile.games_drawn || 0) + 1;
      } else if (wonGame) {
        updates.games_won = (profile.games_won || 0) + 1;
      } else {
        updates.games_lost = (profile.games_lost || 0) + 1;
      }
    }

    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (updateErr) {
      return new Response(JSON.stringify({ error: 'Update failed', details: updateErr }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, new_score: updates.score }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    });
  }
});
