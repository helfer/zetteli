import { makeExecutableSchema } from 'graphql-tools';
import {
    GraphQLDateTime as DateTime,
} from 'graphql-iso-date';

import Zetteli, { ZetteliType } from './models/Zetteli';
import Stack, { StackType } from './models/Stack';
import { LogEvent } from './models/LogEvent';
// import InMemoryZetteliConnector from './connectors/InMemoryZetteliConnector';
import SQLZetteliConnector from './connectors/SQLZetteliConnector';
import SQLStackConnector from './connectors/SQLStackConnector';
import SQLLogConnector from './connectors/SQLLogConnector';

import { PubSub } from 'graphql-subscriptions';

const EVENT_LOG_POLLING_INTERVAL = 250;

// TODO(helfer): get this working, you shouldn't duplicate...
// import knexConfig from './config/knexfile';
const knexConfig = {
    development: {
      client: 'sqlite3',
      connection: {
        filename: './dev.sqlite3',
      },
      useNullAsDefault: true,
    }
};

// import TestData from './test/TestData';

export const typeDefs = `
scalar DateTime

type Zetteli {
    id: String!
    versionId: Int!
    datetime: DateTime!
    tags: [String!]!
    body: String!
    # _versionId: Int # We don't need it now, but we should add it later.
}

input ZetteliInput {
    id: String!
    datetime: DateTime
    tags: [String!]
    body: String
}

type Stack {
    id: String!
    versionId: Int!
    name: String!
    public: Boolean!
    createdAt: DateTime!
    settings: StackSettings!
    zettelis: [Zetteli!]!
    log: Log!
    zettelisConnection(last: Int!, before: String): ZetteliConnection! # I don't need first and after (yet)
}

type ZetteliConnection {
    edges: [ZetteliEdge!]!
    pageInfo: PageInfo!
}

type ZetteliEdge {
    node: Zetteli!
    cursor: String!
}

type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    # firstCursor: String # Just an idea for not having to return every bloody cursor
    # lastCursor: String
}

input StackInput {
    id: String!
    name: String!
    public: Boolean!
    createdAt: DateTime!
    settings: StackSettingsInput!
}

type StackSettings {
    defaultTags: [String!]!
}

input StackSettingsInput {
    defaultTags: [String]
}

type Log {
    name: String!
    # partition: ID
    currentVersionId: Int!
    events(sinceVersionId: Int!): [LogEvent]
}

type LogEvent {
    id: Int!
    opId: String!
    type: String!
    sid: String! # stackId
    eventTime: DateTime!
    eventSchemaId: Int!
    payload: String! # technically JSON
}


type Query {
    stack(id: String!): Stack
    stacks: [Stack!]!
    log: Log
}

type Mutation {
    createZetteli(sid: String!, z: ZetteliInput!): String
    updateZetteli(z: ZetteliInput!): Boolean
    deleteZetteli(id: String!): Boolean

    createStack(s: StackInput!): Boolean
    updateStack(s: StackInput!): Boolean
    deleteStack(id: String!): Boolean
}

type Subscription {
    currentVersionId: String
    events(stackId: String!, sinceVersionId: Int!): [LogEvent!]!
}
`;

export const pubsub = new PubSub();

const zetteli = new Zetteli(new SQLZetteliConnector(knexConfig.development));
const stack = new Stack(new SQLStackConnector(knexConfig.development));
const logConnector = new SQLLogConnector(knexConfig.development);
export const resolvers = {
    Query: {
        stack(root: {}, args: { id: string }){
            return stack.get(args.id);
        },
        stacks(){
            // TODO(helfer): Remove empty argument that's just here because
            // the connector interface was made for zettelis where getAll takes an sid.
            return stack.getAll('');
        },
        log() {
            return {
                name: 'The Log',
                currentVersionId: logConnector.getCurrentVersionId(),
            };
        }, 
    },
    Stack: {
        zettelis(stack: StackType) {
            return zetteli.getAll(stack.id);
        },
    },
    Log: {
        events(root: {}, args: { sinceVersionId: number }) {
            return logConnector.getEvents(args.sinceVersionId);
        },
    },
    DateTime: DateTime,
    Mutation: {
        createZetteli(root: {}, args: { sid: string, z: ZetteliType}) {
            return zetteli.create(args.sid, args.z);
        },
        updateZetteli(root: {}, args: { z: ZetteliType}) {
            return zetteli.update(args.z);
        },
        deleteZetteli(root: {}, args: { id: string }) {
            return zetteli.delete(args.id);
        },

        createStack(root: {}, args: { sid: string, s: StackType}) {
            return stack.create(args.sid, args.s);
        },
        updateStack(root: {}, args: { s: StackType}) {
            return stack.update(args.s);
        },
        deleteStack(root: {}, args: { id: string }) {
            return stack.delete(args.id);
        }
    },
    Subscription: {
        events: {
            resolve: (p: any) => p,
            subscribe: (root: {}, args: { stackId: string, sinceVersionId: number }) => {
                return eventsSince(args.stackId, args.sinceVersionId);
            }
        }
    }
}

const eventsSince = (stackId: string, sinceVersionId: number) => ({
    '@@asyncIterator': () => {
        let currentOffset = sinceVersionId;
        return {
            next: () => new Promise( resolve => {
                const tryFetchEvents = () => logConnector.getEvents(currentOffset).then( events => {
                    if (events.length > 0) {
                        currentOffset = events[events.length -1].id;
                        resolve({
                            done: false,
                            // TODO: add stackId to update and delete events so we can filter events
                            value: events.filter(((e: LogEvent) => !e.sid || e.sid === stackId )),
                        })
                    } else {
                        setTimeout(tryFetchEvents, EVENT_LOG_POLLING_INTERVAL);
                    }
                });
                tryFetchEvents();
            }),
        };
    },
});

const schema = makeExecutableSchema({ typeDefs, resolvers });

export default schema;
