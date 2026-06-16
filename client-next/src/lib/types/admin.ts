export type AdminUser = {
  id: string;
  username: string;
  email: string;
};

export type AuthResponse = {
  message: string;
  accessToken: string;
  refreshToken: string;
  admin: AdminUser;
};

export type CloudinaryUploadResult = {
  url: string;
  public_id: string;
  resource_type?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  original_filename?: string;
  mimetype?: string;
};

export type FileRecord = {
  id: string;
  url?: string;
  publicId?: string;
  filename?: string;
  originalName?: string;
  mimetype?: string;
  size?: number;
  uploadedAt: string;
  city?: string;
  pageCount?: number;
  thumbUrl?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};
