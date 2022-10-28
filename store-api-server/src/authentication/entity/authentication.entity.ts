export interface TokenGateEndpointInfo {
  allowedTokens?: (number | string)[];
  userOwnsTokens: (number | string)[];
  userHasAccess: boolean;
}
