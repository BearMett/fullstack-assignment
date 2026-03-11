import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { API_PREFIX } from "../constants";
import { ValidationPipe } from "@nestjs/common";
export async function middleware(app: NestExpressApplication) {
  // 1. Global Prefix
  app.setGlobalPrefix(API_PREFIX);

  // 2. Global Pipes (데이터 검증/변환)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  // 3. CORS
  app.enableCors({
    origin: true, //for development
    credentials: true,
    exposedHeaders: ["Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // 4. Swagger
  const config = new DocumentBuilder()
    .setTitle("API DOCS")
    .setVersion("1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", name: "JWT", in: "header" })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("/api", app, document, {
    swaggerOptions: { defaultModelsExpandDepth: -1 },
  });
}
