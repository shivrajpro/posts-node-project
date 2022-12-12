const { buildSchema } = require('graphql');

// ! is to make the field required
module.exports = buildSchema(`
    type Post{
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User!
        createdAt: String!
        updatedAt: String!
    }    

    type User{
        _id:ID!
        username: String!
        email: String!
        password:String
        status:String!
        posts:[Post!]!
    }

    input UserInputData{
        email:String!
        username:String!
        password:String!
    }

    type RootMutation{
        createUser(userInput: UserInputData): User!
    }

    type RootQuery{
        hello: String
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`)