import { makeExecutableSchema } from 'graphql-tools';
import Zetteli, { ZetteliType } from './models/Zetteli';
import InMemoryZetteliConnector from './connectors/InMemoryZetteliConnector';

import TestData from './test/TestData';

const typeDefs = `

type Zetteli {
    id: String!
    datetime: String!
    tags: [String!]!
    body: String!
}

input ZetteliInput {
    id: String!
    datetime: String!
    tags: [String!]!
    body: String!   
}

type Query {
    zettelis: [Zetteli]
}

type Mutation {
    createZetteli(z: ZetteliInput): String
    updateZetteli(z: ZetteliInput): Boolean
    deleteZetteli(id: String): Boolean
}

`;

const zetteli = new Zetteli(new InMemoryZetteliConnector(TestData.zettelis));
const resolvers = {
    Query: {
        zettelis(){ return zetteli.getAll() },
    },
    Mutation: {
        createZetteli(root: {}, args: { z: ZetteliType}) {
            return zetteli.create(args.z);
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
