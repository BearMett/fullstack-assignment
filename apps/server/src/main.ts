import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app.module";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { middleware } from "./modules/app.middleware";
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const PORT = configService.get<number>("PORT", 4000);

  middleware(app);
  await app.listen(PORT, "0.0.0.0");
  console.log(`http://localhost:${PORT}/api`);
}
bootstrap();
