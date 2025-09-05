"use client";
 
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import styles from "@/app/styles/BlogPage/Components/CategoryFilter.module.css";
import Breadcrumb from "@/app/components/BlogsPage/Breadcrumb";
import BlogCard from '@/app/components/BlogsPage/BlogCard';
 
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL_BLOG;
 
const CategoryPage = () => {
  const { category } = useParams() || {};
  const [blogs, setBlogs] = useState([]);
  const [subcategories, setSubcategories] = useState(["All"]);
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const [loading, setLoading] = useState(true);

  // Memoize the fetchAllSubcategories function
  const fetchAllSubcategories = useCallback(async () => {
    if (!category) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/blogs?category=${encodeURIComponent(category)}`
      );
      const data = await response.json();
      const blogsData = Array.isArray(data?.blogs) ? data.blogs : [];
 
      const uniqueSubcategories = [
        "All",
        ...new Set(
          blogsData.map((blog) => blog.subcategory?.trim()).filter(Boolean)
        ),
      ];
 
      setSubcategories(uniqueSubcategories);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
      setSubcategories(["All"]);
    }
  }, [category]);
 
  // Memoize the fetchBlogs function
  const fetchBlogs = useCallback(async () => {
    if (!category) return;
    
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/blogs?category=${encodeURIComponent(category)}`;
 
      if (selectedSubcategory.toLowerCase() !== "all") {
        url += `&subcategory=${encodeURIComponent(selectedSubcategory.trim())}`;
      }
 
      const response = await fetch(url);
      const data = await response.json();
 
      if (!response.ok || !Array.isArray(data?.blogs)) {
        throw new Error("Invalid response format");
      }
 
      setBlogs(data.blogs);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, [category, selectedSubcategory]);

  // Main effect to trigger data fetching
  useEffect(() => {
    if (category) {
      fetchAllSubcategories();
      fetchBlogs();
    }
  }, [category, selectedSubcategory, fetchAllSubcategories, fetchBlogs]);
 
  return (
    <div className="p-4">
      <Breadcrumb />
      <div className={styles.categoryPage}>
        <h1 className={styles.categoryTitle}>{category?.toUpperCase()}</h1>
 
        <div className={styles.subcategoryContainer}>
          {subcategories.map((sub, index) => (
            <button
              key={index}
              className={selectedSubcategory === sub ? styles.active : ""}
              onClick={() => setSelectedSubcategory(sub)}
            >
              {sub}
            </button>
          ))}
        </div>
 
        {/* Loading Indicator */}
        {loading ? (
          <div className={styles.loadingIndicator}>
            <p>Loading blogs...</p>
            <div className={styles.spinner}></div> {/* Add spinner styles */}
          </div>
        ) : (
          <div className={styles.blogsContainer}>
            {blogs.length === 0 ? (
              <p className={styles.noBlogs}>
                No blogs found for {category}
                {selectedSubcategory !== "All"
                  ? ` - ${selectedSubcategory}`
                  : ""}
                .
              </p>
            ) : (
              // Ensure BlogCard is updated to use blog.slug
              blogs.map((blog) => <BlogCard key={blog._id} blog={blog} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
};
 
export default CategoryPage;
 