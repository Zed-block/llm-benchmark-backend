import { IsBoolean, IsNotEmpty, IsEmail, IsNumber, IsOptional, IsString } from "class-validator"

export class EmailDTO {
	@IsNotEmpty()
	@IsEmail()
	to: string

	@IsNotEmpty()
	Subject: string

	@IsNotEmpty()
	Body: string
}

export class WaitingUsers {
	@IsNotEmpty()
	@IsEmail()
	email: string

	@IsNotEmpty()
	@IsNotEmpty()
	firstName: string

	@IsNotEmpty()
	@IsNotEmpty()
	lastName: string

	@IsNotEmpty()
	url: string
}
