import { WebSocketLink } from '@apollo/client/link/ws'
import { setContext } from '@apollo/client/link/context'
import {
    ApolloClient,
    ApolloLink,
    createHttpLink,
    InMemoryCache,
    split,
} from '@apollo/client'
import { getMainDefinition } from '@apollo/client/utilities'
import { createUploadLink } from 'apollo-upload-client'
import { RestLink } from 'apollo-link-rest'

const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    const token = localStorage.getItem('Kanvas - Bearer')

    // return the headers to the context so httpLink can read them
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
            contentType: 'application/json',
        },
    }
})

const apolloClient = new ApolloClient({
    link: ApolloLink.from([authLink]),
    uri: 'http://localhost:3003/graphql',
    cache: new InMemoryCache(),
})

export default apolloClient
