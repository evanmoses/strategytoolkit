// To keep our code clean and modular, all custom functionality will be contained
// inside a single object literal called "checkboxFilter".

// In this example, we must bind a 'change' event handler to
// our checkboxes, then interact with the mixer via
// its .filter() API methods.  <script type="text/javascript">

const containerEl = document.querySelector('.container');
const checkboxGroup = document.querySelector('.checkbox-group');
const checkboxes = checkboxGroup.querySelectorAll('input[type="checkbox"]');
const inputSearch = document.querySelector('[data-ref="input-search"]');

// set variables for filtering by based on content of cards in the toolkit
const sortArray = document.querySelectorAll('.toolcard .cardtitle');
let keyupTimeout;

// create variable based on text in card, add it to
// current value of custom attribute 'data-content' for each card
// to be searched below by filterByString function
sortArray.forEach((elem) => {
  const sortText = elem.innerText || elem.innerContent;
  const sortTextLower = sortText.toLowerCase().trim();
  const sortTextHigher = elem.parentElement.parentElement.getAttribute('data-content');
  const combinedText = `${sortTextLower} ${sortTextHigher}`;
  // var sortClass = elem.parentElement.parentElement.className;
  // var classAppend = sortClass.toLowerCase().trim();
  // elem.parentElement.parentElement.setAttribute('data-content',
  // sortTextLower + " " + classAppend);
  elem.parentElement.parentElement.setAttribute('data-content', combinedText);
});

// eslint-disable-next-line no-undef
const mixer = mixitup(containerEl, {
  animation: {
    duration: 350,
  },
  callbacks: {
    onMixClick() {
      // Reset the search if a filter is clicked

      if (this.matches('[data-filter]')) {
        inputSearch.value = '';
      }
    },
  },
});

document.addEventListener('load', () => {
  mixer.filter('all');
});

checkboxGroup.addEventListener('change', () => {
  const selectors = [];

  // Iterate through all checkboxes, pushing the
  // values of those that are checked into an array
  for (let i = 0; i < checkboxes.length; i += 1) {
    const checkbox = checkboxes[i];

    if (checkbox.checked) selectors.push(checkbox.value);
  }

  // If there are values in the array, join it into a string
  // using your desired logic, and send to the mixer's .filter()
  // method, otherwise filter by 'all'

  const selectorString = selectors.length > 0 ? selectors.join('') : 'all';
  // or '.' for AND logic
  mixer.filter(selectorString);
});

// Set up a handler to listen for "keyup" events from the search input
inputSearch.addEventListener('keyup', () => {
  let searchValue;
  if (inputSearch.value.length < 3) {
    // If the input value is less than 3 characters, don't send
    searchValue = '';
  } else {
    searchValue = inputSearch.value.toLowerCase().trim();
  }

  // Very basic throttling to prevent mixer thrashing. Only search
  // once 350ms has passed since the last keyup event

  clearTimeout(keyupTimeout);

  keyupTimeout = setTimeout(() => {
    // eslint-disable-next-line no-use-before-define
    filterByString(searchValue);
  }, 150);
});

/**
 * Filters the mixer using a provided search string, which is matched against
 * the contents of each target's "class" attribute. Any custom data-attribute(s)
 * could also be used.
 *
 * @param  {string} searchValue
 * @return {void}
 */

function filterByString(searchValue) {
  if (searchValue) {
    // Use an attribute wildcard selector to check for matches
    // mixer.filter('[class*="' + searchValue + '"]');

    // eslint-disable-next-line no-undef
    // eslint-disable-next-line prefer-template
    mixer.filter('[data-content*="' + searchValue + '"]');
  } else {
    // If no searchValue, treat as filter('all')

    mixer.filter('all');
  }
}
// Reset mixitup filters on close of bootstrap model
// document.querySelectorAll('#exampleModalLong').on('hidden.bs.modal', () => {
//   mixer.filter('all');
// });

// BUTTON BEHAVIOURS
