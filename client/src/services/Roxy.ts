 // Do it right or don't do it. No any committed. No fuzzy typing.

 import {
    print,

    FragmentDefinitionNode,
    DocumentNode,
    SelectionSetNode,
    SelectionNode,
    ArgumentNode,
    InlineFragmentNode,
    // NamedTypeNode,
    OperationDefinitionNode,
    FieldNode,
} from 'graphql';

// import { Map as ImmutableMap } from 'immutable';

// const _parents = Symbol.for('parent');

interface SerializableObject {
    [key: string]: SerializableValue[] | SerializableValue;
}

type JSONScalar = object;

type SerializableValue = SerializableObject | Number | String | JSONScalar | null;

interface ReadContext {
    // query: DocumentNode;
    variables?: SerializableObject;
    context?: SerializableObject;
    rootId?: string; // default 'QUERY', can be things like 'Stack:5', 'QUERY/allStacks'
    optimistic?: boolean;
}

type WriteContext = ReadContext;

/* interface ProxyHandler {
    get: (obj: GraphNode, name: string) => any;
} */

type UnsubscribeFunction = () => void;

interface Subscriber {
    next: (o: SerializableObject) => void;
    error: (e: Error) => void;
    complete: () => void;
}

interface Observable {
    subscribe: (subscriber: Subscriber) => UnsubscribeFunction;
}

interface TransactionInfo {
    id: number,
    subscribersToNotify: Subscriber[];
}

interface FragmentMap { [key: string]: FragmentDefinitionNode }

interface WriteInfo {
    variables: SerializableObject;
    context?: any,
    fragmentDefinitions: FragmentMap,
    query: DocumentNode,
    rootId: string,
    txInfo: TransactionInfo, 
}

type NodeIndex = { [key: string]: GraphNode };

const QUERY_ROOT_ID = 'QUERY';

interface GraphNodeData {
    [key: string]: GraphNode | GraphNode[] | SerializableValue
}

export class GraphNode {
    public readonly __type = 'GraphNode';
    public parents: { node: GraphNode, key: string | number }[] = [];
    public indexEntry: { index: NodeIndex, key: string };
    public subscribers: Subscriber[] = [];
    private transactionId: number; // The transaction this node was written by.
    protected data: GraphNodeData;
    private newerVersion: GraphNode | undefined;

    public constructor(tx: TransactionInfo, data?: { [key: string]: GraphNode | GraphNode[] | SerializableValue }) {
        this.transactionId = tx.id;
        this.data = data || Object.create(null);
    }

    private notifySubscribers(tx: TransactionInfo) {
        tx.subscribersToNotify = tx.subscribersToNotify.concat(this.subscribers);
    }

    // Copy parents over from old node, creating a new reference of the parent where necessary
    // Also updates the index entry
    public adoptParents(previousNode: GraphNode, tx: TransactionInfo) {
        this.parents = previousNode.parents.map(parent => {
            return {
                node: parent.node.set(parent.key, this, tx),
                key: parent.key
            }
        });
        this.indexEntry = previousNode.indexEntry;
        if (this.indexEntry) {
            this.indexEntry.index[this.indexEntry.key] = this;
        }
    }

    // TODO: could I just use immutable here?
    public set(key: string | number, value: GraphNode | SerializableValue, tx: TransactionInfo): GraphNode {
        if (this.newerVersion) {
            // Always set on the newest version
            return this.newerVersion.set(key, value, tx);
        }
        // TODO: if value is an array, treat it differently.
        if (this.data[key] === value) {
            return this;
        }
        if (this.transactionId === tx.id) {
            // During a transaction, we only copy the node for the first change.
            this.data[key] = value;
            return this;
        }
        const newNode = new GraphNode(tx, { ...this.data, [key]: value });
        newNode.adoptParents(this, tx);
        this.notifySubscribers(tx);
        this.newerVersion = newNode;
        return newNode;
    }

    public get(key: string | number): GraphNode | SerializableValue | undefined {
        return this.data[key];
    }
    public getProxy(selectionSet: SelectionSetNode, variables: SerializableObject) {
        return new Proxy(this.data, new ObjectHandler(selectionSet, variables));
    }

    public addParent(node: GraphNode, key: string | number) {
        this.parents.push({ node, key });
    }

    public setIndexEntry(index: NodeIndex, key: string) {
        this.indexEntry = { index, key };
    }
}

export class ArrayGraphNode extends GraphNode {
    public getProxy(selectionSet: SelectionSetNode, variables: SerializableObject) {
        // TODO: this is a hack
        const arr = Object.keys(this.data).map(node => this.data[node]);
        return new Proxy(arr, new ArrayHandler(selectionSet, variables));
    }
}

export default class Store {
    public nodeIndex: NodeIndex;
    private lastTransactionId = 0;
    constructor(/* private data: { QUERY: GraphNode } */) {
        this.nodeIndex = Object.create(null);
    }

    public readQuery(query: DocumentNode, variables?: object) {
        return { data: this.read(query, { variables: variables as SerializableObject }) };
    };
    public writeQuery(query: DocumentNode, data: any, variables?: object) {
        return this.write(query, data.data, { variables: variables as SerializableObject });
    };

    // TODO: Figure out how to type the return value here
    // TODO: Make a version that doesn't use proxies but copies the object instead?
    // Read just reads once, returns an immutable result.
    // Challenge: if two queries read the exact same node/subtree out of the graph,
    // those subtrees should be referentially equal. Not sure how to do that right now.
    public read(query: DocumentNode, context?: ReadContext): object {
        const rootId = context && context.rootId || QUERY_ROOT_ID;
        const rootSelectionSet = getOperationDefinitionOrThrow(query).selectionSet;
        const variables = context && context.variables || Object.create(null);
        const rootNode = this.nodeIndex[rootId];
        if (!rootNode) {
            return rootNode;
        }
        return rootNode.getProxy(rootSelectionSet, variables);
    } 

    // Return a boolean that indicates whether anything in the store has changed.
    public write(query: DocumentNode, data: SerializableObject, context?: WriteContext): boolean {
        const txInfo: TransactionInfo = {
            id: this.lastTransactionId++,
            subscribersToNotify: [],
        };
        const rootSelectionSet = getOperationDefinitionOrThrow(query).selectionSet;
        const fragmentDefinitionMap = getFragmentDefinitionMap(query)
        // Call writeSelectionSet
        //   - recursively call writeSelectionSet on the result fields, starting at rootId.
        //   - for scalars: write each field in selection set iff it has changed.
        //     - for JSON scalars, do a deepEquals to be sure.
        //   - keep track if you've updated any fields. If you have, you must create a new
        //     object and pass it to the parent. To do this, keep a Map on the operation with
        //     parent -> [children, to, update].
        //   - When all data is written, go through the map of parents to update, and udpate
        //     its children there, creating a new parent and adding an entry to the parent update map.
        //   - While updating parents, keep a list of nodes that were already updated in this operation.
        //     due to cycles it's possible that a node may need to be updated twice. In that case, 
        //     the node should not be copied, but instead the object should be updated in place, and no
        //     new entry should be added to the parent map.
        //   - Any subscribers encountered in the update operation should be added to the set of
        //     subscribers to notify. At the very end of the update, we schedule subscribers for notification
        //     on the next tick.
        //   - PROBLEM: Just because a node is updated doesn't mean that the change affects this
        //     subscriber. This is especially true of the root node. But let's solve this problem some other
        //     day.
        const rootId = context && context.rootId || QUERY_ROOT_ID;
        const rootNode: GraphNode | undefined = this.nodeIndex[rootId];

        const writeInfo: WriteInfo = {
            variables: context && context.variables || {},
            context: context && context.context || undefined,
            fragmentDefinitions: fragmentDefinitionMap,
            query,
            rootId,
            txInfo,
        }

        this.nodeIndex[rootId] = this.writeSelectionSet(rootNode, rootSelectionSet, data, writeInfo);

        return true;
    }

    private writeSelectionSet(
        node: GraphNode | undefined,
        selectionSet: SelectionSetNode,
        data: SerializableObject,
        info: WriteInfo
    ): GraphNode {
        // TODO: Update / set index if node with key has been written.
        let newNode = node || this.getExistingGraphNode(data) || new GraphNode(info.txInfo);
        selectionSet.selections.forEach( selection => {
            if (selection.kind === 'Field') {
                const dataName: string = (selection.alias && selection.alias.value) || selection.name.value;
                if(typeof data[dataName] === 'undefined') {
                    throw new Error(`Missing field ${dataName} in data for ${print(info.query)}`);
                }
                newNode = this.writeField(newNode, selection, data[dataName], info);
            } else {
                let fragment: InlineFragmentNode | FragmentDefinitionNode;
                if (selection.kind === 'InlineFragment') {
                    fragment = selection;
                } else {
                    fragment = info.fragmentDefinitions[selection.name.value];
                    if (!fragment) {
                        throw new Error(`No fragment named ${selection.name.value} in query print(${info.query})`);
                    }
                }
                if (isMatchingFragment(fragment, data)) {
                    newNode = this.writeSelectionSet(newNode, fragment.selectionSet, data, info);
                }
            }
        });
        const indexKey = getStoreKeyFromObject(data);
        if (indexKey) {
            newNode.setIndexEntry(this.nodeIndex, indexKey);
            this.nodeIndex[indexKey] = newNode;
        }
        return newNode;
    }

    private getExistingGraphNode(data: SerializableObject): GraphNode | undefined {
        const key = getStoreKeyFromObject(data);
        return key ? this.nodeIndex[key] : undefined;
    }

    private writeArrayNode(
        node: GraphNode,
        storeName: string,
        field: FieldNode,
        data: SerializableObject[],
        info: WriteInfo,
    ): GraphNode {
        // If it's a simple array
        // Create an intermediate node to represent the array
        const existingArrayNode = node.get(storeName);
        let arrayNode: ArrayGraphNode;
        if( existingArrayNode instanceof ArrayGraphNode) {
            arrayNode = existingArrayNode;
        } else {
            arrayNode = new ArrayGraphNode(info.txInfo);
        }
        // Create a child node for each element in the array.
        data.forEach( (arrayElement, i) => {
            const currentElement = arrayNode.get(i);
            const childNode = this.writeSelectionSet(
                currentElement instanceof GraphNode ? currentElement : undefined,
                field.selectionSet as SelectionSetNode,
                arrayElement,
                info,
            );
            arrayNode = arrayNode.set(i, childNode, info.txInfo);
            childNode.addParent(arrayNode, i);
        });
        // Set the field on the parent node.
        const parentNode = node.set(
            storeName,
            arrayNode,
            info.txInfo,
        );
        arrayNode.addParent(parentNode, storeName);
        return parentNode;
    }

    // TODO: Pass only what the field needs to know to the field. Hold back all other info.
    private writeField(
        node: GraphNode,
        field: FieldNode,
        data: SerializableValue,
        info: WriteInfo
    ): GraphNode {
        const storeName: string = getStoreName(field, info.variables);
        if (field.selectionSet === null || typeof field.selectionSet === 'undefined' || data === null) {
            // Scalar (maybe array) field or null value
            return node.set(storeName, data, info.txInfo);
        } else {
            if (Array.isArray(data)) {
                return this.writeArrayNode(
                    node,
                    storeName,
                    field,
                    data,
                    info,
                );
                // If it's a nested array
                    // Recurse in this function, create the child nodes when it's not an array
                    // any more. Set parent on all the great* grandchildren.
            } else {
                const currentChild = node.get(storeName);
                const childNode = this.writeSelectionSet(
                    currentChild instanceof GraphNode ? currentChild : undefined,
                    field.selectionSet,
                    data as SerializableObject,
                    info,
                );
                const parentNode = node.set(
                    storeName,
                    childNode,
                    info.txInfo,
                );
                childNode.addParent(parentNode, storeName);
                return parentNode; 
            }
        }
    }

    public observe(query: DocumentNode, context: ReadContext): Observable {
        return {
            subscribe: (subscriber: Subscriber) => {
                // 1. Add subscriber to list of subscribers for rootId graph node
                // 2. Whenever rootId is changed, check if any of the observed fields have changed
                // 3. If rootId is deleted, call complete on observable

                throw new Error('Subscribe not implemented yet');
                // return () => null;

                // On unsubscribe, remove subscriber from list of subscribers for that graph node.
            }
        }
    }

    // transaction
    public tx(update: (store: Store) => void): void {
        update(this);
        throw new Error('TODO: store transaction');
    }

    /* private getHandler(query: SelectionSetNode, context: ReadContext): ProxyHandler {
        // TODO: make this more efficient later
        return { get(obj: GraphNode, name: string) { return obj[name] } };
    } */
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

function getFragmentDefinitionMap(query: DocumentNode): FragmentMap {
    let ret: { [key: string]: FragmentDefinitionNode} = Object.create(null);
    query.definitions.forEach( def => {
        if (def.kind === 'FragmentDefinition') {
            ret[def.name.value] = def;
        }
    });
    return ret;
}

function isMatchingFragment(fragment: InlineFragmentNode | FragmentDefinitionNode, data: SerializableObject) {
    if (!fragment.typeCondition) {
        // No type condition means fragment always matches
        return true;
    }
    // TODO: match on union and interface types
    return data.__typename === fragment.typeCondition.name.value;
}

function getStoreName(node: FieldNode, variables: SerializableObject): string {
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

function getStoreKeyFromObject(obj: SerializableObject): string | undefined {
    if (obj.__id) {
        return obj.__id as string | undefined;
    } else if (obj.__typename && obj.id) {
        return `${obj.__typename}:${obj.id}`;
    }
    return undefined;
}

function getFieldNodeFromSelectionSet(
    selectionSet: SelectionSetNode,
    fieldName: string,
    data: SerializableObject,
): FieldNode | undefined {
    let matchingNode: FieldNode | undefined = undefined;
    selectionSet.selections.find((node: SelectionNode) => {
        if (node.kind === 'Field') {
            if (node.alias && node.alias.value === fieldName) {
                matchingNode = node;
                return true;
            }
            if (node.name && node.name.value === fieldName) {
                matchingNode = node;
                return true;
            }
        } else if (node.kind === 'InlineFragment') {
            if (isMatchingFragment(node, data)) {
                matchingNode = getFieldNodeFromSelectionSet(node.selectionSet, fieldName, data);
                return !!matchingNode;
            }
        } else if (node.kind === 'FragmentSpread') {
            // To support this, we just need to pass in the fragment map that we construct when we get
            // the document.
            console.error('Named fragment reading not implemented yet');
        }
        return false;
    });
    return matchingNode;
}

export class ArrayHandler {
    public constructor(private selectionSet: SelectionSetNode, private variables: SerializableObject) {
    } 
    
    public get(target: Array<GraphNode>, name: string) {
        // For length, non-existent properties etc. we just do a passthrough
        if(typeof target[name] !== 'object') {
            return target[name];
        }
        // TODO: Through the iterator it seems to be possible to directly access the underlying graphNode
        return target[name].getProxy(this.selectionSet, this.variables);
    }
    public set() { return false; }
}

export class ObjectHandler {
    public constructor(private selectionSet: SelectionSetNode, private variables: SerializableObject) {
    }

    public get(target: GraphNodeData, name: string): any {
        const node = getFieldNodeFromSelectionSet(this.selectionSet, name, target);
        if (node) {
            const storeName = getStoreName(node, this.variables);
            const value = target[storeName]
            if (typeof value === 'undefined') {
                console.log('unexpected undefined value at ', storeName);
            } else if (value === null) {
                return null;
            } else if (node.selectionSet) {
                if(value instanceof ArrayGraphNode) {
                    // return new Proxy(target[storeName], this.getArrayHandler(node.selectionSet.selections, variables));
                    return (value as ArrayGraphNode).getProxy(node.selectionSet, this.variables);
                }
                return (value as GraphNode).getProxy(node.selectionSet, this.variables);
            }
            // It's a scalar
            return value;
        } else {
            // This happens for a whole bunch of Symbol accesses etc.
            return undefined;
        }
    }

    public ownKeys(): string[] {
        // TODO: check this more carefully, and make it work with fragments.
       return this.selectionSet.selections.map((node: SelectionNode) => {
            if (node.kind === 'Field') {
                if (node.alias) {
                    return node.alias.value;
                }
                return node.name.value;
            }
            return '';
        }).filter(n => !!n);
    }

    public getOwnPropertyDescriptor(target: GraphNodeData, prop: string) {
        const val = this.get(target, prop);
        if (typeof val === 'undefined') {
            return undefined;
        }
        // TODO: why is this value not just val? There was a reason, but I don't remember now.
        return { enumerable: true, configurable: true, value: this.get(target, prop) };
    }

    public set(){ return false; }
    public preventExtensions(){ return false; }
    public isExtensible(){ return false; }
    public deleteProperty(){ return false; }
    public defineProperty(){ return false; }
}