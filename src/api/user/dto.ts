// src/api/user/dto.ts
export interface UserDetails {
    user_id: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
    phone: string;
    dob: string | null;
    bio: string;
    profile_picture_url: string;
    additional_info: Record<string, any>;
    updated_at: string;
    lichess_username: string;
    uscf_id: string,
    chesscom_username: string,
    fide_id: string,
  }
  
  export interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    approved: boolean;
    active: boolean;
    created_at: string;
    updated_at: string;
    details: UserDetails;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
  }
  