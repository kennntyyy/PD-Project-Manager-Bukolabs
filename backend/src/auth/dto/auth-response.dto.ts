export class AuthResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    user_id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    user_role: string;
    profile_pic?: string;
  };
}
