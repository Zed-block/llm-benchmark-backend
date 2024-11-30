import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './auth/jwt.startegy';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
    MongooseModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: async (configService: ConfigService) => ({
				uri: configService.get("MongoURL"),
				useUnifiedTopology: true,
				useNewUrlParser: true,
			}),
		}),
    ConfigModule.forRoot({
      isGlobal: true,  // Make ConfigService globally available
    }),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [JwtStrategy,AppService],
  exports: [JwtModule], // Export JwtModule if needed elsewhere
})
export class AppModule {}
