'use client';

import { ApolloLink, HttpLink, split } from '@apollo/client';
import {
  ApolloNextAppProvider,
  InMemoryCache,
  ApolloClient,
} from '@apollo/experimental-nextjs-app-support';
import { onError } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';

function makeClient() {
  const httpLink = new HttpLink({
    uri: 'http://localhost:8085/graphql',
  });

  const wsLink =
    typeof window !== 'undefined'
      ? new GraphQLWsLink(
          createClient({
            url: 'ws://localhost:8085/graphql',
            connectionParams: {
              reconnectAttempts: 10, // Custom parameter for example purposes
            },
          })
        )
      : null;

  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) =>
        console.log(
          `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
        )
      );
    }
    if (networkError) console.log(`[Network error]: ${networkError}`);
  });

  const link = wsLink
    ? split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          );
        },
        wsLink,
        ApolloLink.from([errorLink, httpLink])
      )
    : ApolloLink.from([errorLink, httpLink]);

  return new ApolloClient({
    cache: new InMemoryCache({
      addTypename: false,
    }),
    link,
    devtools: {
      enabled: true,
    },
  });
}
const client = makeClient();
export function ApolloWrapper({ children }: React.PropsWithChildren<{}>) {
  return (
    <ApolloNextAppProvider makeClient={() => client}>
      {children}
    </ApolloNextAppProvider>
  );
}

export { client };
