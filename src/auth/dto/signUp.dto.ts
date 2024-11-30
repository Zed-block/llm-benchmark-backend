import { IsString, IsNotEmpty, IsEmail, IsOptional } from "class-validator"

import { IsPhoneNumber } from "class-validator"

export class SignUpDto {
	@IsString()
	@IsNotEmpty()
	firstName: string

	@IsString()
	@IsNotEmpty()
	lastName: string

	@IsEmail()
	@IsNotEmpty()
	email: string

	@IsOptional()
	@IsPhoneNumber()
	phone?: string

	@IsString()
	@IsNotEmpty()
	password: string
}
