import { createClient } from '@supabase/supabase-js';
import type { Stats, Settings } from '@/types';
import { scorePlanRobust } from '@/lib/riskEngine';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SavedPlan {
  id: string;
  nickname: string | null;
  settings: Settings;
  stats: Stats;
  final_balance: number;
  trade_count: number;
  win_rate: number;
  score: number;
  created_at: string;
}

export async function savePlan(
  nickname: string,
  settings: Settings,
  stats: Stats,
  finalBalance: number,
  tradeCount: number,
): Promise<SavedPlan | null> {
  const { totalScore: score } = scorePlanRobust({ stats, settings });
  const { data, error } = await supabase
    .from('risk_plans')
    .insert({
      nickname: nickname || null,
      settings,
      stats,
      final_balance: finalBalance,
      trade_count: tradeCount,
      win_rate: settings.winRate,
      score,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save plan:', error.message);
    return null;
  }
  return data as unknown as SavedPlan;
}

export async function fetchTopPlansGlobal(limit = 20): Promise<SavedPlan[]> {
  const allPlans: SavedPlan[] = [];
  for (const wr of [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90]) {
    const { data, error } = await supabase
      .from('risk_plans')
      .select('*')
      .eq('win_rate', wr)
      .order('score', { ascending: false })
      .limit(limit * 6);

    if (error) {
      console.error(`Failed to fetch plans for win_rate ${wr}:`, error.message);
      continue;
    }
    if (data) allPlans.push(...(data as unknown as SavedPlan[]));
  }
  return allPlans;
}

export async function checkPremium(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('premium_subscribers')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Premium check failed:', error.message);
    return false;
  }
  return !!data;
}
