import { gql } from '@apollo/client';

export const MESSAGE_STREAM_SUBSCRIPTION = gql`
  subscription {
    messageStream {
      type
      data
      event
      target
      crdType
    }
  }
`;
