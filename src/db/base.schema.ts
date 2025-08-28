import mongoose, { Schema } from 'mongoose';

const BaseSchema = (): Schema =>
  new mongoose.Schema(
    {},
    {
      strict: false,
      toObject: {
        transform: (doc, ret) => {
          ret.id = ret._id;
          delete ret._id;
        },
      },
      toJSON: {
        transform: (doc, ret) => {
          ret.id = ret._id;
          delete ret._id;
        },
      },
    },
  );

export const extendBaseSchema = (schema: Schema): Schema => {
  schema.set('strict', false);
  schema.set('toObject', { virtuals: true });
  schema.set('toJSON', { virtuals: true });

  // Add common fields to the schema
  schema.add({
    isDeleted: { type: Boolean, default: false }, // Soft delete flag
    deletedAt: { type: Date }, // Timestamp for soft deletion
    deletedBy: { type: String }, // User who deleted the document
    createdBy: { type: String }, // User who created the document
    updatedBy: { type: String }, // User who last updated the document
  });

  return schema;
};
