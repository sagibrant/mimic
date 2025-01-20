# Automator

We are trying to implement a better automation tool which can be easily integrated and combined with the latest AI features.

## Architecture

There are 5 components for the Automator:
* protocol
    * The protocol component defines the communication protocol and the data format
* client
    * The client component defines the SDK and provide a friendly UI to record/replay/inspect on the applications
* connector
    * The connector component is the bridge for remote automation when the client and engine are not in the same machine
* engine
    * The engine component will maintain all the drivers and dispatching different automation request to different drivers
* drivers
    * The drivers component is the collection of all the automation drivers which provide the functionality to automate the application based on the technologies
    * web driver
        * selenium webdriver based (`webdriverhost <--> chromedriver`)
        * web extension based (`nativemessaginghost <--> extension`)
    * ai driver
    * input driver

* flow:
```js
client <--> connector <--> engine <--> drivers
```

* chrome flow:
```js
client <--> connector <--> engine <--> chrome.nativemessaginghost <--> chrome extension
```

