// src/components/BlogsPage/BlogCard.js
"use client";

import Link from "next/link";
import Image from "next/image";
import styles from "@/app/styles/BlogPage/Components/BlogCard.module.css";

// CHANGED: Access NEXT_PUBLIC_API_URL_BLOG directly
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_BLOG;

// REMOVED: BASE_URL from props
const BlogCard = ({ blog }) => {
  const imageUrl = blog.image?.startsWith("http") 
    ? blog.image 
    : `${API_BASE_URL}${blog.image}`;

  return (
    <div className={styles.blogCard}>
      <Link href={`/blogs/${blog.category}/${blog.slug || blog._id}`} className={styles.linkTag}>
        <div className={styles.imageContainer}>
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={blog.title || 'Blog post image'}
              className={styles.blogImage}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{
                objectFit: 'cover',
              }}
              priority={false}
            />
          )}
        </div>
        <div className={styles.overlay}>
          <h3 className={styles.blogTitle}>{blog.title}</h3>
          <p className={styles.blogCategory}>
            {blog.category} • {blog.subcategory}
          </p>
          <p className={styles.blogAuthor}>By {blog.author}</p>
          <span className={styles.readMore}>Read More →</span>
        </div>
      </Link>
    </div>
  );
};

export default BlogCard;