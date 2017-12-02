# Atlas

A cutting-edge state management solution for web and mobile. One store to rule them all.

[ Picture of Atlas carrying the world ]

TODO: Tell a nice story of why you're building this and why it's really important. Ideally you'd say you have an app that needs it and you just can't believe that it's 2018 and we don't have a simpler way of doing this.

## Abstract

In 2018 building a web application with great UX should not be rocket science. Why are we still building
web applications like it's still 2017?

Properties of great web applications:

### UX / Users are happy when:
  - the page to load quickly
  - interactions & animations are smooth
  - displayed data is consistent
  - some features should work even when offline
  - (the design is good, animations make sense, etc.)

### DX / Developers are happy when:
  - apps are easy to write
  - code is simple (easy to understand and maintain)
  - integration & deployment is simple
  - their app scales easily

React does a pretty good job of making it easy for developers to specify what their page should look like,
and how a certain state should be rendered.

What's still really hard/onerous is state management and data loading.

Atlas solves the state management part of the equation, so we're only concerned with the properties listed above if state management is involved in them. For example, we're concerned with consistency and load times, but we're not concerned with UI design.

Let's translate these into concrete DX (developer experience) and UX (user experience) goals

TODO: Put a little figure here of what the stack looks like. This will make it obvious why UI concerns are separated from State Management 

### DX / UX Goals:

### Features:
- Declarative === simple (DX)
- Observable (DX)
- Type support (DX)
- Normalized (correct)
- Optimistic Updates / transactions (fast)
- Serializability (offline support - fast)
- Memory management (cache expiration and eviction - correct/secure/fast)
- Extensibility & Integration (one place to manage all your state - DX)
- Checkpoints (Undo/Redo - UX)
- Security Addons (encrypted in indexedDb if sensitive user info)

- TODO: Plugins, Plugins, Plugins. There might even be a market here.
- TODO: Must make code very modular so that everything can be swapped out separately. For example the DB connector, the reader, the writer, the arrayWriter, etc. Modularity is more important at the start than performance.

#### Concrete performance Goals:

See also: https://developers.google.com/web/fundamentals/performance/rail

- Apps must run at a frame rate of 60HZ to feel smooth (https://developers.google.com/web/fundamentals/performance/rendering/)
  - That means we have 16ms to render a frame. Leaves about 10ms for JavaScript, so the goal is that Atlas shall never take more than half of that, 5ms, on the main thread for any read or write. For example, if a large result comes back from the network, it may not block the main thread for more than 5 ms because any animation happening at that same time would feel janky.
- For an operation to feel instantaneous to the user, it must be completed in less than 100ms. (https://www.nngroup.com/articles/response-times-3-important-limits/)
  - Therefore, we set the goal that optimistic updates should not take more than 50ms between the time they are started and the time they have been fully propagated to all observers whose data affects the current viewport.
- A good website load speed these days is less than 1 second. The faster the better, but under 1s is good. Therefore reading a query from the store if the data is not in memory but on disk should take no more than 500ms.

NOTE: These performance goals should be reached on an average mobile phone, not just a fast desktop! After all, it's 3G networks that make optimistic UI really important to have.

### Concrete scalability goals:

- Handle arrays with 1M scalar values (number, boolean, string)
  - Either an array with 1M elements, or a Matrix of 1000 x 1000 elements, or a tensor of 100 x 100 x 100
- Handle up to 100K indexed nodes (indexed nodes are the ones that get normalized)
- Handle writes of up to 10K indexed nodes at a time


## API
GraphQL, because it's declarative and you shouldn't have to care if the data is local or remote.

### constructor: new Atlas(schema, storeResolvers, actions, serializer, parser, ResultReader)
- Could actions be the same as store resolvers for mutations?
- each type in the schema needs to have serializers and parsers if it's not simply a JSON object.

### atlas.observe(query, options)
- options: rootId, optimistic, priority (how quickly it should get updated)

returns an observable to which you can subscribe. When you subscribe you get a handle on which you can do things like call setPriority(), which you might do when the component that the query is observing moves out of the viewport. Maybe yo can also call pause() on it if you're still somewhat interested but don't want any updates right now. However, the same might be achieved by setting priority to -1 (higher numbers mean higher priority). The reason this could be better than unsubscribing and resubscribing is that we can still keep track of whether anything has changed, and you don't need to tear down and set the observer back up, and the store doesn't need to do a whole bunch of work at once when you subscribe again. We'd also be more likely to keep that data in memory.

### atlas.do(name, payload, options)
- very similar to a redux action
- options: optimistic
Could also be atlas.mutate(mutation, options) instead, where variables are one of the options.

### atlas.read(query, options?)

### atlas.write(query, data, options?)

- Writes can be optimistic, too

### atlas.sync.read()
- For when you're in a rush and okay with letting everyone else wait.

### atlas.sync.write()

### atlas.sync.tx( a => { a.read(), ..., a.write() })
- Access the transaction API directly. If it's not a registered action, it will fail when you try to persist it.

### atlas.delete()
- For when you need to make something disappear. It will be removed from the store. Queries may fail.
- Could provide functionality that removes an object from all places it appears in if you delete that object.
- It's still not exactly clear what should happen when you delete some fields of an object but not all of them.
- Maybe it just deletes the reference you use?
- TODO: I think I need a specific use-case for this. I have two in mind. 1. delete a zetteli -> it should be removed from all notebooks it's in. This can be removal by id. It's just convenience. 2. remove the data from the store that was written into it by a specific query. If other queries still have a reference to the object, you'll still be able to find it in the store via that reference. Even if not all fields of an object are being removed, if there are no more references to that object, it will be deleted. Hmm, this kind of deletion is actually pretty tricky to implement, because it requires knowing which exact fields each query referenced. That is not practical, so let's not do it this way. The alternative way would be for deletion to take precedence, even if there's another query that's interested in fields that are being deleted.

Hmm, the whole notion of what data is in the store and what data isn't is actually hard to understand if you don't hold on to the original queries that put the data in there. If you hold on to the queries, then it's pretty easy to know what's in there. Everything that was written in is still in there, unless it was deleted or garbage collected. So we can know for each query if we have complete data, stale data, partial data or no data. That might be quite useful. You could still make completely new queries (that were never written into the store as such), but until you make the query and we check the store, we can't know if it's in there.

If you do read, we assume you just want to know what's in there right now, but don't require us to hold on to it. If you do a watch, we assume that you're interested in this data and want to know when it changes, so we keep it in the store, even if memory gets a bit tight. We remember every query that's ever been written into the store (usually there won't be more than 100 different queries, and each with maybe 100 different sets of variables), so if you no longer want something in the store, just tell us to no longer keep something associated with a query that's been written into the store.
Ideally, we should be capable of telling for any given object and any given field in the store which queries have touched it. If we know it, we can very quickly update which queries are now partial.

For items in an array, there's actually three different ways in which we could interpret a deletion: 1. pretend it was never in the array. 2. Replace it with null to make it explicit that there is an element but that we can't read it. and 3. put undefined there, so the query now has partial data (and may need to be refetched)

But all in good time, we don't need to solve deletion just yet.

### atlas.reset()
- For when you want to nuke the store and remove everything from it. Don't blow up the house until you've gotten all of your stuff out of it though. Unsubscribe from the queries you're watching, otherwise it will be unpleasant. (maybe there could be an option of globally erroring or completing all observers)


### atlas.parse()
- Parse serialized nodes (and merge them into the store)

### atlas.serialize(query?)
- Serialize all nodes in the query. If query is not provided, serialize all nodes.

### Options: encryption on disk