import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { totalIncome, target, achievement, gap, quarterlyData, categoryData, year } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context for AI analysis
    const quarterlyBreakdown = quarterlyData.map((q: any) => 
      `${q.quarter}: Income Rp ${q.income.toLocaleString('id-ID')} vs Target Rp ${q.target.toLocaleString('id-ID')} (${q.target > 0 ? ((q.income / q.target) * 100).toFixed(1) : 0}% achieved)`
    ).join('\n');

    const categoryBreakdown = categoryData.map((c: any) => 
      `${c.name}: Rp ${c.value.toLocaleString('id-ID')}`
    ).join('\n');

    const prompt = `Analyze this business income data for year ${year} and provide actionable insights:

OVERALL PERFORMANCE:
- Total Income (YTD): Rp ${totalIncome.toLocaleString('id-ID')}
- Yearly Target: Rp ${target.toLocaleString('id-ID')}
- Achievement: ${achievement.toFixed(1)}%
- GAP to Target: Rp ${gap.toLocaleString('id-ID')}

QUARTERLY BREAKDOWN:
${quarterlyBreakdown}

INCOME BY CATEGORY:
${categoryBreakdown}

Provide a concise analysis with:
1. **Key Trends**: Identify 2-3 significant patterns in the data
2. **Strengths**: What's working well?
3. **Concerns**: What needs attention?
4. **Recommendations**: 3-4 specific, actionable strategies to boost income or improve margins

Keep the response professional, data-driven, and focused on actionable insights. Format it clearly with markdown headers and bullet points.`;

    console.log('Sending analysis request to AI...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a business analytics expert specializing in income analysis and strategic recommendations. Provide clear, actionable insights based on data." 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage quota exceeded. Please add credits to continue." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content;

    if (!analysis) {
      throw new Error("No analysis generated");
    }

    console.log('Analysis generated successfully');

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-income function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
