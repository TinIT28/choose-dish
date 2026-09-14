# Choose Dish Context

This context covers a user's personal dish catalog and the daily meal selections made from it. It defines the language for recipes, meal periods, and the history of final choices.

## People and access

**User**:
An account holder who manages a dish catalog and records meal selections.
_Avoid_: Customer, member

## Dish catalog

**Dish catalog**:
The set of dishes a given reader can see right now: a user's own private dishes plus the shared dishes they have not personally excluded, and for an administrator the shared dishes alone. A removed dish leaves the catalog but keeps its row, so past selections still resolve.
_Avoid_: Menu, dish list, dish pool

**Dish**:
A dish entry with a name, short description, and one required image.
_Avoid_: Food, meal, recipe card

**Private dish**:
A dish visible and editable only by the user who owns it.
_Avoid_: Personal food

**Shared dish**:
A dish published by an administrator into a catalog available to multiple users. Users can select it or copy it into their private catalog before editing.
_Avoid_: Public dish, global dish

**Personal exclusion**:
A user's decision to hide an otherwise available shared dish from that user's random selection pool without changing the shared catalog.
_Avoid_: Hidden dish, disabled dish

**Administrator**:
A privileged user who manages the shared dish catalog.
_Avoid_: Moderator, system user

## Daily selection

**Meal period**:
One of the daily meal slots: breakfast, lunch, or dinner.
_Avoid_: Afternoon, eating time, session

**Selection**:
The user's final chosen dish for a local calendar date and meal period. Choosing again replaces the current selection for that same date and meal period.
_Avoid_: Random result, pick, choice event

**Selection time**:
The precise time at which the current selection was made, displayed in the user's timezone.
_Avoid_: Meal time, selected date

**No-repeat window**:
The seven-day period used to exclude dishes that the user selected recently across meal periods.
_Avoid_: Cooldown, duplicate filter

**History retention**:
The user-configurable period for keeping selection records. The default is 30 days; records older than the configured period are removed.
_Avoid_: History limit, archive window
