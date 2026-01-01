import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class RequestVerificationDto {
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요' })
  @IsNotEmpty({ message: '이메일은 필수입니다' })
  email: string;
}

export class VerifyCodeDto {
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요' })
  @IsNotEmpty({ message: '이메일은 필수입니다' })
  email: string;

  @IsString()
  @Length(6, 6, { message: '인증 코드는 6자리입니다' })
  code: string;
}
