import { createParamDecorator, ExecutionContext } from '@nestjs/common';


export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        console.log(request.user)
        return request.user
  },
);