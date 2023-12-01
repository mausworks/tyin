# Tyin

**Typesafe state management in React for less!**

- ✅ Tiny and splittable (<1K gzipped)
- ✅ Ergonomic
- ✅ Extensible

_Tyin is pronounced "tie-in": it ties a state into your React components
… it was also short and available on NPM._

## Installation

Use _your_ favorite NPM package manager:

```sh
npm i tyin
```

## Quickstart

Create the hook:

```tsx
import storeHook from "tyin/hook";

export const useActivePage = storeHook(1);
```

Use it anywhere:

```tsx
import { useActivePage } from "./hooks/useActivePage";

const Pagination = ({ maxPage }: PaginationProps) => {
  const activePage = useActivePage();

  return (
    <Container>
      <Button
        label="Previous"
        disabled={activePage === 1}
        onClick={() => useActivePage.set((page) => page - 1)}
      />
      <Button
        label="Next"
        disabled={activePage === maxPage}
        onClick={() => useActivePage.set((page) => page + 1)}
      />
      <Button
        label="Last"
        disabled={activePage === maxPage}
        onClick={() => useActivePage.set(maxPage)}
      />
    <Container>
  );
};
```

For complex states, you often want to add new methods to update your state.
In this case, we can add the `patch` function to the store with the `objectAPI` plugin,
but we first need to make the store extensible:

```tsx
import storeHook from "tyin/hook";
import extend from "tyin/extend";
import objectAPI from "tyin/plugin-object";

const useUserState = extend(
  storeHook({
    name: "mausworks",
    roles: ["owner"],
  })
).with(objectAPI());

const UserNameInput = () => {
  const name = useUserState((user) => user.name);

  return (
    <TextInput
      value={name}
      onTextChange={(value) => useUserState.patch({ name: value })}
    />
  );
};
```

Handling arrays can be done similarly,
and in this case, we also add the custom function `complete` to the store:

```tsx
import storeHook from "tyin/hook";
import extend from "tyin/extend";
import arrayAPI from "tyin/plugin-array";
import persistPlugin from "tyin/plugin-persist";

const useTodoList = extend(
  storeHook([{
    task: "Walk the dog",
    completed: false
  }])
)
  // Add the array API:
  .with(arrayAPI())
  // Persist the state using the persist plugin:
  .with(persistPlugin({ name: "TodoList" }));
  // Add some custom logic:
  .with((store) => ({
    complete: (index: number) =>
      store.map((todo, i) =>
        i === index ? { ...todo, completed: true } : todo
      );
  }))
  // (Optional) Remove the `with` (and `seal`) method:
  .seal();

const TodoApp = () => {
  const todos = useTodoList((todos) => todos.filter((todo) => !todo.completed));

  return (
    <>
      <TodoList
        todos={todos}
        onComplete={(index) => useTodoList.complete(index)}
      />
      <AddTodo onSubmit={() => useTodoList.push({ task, completed: false })} />
    </>
  );
};
```

You can also use Tyin outside of React:

```ts
import createStore from "tyin/store";
import extend from "tyin/extend";

const store = extend(createStore({ count: 1 })).with(...);
```

## Project Motivation

This project is inspired by [zustand](https://github.com/pmndrs/zustand)—I love zustand.
I have, however, been "using it wrong" for some time, which has led to me creating this project.
Below is some background …

I've been working on [dott.bio](https://get.dott.bio) for some time now. It uses NextJS with zustand,
but all stores look something like this:

```tsx
const useTourState = create(() => ({ started: false, step: 0 }));
```

Something you may find glaringly missing are any kind of state setters.
The reason for this is that I have started to call `setState` directly on the hook instead:

```ts
useTourState.setState({ started: true });
```

This may look awkward or even _wrong_ to some; not only because `useTourState` is a function itself,
but also because `useTourState.setState` is like… super global—it lives "outside of react"…
how can it even make the hook re-render?

It all works thanks to [the `useSyncExternalStore` hook](https://react.dev/reference/react/useSyncExternalStore) that ships with React.
With it, you can make virtually anything re-render, and it is what drives both zustand and Tyin.

Zustand popularized the idea that "the hook _is_ the store", and this project evolves on this idea even further.
The key difference is that in Tyin, you put your state update functions on _the store_ instead of _the state_.
This separates your data from your code ([which is generally considered good practice](https://wiki.c2.com/?SeparationOfDataAndCode)).

If you can look beyond _"that initial irk"_, you may start seeing some benefits with using this pattern.
Remember: you can now access and update the store from anywhere, and your components will simply comply—magic! 🪄

Another pain point I had with using zustand "the vanilla way" was that I kept declaring
the same couple of state setter over and over again for each store.
This is what finally drove me to just call `setState` directly instead since it's versatile enough for most use cases:

```ts
// Replace the state:
useTourState.setState({ started: true, step: 1 }, true);
// Partially apply the state:
useTourState.setState({ step: 2 });
// Accessing current state + partial application:
useTourState.setState((state) => ({ step: state.step + 1 }));
```

I realized that functions that I wanted on my store were often highly generic:

- If my state is an object, I want to be able to replace, remove and add keys to it.
- If my state is an array, I want to be able to push, filter, map, etc …

So why not replace custom state-setting functions with generic ones?

At this point, I realized that zustand ships a lot of things that I have no interest in,
so I wanted to make something simpler that only satisfies my requirements, and Tyin is the result!

## Project philosophy

These are the three tenets that allow for Tyin to be a
feature-complete state management solution in just a few bytes!

### 1. Modularity

Tyin doesn't come with a single entry point—that's intentional!

It instead ships a couple of highly stand-alone modules,
so that the user can import only the functionality that they need.

### 2. Genericism

Tyin exposes generic APIs that aim to maximize ergonomics and minimize bundle size.
Generic APIs facilitate code reuse, leading to synergies in consuming applications.

For example: There is no `ObjectAPI.setKey(key, value)` function,
because `ObjectAPI.patch({ [key]: value })` covers that need
and a lot of other needs, simply by providing a generic API.
This API is powerful enough to receive aggressive reuse in the consuming app; leading to an even smaller bundle size overall.

### 3. Composability

Tyin ships simple abstractions that favor [composition over inheritance](https://en.wikipedia.org/wiki/Composition_over_inheritance).

For example: Not every store needs a plugin, so the `StoreAPI` isn't readily extensible, that functionality is in `extend` instead.

## Bundle size

To get an estimate on the bundle size you can run:

```sh
bun run test/bundle-size/estimate.ts
```

This is the current output:

```txt
extend.js: 167B (140B gzipped)
hook.js: 529B (349B gzipped)
plugin-array.js: 332B (191B gzipped)
plugin-object.js: 286B (226B gzipped)
plugin-persist.js: 415B (304B gzipped)
store.js: 245B (212B gzipped)
```

So, that means if you only import `tyin/hook`; Tyin will add 529 bytes to your bundle size (or ~349 gzipped).

Here are a few other common scenarios:

1. `tyin/hook + extend + plugin-object` = ~1000 bytes (~700 gzipped)
2. `tyin/hook + extend + plugin-object + plugin-persist` = ~1400 bytes (~1000 gzipped)
3. `tyin/*` = ~1750 bytes (~1200 gzipped)

> **Note:** All these numbers are approximate.
> Exact bundle size will vary depending on the bundler and configuration.
> Gzipped size is often smaller in a real-life scenario.

## Framework comparison

This table compares the "general usage" between Tyin, Zustand and Redux.
I picked these frameworks, because I think most people are familiar with them.

|             | Store setup                                              | Get state       | Set state                                |
| ----------- | -------------------------------------------------------- | --------------- | ---------------------------------------- |
| **Tyin**    | Create store, add plugins \*                             | Use store hook  | Call functions on the store              |
| **Zustand** | Create store, define setter functions on the state \*\*  | Use store hook  | Call setter functions on the state       |
| **Redux**   | Create store, define setter actions, add provider to app | Use useDispatch | Dispatch setter actions with useDispatch |

> **\*** = It is unusual to have to define your own setter functions on the store when using Tyin.
> These are provided by plugins such as `tyin/plugin-object` instead.

> **\*\*** This is technically not needed, [but it is the recommended usage](https://docs.pmnd.rs/zustand/getting-started/introduction).
