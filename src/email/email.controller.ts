import { Body, Controller, Post, Param, Get, UseGuards, Query } from "@nestjs/common"
import { EmailService } from "./email.service"

@Controller("email")
export class EmailController {
	constructor(private emailService: EmailService) {}

	
}
