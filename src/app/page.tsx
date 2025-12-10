import FundExplorer from '@/components/FundExplorer';

// Static generation for main page
export async function generateStaticParams() {
  return [{}]; // Only generate the main page
}

export default function HomePage() {
  return <FundExplorer />;
}