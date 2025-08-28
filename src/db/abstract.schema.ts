export interface AbstractSchema {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  isDeleted: boolean;
  deletedAt: Date;
}
