import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';

class LoginDto {
  @IsString()
  @IsNotEmpty()
  password!: string;
}

@ApiTags('authentication')
@Controller('auth')
@Public() // This endpoint is public - needed for login
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login to dashboard',
    description:
      'Validates password and returns a JWT token for accessing the frontend configuration',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        password: {
          type: 'string',
          description: 'Dashboard password',
        },
      },
      required: ['password'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful, token returned',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid password',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.validatePassword(loginDto.password);
  }
}
