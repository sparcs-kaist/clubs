export interface SecretKeyData {
  id: number;
  createdAt: Date;
  secretKey: string;
  deletedAt: Date | null;
}

export interface CreateSecretKeyResponse {
  message: string;
  createdKey: SecretKeyData;
}
