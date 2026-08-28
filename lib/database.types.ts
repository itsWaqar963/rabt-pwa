export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AdminRole = "admin" | "moderator";

export type LessonSubmissionStatus = "pending" | "approved" | "rejected";

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          user_id: string;
          role: AdminRole;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: AdminRole;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: AdminRole;
          created_at?: string;
        };
      };
      lesson_submissions: {
        Row: {
          id: string;
          youtube_url: string;
          question: string;
          options: Json;
          correct_index: number;
          status: LessonSubmissionStatus;
          submitter_id: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          is_own_channel: boolean;
          channel_title: string | null;
          channel_avatar_url: string | null;
        };
        Insert: {
          id?: string;
          youtube_url: string;
          question: string;
          options: Json;
          correct_index: number;
          status?: LessonSubmissionStatus;
          submitter_id: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          is_own_channel?: boolean;
          channel_title?: string | null;
          channel_avatar_url?: string | null;
        };
        Update: {
          id?: string;
          youtube_url?: string;
          question?: string;
          options?: Json;
          correct_index?: number;
          status?: LessonSubmissionStatus;
          submitter_id?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          is_own_channel?: boolean;
          channel_title?: string | null;
          channel_avatar_url?: string | null;
        };
      };
      user_reports: {
        Row: {
          id: string;
          reporter_id: string;
          reported_user_id: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          reported_user_id: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          reported_user_id?: string;
          reason?: string | null;
          created_at?: string;
        };
      };
      meetup_reports: {
        Row: {
          id: string;
          reporter_id: string;
          meetup_id: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          meetup_id: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          meetup_id?: string;
          reason?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

export type AdminUserRow = Database["public"]["Tables"]["admin_users"]["Row"];
export type AdminUserInsert =
  Database["public"]["Tables"]["admin_users"]["Insert"];
export type AdminUserUpdate =
  Database["public"]["Tables"]["admin_users"]["Update"];

export type LessonSubmissionRow =
  Database["public"]["Tables"]["lesson_submissions"]["Row"];
export type LessonSubmissionInsert =
  Database["public"]["Tables"]["lesson_submissions"]["Insert"];
export type LessonSubmissionUpdate =
  Database["public"]["Tables"]["lesson_submissions"]["Update"];

export type UserReportRow = Database["public"]["Tables"]["user_reports"]["Row"];
export type UserReportInsert =
  Database["public"]["Tables"]["user_reports"]["Insert"];
export type UserReportUpdate =
  Database["public"]["Tables"]["user_reports"]["Update"];

export type MeetupReportRow =
  Database["public"]["Tables"]["meetup_reports"]["Row"];
export type MeetupReportInsert =
  Database["public"]["Tables"]["meetup_reports"]["Insert"];
export type MeetupReportUpdate =
  Database["public"]["Tables"]["meetup_reports"]["Update"];
