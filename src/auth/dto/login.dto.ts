import { IsString, IsNotEmpty, IsEmail, IsOptional, IsBoolean } from "class-validator"

export class Login_Details {
	@IsString()
	location: string
	@IsString()
	device: string
	@IsString()
	isMobile: boolean
}

export class LoginDto {
	@IsEmail()
	@IsNotEmpty()
	email: string

	@IsString()
	@IsNotEmpty()
	password: string

	@IsBoolean()
	@IsNotEmpty()
	checkbox: boolean
}

export class GoogleLoginDto {
	@IsString()
	@IsNotEmpty()
	token: string
}
