# 👔 Tyin

Typesafe state management in React for less!

[![npm](https://img.shields.io/npm/v/tyin)](https://npmjs.org/tyin) [![GitHub Workflow (Release)](https://img.shields.io/github/actions/workflow/status/mausworks/tyin/release.yml)](https://github.com/mausworks/tyin/actions/workflows/release.yml)

✅ Tiny (<1K)  
✅ Ergonomic  
✅ Extensible

Tyin is pronounced _tie-in_: it ties a state into your app.

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
      <PreviousButton
        disabled={activePage === 1}
        onClick={() => useActivePage.set((page) => page - 1)}
      />
      <NextButton
        disabled={activePage === maxPage}
        onClick={() => useActivePage.set((page) => page + 1)}
      />
      <LastButton
        disabled={activePage === maxPage}
        onClick={() => useActivePage.set(maxPage)}
      />
    </Container>
  );
};
```

### Handling complex states

Real life applications are often complex, so let's add the `patch` function from the object plugin to handle partial updates:

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
      onChange={({ target }) => useUserState.patch({ name: target.value })}
    />
  );
};
```

### Handling arrays

Tyin ships with a convenience plugin for arrays—because not every state is an object!

In this example, we will add it, along with the persist plugin,
and a custom setter called `complete`:

```tsx
import storeHook from "tyin/hook";
import extend from "tyin/extend";
import arrayAPI from "tyin/plugin-array";
import persist from "tyin/plugin-persist";

const useTodoList = extend(
  storeHook([{
    task: "Walk the dog",
    completed: false
  }])
)
  // Add the array API:
  .with(arrayAPI())
  // Persist the state using the persist plugin:
  .with(persist({ name: "TodoList" }));
  // Add a custom setter:
  .with((store) => ({
    complete: (index: number) =>
      store.map((todo, i) =>
        i === index ? { ...todo, completed: true } : todo
      );
  }))
  // Remove the `with` (and `seal`) from the store:
  .seal();

const TodoApp = () => {
  const todos = useTodoList((todos) => todos.filter((todo) => !todo.completed));

  return (
    <Container>
      <TodoList
        todos={todos}
        onComplete={(index) => useTodoList.complete(index)}
      />
      <AddTodo onSubmit={(task) => useTodoList.push({ task, completed: false })} />
    </Container>
  );
};
```

### Data fetching with Tyin Sync

Tyin provides a way to query and mutate data upstream using the Sync plugin.

It provides automatic deduplication based on the parameters that you provide for `pull`, or based on the state itself for `push` and `delete`. You can also cache the result by setting a `cacheDuration`.

After the store has been set up we can,
pull the state when a component mounts by using the `usePull` hook. To push or delete, we can just call the functions directly on the `sync` API.

```tsx
import storeHook from "tyin/hook";
import sync from "tyin/plugin-sync";
import extend from "tyin/extend";
import useHydrate from "tyin/plugin-sync/useHydrate";
import { use } from "react";
import { Note } from "@/types";

const useUserNotes = extend(storeHook<Note[]>([]))
  .with(
    sync({
      push: (notes, userId: string) =>
        fetch(`/api/notes/${userId}`, {
          method: "PUT",
          body: JSON.stringify(notes),
        }),
      pullOptions: { cacheDuration: 5000 },
      pull: (userId: string) =>
        fetch(`/api/notes/${userId}`).then((res) => res.json()),
    })
  )
  .seal();

type UserNotesListProps = {
  userId: string;
};

const UserNotesPage = ({ userId }: UserNotesPageProps) => {
  const hydration = useHydrate(useUserNotes.sync.pull, [userId], {
    onMount: true,
    onOnline: true,
    onFocus: true,
  });
  const notes = use(hydration);

  return <NotesList readonly notes={notes} />;
};
```

### Tyin without React

Tyin works just fine without React, in fact,
React is just a `devDependency` for it.

Unless you import `storeHook` or other React-specific functionality, you can use Tyin anywhere. Just replace `storeHook` with `createStore`.

```ts
import createStore from "tyin/store";
import extend from "tyin/extend";

const store = extend(createStore({ count: 1 })).with(...);
```

## Project philosophy

These are the three tenets that allow for Tyin to be a
fully featured state management solution in just a few bytes!

### 1. Modularity

Tyin doesn't come with a single entry point—that's intentional!

It instead ships standalone modules that are meant to extend each other,
so that the user can import only the functionality that they need.

### 2. Genericism

Tyin exposes generic APIs that aim to maximize ergonomics and minimize bundle size.
Generic APIs facilitate code reuse which leads to synergies in consuming applications.

For example: There is no `ObjectAPI.setKey(key, value)` function,
because `ObjectAPI.patch({ [key]: value })` covers that need
and many others, simply by being more generic.
This API is powerful enough to receive aggressive reuse in the consuming app; leading to an even smaller overall bundle size.

### 3. Composability

Tyin ships simple abstractions that favor [composition over inheritance](https://en.wikipedia.org/wiki/Composition_over_inheritance).

For example: Not every store needs a plugin, so the `StoreAPI` isn't readily extensible, that functionality is in `extend` instead.

## Bundle size

To get an estimate on the bundle size you can run:

```sh
bun run src/test/size.ts
```

This is the current output:

```txt
export-all: 3288 bytes, 1505 gzipped
export-common: 1469 bytes, 784 gzipped
plugin-sync: 1240 bytes, 644 gzipped
hook: 584 bytes, 383 gzipped
plugin-persist: 415 bytes, 305 gzipped
plugin-array: 332 bytes, 190 gzipped
plugin-object: 286 bytes, 225 gzipped
extend: 272 bytes, 193 gzipped
store: 245 bytes, 213 gzipped
```

So, that means if you import everything; Tyin will add ~900 bytes to your bundle size,
and the most minimal implementation (importing just `tyin`) would only add ~350 bytes.

But this all depends on your bundler and configuration. In real-life scenarios it is often less. For dott.bio—using the `export-object.js` variant measured above—Tyin adds 550 bytes (according to `next/bundle-analyzer`).

## Framework comparison

This table compares the "general usage" between Tyin, Zustand and Redux.
I picked these frameworks, because I think most people are familiar with them.

|             | Store setup                                              | Get state       | Set state                                |
| ----------- | -------------------------------------------------------- | --------------- | ---------------------------------------- |
| **Tyin**    | Create store, add plugins \*                             | Use store hook  | Call functions on the store              |
| **Zustand** | Create store, define setter functions on the state \*\*  | Use store hook  | Call setter functions on the state       |
| **Redux**   | Create store, define setter actions, add provider to app | Use useDispatch | Dispatch setter actions with useDispatch |

> **\*** = You rarely define your own setter functions when using Tyin.
> These are provided by plugins such as `tyin/plugin-object` instead.

> **\*\*** = This is technically not needed, [but it is the recommended usage](https://docs.pmnd.rs/zustand/getting-started/introduction).

## Project motivation

This project is inspired by [zustand](https://github.com/pmndrs/zustand)—I love zustand.
I have, however, been "using it wrong" while working on [dott.bio](https://get.dott.bio).

Most of the stores—after refactoring—now look like this:

```tsx
const useTourState = create(() => ({ started: false, step: 0 }));
```

Something that you may find glaringly missing are any kind of state setters.
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
the same couple of state setters over and over again for each store.
This is what finally drove me to just call `setState` directly instead since it's versatile enough for most use cases:

```ts
// Replace the state:
useTourState.setState({ started: true, step: 1 }, true);
// Partially apply the state:
useTourState.setState({ step: 2 });
// Accessing current state + partial application:
useTourState.setState((state) => ({ step: state.step + 1 }));
```

So, I realized that the functions I want for my stores are generic:

- If my state is an object, I want to be able to replace, remove and add keys to it.
- If my state is an array, I want to be able to push, filter, map, etc …
- If a setter is more complex, I can put it in a hook (this can be advantageous anyways)

So why not replace custom state setters with generic ones?

At this point, I realized that zustand ships a lot of things that I have no interest in,
so I wanted to make something simpler that only satisfies my requirements, and Tyin is the result!

## Module naming strategy

Here are the general naming guidelines:

- Use no prefix for top-level APIs (example: `store.ts`)
- Use the `plugin-` prefix for plugins (example: `plugin-object.ts`)
- Functions that are related to a plugin may be exported from a folder with the plugin name (example: `plugin-sync/usePull.ts`)
- Use the `util-` prefix for utility functions (example: `util-throttle.ts`)
- Utils may only export a single function (and related types)

_Keep in mind that every module in the project is intended for external consumption_

- Every file should have a default export (with a good default name)
- Default exports must be documented and provide a clear example of usage
