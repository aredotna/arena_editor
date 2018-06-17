# Components

## `Editor`

A `textarea`-based component which keeps track of the currently focused word, and passes it on to a child `MentionMenu` component (see below). This component handles the query execution and passes on the results to the `MentionMenu`, which is then used to select them.

Optional properties:

- `mentionQueryDelay`: a value describing how long to wait after typing (in seconds) before a mention query is executed. Default is 300.
- `onChange`: a function called whenever the `Editor`'s state changes, passing in the new state.
- `menuXOffset`: `x` offset for the child `MentionMenu`. Default is 0.
- `menuYOffset`: `y` offset for the child `MentionMenu`. Default is 3.
- `menuMaxResults`: the maximum number of results returned for a mention query. Default is 6.

### `MentionMenu`

An [ARIA-compliant menu](https://www.w3.org/TR/wai-aria-practices/#menu) used for selecting from a list of mentions.

## `HasMentions`

A component that will detect any child anchor elements with a `href` value pointing to an internal link. When one of these child anchors are hovered over, the component will query for that channel/block/user's info and display it as a tooltip using `MentionTooltip` (see below).

Optional properties:

- `tooltipXOffset`: `x` offset for the child `MentionTooltip`. Default is 0.
- `tooltipYOffset`: `y` offset for the child `MentionTooltip`. Default is 3.

Notes:

- Includes the class `has-mentions`; others can be added using the `className` property

### `MentionTooltip`

A thin wrapper around the `Popover` component, for displaying a mentioned channel/block/user's info.

## Lower-level components

### `Popover`

The `Popover` component deals with rendering an element that "floats" above others (e.g. a tooltip or a context menu) and attempts to fit itself into the viewport as best as possible. If the entire popover content can't fit in any configuration, it falls back to ensuring that the top-most content of the popover is displayed.

Required properties:

- `isVisible`: a boolean value determining whether or not the popover should be shown
- `anchor`: an object containing the keys `top`, `left`, `height`, `width`, describing the element the popover is attached to (e.g. the bit of relevant text for a tooltip). This is used to position the popover
- `offset`: an object containing the keys `x` and `y`, describing the respective `x` and `y` offsets from the popover's associated element.
- `shouldReposition`: a function returning a boolean describing whether or not the popover's position should be re-calculated (e.g. if the child contents change).

Notes:

- Includes the class `popover`; others can be added using the `className` property

Used by:

- `TooltipMention`
- `MentionMenu`

# ARIA menu references

- <https://www.w3.org/TR/wai-aria-practices/#menu>
- <https://www.w3.org/TR/wai-aria/#menu>
- <https://www.w3.org/TR/wai-aria/#menuitem>
