// app/rupantarcode/page.tsx

import type { Metadata } from 'next';
import RupantarCode from '@/components/RupantarCode';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'RupantarCode — Any Code to Python | AksharaTantra',
  description:
    'Convert Java, C#, JavaScript, TypeScript, and SQL Server code to Python. ' +
    'Offline-first, privacy-first. No cloud uploads. Download as .py with pip install comments.',
};

export default function RupantarCodePage() {
  return (
    <>
      <Navbar />
      <RupantarCode />
    </>
  );
}