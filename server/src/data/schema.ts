import { makeExecutableSchema } from 'graphql-tools';
import {
    GraphQLDateTime as DateTime,
} from 'graphql-iso-date';

import Zetteli, { ZetteliType } from './models/Zetteli';
// import InMemoryZetteliConnector from './connectors/InMemoryZetteliConnector';
import SQLZetteliConnector from './connectors/SQLZetteliConnector';

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

const typeDefs = `

scalar DateTime

type Zetteli {
    id: String!
    datetime: DateTime!
    tags: [String!]!
    body: String!
}

type Stack {
    id: String!
    name: String
    zettelis: [Zetteli]
}

input ZetteliInput {
    id: String!
    datetime: DateTime
    tags: [String!]
    body: String
}

type Query {
    stack(id: String): Stack
}

type Mutation {
    createZetteli(sid: String!, z: ZetteliInput!): String
    updateZetteli(z: ZetteliInput!): Boolean
    deleteZetteli(id: String!): Boolean
}

`;

const zetteli = new Zetteli(new SQLZetteliConnector(knexConfig.development));
const resolvers = {
    Query: {
        stack(root: {}, args: { id: string }){ 
            return {
                zettelis: zetteli.getAll(args.id),
            }
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
        }
    }
}

const schema = makeExecutableSchema({ typeDefs, resolvers });

export default schema;
