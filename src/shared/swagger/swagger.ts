import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function swaggerMiddleware(app: INestApplication) {
  const config = new DocumentBuilder()
    .addBearerAuth()
    .addOAuth2()
    .setTitle('IOT Dashboard 1.0 APIs')
    .setDescription('IOT Dashboard backend api documentation')
    .setVersion('1.0')
    .addTag('IOT Dashboard')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: false,
  });
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      tagsSorter: 'IOT Dashboard',
    },
  });
}
