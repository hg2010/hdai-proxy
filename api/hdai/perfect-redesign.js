// api/hdai/perfect-redesign.js
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Basic CORS preflight support
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Only POST allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const apiKey = process.env.HDAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server is missing HDAI_API_KEY' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  const {
    imageBase64,
    design_type = 'Interior',
    room_type,
    design_style,
    ai_intervention = 'Mid',
    no_design = 1,
    custom_instruction,
    house_angle,
    garden_type,
    keep_structural_element = true,
  } = body;

  if (!imageBase64) {
    return new Response(JSON.stringify({ error: 'imageBase64 is required' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  // Create form-data for HomeDesignsAI API (image can be base64 string)
  const fd = new FormData();
  fd.set('image', imageBase64);
  fd.set('design_type', design_type);
  fd.set('ai_intervention', ai_intervention);
  fd.set('no_design', String(no_design));
  if (design_style) fd.set('design_style', design_style);
  if (room_type) fd.set('room_type', room_type);
  if (custom_instruction) fd.set('custom_instruction', custom_instruction);
  if (house_angle) fd.set('house_angle', house_angle);
  if (garden_type) fd.set('garden_type', garden_type);
  fd.set('keep_structural_element', keep_structural_element ? 'true' : 'false');

  try {
    const upstream = await fetch('https://homedesigns.ai/api/v2/perfect_redesign', {
      method: 'POST',
      headers: {
        // Most likely pattern for access tokens:
        Authorization: `Bearer ${apiKey}`,
      },
      body: fd,
    });

    const data = await upstream.json().catch(() => ({}));

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Upstream error', details: String(err) }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
