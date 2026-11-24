import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Shanaya — Your World',description:'Interactive fictional AI companion app concept and media experience.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
