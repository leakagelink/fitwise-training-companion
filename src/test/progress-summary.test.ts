import { describe, expect, it } from 'vitest';
import { addDaysISO, weeklyProgressScore, goalPrediction, goalProgressPct, measurementComparison, type ResultInput } from '@/lib/fitness';
const today='2026-11-24';
const dates=Array.from({length:7},(_,i)=>addDaysISO(today,-i));
const input:ResultInput & {activityDates:string[]}={today,goal:'fat_loss',caloriesTarget:2000,waterTargetMl:2500,workoutsPerWeek:3,checkins:dates.map(date=>({date,diet_followed:true,water_ml:2500,sleep_hours:7})),meals:[],workoutDates:dates.slice(0,3),weights:[{logged_on:'2026-11-10',weight_kg:80},{logged_on:today,weight_kg:79}],activityDates:dates};
describe('weekly progress scores',()=>{
  it('shows Diet, Workout, Consistency and Overall together on a 0–100 scale',()=>{expect(weeklyProgressScore(input)).toMatchObject({diet:100,workout:100,consistency:100,overall:100,from:'2026-11-18'});});
  it('deduplicates logging activity and ignores dates before the seven-day window',()=>{expect(weeklyProgressScore({...input,activityDates:[today,today,'2026-11-01'],checkins:[],workoutDates:[],weights:[]}).consistency).toBe(14);});
  it('does not invent a diet score from fewer than 3 tracked days',()=>{expect(weeklyProgressScore({...input,checkins:input.checkins.slice(0,2)}).diet).toBeNull();});
});
describe('goal comparison',()=>{
  it('calculates 50% from 80 to 75 with target 70',()=>{expect(goalProgressPct(80,75,70)).toBe(50);});
  it('supports weight gain progress',()=>{expect(goalProgressPct(60,65,70)).toBe(50);});
  it('keeps missing/same targets unknown',()=>{expect(goalProgressPct(70,70,70)).toBeNull();expect(goalProgressPct(70,69,null)).toBeNull();});
  it('uses earliest and latest nonempty value of each body measurement',()=>{expect(measurementComparison([{measured_on:'2026-11-01',waist_cm:90,chest_cm:null},{measured_on:'2026-11-10',waist_cm:null,chest_cm:100},{measured_on:today,waist_cm:88,chest_cm:99}])[0]).toMatchObject({key:'waist_cm',start:{value:90},current:{value:88},change:-2});});
});
describe('goal estimate',()=>{
  it('predicts 8 weeks from 79 to 75 at half a kilo per week',()=>{expect(goalPrediction({today,goal:'fat_loss',currentKg:79,targetKg:75,weights:input.weights})).toMatchObject({status:'on_track',weeksLeft:8,etaDate:'2027-01-19',ratePerWeek:-0.5});});
  it('does not predict when weight is moving away from target',()=>{expect(goalPrediction({today,goal:'fat_loss',currentKg:79,targetKg:75,weights:[{logged_on:'2026-11-10',weight_kg:78},{logged_on:today,weight_kg:79}]}).status).toBe('not_moving');});
  it('does not invent a date for insufficient weight data',()=>{expect(goalPrediction({today,goal:'fat_loss',currentKg:79,targetKg:75,weights:[]})).toMatchObject({status:'not_enough_data',etaDate:null});});
});
