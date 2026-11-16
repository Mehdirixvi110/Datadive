import Image from "next/image";
import Link from "next/link";
import { Card, Badge } from "@/components/ui";
import { formatDate } from "@/lib/utils/date";
import type { BlogPost } from "@/lib/types";

/**
 * Blog post card (design §11). Links to the full post; shows cover, title,
 * excerpt, author, and publish date. Used by the /blog list.
 */
export function PostCard({ post }: { post: BlogPost }) {
  return (
    <Card interactive className="group flex flex-col gap-4 p-0 overflow-hidden">
      <Link href={`/blog/${post.slug}`} className="flex flex-col gap-4">
        {post.cover ? (
          <div className="aspect-[16/9] overflow-hidden border-b border-border bg-surface">
            <Image
              src={post.cover.url}
              alt={post.cover.alt}
              width={800}
              height={450}
              sizes="(max-width: 768px) 100vw, 400px"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : null}
        <div className="flex flex-col gap-3 p-6">
          {post.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} tone="brand">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
          <h3 className="font-display text-h4 font-semibold text-text group-hover:text-brand-200">
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className="line-clamp-3 text-body text-muted">{post.excerpt}</p>
          ) : null}
          <p className="mt-1 text-small text-muted">
            {post.author ? `${post.author} · ` : ""}
            {formatDate(post.publishDate)}
          </p>
        </div>
      </Link>
    </Card>
  );
}
