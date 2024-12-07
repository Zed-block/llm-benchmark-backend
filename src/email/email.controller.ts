import { Body, Controller, Post, Param, Get, UseGuards, Query } from "@nestjs/common"
import { EmailService } from "./email.service"
import { EmailDTO } from "./types"

@Controller("email")
export class EmailController {
	constructor(private emailService: EmailService) { }

	@Post('/send')
	async sendMail(
		@Body() dto: EmailDTO,
	) {
		return await this.emailService.sendEmail(dto)
	}
}
