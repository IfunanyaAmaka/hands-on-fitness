-- Phase 2 content slice: 8 sessions across goals/levels/types (10-20 min).
INSERT INTO sessions (id, type, goal, level, duration_min) VALUES
  ('beginner-yoga-10', 'yoga', 'flexibility', 'beginner', 10),
  ('beginner-cardio-10', 'workout', 'weight_loss', 'beginner', 10),
  ('beginner-calm-10', 'yoga', 'stress_relief', 'beginner', 10),
  ('intermediate-strength-20', 'workout', 'strength', 'intermediate', 20),
  ('intermediate-flow-20', 'yoga', 'flexibility', 'intermediate', 20),
  ('intermediate-burn-20', 'workout', 'weight_loss', 'intermediate', 20),
  ('advanced-power-20', 'workout', 'strength', 'advanced', 20),
  ('advanced-yoga-20', 'yoga', 'flexibility', 'advanced', 20)
ON CONFLICT (id) DO NOTHING;

INSERT INTO steps (session_id, name, duration_sec, step_order) VALUES
  ('beginner-yoga-10','Cat-cow stretch',60,1),('beginner-yoga-10','Child pose',60,2),('beginner-yoga-10','Standing forward fold',60,3),
  ('beginner-cardio-10','March in place',60,1),('beginner-cardio-10','Step touch',60,2),('beginner-cardio-10','Gentle cool-down',60,3),
  ('beginner-calm-10','Box breathing',60,1),('beginner-calm-10','Seated stretch',60,2),('beginner-calm-10','Corpse pose rest',60,3),
  ('intermediate-strength-20','Bodyweight squats',60,1),('intermediate-strength-20','Push-ups',60,2),('intermediate-strength-20','Plank hold',60,3),('intermediate-strength-20','Lunges',60,4),
  ('intermediate-flow-20','Sun salutation A',60,1),('intermediate-flow-20','Warrior II flow',60,2),('intermediate-flow-20','Pigeon stretch',60,3),
  ('intermediate-burn-20','Jumping jacks',60,1),('intermediate-burn-20','Mountain climbers',60,2),('intermediate-burn-20','Burpees lite',60,3),
  ('advanced-power-20','Pistol squat practice',60,1),('advanced-power-20','Diamond push-ups',60,2),('advanced-power-20','Hollow hold',60,3),
  ('advanced-yoga-20','Crow pose practice',60,1),('advanced-yoga-20','Wheel bridge',60,2),('advanced-yoga-20','Headstand prep',60,3)
ON CONFLICT DO NOTHING;
