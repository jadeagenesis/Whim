/* =========================================================
   WHIM — option list logic
   ---------------------------------------------------------
   This file only handles ADDING and REMOVING options.
   The spin / roulette wheel comes later.
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
}


/* =========================================================
   7. CONNECT THE EVENTS
   ---------------------------------------------------------
   addEventListener says: "when this happens, run this
   function." We pass the function name WITHOUT brackets,
   because we want to hand over the function itself, not
   the result of calling it.
   ========================================================= */

// Clicking the Add button.
addButton.addEventListener("click", addOption);

// Pressing Enter while typing in the input.
input.addEventListener("keydown", function (event) {
  // `event` describes what just happened; .key is the key pressed.
  if (event.key === "Enter") {
    addOption();
  }
});


/* =========================================================
   8. FIRST DRAW
   ---------------------------------------------------------
   Run render() once when the page loads, so the list starts
   in a known, correct state (empty, with the hint visible).
   ========================================================= */
render();
