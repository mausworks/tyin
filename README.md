# GRATIS STATE

State management in React for ~~free~~ less:

- ✅ Tiny & splittable (<1K gzipped)
- ✅ Hook-based
- ✅ Familiar APIs
- ✅ Easy to extend
- ✅ Type safe

## Installation

Use _your_ favorite NPM package manager:

```sh
bun i gratis-state
```

## Quickstart

Create the hook:

```tsx
import storeHook from "gratis-state/react";

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

For more complex states, you may want to add new methods to update the state of the store.
In this case, we can add the `apply` function (and others) to the store with the `objectPreset`.

```tsx
import storeHook from "gratis-state/react";
import objectPreset from "gratis-state/preset-object";

const useUserState = storeHook({ name: "mausworks", roles: ["owner"] })
  .with(objectPreset());

const UserNameInput = () => {
  const name = useUserState((user) => user.name);

  return (
    <TextInput
      value={name}
      onTextChange={(value) => useUserState.apply({ name: value })}
    />
  );
};
```

Handling arrays can be done similarly, 
but in this case we also add the custom function `complete` to the store.

```tsx
import storeHook from "gratis-state/react";
import arrayPreset from "gratis-state/preset-array";
import persistPlugin from "gratis-state/plugin-persist";

const useTodoList = storeHook([{ task: "Walk the dog", completed: false }])
  .with(arrayPreset())
  // Add some custom logic:
  .with((store) => {
    complete: (index: number) =>
      store.map((todo, i) => i === index ? ({ ...todo, completed: true }) : todo);
  })
  // Persist the state using the persist plugin:
  .with(persistPlugin({ name: "TodoList" }));

const TodoApp = () => {
  const todos = useTodoList((todos) => todos.filter((todo) => !todo.completed));

  return (
    <>
      <TodoList todos={todos} onComplete={useTodos.complete} />
      <AddTodo onSubmit={() => useTodoList.push({ task, completed: false })} />
    </>
  );
};
```

You can also use gratis-state outside of React:

```ts
import createStore from "gratis-state/store";

const store = createStore({ count: 1 }).with(...);
```

## Project Motivation

This project is inspired by [zustand](https://github.com/pmndrs/zustand)—I love zustand.
I have, however, been "using it wrong" for some time, which has now led me to create this project.

Many of the stores I've created while working on [dott.bio](https://get.dott.bio) look something like this now:

```tsx
const useTourState = create(() => ({ started: false, step: 0 }));
```

Something you may find glaringly missing are any kind of state setters.
The reason for this is because I have started to call `setState` directly on the hook instead:

```ts
useTourState.setState({ started: true });
```

This may look awkward or even _wrong_ to some; not only because `useTourState` is a function in itself, 
but also because `useTourState.setState` is both global _and_ static—it lives "outside of react", 
so how can it even make the hook re-render?

It all works thanks to [the `useSyncExternalStore` hook](https://react.dev/reference/react/useSyncExternalStore) that ships with React.
With it, you can make virtually anything re-render, and it is what drives both zustand and gratis-state.

Zustand popularized the idea that "the hook is the store", and this project was created to evolve that idea.
The key difference is now that you put your state update functions on _the store_ instead of _the state_.
This separates your data from your code ([which is generally considered good practice](https://wiki.c2.com/?SeparationOfDataAndCode)).

So if you can look beyond the initial awkwardness of it, you may now start seeing some additional benefits.
Remember: you can now access and update the store from anywhere, and your components will comply—it almost feels like cheating.

Another pain point I had with using zustand "the vanilla way" (the way they use it in the examples)
was that I kept declaring the same couple of state update functions over and over again for each store.
This is what finally drove me to just call `setState` directly instead, since it's versatile enough for most of the use-cases:

```ts
// Replace state:
useTourState.setState({ started: true, step: 1 }, true)
// Partial application:
useTourState.setState({ step: 2 })
// Accessing current state + partial application:
useTourState.setState((state) => ({ step: state.step + 1 }))
```

I realized that what I wanted for my state management was often very generic:

- If my state is an object, I want to be able to replace, remove and add keys to it.
- If my state is an array, I want to be able to push, filter, map, etc …

So why not replace custom state-setting functions with generic ones?

At this point I realized that zustand ships a lot of things that I have no interest in,
so I wanted to make something simpler that only satisfies my requirements, and gratis-state is the result!
