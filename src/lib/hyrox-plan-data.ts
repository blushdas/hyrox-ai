import type { SessionType, Phase } from "./types"

export type RawSession = {
  week: number
  day: number // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
  type: SessionType
  phase: Phase
  title: string
  duration: string
  workout: string[]
  notes: string[]
}

export const BEGINNER_PLAN_SESSIONS: RawSession[] = [
  // ── WEEK 1 (BASE) ──────────────────────────────────────────────
  {
    week: 1, day: 1, type: "stations", phase: "base",
    title: "Foundation AMRAP",
    duration: "25 Min AMRAP",
    workout: [
      "25 Min AMRAP:",
      "250m Row",
      "20 Air Squats",
      "15 Ring or TRX Row",
      "10 Elevated or Knee Push Ups",
      "50m Farmer Carry",
    ],
    notes: [
      "Goal is to consistently move throughout",
      "Steady pace — if unsure of pacing, go easy first 10 minutes then pick up the pace if desired",
      "Squat to a 12-15\" box if unable to squat below parallel",
      "Elevate Push Ups by having hands on higher surface than feet",
      "Resort to Knee Push Ups if needed",
    ],
  },
  {
    week: 1, day: 2, type: "recovery", phase: "base",
    title: "Aerobic Walk/Jog",
    duration: "20-40 Min",
    workout: [
      "20-40 Min Walk/Jog",
    ],
    notes: [
      "Jog if able",
      "1:00 Jog / 1:00 Walk if needed (or adjust accordingly)",
      "This will vary person to person based on their current ability level",
    ],
  },
  {
    week: 1, day: 3, type: "stations", phase: "base",
    title: "Foundation AMRAP",
    duration: "20 Min AMRAP",
    workout: [
      "20 Min AMRAP:",
      "50ft or 12.5m Sled Push",
      "400m Jog",
      "Single DB Thruster",
    ],
    notes: [
      "Sled Push should be heavy enough where you have to move slowly",
      "400m Jog should feel like recovery",
      "ONE DB: One head of DB in each hand (Squat and Press)",
    ],
  },
  {
    week: 1, day: 4, type: "stations", phase: "base",
    title: "Power Sets",
    duration: "Quality Sets",
    workout: [
      "3-4 Sets:",
      "Goblet Squat x 10",
      "Push Up x 10",
      "Ring or TRX Row x 10",
      "3-4 Sets:",
      "Walking Lunge x 10",
      "DB Shoulder Press x 10",
      "Wall Ball x 10",
    ],
    notes: [
      "Modify Goblet Squat to Air Squat",
      "Modify to Elevated/Knee Push Ups",
      "Adjust body angle on rows to make the movement easier or more challenging (the lower you are, the more challenging)",
      "Ensure full ROM (Rings all the way to chest, Arms fully extended)",
      "Modify walking lunges to assisted lunges (using TRX or rings)",
      "Adjust DB weight as needed",
      "Ensure proper depth on Wall Balls, squat to box if needed",
    ],
  },
  {
    week: 1, day: 5, type: "stations", phase: "base",
    title: "Foundation For Time",
    duration: "45 Min Time Cap",
    workout: [
      "For Time: 3 Rounds",
      "800m-400m-200m Run",
      "30-20-10 DB Shoulder Press",
      "30-20-10 Goblet Squat",
      "30-20-10 Walking Lunge",
      "45 Min Time Cap",
    ],
    notes: [
      "Workout is 3 rounds total, with descending reps each round",
      "DB Shoulder Press should feel like when fresh, but you should need to break at least 1x on the set of 30 and 20",
      "Squat to box if needed",
      "Aim for full ROM on lunges — knee all the way to the ground",
      "Use TRX or low rings for assistance as needed",
    ],
  },

  // ── WEEK 2 (BASE) ──────────────────────────────────────────────
  {
    week: 2, day: 1, type: "stations", phase: "base",
    title: "Foundation Ladder AMRAP",
    duration: "25 Min AMRAP",
    workout: [
      "25 Min AMRAP:",
      "5-10-15-20-25-etc Push Up",
      "Ring/TRX Row (matching reps)",
      "Wall Balls (matching reps)",
      "*200m Run after each round",
    ],
    notes: [
      "Continue up the ladder until you reach 25 minutes",
      "200m Run does not change throughout",
      "Round 1: 5 Push Ups / 5 Ring Row / 5 Wall Balls / 200m Run",
      "Round 2: 10 Push Ups / 10 Ring Rows / 10 Wall Balls / 200m Run — etc",
      "Ensure proper depth is reached on Wall Balls",
      "If able to squat below parallel, start aiming for 3m/10ft for men or 2.7m/9ft for women",
    ],
  },
  {
    week: 2, day: 2, type: "recovery", phase: "base",
    title: "Aerobic Machine Rotation",
    duration: "30-40 Min AMRAP",
    workout: [
      "30-40 Min AMRAP:",
      "3:00 Minute Bike",
      "3:00 Minute Row",
      "3:00 Minute Ski",
    ],
    notes: [
      "Total length is up to you",
      "Pay attention to pace throughout and stay consistent",
      "Conversational pace, but you should break a sweat",
    ],
  },
  {
    week: 2, day: 3, type: "stations", phase: "base",
    title: "Foundation AMRAP",
    duration: "25 Min AMRAP",
    workout: [
      "25 Min AMRAP:",
      "400m Run",
      "10 DB Thruster",
      "8 Burpees",
    ],
    notes: [
      "Go light enough on DB Thrusters where you can do a set of 10 unbroken while reaching below parallel",
      "Aim for a steady pace throughout",
      "Don't waste energy on the burpees — get chest to the ground and get back up any way",
    ],
  },
  {
    week: 2, day: 4, type: "stations", phase: "base",
    title: "Power Conditioning",
    duration: "16 Minutes",
    workout: [
      "For 16 Minutes: Row — Every 2:00 do 10 Push Ups then get back on rower",
      "3x 30 Air Squats",
      "2:00 Minutes Bike",
      "2:00 Minutes Rest after each round",
      "400m Suitcase Carry (Switch arms as needed)",
    ],
    notes: [
      "On a 16 Min Clock, Row. Every 2 Minutes stop to do 10 push ups then get back on the rower",
      "Option to add weight on squats",
      "During the bike, build intensity throughout the 2 Minutes segment",
      "Suitcase Carry: Switch arms as needed but don't come to a complete stop at any point",
    ],
  },
  {
    week: 2, day: 5, type: "stations", phase: "base",
    title: "Foundation For Time",
    duration: "For Time",
    workout: [
      "For Time:",
      "30-20-10 Wall Balls",
      "12.5m/50ft Sled Pull (Arms Only) after each set",
      "*200m Farmer Carry after each round",
    ],
    notes: [
      "Workout is 3 Rounds total, decrease Wall Ball reps each round",
      "Priority is depth of squat on Wall Ball before the height of the ball",
      "Get comfortable pulling the sled — any weight, option to build weight each round",
      "Farmer carry weight should be heavy enough where you need to set the KBs down 1-2x during the 200m",
    ],
  },

  // ── WEEK 3 (BASE) ──────────────────────────────────────────────
  {
    week: 3, day: 1, type: "stations", phase: "base",
    title: "Foundation For Time",
    duration: "For Time",
    workout: [
      "For Time:",
      "25-20-15-10-5 Goblet Squats",
      "30-26-22-18-14 Walking Lunges",
      "*400m Run after each round",
    ],
    notes: [
      "Option to add weight on walking lunges if full ROM is achieved — if adding weight, do Goblet Hold",
      "Reps decrease each round, but the 400m run will remain the same after each round",
      "Round 1: 25 Goblet Squats / 30 Lunges / 400m Run",
      "Round 2: 20 Goblet Squats / 26 Lunges / 400m Run",
      "Round 3: 15 Goblet Squats / 22 Lunges / 400m Run — etc.",
    ],
  },
  {
    week: 3, day: 2, type: "recovery", phase: "base",
    title: "Tempo Run/Jog/Walk",
    duration: "30-45 Minutes",
    workout: [
      "30-45 Minutes Tempo Run/Jog/Walk:",
      "3:00 Minutes Run",
      "2:00 Minutes Jog",
      "1:00 Minute Walk",
    ],
    notes: [
      "Throughout the run, differentiate between 3 paces",
      "This could be different for everyone",
      "Adjust time and intensity domains as needed",
      "The main goal is to have 3 different paces you're working with",
    ],
  },
  {
    week: 3, day: 3, type: "stations", phase: "base",
    title: "Foundation For Time",
    duration: "For Time",
    workout: [
      "For Time:",
      "200m Run",
      "21-18-15-12-9-6-3 DB Push Press",
      "21-18-15-12-9-6-3 DB Front Squat",
      "21-18-15-12-9-6-3 Ring/TRX Row",
    ],
    notes: [
      "7 Rounds total — each round starts with a 200m Run",
      "All other reps decrease by 3 each round",
      "Round 1: 200m Run / 21 Push Press / 21 Front Squat / 21 Row",
      "Round 2: 200m Run / 18 PP / 18 FS / 18 Row — etc.",
    ],
  },
  {
    week: 3, day: 4, type: "stations", phase: "base",
    title: "Power Aerobic AMRAP",
    duration: "40 Min AMRAP",
    workout: [
      "40 Min AMRAP:",
      "3:00 Minutes Row",
      "1:00 Minute Rest",
      "3:00 Minutes Ski",
      "1:00 Minute Rest",
      "3:00 Minutes Bike",
      "1:00 Minute Rest",
    ],
    notes: [
      "Increase intensity through each 3 Minutes effort, treat each as a build",
      "Rest after each machine",
      "Practice getting out of your comfort zone",
    ],
  },
  {
    week: 3, day: 5, type: "stations", phase: "base",
    title: "Foundation RFT",
    duration: "For Time",
    workout: [
      "3 Rounds for Time (RFT):",
      "20 Walking Lunges",
      "15 Push Ups",
      "10 Cal Ski",
      "50ft/12.5m Bear Crawl",
    ],
    notes: [
      "Option to add weight on lunges",
      "Push Ups can be on knees or Hand Release",
    ],
  },

  // ── WEEK 4 (BASE) ──────────────────────────────────────────────
  {
    week: 4, day: 1, type: "race_sim", phase: "base",
    title: "HYROX Complete RFT",
    duration: "For Time",
    workout: [
      "3 RFT:",
      "15 DB Push Press",
      "50ft/12.5m Sled Pull",
      "50ft/12.5m Broad Jump",
      "800m Run",
    ],
    notes: [
      "DB Push Press should be unbroken",
      "Get comfortable pulling the sled — any weight, option to build weight each round",
      "Practice jumping for distance with a two foot take off and two foot landing",
      "Treat 800m Run as a building effort",
    ],
  },
  {
    week: 4, day: 2, type: "engine_builder", phase: "base",
    title: "Sprint Intervals",
    duration: "Run Repeats",
    workout: [
      "1 Mile Jog Warm Up",
      "12 x 100m Run",
      "1:00 Minute Walk between each",
      "1 Mile Jog Cool Down",
    ],
    notes: [
      "See what you're capable of during 100m effort",
      "Build to what feels like a sprint effort",
      "Focus on foot speed and turnover",
    ],
  },
  {
    week: 4, day: 3, type: "stations", phase: "base",
    title: "Foundation RFT",
    duration: "For Time",
    workout: [
      "4 RFT:",
      "400m Ski/Row",
      "400m Run",
      "50ft/12.5m Sled Push",
    ],
    notes: [
      "Focus on steady pace",
      "Build weight on sled throughout — start light and end heavy",
    ],
  },
  {
    week: 4, day: 4, type: "recovery", phase: "base",
    title: "Aerobic Run/Walk",
    duration: "45:00 Minutes",
    workout: [
      "45:00 Minutes Run/Walk",
    ],
    notes: [
      "Run as many minutes as possible",
      "Walk as needed",
    ],
  },
  {
    week: 4, day: 5, type: "stations", phase: "base",
    title: "Foundation Ascending AMRAP",
    duration: "30 Minutes AMRAP",
    workout: [
      "30 Minutes AMRAP:",
      "3-6-9-12-15-etc KB Swing",
      "3-6-9-12-15-etc Goblet Squat",
      "3-6-9-12-15-etc Burpee Broad Jump",
      "*8 Cal hard effort after each round (any machine)",
    ],
    notes: [
      "Work for 30 Minutes straight",
      "Increase reps by 3 each round until 30 Minutes are up",
      "8 Cal effort remains the same throughout after each round",
      "Round 1: 3 KBS / 3 Goblet Squat / 3 Burpee Broad Jump / 8 Cals",
      "Round 2: 6 KBS / 6 Goblet Squat / 6 Burpee Broad Jump / 8 Cals",
    ],
  },

  // ── WEEK 5 (PACE → build) ───────────────────────────────────────
  {
    week: 5, day: 1, type: "stations", phase: "build",
    title: "Foundation For Time",
    duration: "For Time",
    workout: [
      "For Time:",
      "30-20-10 Cal Ski",
      "30-20-10 HR Push Ups",
      "30-20-10 DB Push Press",
      "30-20-10 Goblet Squat",
    ],
    notes: [
      "Modify Push Ups as needed",
      "Choose a DB weight where you have to break the set of 30 and the set of 20 at least once",
      "Use one DB for the Goblet Squat",
    ],
  },
  {
    week: 5, day: 2, type: "engine_builder", phase: "build",
    title: "Engine AMRAPs",
    duration: "5 x 4 Min AMRAP",
    workout: [
      "5 x 4 Min AMRAP (4:00 on / 2:00 off):",
      "200m Run",
      "12 Single DB Thruster",
      "Max Cal Bike",
    ],
    notes: [
      "Each round should build to a 90% effort",
      "Goal is pacing and consistency across rounds",
      "Thrusters should be unbroken",
      "Use 1 DB for Thrusters — one head of DB in each hand",
      "Score = number of cals",
    ],
  },
  {
    week: 5, day: 3, type: "recovery", phase: "build",
    title: "Aerobic Row + Burpees",
    duration: "E3MOM",
    workout: [
      "E3MOM:",
      "4000 Meters Row",
      "3 x Burpee Over Rower (every 3 min)",
    ],
    notes: [
      "Starting at 0:00, do 3 Burpees over the rower",
      "Continue rowing until you reach 4000m while stopping every 3 minutes on the minute to do 3 Burpees over the rower",
    ],
  },
  {
    week: 5, day: 4, type: "engine_builder", phase: "build",
    title: "400m Run Repeats",
    duration: "4 x 400m",
    workout: [
      "4 x 400m Run",
      "2:00 Minutes Rest after each Run",
    ],
    notes: [
      "Each 400m should feel like race pace",
      "Record each 400m split",
      "Log results and note changes in pace, what you are able to hold, etc.",
      "The goal should be to find what pace you can maintain without leaving anything in the tank",
    ],
  },
  {
    week: 5, day: 5, type: "race_sim", phase: "build",
    title: "HYROX Complete For Time",
    duration: "For Time",
    workout: [
      "For Time:",
      "1000 Meters Row/Ski (buy in)",
      "4x: 100ft/25m Sandbag Lunge",
      "4x: 15 Wall Balls (14/10lbs or 6/4kg)",
      "4x: 400 Meters Run",
      "*Accumulate 400ft/100m Sled Push throughout the 4 Rounds",
      "75/50 Cal Bike (cash out)",
    ],
    notes: [
      "The 1000m Row or Ski is to be done once as a buy in",
      "The 75/50 Cal Bike is to be done once as a cash out",
      "Lunges can be done with sandbag or DB on shoulders",
      "The Sled Push can be broken up in any way throughout",
      "Weight on the sled should be AHAP (As Heavy As Possible)",
    ],
  },

  // ── WEEK 6 (PACE → build) ───────────────────────────────────────
  {
    week: 6, day: 1, type: "stations", phase: "build",
    title: "Foundation RFT",
    duration: "For Time",
    workout: [
      "3 RFT:",
      "100m Farmer Carry (53/35lbs or 24/16kg x2)",
      "15 KB Swing (53/35lbs or 24/16kg)",
      "30 Goblet Squat (53/35lbs or 24/16kg)",
      "400 Meters Ski or Row",
    ],
    notes: [
      "Use the same weight throughout: 1 KB for KBS and Goblet Squat / 2 KBs for Farmers Carry",
      "Farmers Carry weight should be heavy enough where you need to set the KBs down 1-2 times",
    ],
  },
  {
    week: 6, day: 2, type: "engine_builder", phase: "build",
    title: "Engine Alt EMOM",
    duration: "20 Minutes Alt EMOM",
    workout: [
      "20 Minutes Alt EMOM (50 sec on / 10 sec off):",
      "Min 1: Goblet Lunge (53/35lbs or 24/16kg)",
      "Min 2: Push Ups / Ring Rows",
      "Min 3: 200 Meters Run",
      "Min 4: Rest",
    ],
    notes: [
      "Alternate movements each minute",
      "Work 50 seconds, use the 10 seconds rest to transition",
      "Do a max set of push ups followed by ring rows in the time remaining",
      "If you are unable to do push ups, do ring rows only",
    ],
  },
  {
    week: 6, day: 3, type: "recovery", phase: "build",
    title: "60 Min Run with Pickups",
    duration: "60 Minutes",
    workout: [
      "60 Minutes Run",
      "Within the 60 Minutes, complete 2x 10 Min Pick Ups",
    ],
    notes: [
      "The 10 Minute Pick Ups can be done at any time",
      "Pace should be lactate threshold — a pace you can maintain for 15 minutes just below the point of discomfort",
      "Walk as needed, but run for as much as possible",
    ],
  },
  {
    week: 6, day: 4, type: "engine_builder", phase: "build",
    title: "Engine Station Intervals",
    duration: "3 Rounds",
    workout: [
      "3 Rounds: 1:00 Minute on / 1:00 Minute off:",
      "Sled Push",
      "Sled Pull",
      "Box Step Over",
      "DB Thruster (35/20lbs or 15/7.5kg x2)",
      "Push Ups",
    ],
    notes: [
      "1 Minute at each movement station",
      "Alternate movements",
      "1 Minute rest between each",
      "You should be working HARD the entirety of the minute",
      "Use 2 DBs for Thrusters",
    ],
  },
  {
    week: 6, day: 5, type: "race_sim", phase: "build",
    title: "HYROX Complete For Time",
    duration: "For Time",
    workout: [
      "For Time:",
      "100/75 Cal Bike or Ski",
      "100 Goblet Squat (53/35lbs or 24/16kg)",
      "1 Mile Run",
      "100 KB Swing (53/35lbs or 24/16kg)",
      "100/75 Cal Bike or Ski",
      "50 Wall Balls (14/10lbs or 6/4kg)",
      "*Every break: complete 100m Farmers Carry",
    ],
    notes: [
      "Every time you break, complete 100m Farmers Carry (only applies for Goblet Squat, KBS, and Wall Balls)",
      "It is considered a break on Goblet Squats if you put the KB down",
      "It is considered a break on KBS and Wall Balls if movement stops",
    ],
  },

  // ── WEEK 7 (PACE → build) ───────────────────────────────────────
  {
    week: 7, day: 1, type: "stations", phase: "build",
    title: "Foundation For Time",
    duration: "For Time",
    workout: [
      "For Time:",
      "30-25-20-15 KB Deadlift (53/35lbs or 24/16kg)",
      "30-25-20-15 Goblet Lunge (53/35lbs or 24/16kg)",
      "30-25-20-15 Wall Ball (14/10lbs or 6/4kg)",
      "100m Farmer Carry (53/35lbs or 24/16kg x2)",
    ],
    notes: [
      "Weight should be the same for KB Deadlift and Farmer Carry",
      "If unable to reach full ROM on Lunges (knee to ground) go unweighted",
      "Prioritize depth on Wall Ball over height",
      "If able to reach below parallel, aim for either a 10/9ft target",
    ],
  },
  {
    week: 7, day: 2, type: "engine_builder", phase: "build",
    title: "Engine Sprint AMRAPs",
    duration: "5 x 3 Min AMRAP",
    workout: [
      "5 x 3 Minutes AMRAP (3:00 on / 3:00 off):",
      "10 DB Thruster (35/20lbs or 15/7.5kg x2)",
      "6 Burpee Broad Jump",
      "Max Cal Bike",
    ],
    notes: [
      "Thrusters should be done in one set",
      "Each round should be a sprint effort",
      "Goal is to find a pace where you can go HARD but maintain while having a 1:1 work/rest ratio",
      "Score = Cals (stay consistent)",
    ],
  },
  {
    week: 7, day: 3, type: "engine_builder", phase: "build",
    title: "800m Run Repeats",
    duration: "4 x 800m",
    workout: [
      "4 x 800m Run at Race Pace",
      "2 Minutes Rest after each",
    ],
    notes: [
      "Record each 800m split",
      "Log results and note changes in pace, what you are able to hold, etc.",
      "The goal should be to find what pace you can maintain without leaving anything in the tank",
    ],
  },
  {
    week: 7, day: 4, type: "stations", phase: "build",
    title: "Foundation Triple AMRAP",
    duration: "30 Minutes",
    workout: [
      "0:00 - 12:00 AMRAP: 15 Wall Balls (14/10lbs) / 12 DB Push Press / 9 Cal Ski",
      "12:00 - 22:00 AMRAP: 50ft/12.5m Sled Push AHAP / 200m Run",
      "22:00 - 30:00 AMRAP: 8 KB Swing / 10 Burpees",
    ],
    notes: [
      "Each AMRAP goes immediately into the next",
      "Sled Push should be AHAP (As Heavy As Possible)",
      "Focus on going right into the run",
      "Rest if needed AFTER the run, not between sled and run",
    ],
  },
  {
    week: 7, day: 5, type: "race_sim", phase: "build",
    title: "HYROX Complete Couplets",
    duration: "For Time",
    workout: [
      "3x: 20/12 Cal Bike / 100ft Sled Push AHAP / 50ft Burpee Broad Jump / 400m Run",
      "Into:",
      "3x: 20/12 Cal Ski / 20 KB Deadlift / 100m Farmer Carry / 20 Wall Balls",
    ],
    notes: [
      "Focus on consistent and steady pace throughout Burpee Broad Jumps",
      "Recover on 400m run as needed",
      "KB Deadlift and Farmers Carry weight should be the same",
      "Go unbroken on Wall Balls",
    ],
  },

  // ── WEEK 8 (PACE → build) ───────────────────────────────────────
  {
    week: 8, day: 1, type: "stations", phase: "build",
    title: "Foundation RFT",
    duration: "For Time",
    workout: [
      "4 RFT:",
      "50ft/12.5m Sled Pull",
      "10 Push Ups",
      "12 DB Push Press (35/20lbs or 15/7.5kg x2)",
      "15 Wall Balls (14/10lbs or 6/4kg)",
      "200m Ski",
    ],
    notes: [
      "Sled Pull: Practice both walk back method and arms only — adjust weight as needed",
      "Wall Balls should be unbroken",
    ],
  },
  {
    week: 8, day: 2, type: "engine_builder", phase: "build",
    title: "Sled + Sprint E2MOM",
    duration: "E2MOM x 8",
    workout: [
      "E2MOM x 8:",
      "50ft/12.5m Sled Push",
      "200m Sprint",
      "Rest in time remaining",
    ],
    notes: [
      "Adjust run distance if unable to get at least 45 seconds rest, OR switch to Ski or Row",
    ],
  },
  {
    week: 8, day: 3, type: "engine_builder", phase: "build",
    title: "400m Run Repeats",
    duration: "6 x 400m",
    workout: [
      "6 x 400m Run",
      "2 Minutes Rest after each",
    ],
    notes: [
      "Challenge yourself to see what you're capable of",
      "Push the pace on these 400m runs",
      "Keep track of your splits and see where you fall off",
      "Goal should be to find your breaking point",
    ],
  },
  {
    week: 8, day: 4, type: "engine_builder", phase: "build",
    title: "Wall Ball + Sprint E4MOM",
    duration: "Every 4:00 x 5",
    workout: [
      "Every 4:00 Minutes x 5:",
      "20 Wall Balls",
      "200m Sprint",
      "Rest in time remaining",
    ],
    notes: [
      "Focus is SPEED",
      "Wall Balls unbroken",
      "No rest — immediately into the 200m Sprint",
    ],
  },
  {
    week: 8, day: 5, type: "race_sim", phase: "build",
    title: "HYROX Complete RFT",
    duration: "For Time",
    workout: [
      "3 RFT:",
      "500m Ski/Row",
      "100ft/25m Goblet Lunge (53/35lbs or 24/16kg)",
      "100m Farmer Carry (53/35lbs or 24/16kg x2)",
      "1000m Run",
      "*Accumulate 350ft/100m Sled Push or Pull throughout",
    ],
    notes: [
      "Finishing is the goal — pace yourself",
      "Sled Push or Sled Pull can be broken up throughout, as long as you reach the designated distance total",
    ],
  },

  // ── WEEK 9 (ACCELERATE → peak) ─────────────────────────────────
  {
    week: 9, day: 1, type: "engine_builder", phase: "peak",
    title: "Run + Station Rounds",
    duration: "5 Rounds",
    workout: [
      "5 Rounds (500m Run + Movement / 2:00 Rest):",
      "Round 1: 500m Run + 500m Ski",
      "Round 2: 500m Run + 30 Burpee Broad Jumps",
      "Round 3: 500m Run + 200m Farmers Carry",
      "Round 4: 500m Run + 50 Sandbag Lunge",
      "Round 5: 500m Run + 75 Wall Balls",
    ],
    notes: [
      "Focus is on run pace",
      "Each round starts with a 500m Run",
      "Take splits of each run — each run should feel like a race pace effort",
      "The movement will change each round — do the movement that corresponds to the round",
    ],
  },
  {
    week: 9, day: 2, type: "stations", phase: "peak",
    title: "Foundation For Time",
    duration: "For Time",
    workout: [
      "For Time:",
      "25-20-15-10-5 Cal Ski",
      "25-20-15-10-5 Goblet Lunge (53/35lbs or 24/16kg)",
      "25-20-15-10-5 DB Push Press (35/20lbs or 15/7.5kg x2)",
      "25-20-15-10-5 DB Front Squat (35/20lbs or 15/7.5kg x2)",
    ],
    notes: [
      "Use 1 KB for Goblet Lunge",
      "Use 2 DBs for Push Press and Front Squat",
      "Steady pace",
      "Break up DB movements as needed",
    ],
  },
  {
    week: 9, day: 3, type: "engine_builder", phase: "peak",
    title: "200m Sprint Repeats",
    duration: "8 x 200m",
    workout: [
      "8 x 200m Run Max Effort",
      "1:30 Minute Rest after each Run",
    ],
    notes: [
      "Each 200m should be a build to sprint",
      "Start at 80% effort for first 100m, build to sprint for the remainder",
      "Record splits",
    ],
  },
  {
    week: 9, day: 4, type: "engine_builder", phase: "peak",
    title: "Bike + Sled + Run Every 5",
    duration: "Every 5:00 x 6",
    workout: [
      "Every 5:00 Minutes x 6:",
      "10/8 Cal Bike",
      "50ft/12.5m Sled Push",
      "200m Run",
      "Rest in time remaining",
    ],
    notes: [
      "Focus on running immediately after the sled push and on speed/turnover of your legs",
      "The runs won't feel fast but see what your legs can do while compromised",
    ],
  },
  {
    week: 9, day: 5, type: "race_sim", phase: "peak",
    title: "HYROX Complete For Time",
    duration: "For Time",
    workout: [
      "For Time:",
      "30-20-10 Cal Bike",
      "30-20-10 Wall Balls (14/10lbs or 6/4kg)",
      "30-20-10 Weighted Walking Lunge",
      "30-20-10 DB Push Press",
      "*800m Run after each round",
    ],
    notes: [
      "Weight lunges any way",
      "Steady pace throughout",
      "Record 800m run splits to see variance per round",
    ],
  },

  // ── WEEK 10 (ACCELERATE → peak) ────────────────────────────────
  {
    week: 10, day: 1, type: "engine_builder", phase: "peak",
    title: "Run + Station Rounds",
    duration: "6 Rounds",
    workout: [
      "6 Rounds (400m Run + 25 Reps / 2:00 Rest):",
      "Round 1: Wall Balls (14/10lbs or 6/4kg)",
      "Round 2: DB Lunge (35/20lbs or 15/7.5kg x2)",
      "Round 3: DB Front Squat (35/20lbs or 15/7.5kg x2)",
      "Rounds 4-6: Repeat",
    ],
    notes: [
      "Focus is on run speed",
      "Record splits for each — try to stay consistent but aim for faster than race pace",
      "Do 25 reps of the corresponding movement immediately after the run",
      "You will go through each movement 2x total",
      "2:00 minutes rest after each round",
    ],
  },
  {
    week: 10, day: 2, type: "race_sim", phase: "peak",
    title: "HYROX Complete RFT",
    duration: "For Time",
    workout: [
      "4 RFT:",
      "1000m Run",
      "100ft/25m Sled Push",
      "40 Walking Lunge",
    ],
    notes: [
      "1000m runs should feel like race effort",
      "Sled Push should be AHAP (As Heavy As Possible)",
      "Lunges should be body weight only — option to add weight if desired",
    ],
  },
  {
    week: 10, day: 3, type: "engine_builder", phase: "peak",
    title: "400m Run Repeats Hard",
    duration: "6 x 400m",
    workout: [
      "6 x 400m Run HARD",
      "2:00 Minutes rest after each Run",
    ],
    notes: [
      "Don't hold back on these 400m runs",
      "See where you can hang and where you fall off",
      "Record Splits",
    ],
  },
  {
    week: 10, day: 4, type: "engine_builder", phase: "peak",
    title: "Engine Bike/BBJ/Wall Ball",
    duration: "5 Rounds",
    workout: [
      "5 Rounds:",
      "10/8 Cal Bike",
      "8 Burpee Broad Jumps",
      "15 Wall Balls",
      "10/8 Cal Bike",
      "1:00 Minute Rest",
    ],
    notes: [
      "Each round is an 80-100% effort",
      "Wall Balls should be unbroken",
      "PUSH on the bike but pay attention to RPM and don't fall off",
      "Adjust weight as needed throughout",
    ],
  },
  {
    week: 10, day: 5, type: "race_sim", phase: "peak",
    title: "HYROX Complete For Time",
    duration: "For Time",
    workout: [
      "For Time:",
      "1000m Ski",
      "1000m Row",
      "1000m Run",
      "75 Goblet Squat (53/35lbs or 24/16kg)",
      "75 KB Swing (53/35lbs or 24/16kg)",
      "50 Headcutters",
      "50 Burpee Broad Jump",
      "50 Cal Bike",
      "100m Sled Push",
    ],
    notes: [
      "Partition reps in any way, in any order",
      "Goal is completion in 60 minutes or less",
      "Use the same KB weight throughout",
    ],
  },

  // ── WEEK 11 (PRIME → peak) ─────────────────────────────────────
  {
    week: 11, day: 1, type: "race_sim", phase: "peak",
    title: "HYROX Complete RFT",
    duration: "For Time",
    workout: [
      "3 RFT:",
      "20/12 Cal Bike",
      "400m Run",
      "30 Sandbag Lunge",
      "500m Ski",
      "100m Farmers Carry (53/35lbs or 24/16kg x2)",
    ],
    notes: [
      "Watch RPM on bike and stay consistent",
      "If no sandbag, use DB or Barbell on back",
      "100m Farmer Carry should be unbroken",
    ],
  },
  {
    week: 11, day: 2, type: "stations", phase: "peak",
    title: "Foundation AMRAP",
    duration: "25 Min AMRAP",
    workout: [
      "25 Min AMRAP:",
      "100ft/25m Sled Push",
      "500m Run or Row",
      "20 Wall Balls (14/10lbs or 6/4kg)",
    ],
    notes: [
      "This should be a moderate Recovery Pace",
      "Stay steady and consistent",
      "Run or Row, depending on what you're feeling for the day",
    ],
  },
  {
    week: 11, day: 3, type: "engine_builder", phase: "peak",
    title: "800m Run Repeats",
    duration: "4 x 800m",
    workout: [
      "4 x 800m Run at Race Pace",
      "2:00 Minutes Rest after each Run",
    ],
    notes: [
      "These should feel fresh",
      "Run at what you feel is race pace",
      "Record Splits",
    ],
  },
  {
    week: 11, day: 4, type: "recovery", phase: "peak",
    title: "Run with Pickups",
    duration: "40-50 Minutes",
    workout: [
      "40-50 Minutes Run",
      "6 x 1:00 Minute Pickup",
      "2 Minutes Easy between each Pickup",
    ],
    notes: [
      "Complete 6 x 1 Minute Pick Ups / 2 Minutes Easy at some point during the run",
      "The pickup can be hard or moderate depending on how you're feeling",
    ],
  },
  {
    week: 11, day: 5, type: "race_sim", phase: "peak",
    title: "HYROX Race Simulation",
    duration: "5 Rounds",
    workout: [
      "5 Rounds:",
      "800m Run",
      "*Choose 5 HYROX Stations you'd like to run through",
    ],
    notes: [
      "Choose any 5 HYROX Race Movement Standards",
      "Go in race order",
      "Goal should be race pace or race feel",
    ],
  },

  // ── WEEK 12 (RACE → taper) ─────────────────────────────────────
  {
    week: 12, day: 1, type: "stations", phase: "taper",
    title: "Foundation RFT",
    duration: "Moderate Pace",
    workout: [
      "4 RFT:",
      "500m Row",
      "20 KB Deadlift (53/35lbs or 24/16kg x2)",
      "100m Farmer Carry (53/35lbs or 24/16kg x2)",
      "50ft/12.5m Sled Pull",
    ],
    notes: [
      "Moderate Pace",
      "Practice different types of sled pull technique: arms only, full body, walk back",
      "Go lighter on KB Deadlift and Farmer Carry if you want to lower the intensity",
    ],
  },
  {
    week: 12, day: 2, type: "recovery", phase: "taper",
    title: "Aerobic Machine AMRAP",
    duration: "40 Min AMRAP",
    workout: [
      "40 Min AMRAP:",
      "Machine Cals: 10-15-20-25-30-etc",
      "Rotate between Ski/Bike + Row",
    ],
    notes: [
      "Moderate Pace",
      "Go by feel — if you feel good and want to add intensity",
      "Do the first 10 Cals of each movement as a sprint or hard effort followed by recovery",
    ],
  },
  {
    week: 12, day: 3, type: "engine_builder", phase: "taper",
    title: "Sprint + BBJ Intervals",
    duration: "6 Rounds",
    workout: [
      "6x:",
      "200m Build to sprint",
      "6 Burpee Broad Jump",
      "1:00 Minute Rest",
    ],
    notes: [
      "These should feel fresh",
      "Build to a sprint",
      "Adjust the number of Burpee Broad Jumps as desired",
    ],
  },
  {
    week: 12, day: 4, type: "recovery", phase: "taper",
    title: "Easy Run",
    duration: "45 Minutes",
    workout: [
      "45 Minutes Easy Run",
    ],
    notes: [
      "This should be a \"Feel good\" Jog",
      "Option to switch to Row, Ski or Bike",
    ],
  },
  {
    week: 12, day: 5, type: "recovery", phase: "taper",
    title: "Shake Out Run",
    duration: "20-30 Minutes",
    workout: [
      "OPTIONAL: 20-30 Minutes Shake Out Run",
    ],
    notes: [
      "Totally optional depending on how you're feeling",
      "Only if you think your legs will benefit from a quick/easy run",
      "Don't stress about getting it in",
    ],
  },
]
