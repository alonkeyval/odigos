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

export const GetLiveTradeGQL = gql`
  subscription live_trade {
    liveTrade(symbol: "DELTA") {
      symbol
      last_price
      volume
      high
      low
    }
  }
`;
