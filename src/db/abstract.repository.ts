import { Logger } from '@nestjs/common';
import { BulkWriteResult } from 'mongodb';
import { FilterQuery, Model, PipelineStage, Types, UpdateQuery } from 'mongoose';

import { LookupOptions } from './interface/generic-mongo.interface';
import { ISearchQuery, PaginatedResult } from '@/shared/interface/common.interface';

export abstract class AbstractRepository<T> {
  protected abstract readonly logger: Logger;
  constructor(public readonly model: Model<T>) {}

  async create(document: Partial<T>): Promise<T> {
    const createdDocument = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });
    return (await createdDocument.save()).toJSON() as unknown as T;
  }

  async createMany(documents: Partial<T>[]): Promise<T[]> {
    const docsWithIds = documents.map(doc => ({
      ...doc,
    }));

    const createdDocuments = await this.model.insertMany(docsWithIds);

    return createdDocuments as T[];
  }

  async bulkCreate(documents: Partial<T>[]): Promise<BulkWriteResult> {
    // Prepare bulk operations
    const operations = documents.map(doc => ({
      insertOne: {
        document: {
          ...doc,
        },
      },
    }));

    // Execute bulk write operation with ordered: false for parallel processing
    return this.model.bulkWrite(operations as any[], {
      ordered: false,
    });
  }

  async findOne(filterQuery: FilterQuery<T>): Promise<T> {
    const document = await this.model.findOne(filterQuery, {}, { lean: true });

    return document as unknown as T;
  }

  async findById(id: string | Types.ObjectId): Promise<T> {
    const document = await this.model.findById(id, {}, { lean: true });

    return document as unknown as T;
  }

  async findByIdAndDelete(id: string | Types.ObjectId): Promise<T> {
    const document = await this.model.findByIdAndDelete(id, {
      lean: true,
    });

    return document as unknown as T;
  }

  async findOneAndUpdate(filterQuery: FilterQuery<T>, update: UpdateQuery<T>): Promise<T> {
    const document = await this.model.findOneAndUpdate(filterQuery, update, {
      lean: true,
      new: true,
      upsert: true,
    });

    return document as unknown as T;
  }

  async find(filterQuery: FilterQuery<T>): Promise<T[]> {
    return this.model.find(filterQuery, {}, { lean: true }) as unknown as T[];
  }

  async findOneAndDelete(filterQuery: FilterQuery<T>): Promise<T> {
    return this.model.findOneAndDelete(filterQuery, {
      lean: true,
    }) as unknown as T;
  }

  // Soft delete
  async softDelete(filterQuery: FilterQuery<T>, userId: string): Promise<boolean> {
    const data = await this.model
      .findByIdAndUpdate(filterQuery, {
        isDeleted: true,
        deletedBy: userId,
        deletedAt: Date.now(),
      })
      .exec();
    return !!data;
  }

  async delete(filterQuery: FilterQuery<T>): Promise<boolean> {
    const data = await this.model.deleteOne(filterQuery).exec();
    return !!data;
  }

  async deleteMany(filterQuery: FilterQuery<T>): Promise<boolean> {
    const data = await this.model.deleteMany(filterQuery).exec();
    return !!data;
  }

  // Pagination with aggregation
  async fetchByPagination(
    query: ISearchQuery | any,
    sort: any,
    skip: number,
    limit: number,
    offset: number,
    select?: any,
    lookup?: LookupOptions | LookupOptions[],
  ): Promise<PaginatedResult<T>> {
    try {
      const [countResult, dataResult] = await Promise.all([
        this.model.countDocuments(query).exec(),
        this.model
          .aggregate([
            { $match: query },
            ...(lookup ? this.buildLookupStages(lookup) : []),
            { $sort: sort },
            ...(select ? [{ $project: select }] : []),
            { $skip: skip },
            { $limit: limit },
            {
              $addFields: {
                id: { $toString: '$_id' },
              },
            },
          ])
          .exec(),
      ]);

      const total = countResult;
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = offset < totalPages;

      return {
        data: dataResult,
        total,
        totalPages,
        hasNextPage,
      };
    } catch (error) {
      console.error('Fetch pagination error:', error);
      throw error;
    }
  }

  // Bulk update
  async bulkUpdate(bulkOps: any): Promise<{ matchedCount: number; modifiedCount: number } | null> {
    try {
      const result = await this.model.bulkWrite(bulkOps);

      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
      };
    } catch (error) {
      this.logger.error('Error in bulk update', error);
      return null;
    }
  }

  // Update many documents
  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    const result = await this.model.updateMany(filter, update).exec();
    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  }

  // Get distinct values
  async distinct<K extends keyof T>(
    field: K,
    filter?: FilterQuery<T>,
  ): Promise<T[K] extends string | number | boolean ? T[K][] : any[]> {
    const result = await this.model.distinct(field as string, filter).exec();
    return result as any;
  }

  // Count documents
  async countDocuments(options?: FilterQuery<T>): Promise<number> {
    return await this.model.countDocuments(options);
  }

  // Aggregate method
  async aggregate(pipeline: any): Promise<any[] | null> {
    try {
      return await this.model.aggregate(pipeline).exec();
    } catch (error) {
      this.logger.error('Error in aggregation', error);
      return null;
    }
  }

  private buildLookupStages(lookupOptions: LookupOptions | LookupOptions[]): PipelineStage[] {
    const lookups = Array.isArray(lookupOptions) ? lookupOptions : [lookupOptions];

    return lookups.flatMap(lookup => {
      const stages = [];

      // Build the lookup pipeline
      const lookupPipeline = [];

      // Add selection to lookup pipeline if specified
      if (lookup.select) {
        lookupPipeline.push({ $project: lookup.select });
      }

      // Add any additional custom pipeline stages
      if (lookup.pipeline) {
        lookupPipeline.push(...lookup.pipeline);
      }

      // Basic lookup stage
      const lookupStage: PipelineStage.Lookup = {
        $lookup: {
          from: lookup.from,
          localField: lookup.localField,
          foreignField: lookup.foreignField,
          as: lookup.as,
          ...(lookupPipeline.length > 0 && { pipeline: lookupPipeline }),
        },
      };

      stages.push(lookupStage);

      // Add unwind stage if specified (default to true if not specified)
      if (lookup.unwind !== false) {
        stages.push({
          $unwind: {
            path: `$${lookup.as}`,
            preserveNullAndEmptyArrays: true,
          },
        });
      }

      return stages;
    });
  }
}
