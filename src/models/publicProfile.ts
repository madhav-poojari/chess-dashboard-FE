// src/models/publicProfile.ts
import { ClassScheduleDTO } from "../api/user/dto";

export interface PublicProfile {
    first_name: string;
    last_name: string;
    email: string;
    uid: string;
    bio: string;
    country: string;
    city: string;
    state: string;
    postal_code: string;
    profile_picture_url?: string;
    lichessId:string;
    chessdotcomId:string;
    uscfId:string;
    fideId:string;
    syllabus_url:string;
    role: string;
    personal_meet_link: string;
    added_in_whatsapp: boolean;
    mentorDetails: GuidanceInfo | null;
    coachDetails: GuidanceInfo | null;
    schedule?: ClassScheduleDTO[];
    dob?: string | null;
    age?: number | null;
    age_recorded_at?: string | null;
  }
  
  export interface GuidanceInfo {
    name: string;
    profile_picture_url?: string;
    fide_id?: string;
    bio: string;
    personal_meet_link?: string;
  }