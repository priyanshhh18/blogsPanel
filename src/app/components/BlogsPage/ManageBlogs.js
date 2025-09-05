import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "../../styles/BlogPage/ManageBlogs.module.css";

// CHANGED: Access NEXT_PUBLIC_API_URL_BLOG directly
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_BLOG;

const ManageBlogs = ({ blogs, BASE_URL, handleEdit, handleDelete }) => {
  return (
    <div className={styles.blogsList}>
      {blogs.map((blog) => (
        <div className={styles.blogCard} key={blog._id}>
          <div className={styles.imageContainer}>
            <Link href={`/blog/${blog._id}`} className={styles.linkTag}>
              <div className={styles.imageWrapper}>
                <Image
                  src={
                    blog.image?.startsWith("http")
                      ? blog.image
                      : `${API_BASE_URL}${blog.image}`
                  }
                  alt={blog.title}
                  fill
                  className={styles.blogImage}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{
                    objectFit: 'cover',
                  }}
                />
              </div>
            </Link>
          </div>
          <div className={styles.blogContent}>
            <h2>{blog.title}</h2>
            <p className={styles.blogAuthor}>By {blog.author}</p>
            <div
              className={styles.blogDescription}
              dangerouslySetInnerHTML={{ __html: blog.content.slice(0, 150) }}
            ></div>
            <p className={styles.blogCategory}>{blog.category}</p>
            {blog.subcategory && (
              <p className={styles.blogSubcategory}>
                Subcategory: {blog.subcategory}
              </p>
            )}
            <div className={styles.blogActions}>
              <button className={styles.editBtn} onClick={() => handleEdit(blog)}>
                Edit
              </button>
              <button className={styles.deleteBtn} onClick={() => handleDelete(blog._id)}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ManageBlogs;
