import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface SeoProps {
    title: string;
    description?: string;
    keywords?: string;
}

export default function Seo({
    title,
    description = "Wing Way Connect - Your Global Logistics & Travel Partner. Best rates for air tickets, cargo, and courier services.",
    keywords = "logistics, travel, air tickets, cargo, courier, bangladesh, global shipping",
    image = "/og-image.png"
}: SeoProps & { image?: string }) {
    const fullTitle = title ? `${title} - Wing Way Connect` : "Wing Way Connect - Global Logistics & Travel Solution";
    const location = useLocation();
    const canonicalUrl = `https://wcargo2024.com${location.pathname}`;

    return (
        <Helmet key={location.pathname}>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            <link rel="canonical" href={canonicalUrl} />

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content="website" />
            <meta property="og:url" content={canonicalUrl} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content="Wing Way Connect" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@WingWayConnect" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
        </Helmet>
    );
}
