ESC Cardiovascular Guidance Master v1.2 — separated front-end files
=================================================================

V1.2

- Allow table column sorting and hiding

FILES
-----

index.html
  Page structure only. Includes the logo area, filters, column customizer,
  and recommendation table shell.

styles.css
  StudioBlank-inspired design system and all page/table styles.
  Recommendation class colors remain unchanged:
  Class I   = #63be7b
  Class IIa = #ffd966
  Class IIb = #f4b183
  Class III = #e8505b

app.js
  Loads the JSON, builds cascading filters, renders the table, and handles
  per-browser table-column preferences.

ESC_Guidelines_Master_2002_2026_v25_FULLY_SOURCE_VALIDATED_data.json
  Recommendation dataset. The front end reads class_based_recommendations.

COLUMN CUSTOMIZATION
--------------------

Use the "Columns" button above the table to:

- show or hide columns
- drag columns into a new order
- use Up/Down buttons as an accessible alternative to dragging
- reset to the default layout

Column preferences are stored in the browser using localStorage under:
  esc-guidelines-v25-table-columns

This means the preference:

- persists after page refresh/reopen on that browser
- does not change the JSON file
- is not shared with other visitors/devices/browsers

To clear it manually in browser developer tools:
  localStorage.removeItem('esc-guidelines-v25-table-columns')

CASCADING TOPIC FILTER
----------------------

Selecting a Guideline Topic rebuilds the Specific Topic dropdown so it contains
only specific topics belonging to the selected main topic. Clearing the main
Guideline Topic restores all Specific Topics.

LOCAL DEVELOPMENT
-----------------

Because the JSON is loaded with fetch(), opening index.html directly via file://
may be blocked by browser security rules.

From this folder run:

  python3 -m http.server 8000

Then open:

  <http://localhost:8000/>

No npm packages, build process, framework, or external JavaScript library is
required.

LOGO
----

Replace the placeholder inside .logo-space in index.html with, for example:

  <img class="brand-logo" src="logo.svg" alt="Your logo">

Then place logo.svg beside index.html.
