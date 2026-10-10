/* =========================================================
   WHIM — question + option list + spin logic
   ---------------------------------------------------------
   Handles the decision question, adding and removing
   options, and spinning the wheel to pick a random winner.
   ========================================================= */


/* =========================================================
   1. THE DATA
   ---------------------------------------------------------
   `options` is an ARRAY: an ordered list of values held in
   one variable. It is the single source of truth for what
   the user has added.

   After adding "Pizza" then "Sushi" it looks like this:
       options = ["Pizza", "Sushi"]

   We use const because we never re-assign the variable.
   We still change its CONTENTS with push() and splice().
   ========================================================= */
const options = [];

// What the user is trying to decide, e.g. "Where should we go for the
// holiday?". It is read from the question input box and kept up to date
// by the "input" listener near the bottom of this file.
// An empty string means the user hasn't typed a question.
let question = "";

// The option that won the most recent spin.
// `let` (not const) because it gets replaced on every spin.
// It starts as null, which means "no spin has happened yet".
let winner = null;

// --- Wheel state ---

// The TOTAL degrees the wheel has turned since the page loaded.
// We keep a running total rather than resetting to 0 each spin, so
// every spin turns further than the last one and the wheel never
// visibly jumps backwards.
let currentRotation = 0;

// True while the wheel is animating. Used to block a second spin.
let isSpinning = false;

// How long a spin takes, in milliseconds. This MUST match the
// "transition: transform 4s" duration in style.css.
const SPIN_DURATION = 4000;

// Holds the safety-net timer for the current spin (see spinWheel).
let spinTimer = null;

// Slice colours, used in order. If there are more options than colours
// we simply start again from the top of the list.
const WHEEL_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#0ea5e9",
  "#ef4444",
  "#14b8a6",
];


/* =========================================================
   2. GRAB THE HTML ELEMENTS WE NEED
   ---------------------------------------------------------
   document.getElementById("x") finds the element whose
   id is "x". We save them in variables so we don't have to
   search the page again every time a function runs.
   ========================================================= */
const input = document.getElementById("option-input");
const addButton = document.getElementById("add-button");
const list = document.getElementById("options-list");
const emptyMessage = document.getElementById("empty-message");
const message = document.getElementById("message");
const spinButton = document.getElementById("spin-button");
const result = document.getElementById("result");
const wheel = document.getElementById("wheel");
const wheelLabels = document.getElementById("wheel-labels");
const questionInput = document.getElementById("question-input");
const resultQuestion = document.getElementById("result-question");


/* =========================================================
   3. showMessage()
   ---------------------------------------------------------
   Displays a short feedback line under the input, then
   clears it automatically so it doesn't linger forever.
   ========================================================= */
function showMessage(text) {
  message.textContent = text;

  // setTimeout runs the function once, after 2000ms (2 seconds).
  setTimeout(function () {
    message.textContent = "";
  }, 2000);
}


/* =========================================================
   4. addOption()
   ---------------------------------------------------------
   Runs when the user clicks "Add" or presses Enter.
   It validates the text, stores it, then redraws.
   ========================================================= */
function addOption() {
  // .trim() removes whitespace from the start and end,
  // so "   pizza  " becomes "pizza".
  const value = input.value.trim();

  // --- Guard 1: reject an empty entry ---
  if (value === "") {
    showMessage("Type something first.");
    return; // return = stop running this function right here
  }

  // --- Guard 2: reject duplicates, ignoring upper/lower case ---
  // .some() asks: "does ANY item in the array match?" and gives
  // back true or false.
  const isDuplicate = options.some(function (option) {
    // .toLowerCase() makes the comparison case-insensitive,
    // so "Pizza" and "pizza" count as the same thing.
    return option.toLowerCase() === value.toLowerCase();
  });

  if (isDuplicate) {
    showMessage("That option is already in the list.");
    return;
  }

  // --- Passed both checks ---
  options.push(value); // push() adds an item to the END of the array
  input.value = "";    // clear the text box
  input.focus();       // put the cursor back, ready for the next entry

  render();            // redraw the list so the new option appears
}


/* =========================================================
   5. removeOption(index)
   ---------------------------------------------------------
   Deletes one option from the array.
   `index` is its position: 0 = first item, 1 = second, etc.
   (Computers count from 0, not 1.)
   ========================================================= */
function removeOption(index) {
  // splice(index, 1) means: "starting at `index`, remove 1 item".
  options.splice(index, 1);

  render(); // redraw so the removed row disappears
}


/* =========================================================
   6. render()
   ---------------------------------------------------------
   Rebuilds the visible <ul> from scratch, using the options
   array as the blueprint. It never reads the existing HTML —
   it only ever looks at `options`.
   ========================================================= */
function render() {
  // Step 1: clear out whatever is currently in the list.
  // Setting innerHTML to "" deletes all children.
  list.innerHTML = "";

  // Step 2: build one <li> for each option.
  // .forEach() runs the function once per array item, and
  // hands us both the item and its index.
  options.forEach(function (option, index) {
    // createElement() builds a brand-new HTML element in memory.
    const li = document.createElement("li");

    // The option's text. We use textContent (not innerHTML) so
    // that any < or & the user types is shown as plain text.
    const label = document.createElement("span");
    label.textContent = option;

    // A small remove button for this row.
    const removeButton = document.createElement("button");
    removeButton.textContent = "✕";
    removeButton.type = "button"; // so it never acts like a submit button
    removeButton.className = "remove-button";
    removeButton.title = "Remove " + option; // tooltip on hover

    // When this button is clicked, remove THIS row.
    // The `index` value is remembered by this function, so each
    // button correctly refers to its own option.
    removeButton.addEventListener("click", function () {
      removeOption(index);
    });

    // Assemble the row: <li> <span>text</span> <button>✕</button> </li>
    li.appendChild(label);
    li.appendChild(removeButton);

    // Then attach the finished row to the list.
    list.appendChild(li);
  });

  // Step 3: show the "No options yet" hint only when list is empty.
  if (options.length === 0) {
    emptyMessage.style.display = "block";
  } else {
    emptyMessage.style.display = "none";
  }

  // Step 4: draw the wheel too. Because render() already runs after
  // every add and remove, this keeps the wheel permanently in sync
  // with the list without any extra wiring.
  renderWheel();
}


/* =========================================================
   7. renderWheel()
   ---------------------------------------------------------
   Paints the circle from the `options` array: one equal slice
   per option, plus that option's text on its slice.
   Same principle as render() — the array is the blueprint.
   ========================================================= */
function renderWheel() {
  // Start from a clean slate every time.
  wheelLabels.innerHTML = "";

  // --- Fewer than 2 options: a plain placeholder circle ---
  if (options.length < 2) {
    wheel.classList.add("wheel--empty");
    wheel.style.background = ""; // hand styling back to the CSS class
    return;
  }
  wheel.classList.remove("wheel--empty");

  // How many degrees each slice gets.
  // 360 degrees / 4 options = 90 degrees each.
  const sliceAngle = 360 / options.length;

  // A conic-gradient is built from colour "stops" written as:
  //   "#6366f1 0deg 90deg, #8b5cf6 90deg 180deg, ..."
  // meaning "from 0deg to 90deg use the first colour", and so on.
  const stops = [];

  options.forEach(function (option, index) {
    // Where this slice starts and ends, measured clockwise from the top.
    const start = index * sliceAngle;
    const end = start + sliceAngle;

    // Reuse the colour palette, wrapping around if there are more
    // options than colours. The % (remainder) operator does the wrapping.
    const colour = WHEEL_COLORS[index % WHEEL_COLORS.length];

    stops.push(colour + " " + start + "deg " + end + "deg");

    // --- The text label for this slice ---
    const label = document.createElement("div");
    label.className = "wheel__label";

    // Tell CSS which way to rotate this label: to the MIDDLE of its slice.
    // CSS reads this custom property in the rotate() rules.
    label.style.setProperty("--angle", start + sliceAngle / 2 + "deg");

    // The span is counter-rotated in CSS so the text stays upright.
    const span = document.createElement("span");
    span.textContent = option;
    label.appendChild(span);

    wheelLabels.appendChild(label);
  });

  // Paint the slices. A conic-gradient starts at 12 o'clock and sweeps
  // clockwise, which is exactly how the angles above were measured —
  // so slice 0 begins right under the pointer.
  wheel.style.background = "conic-gradient(" + stops.join(", ") + ")";
}


/* =========================================================
   8. spinWheel()
   ---------------------------------------------------------
   Runs when the user clicks "Spin". It picks the winner FIRST,
   then works out how far to turn the wheel so that winner ends
   up under the pointer. CSS does the actual animating.
   ========================================================= */
function spinWheel() {
  // A spin needs at least two things to choose between.
  // With 0 or 1 options there is nothing random about the answer.
  if (options.length < 2) {
    showMessage("Add at least 2 options to spin.");
    return; // stop running this function right here
  }

  // Ignore extra clicks if a spin is already in progress.
  if (isSpinning) {
    return;
  }

  // --- Step 1: pick the winner (the same random logic as before) ---
  //   Math.random()      -> a decimal from 0 up to (but not including) 1
  //   * options.length   -> stretches that to cover the array
  //   Math.floor()       -> rounds down to a valid array position
  const index = Math.floor(Math.random() * options.length);
  winner = options[index];

  // --- Step 2: find the angle of the MIDDLE of the winner's slice ---
  // Slice 0 runs from 0deg to sliceAngle, slice 1 from sliceAngle to
  // 2 x sliceAngle, and so on. So the middle of slice `index` sits at:
  const sliceAngle = 360 / options.length;
  const winnerCentre = index * sliceAngle + sliceAngle / 2;

  // --- Step 3: work out where the wheel has to end up ---
  // The pointer is fixed at the top, which we treat as 0deg. Rotating the
  // wheel by R moves a point that was at angle `a` to angle `a + R`, so to
  // bring `winnerCentre` to 0deg we need R to be -winnerCentre.
  //
  // Negative angles are awkward to read, and "360 - x" gives the same
  // position going forwards. The % 360 keeps the answer in 0..359.
  const landingAngle = (360 - winnerCentre) % 360;

  // --- Step 4: how much further from where the wheel is now? ---
  // currentRotation is always positive, so % 360 is its angle within
  // the current turn — like the hand of a clock at 3 o'clock.
  const currentAngle = currentRotation % 360;

  // The extra turn needed to reach the landing angle...
  let delta = landingAngle - currentAngle;

  // ...going forwards. If the landing angle is "behind" us, loop past 360.
  if (delta < 0) {
    delta = delta + 360;
  }

  // --- Step 5: add 4 or 5 extra full turns for drama ---
  // Math.floor(Math.random() * 2) gives 0 or 1, so this is 4 or 5.
  const extraTurns = 4 + Math.floor(Math.random() * 2);

  // --- Step 6: update the running total, then let CSS animate ---
  // We ADD to the previous total, so the number only ever grows and every
  // spin keeps working, however many times you click.
  currentRotation = currentRotation + delta + extraTurns * 360;

  isSpinning = true;
  spinButton.disabled = true; // blocks a second spin mid-animation

  // Setting the transform is all it takes. The 4s transition in style.css
  // animates from wherever the wheel is now to this new angle.
  wheel.style.transform = "rotate(" + currentRotation + "deg)";

  // Safety net. The plan is for finishSpin() to run when the transitionend
  // event fires. But that event is not guaranteed: browsers may skip it if
  // the tab is in the background. Without this fallback the button would
  // stay disabled for ever. Whichever of the two arrives first wins, and
  // finishSpin() ignores the second one.
  clearTimeout(spinTimer);
  spinTimer = setTimeout(finishSpin, SPIN_DURATION + 200);
}


/* =========================================================
   9. finishSpin()
   ---------------------------------------------------------
   Puts the wheel area back into its resting state and reveals
   the winner. Called either by the transitionend event or by
   the safety-net timer above — never both, thanks to the guard.
   ========================================================= */
function finishSpin() {
  // If we already finished (the timer and the event both fired),
  // do nothing.
  if (!isSpinning) {
    return;
  }

  isSpinning = false;
  spinButton.disabled = false; // the button is usable again

  // Show the question above the winner — but only if one was typed.
  // If `question` is an empty string, we hide the line completely, so an
  // empty question shows just the winner and no blank line above it.
  if (question === "") {
    resultQuestion.textContent = "";
    resultQuestion.hidden = true;
  } else {
    resultQuestion.textContent = question;
    resultQuestion.hidden = false;
  }

  // Only NOW do we reveal the winner, so the result appears at the
  // same moment the wheel settles.
  result.textContent = winner;

  // Tidy up the safety-net timer if it was the event that finished us.
  clearTimeout(spinTimer);
  spinTimer = null;
}


/* =========================================================
   10. CONNECT THE EVENTS
   ---------------------------------------------------------
   addEventListener says: "when this happens, run this
   function." We pass the function name WITHOUT brackets,
   because we want to hand over the function itself, not
   the result of calling it.
   ========================================================= */

// Clicking the Add button.
addButton.addEventListener("click", addOption);

// Typing in the question box keeps the `question` variable up to date.
// We use "input" rather than "change": "input" fires on EVERY keystroke
// (and on paste and cut), while "change" only fires once the field loses
// focus — which would be far too late for us.
questionInput.addEventListener("input", function () {
  // .value is the text currently in the box.
  // .trim() drops any spaces at the start or end, so a box containing
  // only spaces counts as an empty question.
  question = questionInput.value.trim();
});

// Pressing Enter while typing in the input.
input.addEventListener("keydown", function (event) {
  // `event` describes what just happened; .key is the key pressed.
  if (event.key === "Enter") {
    addOption();
  }
});

// Clicking the Spin button.
spinButton.addEventListener("click", spinWheel);

// When the CSS transition finishes, the wheel has stopped turning.
// This is better than relying only on a timer, because it fires at
// exactly the moment the animation really ends.
wheel.addEventListener("transitionend", function (event) {
  // A transition fires once per animated property. We only care about
  // the rotation, so ignore anything else.
  if (event.propertyName !== "transform") {
    return;
  }

  finishSpin();
});


/* =========================================================
   11. FIRST DRAW
   ---------------------------------------------------------
   Run render() once when the page loads, so the list starts
   in a known, correct state (empty, with the hint visible).
   ========================================================= */
render();
