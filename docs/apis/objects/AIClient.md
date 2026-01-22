# AIClient

AI client interface.

## init

`init(options?: Record<string, unknown>): this`

Initializes the client.

### Usage

```js
ai.init();
```

### Arguments

- `options?` `<Record<string, unknown>>`

### Returns

- `this`

## setModel

`setModel(model: string): this`

Sets the model name.

### Usage

```js
ai.setModel('gpt-4o');
```

### Arguments

- `model` `<string>`

### Returns

- `this`

## setSystemPrompt

`setSystemPrompt(prompt: string): this`

Sets the system prompt.

### Usage

```js
ai.setSystemPrompt('You are a helpful web automation assistant.');
```

### Arguments

- `prompt` `<string>`

### Returns

- `this`

## chat

`chat(message: string): Promise<string | null>`

Sends a chat message.

### Usage

```js
const response = await ai.init().setModel('gpt-4o').chat('How do I fill a login form?');
expect(response === null || typeof response === 'string').toBeTruthy();
```

### Arguments

- `message` `<string>`

### Returns

- `Promise<string | null>`
