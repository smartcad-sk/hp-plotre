import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CtaBand } from "@/components/blocks/CtaBand";
import { SectionRenderer } from "@/components/blocks/SectionRenderer";
import { PageHeader } from "@/components/layout/PageHeader";
import { JsonLd, breadcrumbLd } from "@/components/seo/JsonLd";
import { IntroBand } from "@/components/layout/IntroBand";
import { Container } from "@/components/ui/Container";
import { Prose } from "@/components/ui/Prose";
import {
  breadcrumbFor,
  catchAllRoutes,
  displayTitle,
  getPage,
  getPost,
  isProductRoute,
  pageDescription,
  pageImage,
  seoTitle,
} from "@/lib/content";
import type { PageType } from "@/lib/analytics";
import { normalizePage } from "@/lib/normalize";
import { SITE_URL, site } from "@/lib/site";

const CATEGORY_ROUTES = new Set(["/velkoformatove-tlaciarne", "/skladacky-vykresov", "/latex", "/vyrezavacie-plotre"]);
const SERVICE_ROUTES = /^\/(smart-sluzby|diagnostika-plotra|stary_za_novy|plotrovanie|bazar-plotrov)/;

function pageTypeFor(route: string): PageType {
  if (isProductRoute(route)) return "product";
  if (CATEGORY_ROUTES.has(route)) return "product_category";
  if (SERVICE_ROUTES.test(route)) return "service";
  return "page";
}

export function generateStaticParams() {
  return catchAllRoutes().map((route) => ({ slug: route.slice(1).split("/") }));
}

const toRoute = (slug: string[]) => "/" + slug.map(decodeURIComponent).join("/").toLowerCase();

export async function generateMetadata({ params }: PageProps<"/[...slug]">): Promise<Metadata> {
  const route = toRoute((await params).slug);
  const post = getPost(route);
  if (post) {
    return {
      title: seoTitle(post.title),
      description: post.description,
      alternates: { canonical: route },
      openGraph: {
        type: "article",
        title: post.title,
        description: post.description,
        publishedTime: post.date,
        modifiedTime: post.modified,
        images: post.thumbnail ? [post.thumbnail.src] : undefined,
      },
    };
  }
  const page = getPage(route);
  if (!page) return {};
  const { title } = normalizePage(page);
  const description = pageDescription(page);
  const image = pageImage(page);
  return {
    title: seoTitle(title),
    description,
    alternates: { canonical: route },
    openGraph: { title, description, url: route, images: image ? [image.src] : undefined },
  };
}

const dateFmt = new Intl.DateTimeFormat("sk-SK", { day: "numeric", month: "long", year: "numeric" });

export default async function ContentPage({ params }: PageProps<"/[...slug]">) {
  const route = toRoute((await params).slug);

  const post = getPost(route);
  if (post) {
    const crumbs = breadcrumbFor(route);
    return (
      <>
        <JsonLd data={breadcrumbLd([...crumbs, { label: post.title, href: route }])} />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.description,
            datePublished: post.date,
            dateModified: post.modified,
            image: post.thumbnail ? `${SITE_URL}${post.thumbnail.src}` : undefined,
            author: { "@type": "Organization", name: site.company },
            publisher: { "@id": `${SITE_URL}/#organization` },
            mainEntityOfPage: `${SITE_URL}${route}`,
          }}
        />
        <PageHeader title={post.title} crumbs={crumbs} pageType="blog_post">
          <p className="text-white/85">
            <time dateTime={post.date}>{dateFmt.format(new Date(post.date))}</time>
          </p>
        </PageHeader>
        <article className="py-10 sm:py-14">
          <Container size="prose" className="space-y-8">
            {post.thumbnail && (
              <Image
                src={post.thumbnail.src}
                alt={post.thumbnail.alt}
                width={post.thumbnail.width ?? 900}
                height={post.thumbnail.height ?? 488}
                sizes="(min-width: 768px) 736px, 100vw"
                priority
                className="h-auto w-full rounded-(--radius-card)"
              />
            )}
            <Prose html={post.html} />
          </Container>
        </article>
        <CtaBand />
      </>
    );
  }

  const page = getPage(route);
  if (!page) notFound();

  const { title, leadHtml, intro, sections } = normalizePage(page);
  const crumbs = breadcrumbFor(route);
  const product = isProductRoute(route);

  return (
    <>
      <JsonLd data={breadcrumbLd([...crumbs, { label: displayTitle(page), href: route }])} />
      <PageHeader title={title} leadHtml={leadHtml} crumbs={crumbs} pageType={pageTypeFor(route)} />
      {intro && <IntroBand data={intro} />}
      <SectionRenderer sections={sections} pageTitle={title} />
      {route !== "/kontakt" && (
        <CtaBand
          title={product ? `Máte záujem o ${title}?` : undefined}
          text={product ? "Pripravíme vám ponuku na kúpu, prenájom alebo splátky vrátane dovozu, inštalácie a zaškolenia." : undefined}
        />
      )}
    </>
  );
}
