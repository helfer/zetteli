import { makeExecutableSchema } from 'graphql-tools';

const typeDefs = `

type Zetteli {
    id: String!
    datetime: String!
    tags: [String!]!
    body: String!
}

type Query {
    zettelis: [Zetteli]
}

`;

const schema = makeExecutableSchema({ typeDefs });

export default schema;
