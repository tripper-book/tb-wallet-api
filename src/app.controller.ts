import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

/** Root response */
class RootResponseDto {
  message: string;
  docs: string;
}

@ApiTags('root')
@Controller()
export class AppController {
  /**
   * Returns API name and link to Swagger docs.
   * @returns { message, docs }
   */
  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  @ApiResponse({ status: 200, description: 'API info', schema: { properties: { message: { type: 'string', example: 'TB Wallet API' }, docs: { type: 'string', example: '/api' } } } })
  root(): RootResponseDto {
    return {
      message: 'TB Wallet API',
      docs: '/api',
    };
  }
}
