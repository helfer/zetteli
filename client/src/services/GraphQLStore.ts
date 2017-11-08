// import gql from 'graphql-tag';

/**
 * Problem: I want to have a denormalized store where reading a query is as simple as returning the root.
 * Unfortunately field arguments make things a little more complicated so I cannot simply return the root.
 * 
 * Proxies would be the ideal solution. I could store things like:
 * 
 * {
 *   'stack(id: 5)': {
 *     id: 123,
 *     name: 'Stack 5',
 *     zettelis(last: 3) {
 *       id
 *       tags
 *       body
 *     }
 *   }
 * }
 * 
 * And the proxy would for a given query where stack(id: 5) was asked for simply return that object
 * when someone asks for data.stack. The stack itself would be proxied too of course, because it would
 * have to return the correct zettelis object.
 * 
 * Sadly, proxies are not a real option. So what can we do instead? We can either create a new object on read,
 * or we create a new object on write.
 * 
 * Creating a new object on read would mean we have to traverse the query and see that stack(id: 5) is being
 * requested, so we create an object that contains { stack: blah } and make blah refer to the same thing
 * as stack(id: 5). But then things get more complicated, because stack contains 'zettelis(last: 3)', which
 * should just be zettelis. But we can't modify that object, because that object is normalized.
 * 
 * Either way you slice it or dice it, if you can't use a proxy to access that object, you'll eventually
 * have to create a copy of it where zettelis is exactly what you want. Doing that on every read would be
 * pretty costly, so let's not do that. Doing it on every write will waste a lot of space and keep us busy
 * chasing down references.
 * 
 * Oh man, how nice would a solution with a proxy be! It could even make sure that you don't modify the
 * result and that you only read the things you asked for. It would be like a mask over the entire local
 * graph, which is exactly what a query should be.
 * 
 * Screw it. Browser (versions) with Proxy support have 78% market share. That's good enough for me to
 * build a prototype with it. It will only get more, and since I'm mainly using this project for myself
 * that's really more than enough. It's also supported on Node 6.
 * 
 * Okay, so now how would I implement it with a proxy?
 * 
 * A quick experiment in Chrome shows me that I can create about 10K proxies in 1ms and 1M in 30ms.
 * That's definitely fast enough for all my purposes.
 * start = performance.now();
 * for(i = 1; i< 10000; i++){ window.x = new Proxy(a, handler); };
 * performance.now() - start;
 *
 * 
 * Okay so then how would I solve things with proxies?
 * 
 * Writing the result:
 * - The only nontrivial part here is normalization. For everything else, we just write it into the data
 * object. For objects that have to be normalized, we basically keep an index of all ids to objects. If we
 * encounter an object with id in the result, we continue to write in the indexed object instead of our own.
 * 
 * So let's say we got the result for { stack(id: 5){ id name zettelis(last: 3){ id tags body } } }
 * (you can assume that either ids are globally unique or we added __typename)
 * 
 * So we take the result, we look at the query and see that the current selection set there is
 * stack(id: 5). We write that to the key "stack(id: 5)" in data. Then we recurse and actually
 * create that object, give it id, name and "zettelis(last: 3)", where we again recurse. Zettelis
 * is an array, so we write an array of objects. Because stack and zettelis both have an id (and
 * __typename maybe), we also create an entry for them in our index. { 'Stack:5', and 'Zetteli:1',
 * 'Zetteli:2', 'Zetteli:7', etc. }
 * that refers to the object that we just inserted.
 * 
 * Later we make the query { allStacks { id name zettelis(first: 3){ id datetime body } } }
 * 
 * This creates the "allStacks" key in the data object. Then let's assume it returns only one stack in the
 * list, stack 5, and that first:3 has at least one overlapping element with last:3.
 * 
 * so in the allStacks array, we'll enounter stack:5, look it up in our index and realize that we already have
 * stack 5. So we just put the reference in the array and then continue working with the original stack:5.
 * Now since our last query the name of stack:5 changed, so we overwrite it. (here we could store a query
 * id in all the normalized objects to know which queries need to be notified when we change it, but
 * we can do that later.) We then add the key "zettelis(first: 3)" and in that array we notice that
 * one of the objects is overlapping, so we go to the exising reference instead and add the fields 
 * that weren't there before, and maybe overwrite the ones that were there before. And that's it.
 * 
 * For now I'm not going to worry about strict equality checking (or equality checking of any kind for that
 * matter)
 * 
 * So, what then happens if we read that query out of the store? Let's take the first one.
 * 
 * { stack(id: 5){ id name zettelis(last: 3){ id tags body } } }
 * 
 * We have to go to the leaves and start creating proxies there (recursion).
 * 
 * So we're in the array (which I guess doesn't need to be proxied?) and we have a neat object
 * with { id tags body }. We don't really need to, but we wrap a proxy around i anyway, and we
 * tell it the selection set that it has. Then one level higher up we got an array of three proxies
 * in the 'zettelis(last: 3)' key. We wrap the stack in a proxy, which when asked for the zettelis
 * field will return zettelis(last: 3), because it can see that the selection set is asking for
 * zettelis(last: 3). On the highest node we get a Proxy which will return stack(id: 5) when asked
 * for stack. Because that's just what it does.
 * 
 * Hm, I don't think that's very practical. It seems kind of silly.
 * 
 * But what if we start the other way around? If we just right away return a proxy around the data object,
 * and we pass that proxy a handler which contains the query? In that way, if you don't access any of the
 * fields, no extra work has to be done, it's super fast. If you access data.stack, it looks at the selection
 * set of the query and notices that you want stack(id: 5), so it gives you that with a new proxy wrapped
 * around it, to which it passes the selection set inside of stack(id: 5). If you go on to ask for
 * data.stack.zettelis, it sees that you wanted zettelis(last: 3), so it returns that, wrapped in a new
 * Proxy of course. Now inside that proxy we have an array, so things get a bit trickier. But not all that
 * much. You ask for any element in the array, you simply get a Proxy of that element with the selection
 * set given. Or if it sees that the selection set doesn't contain any keys with arguments, it could give
 * you the object directly if we don't need data masking and don't care about preventing writes. But
 * anyway, that would be a performance optimization that isn't important for now.
 * 
 * If you ask for any scalar field, you just get that value, no proxying there. For JSON scalar fields
 * that unfortunately means that you can change anything you want inside of them, and it will be
 * reflected everywhere else where a reference to that object is held. To avoid this, we could make a
 * copy or simply continue our proxy scheme ad-infinitum. But I say we should just not care for now.
 * 
 * One more question: How woudld I apply optimistic updates?
 * I think they should be lazily applied, meaning that I take the transaction (basically an action that
 * can read the store, then write to it) but don't apply it until some proxy tries to read it. Then
 * I cache the optimistic state.
 * 
 * Another thing to keep in mind is that referential equality should be preserved. Whenever I change
 * an object, I need to make a copy of it (or I could build some things with a versioned proxy. That
 * could be pretty cool as well, but probably too much work).
 * 
 * Furthermore, we probably also want to make sure that when you read a query, you first check if
 * you actually have that result in the store (otherwise you're reading partial data). It shouldn't
 * be too hard though, a quick look at the data will tell you whether it's there or not.
 * 
 * Okay, what are the basics that I need in my app:
 * 1 read a query with variable arguments (no fancy fragments etc.)
 * 2 Write a query with variable arguments into the store
 * 3 normalize when two queries write the same thing (by id+__typename)
 * 4 apply optimistic updates
 * 5 roll back optimistic updates
 * 
 * I don't think 1 or 2 will be hard. 3 might be a little trickier, but still pretty easy.
 * For 4 and 5 I don't have any plan yet, so I should first think about that.
 * 
 * Make sure this thing can be used with client-only fields. Make sure it supports transactions.
 * Make sure it supports serialization (for offline-support). Make sure it supports custom resolvers
 * with directives.
 * 
 * For union-type fragments, just give it the entire schema.
 */

 // TODO: Do it right or don't do it. No any committed. No fuzzy typing.

import {
    print,

    DocumentNode,
    SelectionNode,
    ArgumentNode,
    OperationDefinitionNode,
    FieldNode,
} from 'graphql';

// TODO:
// Add a function to ask the store whether it contains cached data for a given query.
// Add an option to return partial data while setting a flag.
// Make normalization optional (can be turned on or off)

export default class GraphQLStore {
    constructor(private state: any) {}

    public readQuery(query: DocumentNode, variables?: object): any {
        const selection = getOperationDefinitionOrThrow(query).selectionSet.selections;
        return { data: new Proxy(this.state.data, this.getHandler(selection, variables)) };
    }

    public writeQuery(query: DocumentNode, data: any, variables?: object) {
        const selection = getOperationDefinitionOrThrow(query).selectionSet.selections;
        this.state.data = this.writeSelectionSet(selection, data.data, this.state.data, variables);
    }

    // writes the selection set and returns the new store object at that key.
    public writeSelectionSet(selection: SelectionNode[], data: any, root: any, variables?: any): any {
        let newRoot = root;
        if (typeof newRoot === 'undefined') newRoot = Object.create(null);
        if (Array.isArray(data)) {
            // Check and write each array value to store.
            // TODO: this won't work on nested arrays.
            newRoot = [];
            data.forEach( (item, i) => {
                newRoot[i] = this.writeSelectionSet(selection, data[i], newRoot[i], variables);
            });
        } else {
            selection.forEach( selectionNode => {
                if (selectionNode.kind === 'Field') {
                    if(typeof data[selectionNode.name.value] === 'undefined') {
                        throw new Error(`Missing field ${selectionNode.name.value} in result ${JSON.stringify(data)}`);
                    }
                    const storeName = this.getStoreKeyFromNode(selectionNode, variables);
                    if(selectionNode.selectionSet) {
                        const normalizedKey = this.getStoreKeyFromObject(data[selectionNode.name.value]);
                        if (normalizedKey) {
                            this.state.nodes[normalizedKey] = this.writeSelectionSet(
                                selectionNode.selectionSet.selections,
                                data[selectionNode.name.value],
                                this.state.nodes[normalizedKey],
                                variables,
                            );
                            newRoot[storeName] = this.state.nodes[normalizedKey];
                        } else {
                            newRoot[storeName] = this.writeSelectionSet(
                                selectionNode.selectionSet.selections,
                                data[selectionNode.name.value],
                                newRoot[storeName],
                                variables,
                            );
                        }
                    } else {
                        // scalar value
                        newRoot[storeName] = data[selectionNode.name.value];
                    }
                } else if (selectionNode.kind === 'FragmentSpread') {
                    throw new Error('fragment spread writing not implemented yet');
                } else if (selectionNode.kind === 'InlineFragment') {
                    throw new Error('inline fragment writing not impelmented yet')
                }
            });
        }
        return newRoot;
    }

    public getStoreKeyFromNode(node: FieldNode, variables: any): string {
        if (node.arguments && node.arguments.length) {
            // TODO this is slow, break it out to speed things up.
            const getArgString = (arg: ArgumentNode) => {
                if (arg.value.kind === 'Variable') {
                    // TODO: serialize variables correctly
                    return `${arg.name.value}: ${JSON.stringify(variables[arg.value.name.value])}`;
                } else if (arg.value.kind === 'NullValue') {
                    return `${arg.name.value}: null`
                } else if (arg.value.kind === 'ListValue') {
                    throw new Error('List argument serialization not implemented')
                    // return '';
                } else if (arg.value.kind === 'ObjectValue') {
                    throw new Error('Object argument serialization not implemented')
                    // return '';
                } else if (arg.value.kind === 'StringValue') {
                   return `${arg.name.value}: "${arg.value.value}"` 
                }
                return `${arg.name.value}: ${arg.value.value}`;
            }
            return `${node.name.value}(${node.arguments.map(getArgString)})`;
        }
        return node.name.value;
    }

    public getStoreKeyFromObject(obj: any): string | undefined {
        if (obj.__id) {
            return obj.__id;
        } else if (obj.__typename && obj.id) {
            return `${obj.__typename}:${obj.id}`;
        }
        return undefined;
    }

    // Node: AST is a pretty bad representation for reading stuff out of the store
    // we have to iterate over the fields many many times. A map type thingy would be much better.

    /**
     * Here's basically the representation we'd want.
     * {
     *   'allStacks': {
     *     'id': true,
     *     '__typename': true,
     *     'name': true,
     *     'zettelis': 'zettelis(last: 2)',
     *     'zettelis(last: 2),
     *   }
     * }
     */

    // TODO: we're creating a proxy and a handler every time you access a field.
    // That might not be very smart. Is there a way we can reuse or memoize these?
    public getHandler(selection: SelectionNode[], variables?: any): object {
        const keys = () => {
            // TODO: check this more carefully, and make it work with fragments.
            
            const keys = selection.map((node: SelectionNode) => {
                if (node.kind === 'Field') {
                    if (node.alias) {
                        return node.alias.value;
                    }
                    return node.name.value;
                }
                return false;
            }).filter(n => !!n);
            return keys;
        }
        const get = (target: any, name: any) => {
            // console.log('GET', name);
            const node = selection.find((node: SelectionNode) => {
                if (node.kind === 'Field') {
                    if (node.alias) {
                        return node.alias.value === name;
                    }
                    return node.name && node.name.value === name;
                } else {
                    return false;
                }
            }) as FieldNode;
            if (node) {
                let storeName = this.getStoreKeyFromNode(node, variables);
                if (typeof target[storeName] === 'undefined') {
                    console.log('error at ', storeName);
                }
                // if node has arguments, we need to check those as well.
                
                if (node.selectionSet) {
                    if(Array.isArray(target[storeName])) {
                        return new Proxy(target[storeName], this.getArrayHandler(node.selectionSet.selections, variables));
                    }
                    return new Proxy(target[storeName], this.getHandler(node.selectionSet.selections, variables))
                }
                return target[storeName];
            } else {
                return undefined;
            }
        };

        return {
            ownKeys: keys,
            getOwnPropertyNames: keys,
            getOwnPropertyDescriptor: (target: any, prop: string) => {
                const val = get(target, prop);
                if (typeof val === 'undefined') {
                    return undefined;
                }
                return { enumerable: true, configurable: true, value: get(target, prop) };
            },
            get: get,
            set: () => false,
            preventExtensions: () => true,
            isExtensible: () => false,
            deleteProperty: () => false,
            defineProperty: () => false,
        };
    }

    public getArrayHandler(selection: SelectionNode[], variables: any): object {
        return {
            get: (target: any, name: any) => {
                // For length, non-existent properties etc. we just do a passthrough
                if(typeof target[name] !== 'object') {
                    return target[name];
                }
                // TODO: Does this deal with nested arrays?
                if(Array.isArray(target[name])) {
                    return new Proxy(target[name], this.getArrayHandler(selection, variables));
                }
                return new Proxy(target[name], this.getHandler(selection, variables));
            },
            set: () => false,
        }
    }
}

function getOperationDefinitionOrThrow(query: DocumentNode): OperationDefinitionNode {
    let ret: OperationDefinitionNode | undefined;
    query.definitions.forEach( def => {
        if (def.kind === 'OperationDefinition') {
            ret = def;
            return;
        }
    });
    if (!ret) {
        throw new Error(`No operation definition found in query ${print(query)}`)
    }
    return ret;
}