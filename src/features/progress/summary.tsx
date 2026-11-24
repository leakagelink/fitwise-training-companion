import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { goalPrediction, goalProgressPct, measurementComparison, todayISO, weeklyProgressScore } from '@/lib/fitness';
import { loadResultAnalysis } from './result-data';

export function ProgressSummary() {
  const today = todayISO();
  const q = useQuery({ queryKey: ['progress', 'summary', today], queryFn: async () => {
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session) throw new Error('Please sign in again');
    const id = auth.session.user.id;
    const [loaded, weights, measurements, checks] = await Promise.all([
      loadResultAnalysis(supabase, id, today),
      supabase.from('weight_logs').select('logged_on,weight_kg').eq('user_id', id).order('logged_on').order('created_at'),
      supabase.from('body_measurements').select('*').eq('user_id', id).order('measured_on'),
      supabase.from('daily_checkins').select('date').eq('user_id', id).gte('date', today.slice(0,4)+'-01-01'),
    ]);
    if (weights.error || measurements.error || checks.error) throw new Error('Could not load progress summary');
    const logs = weights.data;
    const first = logs[0], last = logs.at(-1);
    const start = first?.weight_kg ?? loaded.profile.weight_kg;
    const current = last?.weight_kg ?? loaded.profile.weight_kg;
    return { score: weeklyProgressScore({ ...loaded.input, activityDates: checks.data.map(c => c.date) }),
      prediction: goalPrediction({ goal: loaded.profile.goal, currentKg: current, targetKg: loaded.profile.target_weight_kg, weights: logs, today }),
      start, current, target: loaded.profile.target_weight_kg, progress: goalProgressPct(start,current,loaded.profile.target_weight_kg), comparisons: measurementComparison(measurements.data) };
  }});
  if (q.isPending) return <p className="text-sm text-muted-foreground">Loading progress summary…</p>;
  if (q.isError) return <p role="alert" className="text-sm text-destructive">Could not load progress summary.</p>;
  const d=q.data;
  const labels={waist_cm:'Waist',chest_cm:'Chest',hips_cm:'Hips',arm_cm:'Arm',body_fat_pct:'Body fat'};
  const messages={maintenance:'Keep your weight stable; no finish date is predicted.',no_target:'Set your target weight in Profile.',not_enough_data:'Log weights at least 7 days apart for a date estimate.',not_moving:'Your recent weight is not moving toward the target. Review your results below.',very_slow:'Your recent pace is too slow for a reliable finish date.',reached:'You are within 0.5 kg of your target.',on_track:`About ${d.prediction.weeksLeft} weeks left · ${d.prediction.etaDate}`};
  return <section className="space-y-5 border-y border-border py-5">
    <div><h2 className="text-lg font-semibold">Weekly progress scores</h2><p className="text-xs text-muted-foreground">Last 7 days · {d.score.from} to {today}</p></div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(['diet','workout','consistency','overall'] as const).map((key)=><div key={key} className="border-l-2 border-primary pl-3"><p className="text-xs text-muted-foreground">{{diet:'Diet',workout:'Workout',consistency:'Consistency',overall:'Overall transformation'}[key]}</p><p className="text-2xl font-semibold">{d.score[key] === null ? '—' : d.score[key]}<span className="text-xs text-muted-foreground"> /100</span></p></div>)}</div>
    <p className="text-xs text-muted-foreground">Estimates from logged data, not a body-composition assessment. Diet needs 3 tracked days. Overall combines adherence, consistency and weight trend; missing data is excluded.</p>
    <h2 className="text-lg font-semibold">Starting vs current</h2>
    <div className="flex flex-wrap gap-6 text-sm"><span>Starting weight<br/><strong>{d.start ?? '—'} kg</strong></span><span>Current weight<br/><strong>{d.current ?? '—'} kg</strong></span><span>Target<br/><strong>{d.target ?? '—'} kg</strong></span><span>Goal progress<br/><strong>{d.progress === null ? '—' : `${d.progress}%`}</strong></span></div>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground"><th>Measurement</th><th>Starting</th><th>Current</th><th>Change</th></tr></thead><tbody>{d.comparisons.map(c=><tr key={c.key} className="border-t border-border"><td className="py-2">{labels[c.key]}</td><td>{c.start?.value ?? '—'}</td><td>{c.current?.value ?? '—'}</td><td>{c.change === null ? '—' : `${c.change>0?'+':''}${c.change}`} {c.key==='body_fat_pct'?'pp':'cm'}</td></tr>)}</tbody></table></div>
    <div><h2 className="text-lg font-semibold">Estimated goal date</h2><p className="mt-2 text-sm">{messages[d.prediction.status]}</p>{d.prediction.ratePerWeek !== null && <p className="text-xs text-muted-foreground">Recent pace: {d.prediction.ratePerWeek} kg/week</p>}<p className="mt-2 text-xs text-muted-foreground">Based on recent weight logs, not a guarantee. Muscle gain cannot be measured from weight alone. Starting values are your earliest recorded values.</p></div>
  </section>;
}
