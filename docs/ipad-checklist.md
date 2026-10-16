# iPad checklist

What only a real iPad can show. Everything else is covered by the automated tests (`README.md`, "Test it").

## Set up

On the computer, start the games on your network:

```bash
python tools/devserver.py 8642 --lan
```

Open the address it prints in Safari on the iPad (same Wi-Fi), with the iPad held sideways.

Install and offline play (step 9) need the site served over HTTPS, so do that step after deploying (README, "Deploy it").

## Checks

1. **Sharp and fitted.** The menu cards, the cat and the story scenes look crisp, not soft. Nothing is cut off at the edges, in Safari and once installed to the Home Screen; the scenery carries on past the games' edges instead of leaving bars.
2. **The font.** Words are in the rounded Fredoka font, and a and g are written the school way (one loop), not a plain system font.
3. **Sound and the narrator.**
   - Every prompt, story and bit of praise is in the recorded voice (Sarah), never the iPad's built-in one; "Help please" is the younger voice (Liam), and in Music Maker and on the photo wall its hint follows it instead of cutting it off.
   - Right answers pop, chime and speak; wrong answers are silent, with the hourglass pause.
   - In Feelings, each story is heard to the end before "How does he feel?", for every story.
   - Word Builder: after a level-up, "Level up!" is heard after "… Great job!". Counting Time: tapping quickly, no number is cut off.
   - With the music on, the voice is clear over it (the music dips while it talks), and the voice is about as loud as the sound effects.
   - Interrupt it: pull down Control Center and dismiss it, swipe to another app and back. Sounds and the voice both come back without reloading.
4. **Dragging.** In Sort It, Word Builder, Math Bubbles, Counting, Feelings and both puzzles, a dragged picture stays under the finger all the way, and lands where it's let go. Pull down Control Center in the middle of a drag: the piece glides back and nothing counts as an answer.
5. **The cat.** It waves on the menu, cheers a right answer, and points while Help is showing a hint. It never does anything after a wrong answer. In Copy Cat the big cat plays the pattern and the corner cat isn't there.
6. **Each game once.** Play a round of all twelve: every one shows its scene, Help gives a real hint, and Home then the same game again within a second starts cleanly (no doubled round or speech).
7. **Memory.** Play 20 puzzles in a row (Puzzle Builder, then Picture Puzzle with different photos). Nothing slows down, and the page doesn't reload by itself.
8. **Reduce Motion.** Turn it on (Settings, Accessibility, Motion). No confetti, no bobbing bubbles, no flying star; hints still show (a steady glow).
9. **Install and offline** (over HTTPS). Share, then Add to Home Screen. Open it from the icon: it fills the screen. Turn on Airplane Mode, close the app fully, and open it again: every game plays, including Picture Puzzle with its photos.

## If something's off

Note the step, what you expected and what happened, ideally with a screenshot or screen recording, and the iPad model and iPadOS version (Settings, General, About).
