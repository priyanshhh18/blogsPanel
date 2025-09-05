/**
 * Utility function to generate static HTML for SEO purposes
 * @param {string} page - The page name to generate static HTML for
 * @returns {string} - The static HTML string
 */
const getStaticHtml = (page) => {
  // Base HTML structure for the blog page
  if (page === 'blog') {
    return `
      <div class="seo-content">
        <h1>Connecting Dots ERP Blog</h1>
        <p>Welcome to the Connecting Dots ERP Blog - your source for the latest insights on SAP, IT training, and career development.</p>
        <h2>Featured Categories</h2>
        <ul>
          <li>SAP Solutions</li>
          <li>IT Training & Certification</li>
          <li>Career Development</li>
          <li>Industry Insights</li>
        </ul>
        <p>Explore our latest articles and stay updated with the latest trends and best practices in enterprise technology and professional development.</p>
      </div>
    `;
  }

  // Default empty string if no matching page is found
  return '';
};

export { getStaticHtml };
