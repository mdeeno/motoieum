// web/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// 환경변수 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 클라이언트 생성 및 내보내기 (export 필수!)
export const supabase = createClient(supabaseUrl, supabaseKey);
