import { Module } from "@nestjs/common"
import { PassportModule } from "@nestjs/passport"
import { EmailService } from "./email.service"
import { EmailController } from "./email.controller"


@Module({
    imports: [
        PassportModule.register({ defaultStrategy: "jwt" }),
    ],
    controllers: [EmailController],
    providers: [EmailService],
    exports: [EmailService],
})
export class EmailModule { }