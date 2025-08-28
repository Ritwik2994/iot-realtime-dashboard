import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUserGraphQL = createParamDecorator((data: unknown, context: ExecutionContext) => {
  try {
    const gqlContext = GqlExecutionContext.create(context);
    const { req } = gqlContext.getContext();

    if (!req) {
      throw new Error('Request context not available');
    }

    if (!req.user) {
      throw new Error('User not found in request context');
    }

    return req.user;
  } catch (error) {
    throw new Error(`Failed to extract current user: ${error.message}`);
  }
});
