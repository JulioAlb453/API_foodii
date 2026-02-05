export interface TokenPayload {
  id: string;
  username: string;
}

export interface TokenService {
  generate(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}