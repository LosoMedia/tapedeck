import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TapeRow {
  id: string;
  title: string;
  artist: string;
  classification: 'ai' | 'organic' | 'hybrid';
  genre: string;
  mood: string;
  bpm: number;
  musical_key: string;
  duration: string;
  cover_url: string;
  description: string;
  skills_needed: string[];
  collaboration_status: 'open' | 'closed' | 'pitch-ready';
  rating: number;
  plays: string;
  created_at: string;
}

export interface CollabRequestRow {
  id: string;
  tape_id: string;
  applicant_name: string;
  applicant_role: string;
  message: string;
  skills: string[];
  contact: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface TapeReviewRow {
  id: string;
  tape_id: string;
  reviewer_name: string;
  reviewer_role: string;
  rating: number;
  body: string;
  created_at: string;
}
