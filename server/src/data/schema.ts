import { makeExecutableSchema } from 'graphql-tools';
import {
    GraphQLDateTime as DateTime,
} from 'graphql-iso-date';

import Zetteli, { ZetteliType } from './models/Zetteli';
import Stack, { StackType } from './models/Stack';
// import InMemoryZetteliConnector from './connectors/InMemoryZetteliConnector';
import SQLZetteliConnector from './connectors/SQLZetteliConnector';
import SQLStackConnector from './connectors/SQLStackConnector';
import SQLLogConnector from './connectors/SQLLogConnector';

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
    zettelis: [Zetteli]
    log: Log
}

input StackInput {
    id: String!
    name: String!
    public: Boolean!
    createdAt: DateTime!
    settings: StackSettingsInput!
}

type StackSettings {
    defaultTags: [String]
}

input StackSettingsInput {
    defaultTags: [String]
}

type Log {
    name: String
    # partition: ID
    currentVersionId: Int
    events(sinceVersionId: Int!): [LogEvent]
}

type LogEvent {
    id: Int!
    opId: String!
    type: String!
    eventTime: DateTime!
    eventSchemaId: Int!
    payload: String # technically JSON
}


type Query {
    stack(id: String): Stack
    stacks: [Stack]
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

`;

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
    }
}

const schema = makeExecutableSchema({ typeDefs, resolvers });

export default schema;
