import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function PostPreview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: true,
      category: true,
      tags: true,
    },
  });

  if (!post) {
    notFound();
  }

  return (
    <div className="preview-container" style={{
      maxWidth: "800px",
      margin: "0 auto",
      padding: "40px 20px",
      fontFamily: "system-ui, sans-serif"
    }}>
      <div style={{ marginBottom: "32px", textAlign: "center" }}>
        {post.category && (
          <span style={{ 
            color: "var(--accent-primary, #007aff)", 
            fontSize: "0.875rem", 
            fontWeight: 600, 
            textTransform: "uppercase", 
            letterSpacing: "0.05em" 
          }}>
            {post.category.name}
          </span>
        )}
        <h1 style={{ 
          fontSize: "2.5rem", 
          fontWeight: 800, 
          lineHeight: 1.2, 
          marginTop: "12px", 
          marginBottom: "16px",
          color: "var(--text-primary, #111)"
        }}>
          {post.title}
        </h1>
        {post.excerpt && (
          <p style={{
            fontSize: "1.25rem",
            color: "var(--text-secondary, #555)",
            lineHeight: 1.5,
            marginBottom: "24px"
          }}>
            {post.excerpt}
          </p>
        )}
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", color: "var(--text-muted, #888)", fontSize: "0.875rem" }}>
          <span>By <strong>{post.author.name}</strong></span>
          <span>•</span>
          <span>{formatDate(post.createdAt.toISOString())}</span>
        </div>
      </div>

      {post.coverImage && (
        <div style={{ marginBottom: "40px", borderRadius: "16px", overflow: "hidden", aspectRatio: "16/9" }}>
          <img 
            src={post.coverImage} 
            alt={post.title} 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        </div>
      )}

      <div 
        className="prose tiptap-editor" 
        style={{ 
          maxWidth: "100%", 
          lineHeight: 1.6, 
          fontSize: "1.125rem",
          color: "var(--text-primary, #222)"
        }}
        dangerouslySetInnerHTML={{ __html: post.content }} 
      />

      {post.tags.length > 0 && (
        <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid var(--border-secondary, #eee)", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {post.tags.map(tag => (
            <span key={tag.id} style={{
              background: "var(--bg-tertiary, #f0f0f0)",
              color: "var(--text-secondary, #444)",
              padding: "4px 12px",
              borderRadius: "99px",
              fontSize: "0.875rem"
            }}>
              #{tag.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
