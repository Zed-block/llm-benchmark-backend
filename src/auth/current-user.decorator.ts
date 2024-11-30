import { createParamDecorator, ExecutionContext } from "@nestjs/common"
import { User } from "../user/schema/user.schema"

export const CurrentUser = createParamDecorator((_data, ctx: ExecutionContext): User => {
	const req = ctx.switchToHttp().getRequest()
	const user = req.user
	// Use a combination of the user ID and other identifying information (like route path)

	return user
})