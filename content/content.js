/* Plate 450 Diary content. Do not edit by hand: use the Content Studio (#studio on the site), download this file, and upload it to the content folder on GitHub. */
(function (r) { r.DD_CONTENT = {
 "version": 1,
 "updated": "2026-11-15",
 "scenarios": [
  {
   "id": "run1",
   "cat": "run",
   "lvl": 1,
   "sit": {
    "inn": 4,
    "outs": 1,
    "b": [
     1,
     0,
     0
    ],
    "us": 2,
    "them": 2,
    "cnt": "",
    "you": "1"
   },
   "q": "You are the runner on first. The batter hits a ground ball to the shortstop. What do you do?",
   "opts": [
    "Run to second base as fast as you can",
    "Stay on first base",
    "Wait to see if the shortstop makes a throw"
   ],
   "ans": 0,
   "why": "The batter has to run to first, so you are forced to leave. If you stay, the fielder can step on second for an easy force out.",
   "tip": "Forced to go? Go!"
  },
  {
   "id": "run2",
   "cat": "run",
   "lvl": 1,
   "sit": {
    "inn": 5,
    "outs": 1,
    "b": [
     0,
     0,
     1
    ],
    "us": 3,
    "them": 3,
    "cnt": "",
    "you": "3"
   },
   "q": "You are on third. A deep fly ball is hit to center field. What is your plan?",
   "opts": [
    "Keep one foot on third base and take off the moment the ball is caught",
    "Run home right away, before the catch",
    "Walk toward home plate and wait",
    "Stand off the base and just watch"
   ],
   "ans": 0,
   "why": "On a fly ball you must tag up: stay on the base and go once it is caught. If you leave early, the defense can throw to the base and get you out.",
   "tip": "Fly ball? Tag up."
  },
  {
   "id": "run3",
   "cat": "run",
   "lvl": 2,
   "sit": {
    "inn": 6,
    "outs": 2,
    "b": [
     0,
     1,
     0
    ],
    "us": 4,
    "them": 5,
    "cnt": "",
    "you": "2"
   },
   "q": "Two outs. A fly ball is hit to left-center that might fall in or might be caught. What do you do?",
   "opts": [
    "Take off as soon as the ball is hit",
    "Wait on the base until you see if it is caught",
    "Tag up like you would with one out"
   ],
   "ans": 0,
   "why": "With two outs, a catch ends the inning anyway, so you lose nothing by running. If the ball falls, you will have a great jump to score.",
   "tip": "Two outs: run on contact."
  },
  {
   "id": "run4",
   "cat": "run",
   "lvl": 2,
   "sit": {
    "inn": 3,
    "outs": 0,
    "b": [
     1,
     0,
     0
    ],
    "us": 1,
    "them": 0,
    "cnt": "",
    "you": "1"
   },
   "q": "A hard line drive is hit right at the shortstop. What do you do?",
   "opts": [
    "Get back to first base right away",
    "Run to second as fast as you can",
    "Run to second, then keep going to third",
    "Stand still and watch"
   ],
   "ans": 0,
   "why": "A hard liner is often caught. If the shortstop catches it and throws to first before you get back, that is a double play. Getting back is the safe choice.",
   "tip": "Hard liner at a fielder? Get back."
  },
  {
   "id": "run5",
   "cat": "run",
   "lvl": 1,
   "sit": {
    "inn": 3,
    "outs": 1,
    "b": [
     0,
     0,
     0
    ],
    "us": 2,
    "them": 3,
    "cnt": "",
    "you": "bat"
   },
   "q": "You hit a ground ball and the throw to first will be close. How do you run through first base?",
   "opts": [
    "Sprint through the bag, touch it, then slow down in foul territory",
    "Slide into first base",
    "Slow down and stop on the bag",
    "Jump over the bag"
   ],
   "ans": 0,
   "why": "You can run past first without being tagged out, so full speed through the bag is fastest. Sliding or slowing down costs you time. After the bag, turn toward foul territory and do not head toward second.",
   "tip": "Run THROUGH first."
  },
  {
   "id": "hit1",
   "cat": "hit",
   "lvl": 1,
   "sit": {
    "inn": 3,
    "outs": 1,
    "b": [
     0,
     0,
     0
    ],
    "us": 1,
    "them": 2,
    "cnt": "0-2",
    "you": "bat"
   },
   "q": "You have two strikes (the count is 0-2). What is your plan?",
   "opts": [
    "Shorten your swing and protect the plate. Swing at anything close.",
    "Wait for the perfect pitch only",
    "Take every pitch and hope for a walk",
    "Swing as hard as you can at everything"
   ],
   "ans": 0,
   "why": "With two strikes, a close pitch can end your at bat if you take it. Choke up a little, shorten your swing, and put the ball in play.",
   "tip": "Two strikes: protect the plate."
  },
  {
   "id": "hit2",
   "cat": "hit",
   "lvl": 1,
   "sit": {
    "inn": 2,
    "outs": 0,
    "b": [
     0,
     0,
     0
    ],
    "us": 0,
    "them": 0,
    "cnt": "1-1",
    "you": "bat"
   },
   "q": "The pitch bounces in the dirt, far outside the strike zone. Do you swing?",
   "opts": [
    "Let it go",
    "Swing hard, you might connect",
    "Start to swing, then check halfway"
   ],
   "ans": 0,
   "why": "Pitches in the dirt are almost never hits. Letting bad pitches go gets you into better counts, and more walks.",
   "tip": "Hit strikes. Take balls."
  },
  {
   "id": "hit3",
   "cat": "hit",
   "lvl": 2,
   "sit": {
    "inn": 5,
    "outs": 0,
    "b": [
     0,
     1,
     0
    ],
    "us": 2,
    "them": 3,
    "cnt": "",
    "you": "bat"
   },
   "q": "Nobody is out and your team needs the runner on second to move to third. Where do you try to hit a ground ball?",
   "opts": [
    "To the right side (first or second baseman)",
    "To the left side (third baseman or shortstop)",
    "Straight back at the pitcher",
    "Pop it up"
   ],
   "ans": 0,
   "why": "A ground ball to the right side makes the fielder throw to first, and the runner can take third. A ball to the left side usually makes him hold.",
   "tip": "Runner on second? Hit it to the right side."
  },
  {
   "id": "hit4",
   "cat": "hit",
   "lvl": 2,
   "sit": {
    "inn": 6,
    "outs": 1,
    "b": [
     0,
     0,
     1
    ],
    "us": 3,
    "them": 3,
    "cnt": "1-0",
    "you": "bat"
   },
   "q": "Tie game, runner on third, one out, and the infield is playing in. What is your goal at the plate?",
   "opts": [
    "Hit the ball in the air deep enough to score the runner",
    "Pop it straight up in the infield",
    "Hit a slow roller to the pitcher",
    "Take the first three pitches"
   ],
   "ans": 0,
   "why": "With fewer than two outs, a fly ball caught deep lets the runner tag up and score. That is a sacrifice fly, and it does not count as an at bat.",
   "tip": "Less than two outs: get the run home."
  },
  {
   "id": "hit5",
   "cat": "hit",
   "lvl": 2,
   "sit": {
    "inn": 4,
    "outs": 0,
    "b": [
     1,
     0,
     0
    ],
    "us": 1,
    "them": 1,
    "cnt": "",
    "you": "bat"
   },
   "q": "Your coach gives the sacrifice bunt sign with a runner on first and nobody out. Where do you aim?",
   "opts": [
    "Softly down the first- or third-base line, away from the pitcher",
    "Hard right back at the pitcher",
    "In the air toward the outfield",
    "Skip the bunt and swing away"
   ],
   "ans": 0,
   "why": "The goal is to move the runner to second while the fielders take the out at first. A soft bunt along a line, away from the pitcher, gives the runner time. Always follow the coach’s sign.",
   "tip": "Bunt away from the pitcher."
  },
  {
   "id": "fld1",
   "cat": "fld",
   "lvl": 1,
   "sit": {
    "inn": 4,
    "outs": 1,
    "b": [
     1,
     0,
     0
    ],
    "us": 3,
    "them": 2,
    "cnt": "",
    "you": "SS"
   },
   "q": "Runner on first, one out. The ball is hit on the ground right to you at shortstop. Where is your best throw?",
   "opts": [
    "To second base for the force out",
    "To first base for the sure out",
    "Hold the ball",
    "To home plate"
   ],
   "ans": 0,
   "why": "The runner on first has to go, so you can get the force at second, and it can turn into a double play. Take the lead runner when you can.",
   "tip": "Get the lead runner."
  },
  {
   "id": "fld2",
   "cat": "fld",
   "lvl": 2,
   "sit": {
    "inn": 6,
    "outs": 1,
    "b": [
     1,
     1,
     1
    ],
    "us": 4,
    "them": 4,
    "cnt": "",
    "you": "SS"
   },
   "q": "Bases loaded, one out, and a ground ball is hit to you. Where do you throw?",
   "opts": [
    "Home for the force out, then on to first for two",
    "To first base only",
    "To third base",
    "Hold the ball"
   ],
   "ans": 0,
   "why": "With the bases loaded, every runner is forced. Getting the runner at home stops the run first, and the catcher can still throw to first for a double play.",
   "tip": "Bases loaded: force at home first."
  },
  {
   "id": "fld3",
   "cat": "fld",
   "lvl": 2,
   "sit": {
    "inn": 3,
    "outs": 0,
    "b": [
     0,
     0,
     0
    ],
    "us": 0,
    "them": 1,
    "cnt": "",
    "you": "SS"
   },
   "q": "A high fly ball drops between you at shortstop and the center fielder. He is running in and calls “I got it!” What do you do?",
   "opts": [
    "Get out of the way and let him catch it",
    "Keep going, you are closer to the ball",
    "Stop and stand next to him",
    "Call him off"
   ],
   "ans": 0,
   "why": "An outfielder running in can see the whole play and has the right of way over an infielder. Call for the ball loudly if you have it, and back off when someone else calls it first.",
   "tip": "Call it loud. Yield if called."
  },
  {
   "id": "fld4",
   "cat": "fld",
   "lvl": 1,
   "sit": {
    "inn": 2,
    "outs": 1,
    "b": [
     0,
     0,
     0
    ],
    "us": 0,
    "them": 0,
    "cnt": "",
    "you": "RF"
   },
   "q": "No one is on base and the batter hits a ground ball to the shortstop. Where should the right fielder go?",
   "opts": [
    "Run toward first base to back up the throw",
    "Stay where you are",
    "Run to center field",
    "Run toward home plate"
   ],
   "ans": 0,
   "why": "If the throw gets past the first baseman, a backup stops it from rolling away and keeps the runner from taking extra bases. Great fielders never stand still.",
   "tip": "Always back up a base."
  },
  {
   "id": "fld5",
   "cat": "fld",
   "lvl": 1,
   "sit": {
    "inn": 7,
    "outs": 2,
    "b": [
     0,
     0,
     1
    ],
    "us": 5,
    "them": 5,
    "cnt": "",
    "you": "3B"
   },
   "q": "Two outs, runner on third, tie game. A ground ball is hit to you at third base. What is your play?",
   "opts": [
    "Throw to first base for the out that ends the inning",
    "Throw home to catch the runner",
    "Hold the ball and look at the runner",
    "Chase the runner back to third"
   ],
   "ans": 0,
   "why": "With two outs, the sure out at first ends the inning, and no run can score. The runner on third is not forced, so a throw home would need a tag and is much riskier.",
   "tip": "Two outs: take the sure out."
  },
  {
   "id": "pit1",
   "cat": "pit",
   "lvl": 1,
   "sit": {
    "inn": 6,
    "outs": 2,
    "b": [
     1,
     1,
     1
    ],
    "us": 3,
    "them": 3,
    "cnt": "3-2",
    "you": "P"
   },
   "q": "Bases loaded, two outs, full count. A walk forces in a run. What do you throw?",
   "opts": [
    "Your best strike in the zone",
    "A pitch well outside, hoping he chases",
    "A slow pitch in the dirt",
    "A pitch up and away on purpose"
   ],
   "ans": 0,
   "why": "A ball means a run scores. Trust your defense: attack the zone with your best pitch and let the hitter make the play.",
   "tip": "Full count, bases loaded: throw a strike."
  },
  {
   "id": "pit2",
   "cat": "pit",
   "lvl": 2,
   "sit": {
    "inn": 4,
    "outs": 1,
    "b": [
     0,
     0,
     1
    ],
    "us": 2,
    "them": 2,
    "cnt": "",
    "you": "C"
   },
   "q": "A pitch skips in the dirt with a runner on third. What is the catcher’s job?",
   "opts": [
    "Drop to your knees and block the ball with your body",
    "Reach out and catch it with only your glove",
    "Turn and watch it roll by",
    "Stand up and catch it one-handed"
   ],
   "ans": 0,
   "why": "Blocking keeps the ball in front of you, so the runner cannot score on a wild pitch. Get your knees down, chin tucked, and glove between your legs.",
   "tip": "Block it. Keep it in front."
  },
  {
   "id": "pit3",
   "cat": "pit",
   "lvl": 1,
   "sit": {
    "inn": 3,
    "outs": 1,
    "b": [
     0,
     0,
     0
    ],
    "us": 1,
    "them": 1,
    "cnt": "",
    "you": "P"
   },
   "q": "The first baseman fields a ground ball and is pulled far away from first base. What should the pitcher do?",
   "opts": [
    "Run over and cover first base",
    "Stay on the mound",
    "Cover third base",
    "Back up home plate"
   ],
   "ans": 0,
   "why": "Somebody has to be at first to take the throw. The first baseman cannot be in two places, so the pitcher sprints to the bag.",
   "tip": "Pitcher covers first."
  },
  {
   "id": "pit4",
   "cat": "pit",
   "lvl": 2,
   "sit": {
    "inn": 5,
    "outs": 1,
    "b": [
     0,
     0,
     1
    ],
    "us": 2,
    "them": 2,
    "cnt": "",
    "you": "P"
   },
   "q": "The catcher cannot find a wild pitch and the runner on third breaks for home. Where does the pitcher go?",
   "opts": [
    "Run to cover home plate and take the throw",
    "Stay on the mound",
    "Chase the ball to the backstop",
    "Cover first base"
   ],
   "ans": 0,
   "why": "The catcher chases the ball, so the pitcher covers the plate. Get there fast, set up in front of it, and be ready to tag the runner.",
   "tip": "Wild pitch with a runner on third: cover home."
  },
  {
   "id": "pit5",
   "cat": "pit",
   "lvl": 1,
   "sit": {
    "inn": 4,
    "outs": 0,
    "b": [
     0,
     0,
     0
    ],
    "us": 2,
    "them": 1,
    "cnt": "",
    "you": "P"
   },
   "q": "You have thrown 45 pitches and your arm feels sore and tight. What should you do?",
   "opts": [
    "Tell your coach right away and stop pitching",
    "Pitch through it",
    "Throw harder to loosen it up",
    "Say nothing so you can finish the inning"
   ],
   "ans": 0,
   "why": "Pain is a warning sign. Pushing through it can cause a serious arm injury in young players. Pitch limits and rest days exist to protect your arm.",
   "tip": "Sore arm? Tell your coach."
  },
  {
   "id": "rul1",
   "cat": "rul",
   "lvl": 2,
   "sit": {
    "inn": 5,
    "outs": 0,
    "b": [
     1,
     1,
     0
    ],
    "us": 3,
    "them": 3,
    "cnt": "",
    "you": "bat"
   },
   "q": "Runners on first and second, nobody out. The batter hits a high pop-up an infielder can catch easily, and the umpire calls “Infield fly!” What happens?",
   "opts": [
    "The batter is out, and runners may advance at their own risk",
    "It is a normal fly ball, so the batter is safe if it is dropped",
    "Every runner must run",
    "The play is dead and nobody can move"
   ],
   "ans": 0,
   "why": "The infield fly rule protects runners from a trick double play. The batter is out right away, the ball stays live, and runners are not forced to move.",
   "tip": "Infield fly: batter is out."
  },
  {
   "id": "rul2",
   "cat": "rul",
   "lvl": 2,
   "sit": {
    "inn": 4,
    "outs": 1,
    "b": [
     0,
     0,
     0
    ],
    "us": 2,
    "them": 2,
    "cnt": "1-2",
    "you": "bat"
   },
   "q": "Strike three, but the catcher drops the ball and first base is empty. What can you do?",
   "opts": [
    "Run to first base. You might get there before the throw.",
    "Walk back to the dugout",
    "Stay in the batter’s box",
    "Run to second"
   ],
   "ans": 0,
   "why": "On a dropped third strike with first base empty (or with two outs), the batter can run. If the catcher throws you out, you are out. Check your league’s rules, since some levels do not allow this.",
   "tip": "Dropped third strike? Run!"
  },
  {
   "id": "rul3",
   "cat": "rul",
   "lvl": 2,
   "sit": {
    "inn": 6,
    "outs": 2,
    "b": [
     0,
     0,
     1
    ],
    "us": 3,
    "them": 3,
    "cnt": "",
    "you": "3"
   },
   "q": "Two outs. The runner on third crosses home plate, but the batter is thrown out at first before reaching the base. Does the run count?",
   "opts": [
    "No. The batter was the third out before reaching first.",
    "Yes. The runner touched home plate first.",
    "Yes. Runs always count if the runner scores.",
    "Only if the coach asks the umpire"
   ],
   "ans": 0,
   "why": "A run does not count if the third out is the batter being put out before first base, or any force out. Even if the runner scored first, the play is dead.",
   "tip": "Third out at first (or a force) cancels the run."
  },
  {
   "id": "rul4",
   "cat": "rul",
   "lvl": 1,
   "sit": {
    "inn": 2,
    "outs": 1,
    "b": [
     0,
     0,
     0
    ],
    "us": 0,
    "them": 1,
    "cnt": "1-1",
    "you": "bat"
   },
   "q": "A pitch outside the strike zone hits your arm. You did not swing, and you tried to get out of the way. What happens?",
   "opts": [
    "You get first base",
    "It counts as a ball and you stay up",
    "It counts as a strike",
    "You are out"
   ],
   "ans": 0,
   "why": "When a pitch hits a batter who tried to avoid it and did not swing, the batter is awarded first base. Runners are pushed up only if they are forced.",
   "tip": "Hit by a pitch: take your base."
  },
  {
   "id": "rul5",
   "cat": "rul",
   "lvl": 2,
   "sit": {
    "inn": 5,
    "outs": 1,
    "b": [
     0,
     1,
     0
    ],
    "us": 2,
    "them": 2,
    "cnt": "",
    "you": "2"
   },
   "q": "A ground ball is hit and strikes you as you run toward third, before it gets past an infielder. What is the ruling?",
   "opts": [
    "You are out and the ball is dead",
    "Play continues and you are safe",
    "The batter is out and you are safe",
    "The pitch is replayed"
   ],
   "ans": 0,
   "why": "A runner hit by a fair batted ball that has not passed or been touched by an infielder is out. Watch the ball, and jump or slide to avoid it.",
   "tip": "Do not get hit by a fair ball."
  },
  {
   "id": "iq1",
   "cat": "iq",
   "lvl": 2,
   "sit": {
    "inn": 7,
    "outs": 1,
    "b": [
     0,
     0,
     1
    ],
    "us": 3,
    "them": 3,
    "cnt": "",
    "you": "SS"
   },
   "q": "Bottom of the last inning, tie game, runner on third, one out. How should the infield play?",
   "opts": [
    "Move in, to cut off the run at the plate",
    "Stay at double-play depth",
    "Play back and give up the run",
    "It does not matter"
   ],
   "ans": 0,
   "why": "The winning run is on third. Playing in gives you a chance to throw him out at home on a ground ball. You cannot afford to let the game end on a routine grounder.",
   "tip": "Winning run on third? Infield in."
  },
  {
   "id": "iq2",
   "cat": "iq",
   "lvl": 2,
   "sit": {
    "inn": 5,
    "outs": 0,
    "b": [
     0,
     1,
     0
    ],
    "us": 2,
    "them": 2,
    "cnt": "",
    "you": "2"
   },
   "q": "Nobody out and you are on second. A ground ball is hit to the second baseman, behind you. What do you do?",
   "opts": [
    "Advance to third base",
    "Stay at second",
    "Go back toward first",
    "Run home"
   ],
   "ans": 0,
   "why": "A ball hit to your right side is behind you, so the fielder has to throw to first and cannot hold you. Move over to third. A ball hit in front of you means hold.",
   "tip": "Behind you? Go. In front? Hold."
  },
  {
   "id": "iq3",
   "cat": "iq",
   "lvl": 1,
   "sit": {
    "inn": 4,
    "outs": 1,
    "b": [
     0,
     1,
     0
    ],
    "us": 2,
    "them": 3,
    "cnt": "",
    "you": "SS"
   },
   "q": "Your teammate makes an error and a run scores. What do you do next?",
   "opts": [
    "Encourage him and get ready for the next pitch",
    "Tell him he blew it",
    "Throw your glove",
    "Stop paying attention"
   ],
   "ans": 0,
   "why": "Everyone makes errors, including big leaguers. Teams that stay positive and focus on the next play recover faster. The next pitch is the only one you can control.",
   "tip": "Next pitch. Next play."
  },
  {
   "id": "iq4",
   "cat": "iq",
   "lvl": 1,
   "sit": {
    "inn": 5,
    "outs": 1,
    "b": [
     1,
     0,
     0
    ],
    "us": 3,
    "them": 3,
    "cnt": "1-0",
    "you": "bat"
   },
   "q": "Your coach gives a sign and you are not sure what it means. What do you do?",
   "opts": [
    "Step out and ask for time to check with the coach",
    "Guess",
    "Ignore it and do what you want",
    "Look at the other team’s dugout"
   ],
   "ans": 0,
   "why": "A quick question is better than a guess that costs your team an out. The umpire will give you time, and your coach would rather you ask.",
   "tip": "Not sure? Ask."
  },
  {
   "id": "iq5",
   "cat": "iq",
   "lvl": 1,
   "sit": {
    "inn": 3,
    "outs": 1,
    "b": [
     1,
     0,
     0
    ],
    "us": 1,
    "them": 1,
    "cnt": "",
    "you": "2B"
   },
   "q": "You are an infielder. What should you think about before every pitch?",
   "opts": [
    "How many outs there are, where the runners are, and where I will throw if the ball comes to me",
    "Nothing, just wait and see",
    "What snack I will have after the game",
    "Who is in the crowd"
   ],
   "ans": 0,
   "why": "Great fielders make the decision before the ball is hit. Knowing the outs and runners means you throw to the right base without hesitating.",
   "tip": "Outs. Runners. Plan."
  },
  {
   "id": "run6",
   "cat": "run",
   "lvl": 3,
   "sit": {
    "inn": 4,
    "outs": 0,
    "b": [
     0,
     1,
     0
    ],
    "us": 1,
    "them": 1,
    "cnt": "",
    "you": "2"
   },
   "q": "You are on second with nobody out. The batter hits a hard ground ball right at the shortstop. What do you do?",
   "opts": [
    "Hold at second until the ball gets past the infield",
    "Break for third as soon as the bat hits the ball",
    "Run to third when the shortstop fields it"
   ],
   "ans": 0,
   "why": "A ground ball hit in front of you, toward the left side, is easy for the shortstop to throw you out at third. With no outs you can wait for a better chance, so hold unless it is hit to your right or gets through.",
   "tip": "Ball in front of you? Hold."
  },
  {
   "id": "run7",
   "cat": "run",
   "lvl": 3,
   "sit": {
    "inn": 5,
    "outs": 2,
    "b": [
     1,
     0,
     0
    ],
    "us": 1,
    "them": 1,
    "cnt": "3-2",
    "you": "1"
   },
   "q": "Two outs, full count, and you are the runner on first. What is your plan as the pitcher delivers?",
   "opts": [
    "Take off with the pitch",
    "Stay close to first base",
    "Take a big lead, then wait to see contact"
   ],
   "ans": 0,
   "why": "With two outs and a full count, the play ends on strike three, a walk or a ball in play. Running on the pitch puts you in scoring position and you score from second on most hits.",
   "tip": "Two outs, 3-2? Run on the pitch."
  },
  {
   "id": "hit6",
   "cat": "hit",
   "lvl": 3,
   "sit": {
    "inn": 6,
    "outs": 2,
    "b": [
     0,
     0,
     1
    ],
    "us": 2,
    "them": 3,
    "cnt": "0-2",
    "you": "bat"
   },
   "q": "Two outs, runner on third, and you are behind 0-2. What is your approach?",
   "opts": [
    "Shorten up and protect the plate: swing at anything close",
    "Wait for a perfect pitch to drive",
    "Take the next pitch to see what he throws"
   ],
   "ans": 0,
   "why": "With two strikes the umpire effectively gives the pitcher more of the plate, so you must protect it. A shorter swing and a good look at anything near the zone keeps the at bat alive.",
   "tip": "Two strikes: protect the plate."
  },
  {
   "id": "hit7",
   "cat": "hit",
   "lvl": 3,
   "sit": {
    "inn": 6,
    "outs": 1,
    "b": [
     0,
     0,
     1
    ],
    "us": 2,
    "them": 3,
    "cnt": "",
    "you": "bat"
   },
   "q": "Runner on third, one out, and the infield is playing back. What is your best goal at the plate?",
   "opts": [
    "Put the ball in play: a ground ball or deep fly can score the run",
    "Swing for a home run no matter what",
    "Take pitches until you get a walk"
   ],
   "ans": 0,
   "why": "The infield is giving up the run on a grounder, and a fly ball deep enough scores him too. A strikeout is the only way to waste the chance, so make contact.",
   "tip": "Runner on third: put it in play."
  },
  {
   "id": "fld6",
   "cat": "fld",
   "lvl": 3,
   "sit": {
    "inn": 6,
    "outs": 1,
    "b": [
     0,
     0,
     1
    ],
    "us": 3,
    "them": 3,
    "cnt": "",
    "you": "3B"
   },
   "q": "Tie game, runner on third, one out, and your infield is playing in. A ground ball is hit to you at third base. Where do you throw?",
   "opts": [
    "Home plate, to cut off the run",
    "First base for the sure out",
    "Hold the ball and check the runner"
   ],
   "ans": 0,
   "why": "The infield only plays in when the run matters, which it does in a tie game. Throwing home keeps the go-ahead run from scoring, and the runner must stay put or get tagged.",
   "tip": "Infield in? Throw home."
  },
  {
   "id": "fld7",
   "cat": "fld",
   "lvl": 3,
   "sit": {
    "inn": 3,
    "outs": 1,
    "b": [
     0,
     0,
     0
    ],
    "us": 0,
    "them": 0,
    "cnt": "",
    "you": "LF"
   },
   "q": "A fly ball is hit into the left-center gap. You and the center fielder both have a chance. Who has priority?",
   "opts": [
    "The center fielder",
    "The left fielder",
    "Whoever calls it last"
   ],
   "ans": 0,
   "why": "Outfielders run toward the ball, so the center fielder has priority over the corner outfielders because he sees the whole field and runs forward. Back off and call out to help him.",
   "tip": "Gap ball? Center has priority."
  },
  {
   "id": "pit6",
   "cat": "pit",
   "lvl": 3,
   "sit": {
    "inn": 4,
    "outs": 0,
    "b": [
     1,
     1,
     0
    ],
    "us": 2,
    "them": 2,
    "cnt": "",
    "you": "P"
   },
   "q": "Runners on first and second with nobody out. The batter bunts and the ball rolls slowly toward third base. You pick it up. What is your first thought?",
   "opts": [
    "Look at third for the lead runner, but take the sure out at first if you cannot get him",
    "Always throw to first base",
    "Throw to second base"
   ],
   "ans": 0,
   "why": "The lead runner moving to third is the most dangerous. If you can beat him there you stop the rally, but if not, a sure out at first is better than a wild throw that loads the bases.",
   "tip": "Lead runner if you can, else the sure out."
  },
  {
   "id": "pit7",
   "cat": "pit",
   "lvl": 3,
   "sit": {
    "inn": 5,
    "outs": 1,
    "b": [
     0,
     0,
     1
    ],
    "us": 1,
    "them": 1,
    "cnt": "1-2",
    "you": "C"
   },
   "q": "You are catching with a runner on third and one out. A curveball bounces in the dirt in front of you. What do you do?",
   "opts": [
    "Drop to your knees and block it so it stays in front of you",
    "Reach out to snag it with your glove only",
    "Turn your head and let it go by"
   ],
   "ans": 0,
   "why": "A ball that gets past you lets the runner score on a wild pitch. Blocking with your body keeps it in front of you so the runner has to hold, even if you do not catch it cleanly.",
   "tip": "Runner on third: block everything."
  },
  {
   "id": "rul6",
   "cat": "rul",
   "lvl": 3,
   "sit": {
    "inn": 6,
    "outs": 2,
    "b": [
     0,
     0,
     1
    ],
    "us": 2,
    "them": 3,
    "cnt": "",
    "you": "3"
   },
   "q": "Two outs. The batter hits a ground ball and is thrown out at first for the third out. You crossed home plate just before the throw got to first. Does your run count?",
   "opts": [
    "No, the third out was a force out, so no run scores",
    "Yes, you touched home plate first",
    "Yes, because you were not the one who made the out"
   ],
   "ans": 0,
   "why": "A run cannot score on a play where the third out is a force out, and the batter being thrown out at first is a force out. Timing does not matter in that case, though it does on a tag play.",
   "tip": "3rd out by force? No run."
  },
  {
   "id": "rul7",
   "cat": "rul",
   "lvl": 3,
   "sit": {
    "inn": 3,
    "outs": 1,
    "b": [
     1,
     0,
     0
    ],
    "us": 0,
    "them": 0,
    "cnt": "",
    "you": "1"
   },
   "q": "You are the runner on first. A fair ground ball hits you before it gets past an infielder. What happens?",
   "opts": [
    "You are out, the ball is dead and the batter is awarded first base",
    "Nothing, play continues",
    "You are safe because you did not touch the ball on purpose"
   ],
   "ans": 0,
   "why": "A runner hit by a fair batted ball before it passes an infielder is out, even if it was an accident. The ball is dead, and the batter is awarded first base.",
   "tip": "Ball hits runner? Runner is out."
  },
  {
   "id": "iq6",
   "cat": "iq",
   "lvl": 3,
   "sit": {
    "inn": 7,
    "outs": 1,
    "b": [
     0,
     0,
     1
    ],
    "us": 4,
    "them": 4,
    "cnt": "",
    "you": "P"
   },
   "q": "Last inning, tie game, runner on third, one out. First base is open and a great hitter is up, with a weaker hitter behind him. What is a smart option?",
   "opts": [
    "Walk him on purpose to set up a force at every base",
    "Throw him a fat pitch and hope",
    "Pitch him carefully inside and risk a wild pitch"
   ],
   "ans": 0,
   "why": "With first base open, walking him puts a force on at every base, so a ground ball can be a force at home or a double play. You also get to face the weaker hitter next.",
   "tip": "First base open? A walk can help."
  },
  {
   "id": "iq7",
   "cat": "iq",
   "lvl": 3,
   "sit": {
    "inn": 7,
    "outs": 1,
    "b": [
     1,
     0,
     0
    ],
    "us": 5,
    "them": 3,
    "cnt": "",
    "you": "RF"
   },
   "q": "You are the right fielder in the last inning with a two-run lead and a runner on first. Where should you play?",
   "opts": [
    "Deeper, so nothing gets over your head",
    "Shallow, to throw out the runner on a single",
    "Wherever you like"
   ],
   "ans": 0,
   "why": "With a lead late in the game the biggest danger is a ball over your head that scores runs quickly. Playing deeper keeps everything in front of you and you give up only a single.",
   "tip": "Late with a lead? Keep it in front."
  },
  {
   "id": "sco1",
   "cat": "sco",
   "lvl": 1,
   "sit": {
    "inn": 3,
    "outs": 1,
    "b": [
     0,
     0,
     0
    ],
    "us": 2,
    "them": 2,
    "cnt": "",
    "you": "SS"
   },
   "q": "The shortstop fields a ground ball and makes a good throw to first, but the runner simply beats the throw. How is the play scored?",
   "opts": [
    "A hit (or fielder’s choice): no assist and no error",
    "An assist for the shortstop",
    "An error on the shortstop"
   ],
   "ans": 0,
   "why": "The runner was just faster than the throw, so the defense did nothing wrong. It is scored as a hit or fielder’s choice, and nobody gets an assist or an error.",
   "tip": "Beat the throw? No A, no E."
  },
  {
   "id": "sco2",
   "cat": "sco",
   "lvl": 2,
   "sit": {
    "inn": 5,
    "outs": 1,
    "b": [
     0,
     0,
     1
    ],
    "us": 3,
    "them": 4,
    "cnt": "",
    "you": "SS"
   },
   "q": "Runner on third. The shortstop fields a grounder and throws home, but the throw is wild and the runner scores. An accurate throw with ordinary effort would have gotten the out. How is it scored?",
   "opts": [
    "An error on the shortstop and no assist",
    "An assist for the shortstop",
    "No error: the runner just beat the throw"
   ],
   "ans": 0,
   "why": "If an accurate throw with ordinary effort would have gotten the out, the bad throw is an error. There is no assist because the throw did not help record an out.",
   "tip": "Wild throw, out was there? Error."
  },
  {
   "id": "sco3",
   "cat": "sco",
   "lvl": 2,
   "sit": {
    "inn": 6,
    "outs": 2,
    "b": [
     0,
     0,
     1
    ],
    "us": 4,
    "them": 4,
    "cnt": "",
    "you": "C"
   },
   "q": "The third baseman makes a good throw home that beats the runner, but the catcher drops the ball and the runner is safe. How is it scored?",
   "opts": [
    "An assist for the thrower and an error on the catcher",
    "An error on the thrower and no assist",
    "No assist and no error: it is a hit"
   ],
   "ans": 0,
   "why": "The thrower did his job: the throw beat the runner, so he earns the assist. The catcher should have held the ball, so the catcher gets the error.",
   "tip": "Good throw, ball dropped? A and E."
  },
  {
   "id": "sco4",
   "cat": "sco",
   "lvl": 3,
   "sit": {
    "inn": 7,
    "outs": 1,
    "b": [
     0,
     0,
     1
    ],
    "us": 5,
    "them": 5,
    "cnt": "",
    "you": "C"
   },
   "q": "Runner on third, one out. The shortstop fields a grounder and throws home. The catcher tags out the runner at the plate, but the batter reaches first. How are the fielders credited?",
   "opts": [
    "An assist for the shortstop and a putout for the catcher",
    "No credit for anyone because the batter reached base",
    "An error on the shortstop because the batter was safe"
   ],
   "ans": 0,
   "why": "An out was recorded at the plate, so the shortstop who threw gets an assist and the catcher who tagged the runner gets the putout. The batter is on with a fielder’s choice.",
   "tip": "Out at home: assist + putout."
  }
 ],
 "trivia": [
  {
   "id": "tv1",
   "cat": "Rules",
   "lvl": 1,
   "q": "How many outs does a team get in each half inning?",
   "opts": [
    "2",
    "3",
    "4"
   ],
   "ans": 1,
   "fact": "Three outs end the half inning, then the teams switch."
  },
  {
   "id": "tv2",
   "cat": "Rules",
   "lvl": 1,
   "q": "How many balls make a walk?",
   "opts": [
    "3",
    "4",
    "5"
   ],
   "ans": 1,
   "fact": "Ball four sends the batter to first base. Three strikes is a strikeout."
  },
  {
   "id": "tv3",
   "cat": "Fields",
   "lvl": 2,
   "q": "In Little League Majors, how far apart are the bases?",
   "opts": [
    "50 feet",
    "60 feet",
    "90 feet"
   ],
   "ans": 1,
   "fact": "Little League bases are 60 feet apart. Major League bases are 90 feet apart."
  },
  {
   "id": "tv4",
   "cat": "Fields",
   "lvl": 2,
   "q": "How far apart are the bases in Major League Baseball?",
   "opts": [
    "60 feet",
    "75 feet",
    "90 feet",
    "100 feet"
   ],
   "ans": 2,
   "fact": "The 90-foot basepaths have been standard in the majors since the 1800s."
  },
  {
   "id": "tv5",
   "cat": "Fun",
   "lvl": 2,
   "q": "How many double stitches does a baseball have?",
   "opts": [
    "72",
    "108",
    "216"
   ],
   "ans": 1,
   "fact": "A baseball has 108 double stitches. That is 216 stitches in all, sewn by hand."
  },
  {
   "id": "tv6",
   "cat": "History",
   "lvl": 2,
   "q": "Which player broke Major League Baseball’s color barrier in 1947?",
   "opts": [
    "Jackie Robinson",
    "Willie Mays",
    "Hank Aaron",
    "Roberto Clemente"
   ],
   "ans": 0,
   "fact": "Jackie Robinson debuted with the Brooklyn Dodgers on April 15, 1947. His number 42 is retired across all of baseball."
  },
  {
   "id": "tv7",
   "cat": "Records",
   "lvl": 3,
   "q": "Who holds the Major League record for career home runs?",
   "opts": [
    "Babe Ruth",
    "Hank Aaron",
    "Barry Bonds",
    "Willie Mays"
   ],
   "ans": 2,
   "fact": "Barry Bonds hit 762 home runs. Hank Aaron hit 755 and Babe Ruth hit 714."
  },
  {
   "id": "tv8",
   "cat": "Records",
   "lvl": 3,
   "q": "Which player played 2,632 games in a row, a record that stood for decades?",
   "opts": [
    "Lou Gehrig",
    "Cal Ripken Jr.",
    "Pete Rose"
   ],
   "ans": 1,
   "fact": "Cal Ripken Jr. broke Lou Gehrig’s streak of 2,130 games in 1995."
  },
  {
   "id": "tv9",
   "cat": "History",
   "lvl": 2,
   "q": "Which player was nicknamed “The Iron Horse”?",
   "opts": [
    "Lou Gehrig",
    "Ty Cobb",
    "Joe DiMaggio"
   ],
   "ans": 0,
   "fact": "Lou Gehrig played 2,130 straight games for the Yankees before illness ended his career."
  },
  {
   "id": "tv10",
   "cat": "Fun",
   "lvl": 2,
   "q": "Where is the Little League World Series played every August?",
   "opts": [
    "Cooperstown, New York",
    "Williamsport, Pennsylvania",
    "Omaha, Nebraska",
    "Cleveland, Ohio"
   ],
   "ans": 1,
   "fact": "Teams from around the world travel to Williamsport, Pennsylvania, each August."
  },
  {
   "id": "tv11",
   "cat": "Rules",
   "lvl": 3,
   "q": "What do we call a game in which no opposing batter reaches base at all?",
   "opts": [
    "A shutout",
    "A perfect game",
    "A no-hitter"
   ],
   "ans": 1,
   "fact": "A perfect game means no hits, walks, hit batters or errors allow anyone to reach."
  },
  {
   "id": "tv12",
   "cat": "Positions",
   "lvl": 1,
   "q": "Which two players make up the “battery”?",
   "opts": [
    "Pitcher and catcher",
    "Shortstop and second baseman",
    "First baseman and pitcher"
   ],
   "ans": 0,
   "fact": "The pitcher and catcher work together on every pitch."
  },
  {
   "id": "tv13",
   "cat": "Stats",
   "lvl": 2,
   "q": "What does ERA stand for?",
   "opts": [
    "Earned Run Average",
    "Every Run Allowed",
    "Extra Runs Added"
   ],
   "ans": 0,
   "fact": "ERA tells how many earned runs a pitcher allows per full game."
  },
  {
   "id": "tv14",
   "cat": "Stats",
   "lvl": 2,
   "q": "In a single game, what is it called when a batter strikes out four times?",
   "opts": [
    "A hat trick",
    "The golden sombrero",
    "The silver slugger"
   ],
   "ans": 1,
   "fact": "Three strikeouts is a hat trick. Four strikeouts is the golden sombrero."
  },
  {
   "id": "tv15",
   "cat": "Stats",
   "lvl": 3,
   "q": "To win baseball’s batting Triple Crown, a player must lead the league in batting average, home runs and what?",
   "opts": [
    "Stolen bases",
    "RBI",
    "Walks"
   ],
   "ans": 1,
   "fact": "The batting Triple Crown is highest average, most home runs and most runs batted in."
  },
  {
   "id": "tv16",
   "cat": "Fun",
   "lvl": 1,
   "q": "Which song is traditionally sung during the seventh-inning stretch?",
   "opts": [
    "Take Me Out to the Ball Game",
    "Sweet Caroline",
    "Centerfield"
   ],
   "ans": 0,
   "fact": "Fans have stood and sung it at ballparks for more than a century."
  },
  {
   "id": "tv17",
   "cat": "Fields",
   "lvl": 2,
   "q": "What is the famous left-field wall at Fenway Park called?",
   "opts": [
    "The Green Monster",
    "The Ivy Wall",
    "The Big Blue"
   ],
   "ans": 0,
   "fact": "Fenway Park, home of the Boston Red Sox, opened in 1912."
  },
  {
   "id": "tv18",
   "cat": "Equipment",
   "lvl": 2,
   "q": "Which award is given each year to the best defensive player at each position?",
   "opts": [
    "The Gold Glove",
    "The Silver Slugger",
    "The Cy Young"
   ],
   "ans": 0,
   "fact": "The Gold Glove honors fielding. The Silver Slugger honors hitting."
  },
  {
   "id": "tv19",
   "cat": "Rules",
   "lvl": 2,
   "q": "What happens to the runners when a pitcher commits a balk?",
   "opts": [
    "Each runner moves up one base",
    "The batter walks",
    "The pitch is replayed"
   ],
   "ans": 0,
   "fact": "A balk is an illegal pitching motion. Every runner advances one base."
  },
  {
   "id": "tv20",
   "cat": "Positions",
   "lvl": 1,
   "q": "How many players does a team have on the field on defense?",
   "opts": [
    "8",
    "9",
    "10"
   ],
   "ans": 1,
   "fact": "Pitcher, catcher, four infielders and three outfielders make nine."
  },
  {
   "id": "tv21",
   "cat": "History",
   "lvl": 1,
   "q": "Which slugger was known as “The Bambino” and “The Sultan of Swat”?",
   "opts": [
    "Babe Ruth",
    "Ted Williams",
    "Mickey Mantle"
   ],
   "ans": 0,
   "fact": "Babe Ruth began his career as a pitcher before becoming baseball’s biggest home run hitter."
  },
  {
   "id": "tv22",
   "cat": "Rules",
   "lvl": 1,
   "q": "When a batter is hit by a pitch and did not swing, what does he get?",
   "opts": [
    "A ball",
    "First base",
    "A strike",
    "Nothing"
   ],
   "ans": 1,
   "fact": "The batter is awarded first base if he tried to avoid the pitch."
  },
  {
   "id": "tv23",
   "cat": "Rules",
   "lvl": 1,
   "q": "How many bases are on a baseball field, counting home plate?",
   "opts": [
    "3",
    "4",
    "5"
   ],
   "ans": 1,
   "fact": "First, second, third and home make four."
  },
  {
   "id": "tv24",
   "cat": "Rules",
   "lvl": 1,
   "q": "What do we call a hit that lets the batter stand safely on second base?",
   "opts": [
    "A single",
    "A double",
    "A triple"
   ],
   "ans": 1,
   "fact": "Single is first base, double is second, triple is third and a home run scores everyone."
  },
  {
   "id": "tv25",
   "cat": "Equipment",
   "lvl": 1,
   "q": "What does the catcher wear to protect his face?",
   "opts": [
    "A mask",
    "A visor",
    "A batting helmet only"
   ],
   "ans": 0,
   "fact": "Catchers also wear a chest protector and shin guards, called the tools of ignorance."
  },
  {
   "id": "tv26",
   "cat": "Rules",
   "lvl": 3,
   "q": "A batter swings and misses strike three, but the catcher drops the ball and the batter reaches first. How is it scored for the pitcher?",
   "opts": [
    "A strikeout",
    "A walk",
    "A passed ball only"
   ],
   "ans": 0,
   "fact": "The pitcher still gets credit for the strikeout, even though the batter reached base."
  },
  {
   "id": "tv27",
   "cat": "History",
   "lvl": 3,
   "q": "Who was the first player elected unanimously to the Baseball Hall of Fame?",
   "opts": [
    "Mariano Rivera",
    "Derek Jeter",
    "Ken Griffey Jr.",
    "Cal Ripken Jr."
   ],
   "ans": 0,
   "fact": "Mariano Rivera received every vote in 2019."
  },
  {
   "id": "tv28",
   "cat": "History",
   "lvl": 3,
   "q": "Who threw the only perfect game in World Series history?",
   "opts": [
    "Don Larsen",
    "Sandy Koufax",
    "Roy Halladay",
    "Cy Young"
   ],
   "ans": 0,
   "fact": "Don Larsen did it for the Yankees in Game 5 of the 1956 World Series."
  },
  {
   "id": "tv29",
   "cat": "Stats",
   "lvl": 3,
   "q": "A batter goes 2-for-4 with a double and a single. What is his slugging percentage for the game?",
   "opts": [
    ".500",
    ".750",
    ".600"
   ],
   "ans": 1,
   "fact": "Total bases are 2 + 1 = 3, and 3 divided by 4 at bats is .750."
  },
  {
   "id": "tv30",
   "cat": "Stats",
   "lvl": 3,
   "q": "Which of these is NOT counted in the denominator of on-base percentage?",
   "opts": [
    "Sacrifice bunts",
    "Sacrifice flies",
    "Walks",
    "At bats"
   ],
   "ans": 0,
   "fact": "On-base percentage divides by at bats, walks, hit by pitch and sacrifice flies. Sacrifice bunts are left out."
  },
  {
   "id": "tv31",
   "cat": "Stats",
   "lvl": 3,
   "q": "In a 6-inning game, a pitcher allows 2 earned runs in 3 innings. What is his ERA?",
   "opts": [
    "2.00",
    "4.00",
    "6.00"
   ],
   "ans": 1,
   "fact": "2 earned runs x 6 innings, divided by 3 innings pitched, is 4.00."
  },
  {
   "id": "tv32",
   "cat": "Records",
   "lvl": 3,
   "q": "Which pitcher holds the Major League record for career strikeouts?",
   "opts": [
    "Nolan Ryan",
    "Randy Johnson",
    "Roger Clemens",
    "Walter Johnson"
   ],
   "ans": 0,
   "fact": "Nolan Ryan struck out 5,714 batters over 27 seasons."
  }
 ],
 "quizzes": [
  {
   "id": "qz1",
   "title": "Baseball Basics",
   "desc": "Five quick questions for brand-new ballplayers.",
   "questions": [
    {
     "q": "How many strikes make a strikeout?",
     "opts": [
      "2",
      "3",
      "4"
     ],
     "ans": 1,
     "why": "Three strikes and the batter is out."
    },
    {
     "q": "How many players are on the field for the defense?",
     "opts": [
      "8",
      "9",
      "11"
     ],
     "ans": 1,
     "why": "Nine: pitcher, catcher, four infielders and three outfielders."
    },
    {
     "q": "A runner scores a run when he safely touches which base last?",
     "opts": [
      "First base",
      "Third base",
      "Home plate"
     ],
     "ans": 2,
     "why": "He must touch all four bases in order, finishing at home plate."
    },
    {
     "q": "Who stands behind home plate and catches the pitches?",
     "opts": [
      "The shortstop",
      "The catcher",
      "The umpire only"
     ],
     "ans": 1,
     "why": "The catcher also calls pitches and blocks balls in the dirt."
    },
    {
     "q": "A fielder catches a fly ball before it touches the ground. What happens?",
     "opts": [
      "The batter is out",
      "The batter gets a single",
      "It is a foul ball"
     ],
     "ans": 0,
     "why": "A fair or foul fly ball caught in the air is an out."
    }
   ]
  },
  {
   "id": "qz2",
   "title": "Rules Challenge",
   "desc": "Test your rules knowledge, from rookie to pro.",
   "questions": [
    {
     "q": "What is a force out?",
     "opts": [
      "A tag out at home plate",
      "An out made when a runner must advance and the fielder with the ball touches the base first",
      "An out on a strikeout"
     ],
     "ans": 1,
     "why": "A runner is forced when the batter becomes a runner and takes the base behind him."
    },
    {
     "q": "Runners on first and second, nobody out, and a high pop-up the infielder can catch easily. What rule is called?",
     "opts": [
      "Balk",
      "Infield fly",
      "Obstruction"
     ],
     "ans": 1,
     "why": "The infield fly rule makes the batter out right away so the defense cannot trick the runners."
    },
    {
     "q": "What must a runner do on a fly ball that is caught?",
     "opts": [
      "Touch the next base",
      "Tag up on his base after the catch before advancing",
      "Return to home plate"
     ],
     "ans": 1,
     "why": "Runners must keep or return to the base and leave only after the ball is caught."
    },
    {
     "q": "Strike three is dropped by the catcher with first base empty. What can the batter do?",
     "opts": [
      "Nothing, he is out",
      "Run to first base",
      "Take a walk"
     ],
     "ans": 1,
     "why": "In most leagues the batter may run, and is out if he is tagged or thrown out. Check your league rules."
    },
    {
     "q": "A pitcher makes an illegal motion with runners on base. This is a:",
     "opts": [
      "Balk",
      "Wild pitch",
      "Passed ball"
     ],
     "ans": 0,
     "why": "On a balk, every runner moves up one base."
    }
   ]
  }
 ],
 "kb": [
  {
   "id": "batting-average",
   "cat": "Stats",
   "title": "How batting average works",
   "summary": "The number that says how often a hitter gets a hit.",
   "body": "Batting average (AVG) is hits divided by at bats.\n\n**AVG = Hits ÷ At bats**\n\nIf you get 3 hits in 10 at bats, your average is 3 ÷ 10 = .300.\n\n## What does not count as an at bat\n\n- Walks\n- Hit by pitch\n- Sacrifice flies and sacrifice bunts\n- Catcher’s interference\n\nThat is why a walk never lowers your batting average. A .300 hitter is very good at any level."
  },
  {
   "id": "obp-slg-ops",
   "cat": "Stats",
   "title": "OBP, SLG and OPS in plain English",
   "summary": "Three stats that show how valuable a hitter is.",
   "body": "**On-base percentage (OBP)** shows how often you reach base. It counts hits, walks and hit by pitch.\n\n**Slugging percentage (SLG)** shows how much power you have. A single counts 1, a double 2, a triple 3 and a home run 4, divided by at bats.\n\n**OPS** is simply OBP plus SLG. It is a quick way to see the whole hitter.\n\nPatient hitters who draw walks can have a great OBP even with a modest average."
  },
  {
   "id": "how-era-works",
   "cat": "Stats",
   "title": "How ERA is figured",
   "summary": "Why unearned runs do not count against a pitcher.",
   "body": "Earned run average (ERA) is how many earned runs a pitcher allows per full game.\n\n**ERA = Earned runs × innings in a game ÷ innings pitched**\n\nYouth games are often 6 innings, so use 6 where a major league game would use 9.\n\n## Earned or unearned?\n\nA run is **unearned** if it scores because of an error or a passed ball. Unearned runs do not count in ERA, because the pitcher is not fully to blame.\n\nExample: 2 earned runs in 4 innings of a 6-inning game is 2 × 6 ÷ 4 = 3.00."
  },
  {
   "id": "what-is-an-at-bat",
   "cat": "Stats",
   "title": "What counts as an at bat?",
   "summary": "A quick guide to the plate appearances that do and do not count.",
   "body": "Every time you step up to hit is a **plate appearance**. Only some count as an **at bat**.\n\n## These are at bats\n\n- Hits\n- Outs on balls in play\n- Strikeouts\n- Reaching on an error or fielder’s choice\n\n## These are not at bats\n\n- Walks\n- Hit by pitch\n- Sacrifice flies\n- Sacrifice bunts\n- Catcher’s interference\n\nSacrifices help the team, so they never hurt your average."
  },
  {
   "id": "infield-fly-rule",
   "cat": "Rules",
   "title": "The infield fly rule, explained",
   "summary": "Why the batter is out on some easy pop-ups.",
   "body": "The infield fly rule applies with fewer than two outs and runners on first and second, or the bases loaded.\n\nWhen a fair fly ball can be caught by an infielder with ordinary effort, the umpire calls **infield fly**. The batter is out right away, even if the ball is dropped.\n\n## Why it exists\n\nWithout the rule, a fielder could drop the ball on purpose and turn an easy double play.\n\nRunners may still advance at their own risk, but they are not forced to run."
  },
  {
   "id": "arm-care",
   "cat": "Pitching & arm care",
   "title": "Arm care for young pitchers",
   "summary": "Simple habits that protect a growing arm.",
   "body": "A young arm is still growing, so protect it.\n\n- Warm up before you throw and stretch afterward\n- Follow your league’s pitch-count and rest-day rules, every time\n- Never pitch through pain. Tell your coach right away\n- Take time off from throwing during the year\n- Avoid pitching for two teams on the same days\n- Learn good mechanics before you throw harder\n\nPain, tightness or a tired arm are warning signs. Rest is part of training. If something keeps hurting, talk to a parent and a doctor."
  },
  {
   "id": "who-covers-what",
   "cat": "Fielding",
   "title": "Who covers what? Basic fielding jobs",
   "summary": "A starter guide to where each fielder goes on common plays.",
   "body": "Great teams know their jobs before the pitch.\n\n- **Ground ball to the first baseman, pulled off the bag:** the pitcher runs over to cover first\n- **Wild pitch or passed ball with a runner on third:** the pitcher covers home plate\n- **Ground ball to the infield with no one on:** the right fielder backs up first base\n- **Fly ball to the outfield:** the fielder who is best placed calls it loudly, and others back off\n\nBefore every pitch, ask yourself: how many outs, where are the runners, and where will I throw?"
  },
  {
   "id": "parents-guide",
   "cat": "For parents",
   "title": "How parents can help (without the pressure)",
   "summary": "Simple ways to support your ballplayer.",
   "body": "Kids play their best when baseball is fun.\n\n- Cheer effort and teamwork, not just results\n- Let the coach coach. Save advice for the car ride home, and keep it short\n- Ask “What was your favorite part?” before asking about stats\n- Help your player track their own stats, and celebrate small improvements\n- Make sure they eat, sleep and rest their arm\n\n## Staying private online\n\nUse a first name or nickname in Plate 450 Diary and share player cards only with family and friends you trust."
  }
 ],
 "glossary": [
  {
   "id": "ab-at-bat",
   "term": "AB (at bat)",
   "def": "A turn at bat that ends in a hit, an out or an error. Walks and sacrifices do not count."
  },
  {
   "id": "avg-batting-average",
   "term": "AVG (batting average)",
   "def": "Hits divided by at bats."
  },
  {
   "id": "balk",
   "term": "Balk",
   "def": "An illegal move by the pitcher with runners on base. Every runner advances one base."
  },
  {
   "id": "battery",
   "term": "Battery",
   "def": "The pitcher and the catcher."
  },
  {
   "id": "bb-base-on-balls",
   "term": "BB (base on balls)",
   "def": "A walk: four balls, and the batter takes first base."
  },
  {
   "id": "bunt",
   "term": "Bunt",
   "def": "Tapping the ball softly in front of the plate instead of swinging."
  },
  {
   "id": "cutoff",
   "term": "Cutoff",
   "def": "An infielder who lines up between an outfielder and a base to take a throw and redirect it."
  },
  {
   "id": "double-play",
   "term": "Double play",
   "def": "A play that gets two outs at once."
  },
  {
   "id": "er-earned-run",
   "term": "ER (earned run)",
   "def": "A run that scores without the help of an error or passed ball."
  },
  {
   "id": "era",
   "term": "ERA",
   "def": "Earned run average: earned runs allowed per full game."
  },
  {
   "id": "error",
   "term": "Error",
   "def": "A mistake by a fielder that lets a batter or runner reach or advance when a normal play would have made an out."
  },
  {
   "id": "fair-ball",
   "term": "Fair ball",
   "def": "A batted ball that stays inside the foul lines."
  },
  {
   "id": "fielder-s-choice",
   "term": "Fielder’s choice",
   "def": "When a fielder makes an out on another runner instead of the batter, and the batter reaches base."
  },
  {
   "id": "force-out",
   "term": "Force out",
   "def": "An out made when a runner must advance and the fielder with the ball touches the base first."
  },
  {
   "id": "foul-ball",
   "term": "Foul ball",
   "def": "A batted ball that lands outside the foul lines. It counts as a strike unless there are already two strikes."
  },
  {
   "id": "hbp-hit-by-pitch",
   "term": "HBP (hit by pitch)",
   "def": "A batter struck by a pitch who tried to get out of the way earns first base."
  },
  {
   "id": "infield-fly",
   "term": "Infield fly",
   "def": "A pop-up an infielder can catch with ordinary effort, called by the umpire with runners on first and second or the bases loaded and fewer than two outs. The batter is out."
  },
  {
   "id": "obp-on-base-percentage",
   "term": "OBP (on-base percentage)",
   "def": "How often a batter reaches base by hit, walk or hit by pitch."
  },
  {
   "id": "ops",
   "term": "OPS",
   "def": "On-base percentage plus slugging percentage."
  },
  {
   "id": "passed-ball",
   "term": "Passed ball",
   "def": "A pitch the catcher should have caught that lets runners advance."
  },
  {
   "id": "rbi",
   "term": "RBI",
   "def": "Run batted in: a run that scores because of your at bat."
  },
  {
   "id": "sacrifice-fly",
   "term": "Sacrifice fly",
   "def": "A fly ball caught for an out that lets a runner tag up and score. It does not count as an at bat."
  },
  {
   "id": "sb-stolen-base",
   "term": "SB (stolen base)",
   "def": "When a runner advances to the next base while the pitcher is delivering the pitch, without the help of a hit, walk or error."
  },
  {
   "id": "slg-slugging-percentage",
   "term": "SLG (slugging percentage)",
   "def": "Total bases divided by at bats. It measures power."
  },
  {
   "id": "strike-zone",
   "term": "Strike zone",
   "def": "The area over home plate where a pitch is a strike if the batter does not swing."
  },
  {
   "id": "tag-up",
   "term": "Tag up",
   "def": "Keeping a foot on a base until a fly ball is caught, then advancing."
  },
  {
   "id": "walk-off",
   "term": "Walk-off",
   "def": "A hit or run that ends the game in the home team’s last turn at bat."
  },
  {
   "id": "wild-pitch",
   "term": "Wild pitch",
   "def": "A pitch so far off target that the catcher cannot reasonably stop it, allowing runners to advance."
  }
 ],
 "directory": []
}; })(typeof window !== "undefined" ? window : (typeof module === "object" && module.exports ? module.exports : this));
