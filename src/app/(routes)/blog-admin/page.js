"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FaPlus, FaEdit, FaTrash, FaSearch, FaSpinner, FaExclamationTriangle,
  FaBlog, FaUser, FaEye, FaTimes, FaFilter
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import CreateBlogPost from "../../components/BlogsPage/CreateBlogPost";
import ProtectedPage from "../../components/blog-admin/ProtectedPage";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5002";

const BlogsAdminPanel = () => {
  const { user, isAuthenticated } = useAuth();

  const canCreate = true;
  const canEdit = true;
  const canDelete = true;

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBlog, setEditingBlog] = useState(null); // will be hydrated on edit
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [stats, setStats] = useState({
    total: 0, published: 0, drafts: 0, featured: 0,
  });

  const [filters, setFilters] = useState({
    category: "", status: "", search: "",
  });

  const categories = useMemo(
    () => [
      "Technology", "Business", "Marketing", "Development", "Design",
      "Analytics", "AI/ML", "Cloud Computing", "Lifestyle", "Health",
      "Travel", "Food",
    ],
    []
  );
  const statuses = useMemo(
    () => ["None", "Trending", "Featured", "Editor's Pick", "Recommended"],
    []
  );

  const filteredBlogs = useMemo(() => {
    const t = searchTerm.trim().toLowerCase();
    return blogs.filter((b) => {
      const matchTitle = !t || b.title?.toLowerCase()?.includes(t);
      const matchCat = !filterCategory || b.category === filterCategory;
      const matchStatus = !filterStatus || b.status === filterStatus;
      return matchTitle && matchCat && matchStatus;
    });
  }, [blogs, searchTerm, filterCategory, filterStatus]); 

  const showNotification = useCallback((msg) => {
    console.log(msg);
  }, []); 

  const handleLogout = useCallback(async () => {
    try {
      localStorage.removeItem("blogToken");
      localStorage.removeItem("blogsToken");
      localStorage.removeItem("blogsRole");
      localStorage.removeItem("blogsUser");

      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRole");
      localStorage.removeItem("adminUsername");
      localStorage.removeItem("adminEmail");
      localStorage.removeItem("adminId");
      localStorage.removeItem("isAdminLoggedIn");
      localStorage.removeItem("userData");
    } finally {
      window.location.replace("/AdminLogin?logout=1");
    }
  }, []); 

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPopState = () => handleLogout();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [handleLogout]); 

  // One‑shot: fetch ALL blogs at once
  const fetchBlogs = useCallback(
    async (showLoader = true) => {
      try {
        setLoading(showLoader);
        setRefreshing(!showLoader);
        setError(null);

        const token =
          localStorage.getItem("adminToken") ||
          localStorage.getItem("blogToken");
        if (!token) throw new Error("Authentication token not found");

        const tokenHeader = token.replace(/^Bearer\s*/i, "");

        if (!user || !isAuthenticated?.()) {
          try {
            const response = await fetch(`${API_BASE}/api/auth/validate-token`, {
              headers: { Authorization: `Bearer ${tokenHeader}` },
            });
            if (!response.ok) throw new Error("Invalid token");
            const userData = await response.json();
            if (window.loginFromProtectedPage) {
              window.loginFromProtectedPage(userData);
            }
            return;
          } catch (err) {
            localStorage.removeItem("blogToken");
            localStorage.removeItem("adminToken");
            window.location.replace("/AdminLogin?session=expired");
            return;
          }
        }

        if (!user) {
          setError("Failed to load user information. Please try again.");
          return;
        }

        const params = new URLSearchParams();
        if (filters.search) params.append("search", filters.search);
        if (filters.category) params.append("category", filters.category);
        if (filters.status) params.append("status", filters.status);

        params.append("page", "0");
        params.append("limit", "10000");

        const response = await fetch(`${API_BASE}/api/blogs?${params}`, {
          headers: { Authorization: `Bearer ${tokenHeader}` },
        });
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.message || "Failed to fetch blogs");
        }
        const data = await response.json();

        const list = Array.isArray(data.blogs) ? data.blogs : [];
        setBlogs(list);

        setStats({
          total: data.stats?.total ?? list.length,
          published: data.stats?.published ?? 0,
          drafts: data.stats?.drafts ?? 0,
          featured: data.stats?.featured ?? 0,
        });

        setError(null);
      } catch (err) {
        console.error("Error fetching blogs:", err);
        setError(err?.message || "Failed to load blogs. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters, isAuthenticated, user]
  ); 

  useEffect(() => {
    if (isAuthenticated?.()) {
      fetchBlogs(true);
    }
  }, [isAuthenticated, fetchBlogs]); 

  const handleSaveBlog = useCallback(
    async (blogData) => {
      try {
        setLoading(true);

        const token =
          localStorage.getItem("adminToken") ||
          localStorage.getItem("blogToken");
        if (!token) throw new Error("Authentication token not found");

        const formData = new FormData();
        const map = { urlSlug: "slug", authorName: "author", blogImage: "image" };

        Object.keys(blogData).forEach((key) => {
          const backend = map[key] || key;
          const val = blogData[key];
          if (val !== null && val !== "" && val !== undefined) {
            if (key === "blogImage" && typeof File !== "undefined" && val instanceof File) {
              formData.append("image", val);
            } else if (key !== "blogImage" && key !== "imagePreview" && key !== "_id") {
              formData.append(backend, val);
            }
          }
        });

        if (!formData.get("author")) {
          formData.append("author", (user && user.username) || "Admin");
        }

        if (editingBlog && user?.role?.toLowerCase() === "user") {
          const canEditThisPost =
            editingBlog.author === user.username ||
            editingBlog.authorId === user.id ||
            editingBlog.createdBy === user.id;
          if (!canEditThisPost) throw new Error("You can only edit your own posts");
        }

        let url = `${API_BASE}/api/blogs`;
        let method = "POST";
        if (editingBlog && blogData._id) {
          url = `${API_BASE}/api/blogs/${blogData._id}`;
          method = "PUT";
        }

        const tokenHeader = (localStorage.getItem("adminToken") ||
          localStorage.getItem("blogToken") ||
          "").replace(/^Bearer\s*/i, "");

        const response = await fetch(url, {
          method,
          headers: { Authorization: `Bearer ${tokenHeader}` },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to save blog");
        }

        await response.json();
        await fetchBlogs(false); // refresh full list

        setShowCreateModal(false);
        setEditingBlog(null);

        console.log(editingBlog ? "Blog updated successfully!" : "Blog created successfully!");
      } catch (err) {
        setError(err?.message || "Failed to save blog");
      } finally {
        setLoading(false);
      }
    },
    [editingBlog, fetchBlogs, user]
  ); 

  // EDIT: hydrate blog into modal before opening
  const handleEdit = useCallback(
    async (blog) => {
      try {
        setLoading(true);
        const tokenHeader = (localStorage.getItem("adminToken") ||
          localStorage.getItem("blogToken") ||
          "").replace(/^Bearer\s*/i, "");

        // Get the latest server version to prefill the form accurately
        const res = await fetch(`${API_BASE}/api/blogs/${blog._id}`, {
          headers: { Authorization: `Bearer ${tokenHeader}` },
        });
        if (!res.ok) {
          const jd = await res.json().catch(() => ({}));
          throw new Error(jd.message || "Failed to load blog");
        }
        const data = await res.json();

        // Map server fields to CreateBlogPost props fields
        setEditingBlog({
          _id: data._id,
          title: data.title || "",
          content: data.content || "",
          category: data.category || "",
          subcategory: data.subcategory || "",
          author: data.author || "",
          status: data.status || "None",
          slug: data.slug || "",
          image: data.image || "",
        });
        setShowCreateModal(true);
      } catch (err) {
        setError(err?.message || "Failed to open editor");
      } finally {
        setLoading(false);
      }
    },
    []
  ); 

  const handleDelete = useCallback(
    async (id, blog) => {
      try {
        setLoading(true);
        const tokenHeader = (localStorage.getItem("adminToken") ||
          localStorage.getItem("blogToken") ||
          "").replace(/^Bearer\s*/i, "");
        const res = await fetch(`${API_BASE}/api/blogs/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${tokenHeader}` },
        });
        if (!res.ok) {
          const jd = await res.json().catch(() => ({}));
          throw new Error(jd.message || "Failed to delete");
        }
        setBlogs((prev) => prev.filter((b) => b._id !== id));
      } catch (err) {
        setError(err?.message || "Delete failed");
      } finally {
        setLoading(false);
      }
    },
    []
  ); 

  return (
    <ProtectedPage requiredRoles={["admin", "superadmin", "user"]} pageTitle="Blog Management">
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
              <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center">
                  {editingBlog ? (
                    <>
                      <FaEdit className="mr-2 sm:mr-3 text-blue-600" />
                      <span className="hidden sm:inline">Edit Blog Post</span>
                      <span className="sm:hidden">Edit Post</span>
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2 sm:mr-3 text-green-600" />
                      <span className="hidden sm:inline">Create New Blog Post</span>
                      <span className="sm:hidden">Create Post</span>
                    </>
                  )}
                </h2>
                <button
                  onClick={() => { setShowCreateModal(false); setEditingBlog(null); }}
                  className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-200 rounded-full"
                  disabled={loading}
                >
                  <FaTimes className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[calc(95vh-80px)] sm:max-h-[calc(90vh-80px)]">
                <CreateBlogPost
                  onSave={handleSaveBlog}
                  initialData={editingBlog || {}}
                  isModal
                  onCancel={() => { setShowCreateModal(false); setEditingBlog(null); }}
                />
              </div>
            </div>
          </div>
        )}

        

<div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
              <div className="text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center justify-center sm:justify-start">
                  <FaBlog className="mr-2 sm:mr-3" />
                  <span className="hidden sm:inline">
                    {user?.role?.toLowerCase() === "user" ? "My Blog Posts" : "Manage Blog Posts"}
                  </span>
                  <span className="sm:hidden">
                    {user?.role?.toLowerCase() === "user" ? "My Posts" : "Manage Posts"}
                  </span>
                </h2>
                <p className="hidden md:block text-blue-100 text-sm sm:text-base">
                  {user?.role?.toLowerCase() === "user"
                    ? "Create and manage your blog content"
                    : "Create, edit, and manage blog content"}
                </p>
              </div>

              <div className="mt-3 sm:mt-0">
                <button
                  onClick={handleLogout}
                  className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  title="Logout"
                >
                  <FaTimes className="w-3 h-3" />
                  Logout
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-4">
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-2 sm:p-3 text-center hover:bg-opacity-20 transition-all duration-200">
                <div className="text-lg sm:text-2xl font-bold text-blue-800">{stats.total}</div>
                <div className="text-xs text-blue-800">Total</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-2 sm:p-3 text-center hover:bg-opacity-20 transition-all duration-200">
                <div className="text-lg sm:text-2xl font-bold text-green-700">{stats.published}</div>
                <div className="text-xs text-green-700">Published</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-2 sm:p-3 text-center hover:bg-opacity-20 transition-all duration-200">
                <div className="text-lg sm:text-2xl font-bold text-red-600">{stats.drafts}</div>
                <div className="text-xs text-red-600">Drafts</div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-2 sm:p-3 text-center hover:bg-opacity-20 transition-all duration-200">
                <div className="text-lg sm:text-2xl font-bold text-purple-800">{stats.featured}</div>
                <div className="text-xs text-purple-800">Featured</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="p-4 sm:p-6 border-b bg-gray-50">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {canCreate && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm sm:text-base font-medium"
                    >
                      {loading ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                      <span className="sm:hidden">New Blog</span>
                      <span className="hidden sm:inline">Create New Blog</span>
                    </button>
                  )}

                  <div className="text-xs sm:text-sm text-gray-600 flex items-center justify-center sm:justify-start gap-2 bg-white px-3 py-2 rounded-lg border">
                    <FaUser className="text-blue-500" />
                    <span>
                      Role: <span className="font-medium capitalize">{user?.role}</span>
                    </span>
                    {user?.role?.toLowerCase() === "user" && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        Your Posts Only
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowFilters((s) => !s)}
                  className="sm:hidden bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <FaFilter />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </button>
              </div>

              <div className={`space-y-3 sm:space-y-0 ${showFilters ? "block" : "hidden sm:block"}`}>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="relative flex-1 sm:flex-initial">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search blogs..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="text-black pl-10 pr-4 py-2 sm:py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64 shadow-sm text-sm sm:text-base"
                      disabled={loading}
                    />
                  </div>

                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm text-sm sm:text-base text-black"
                    disabled={loading}
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-black px-3 sm:px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 shadow-sm text-sm sm:text-base"
                    disabled={loading}
                  >
                    <option value="">All Statuses</option>
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <FaExclamationTriangle className="text-red-500 flex-shrink-0 mt-0.5" />
                <span className="flex-1 text-sm">{error}</span>
                <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 flex-shrink-0">
                  <FaTimes />
                </button>
              </div>
            )}
          </div>

          {/* Blog List */}
          <div className="p-4 sm:p-6">
            {loading && blogs.length === 0 ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <FaSpinner className="animate-spin text-3xl sm:text-4xl text-blue-600 mb-4 mx-auto" />
                  <p className="text-gray-600 text-sm sm:text-base">Loading your blogs...</p>
                </div>
              </div>
            ) : filteredBlogs.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-gray-400 mb-4">
                  <FaBlog className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  {blogs.length === 0 ? "No blog posts yet" : "No posts match your search"}
                </h3>
                <p className="text-gray-500 mb-4 text-sm sm:text-base px-4">
                  {blogs.length === 0
                    ? user?.role?.toLowerCase() === "user"
                      ? "Get started by creating your first blog post"
                      : "Get started by creating blog posts"
                    : "Try adjusting your search terms or filters"}
                </p>
                {canCreate && blogs.length === 0 && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm text-sm sm:text-base"
                  >
                    <FaPlus />
                    Create Your First Blog
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredBlogs.map((blog) => (
                  <div
                    key={blog._id}
                    className={`border rounded-lg p-4 sm:p-6 hover:shadow-md transition-all duration-200 bg-white ${
                      user?.role?.toLowerCase() === "user" && blog.author === (user?.username || "")
                        ? "border-l-4 border-l-blue-500 bg-blue-50"
                        : "hover:border-gray-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-4 sm:space-y-0">
                      <div className="flex-1 sm:mr-4">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 line-clamp-2 hover:text-blue-600 transition-colors">
                          {blog.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs sm:text-sm font-medium">
                            {blog.category}
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs sm:text-sm font-medium">
                            {blog.subcategory}
                          </span>
                          {blog.status !== "None" && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs sm:text-sm font-medium">
                              {blog.status}
                            </span>
                          )}
                          {user?.role?.toLowerCase() === "user" && blog.author === (user?.username || "") && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1">
                              <FaUser className="w-3 h-3" />
                              Your Post
                            </span>
                          )}
                        </div>

                        <div className="text-gray-600 text-xs sm:text-sm space-y-1">
                          <p>
                            <strong>Author:</strong> {blog.author}{" "}
                            {user && blog.author === user.username && (
                              <span className="text-blue-600 font-medium">(You)</span>
                            )}
                          </p>
                          <p>
                            <strong>Created:</strong> {new Date(blog.createdAt).toLocaleDateString()}
                          </p>
                          <p className="hidden sm:block">
                            <strong>Updated:</strong> {new Date(blog.updatedAt).toLocaleDateString()}
                          </p>
                          <p className="hidden sm:block">
                            <strong>Slug:</strong>{" "}
                            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">/{blog.slug}</code>
                          </p>
                        </div>

                        {blog.content && (
                          <p className="text-gray-700 mt-3 text-xs sm:text-sm line-clamp-2">
                            {blog.content.replace(/<[^>]*>/g, "").substring(0, 100)}...
                          </p>
                        )}
                      </div>

                      {blog.image && (
                        <div className="flex justify-center sm:justify-end">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={blog.image}
                            alt={blog.title}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-100">
                      <div className="flex gap-2 flex-1">
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(blog)}
                            disabled={loading}
                            className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            <FaEdit className="w-3 h-3" /> Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(blog._id, blog)}
                            disabled={loading}
                            className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            <FaTrash className="w-3 h-3" /> Delete
                          </button>
                        )}
                      </div>
                      <a
                        href={`/blogs/${blog.category ? blog.category.toLowerCase() : ""}/${blog.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 sm:flex-initial bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 text-xs sm:text-sm transition-colors shadow-sm"
                      >
                        <FaEye className="w-3 h-3" /> View Live
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
};

export default BlogsAdminPanel;
