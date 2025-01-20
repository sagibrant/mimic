/**
 * CustomEventChannel.ts
 * Using CustomEvent for communication between the MAIN world and other Isolated Worlds:
 * This channel is used for messaging between the content script and the user's JavaScript execution context, ensuring a message flow of background → content → MAIN → content.
 * It is particularly useful when a step action requires both a query and an action.
 * The content world can be used to query DOM elements, preventing JavaScript overwrites, while the MAIN world executes actions—allowing calls to user-defined methods.
 * author: zhang jie
 */
class CustomEventChannel {
}