import { getStaticHtml } from '@/app/utils/staticHtml';
import BlogCard from '@/app/components/BlogsPage/BlogCard';
import BlogHero from '@/app/components/BlogsPage/BlogHero';
import BlogClientContent from '@/app/components/BlogsPage/BlogClientContent';

const staticHtml = getStaticHtml('blog');

export const metadata = {
  title: 'Connecting Dots ERP Blog | SAP, IT & HR Insights',
  description: 'Explore the latest articles, insights, and news from Connecting Dots ERP on SAP, IT training, HR trends, and career development.',
  alternates: {
    canonical: '/blogs',
  },
  openGraph: {
    title: 'Connecting Dots ERP Blog',
    description: 'Latest insights on SAP, IT training, HR trends, and career development',
    url: 'https://yourdomain.com/blogs',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Connecting Dots ERP Blog',
    description: 'Latest insights on SAP, IT training, and career development',
  },
};

export default async function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BlogHero />
      <main className="container mx-auto px-4 py-8">
        {/* Static HTML content for SEO (will be visible in page source) */}
        <div id="seo-content" dangerouslySetInnerHTML={{ __html: staticHtml }} className="hidden" aria-hidden="true" />
        {/* Dynamic React Content (rendered on client) */}
        <BlogClientContent />
      </main>
    </div>
  );
}