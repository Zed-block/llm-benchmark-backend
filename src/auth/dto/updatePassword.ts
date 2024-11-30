import { IsNotEmpty, IsString } from "class-validator"

export class updatePasswordDTO {
	@IsString()
	@IsNotEmpty()
	oldPassword: string

	@IsString()
	@IsNotEmpty()
	newPassword: string
}
