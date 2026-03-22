import { NestFactory } from "@nestjs/core";
import { AppModule } from "./modules/app.module";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DataSource } from "typeorm";
import { middleware } from "./modules/app.middleware";
import { seedDemoData, shouldSeedDemoData } from "./seed";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get<ConfigService>(ConfigService);
  const PORT = configService.get<number>("PORT", 4000);

  if (shouldSeedDemoData(process.env.NODE_ENV)) {
    const dataSource = app.get<DataSource>(DataSource);
    await seedDemoData(dataSource);
  }

  await middleware(app);
  await app.listen(PORT, "0.0.0.0");
  console.log(`http://localhost:${PORT}/api`);
}
bootstrap();
