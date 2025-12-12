// web/app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  // 들어오자마자 '/market' 페이지로 강제 이동!
  redirect('/market');
}
