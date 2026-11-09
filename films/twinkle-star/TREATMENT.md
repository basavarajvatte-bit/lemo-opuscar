# Twinkle Star — treatment

Style: Crayon Picture Book (`styles/crayon-book/STYLE.md`). Vertical 1080×1920, 24 fps, ~25 s, YouTube Shorts.
Audience: young children (USA). Language: English. Voice: Kokoro, warm young American voice, slow and clear.
Text: "Twinkle, Twinkle, Little Star", first verse (Jane Taylor, 1806, public domain).

## 1. Three candidate structures

1. **Colouring-book page.** Every outline is on the page from frame one; each line of the verse colours one area (hill, pyjamas, star, sky). Clear, but static, and the child would be "finished" late, which hurts lip-sync.
2. **Night falls on one page (chosen).** A blank page; the crayon draws a child on a little hill in three seconds. The child recites. On "little star" one big lemon star is drawn into the sky. On "Up above the world so high" the camera pulls back to the whole page; on "Like a diamond in the sky" an ultramarine wash sweeps down the sky and dozens of white-wax stars, hidden on the paper from the first frame, appear through it. The last couplet pushes back in; the big star gets a face and winks back. The child yawns, the music box plays the whole tune once and winds down.
3. **Flip book.** One page per couplet (day, dusk, night), joined by page turns. Three settings in 25 s is too busy for small children and the turns steal time from the words.

Why 2: one page, one turn (day paper → night sky), and the style's best native move (wax resist) lands on the word "diamond", which is exactly what the line is about. The child stays big and facing us the whole time, so the mouth can be read.

## 2. Logline and arc

A small crayon child on a crayon hill says the rhyme to the sky, and the sky answers by filling with stars.
- Setup (0–3 s): blank paper, the child draws itself on and waves.
- Development (3–13 s): first couplet, the big star appears; the camera pulls back as the child looks up.
- Turn (13–15 s): the night wash sweeps the sky; hidden stars glitter on.
- Ending (15–25 s): the opening couplet again, now under a full night sky; the big star winks; the child yawns; music box winds down.

## 3. Benchmark

- Picture-book bedtime animation with hand-textured, boiling frames and one held lullaby passage (grammar from Raymond Briggs-era hand-drawn TV specials).
  Learn: still background, living figure; one tune held back and heard in full once; tender pacing.
  Don't take: any character, song, shot or design.
- Preschool sing-along videos: words written large, one line at a time, in sync with the voice.
  Learn: word-by-word reveal, lots of bare space, slow speech. Don't take: bright vector look, bouncing ball.

## 4. Shot list

| # | Time | Framing | Move | Why |
|---|---|---|---|---|
| 1 | 0.0–3.2 | Medium full on the child (head to feet), centre | locked, then a small push | the child drawing itself is the hook |
| 2 | 3.2–9.0 | Medium close (head + chest), star top-right | slow push, then locked | "this one": we meet the child, mouth big |
| 3 | 9.0–15.4 | Full page: sky top 60 %, child bottom 40 % | pull out (tilt along the gaze) then held wide | the sky is the subject; wash needs the whole page |
| 4 | 15.4–21.6 | Medium full, star in frame | slow push back in | return to the child, rhyme repeats |
| 5 | 21.6–25.5 | Same, drifts up a little toward the star | gentle drift | star winks, goodnight beat, music box ends |

Camera moves: push, pull-out/tilt, held wide, push, drift. Transitions: drawing on, the wash. No dissolves.

## 5. Beat sheet (approximate; locked to voice timings in `timeline.js`)

- 0.0 bare paper, crayon foley; 0.2–1.6 outline of child + hill draws on; 1.6–2.6 colouring (pyjamas, hair, cheeks); 2.6 child waves; music box pickup.
- 3.2 "Twinkle, twinkle, little star," — on "star" the lemon star draws on, top right; child points up.
- 6.0 "How I wonder what you are!" — head tilt, curious pose.
- 9.0 "Up above the world so high," — camera pulls out; child's arms rise high.
- 12.0 "Like a diamond in the sky." — 12.3–14.6 ultramarine wash sweeps down; white-wax stars appear, one glockenspiel note per few stars.
- 14.8 silence beat (breath), boil halves.
- 15.4 "Twinkle, twinkle, little star," — push in; big star grows a face.
- 18.4 "How I wonder what you are!" — child hugs self, smiles.
- 21.6 star winks (glock ding); child yawns (bassoon low note), music box plays the tune and droops; 25.5 end.

## 6. Cue map

- Tempo 84 bpm (a beat = 0.714 s), 4/4, bar = 2.857 s. Lilt in 6/8 feel on ukulele-like plucks (pluck.py) and music box.
- Bars 1 (0–2.9): crayon foley + music-box pickup. Bars 2–7: soft ukulele chords I–IV–I–V under each spoken line (C major), music ducked 10 dB under voice.
- Wash (12.3 s): glockenspiel sparkles across the stars, rising.
- 14.8–15.4: near-silence (only crickets).
- Bars 8–9: ukulele returns; 21.6: music box plays the melody in full (the held-back theme), last note pitch droops (wind-down).

## 7. Sound design

| Section | Ambience | Foley | Music |
|---|---|---|---|
| Draw-on 0–3.2 | room tone | crayon stick-slip scribbles, colouring swishes | music-box pickup |
| Couplet 1 | room tone, faint birds | crayon on the star | ukulele lilt, ducked |
| Couplet 2 | crickets fade in | wet brush (panned with the band) | glockenspiel sparkles |
| Breath 14.8 | crickets only | – | silence |
| Couplet 3 | crickets | felt puff for the star face | ukulele |
| Ending | crickets | wink ding, yawn | music box full tune, wind-down |

## 8. Subtitle & title design

The printed words of the book: Patrick Hand, ~92 px (vertical frame, read on a phone by small children), plum outline colour, on a ragged paper knock-out at the bottom of the frame. Each couplet stays on screen; each word writes itself on letter by letter as it is spoken (word timings from Whisper). No separate title card: the first line is the title.

Crayon box (10): plum line, lemon, marigold, peach skin, rose cheeks, teal pyjamas, mint hill, olive grass streaks, chestnut hair, white (resist). Watercolour: ultramarine (night).
