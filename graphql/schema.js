const { buildSchema } = require('graphql');

// ! is to make the field required
module.exports = buildSchema(`
    type TestData{
        text: String!
        views: Int!
    }

    type RootQuery{
        hello: TestData!
    }

    schema {
        query: RootQuery
    }
`)